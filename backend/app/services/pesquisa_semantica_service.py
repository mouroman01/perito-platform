"""Pesquisa semântica (RF015) por embeddings do Gemini + cosseno em Python.

Sem pgvector: os vetores ficam serializados em JSON na tabela `embeddings_busca` e a
similaridade de cosseno é calculada em Python no momento da busca. Escala de sobra
para o volume de um perito (dezenas/centenas de itens).

Indexa três tipos de item textual: laudos (título + conteúdo), evidências
(nome + descrição) e documentos (nome + categoria). A busca aplica RBAC por tipo:
laudos exigem `laudos:read`; evidências e documentos exigem `processos:read`.
"""
import json
import math

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.documento import Documento
from app.models.embedding_busca import EmbeddingBusca
from app.models.evidencia import Evidencia
from app.models.laudo import Laudo
from app.models.usuario import Usuario
from app.services import ia_service

_PERMISSAO_POR_TIPO = {"laudo": "laudos:read", "evidencia": "processos:read", "documento": "processos:read"}
_URL_POR_TIPO = {"laudo": "/laudos/{id}", "evidencia": "/processos/{processo}", "documento": "/processos/{processo}"}


def _tem_permissao(usuario: Usuario, permissao: str) -> bool:
    permissoes = usuario.perfil.permissoes or []
    return "*" in permissoes or permissao in permissoes


def _cosseno(a: list[float], b: list[float]) -> float:
    produto = sum(x * y for x, y in zip(a, b))
    norma_a = math.sqrt(sum(x * x for x in a))
    norma_b = math.sqrt(sum(y * y for y in b))
    if norma_a == 0 or norma_b == 0:
        return 0.0
    return produto / (norma_a * norma_b)


def _itens_indexaveis(db: Session):
    """Gera tuplas (tipo, entidade_id, processo_id, titulo, texto) a indexar."""
    for laudo in db.scalars(select(Laudo)):
        texto = f"{laudo.titulo}\n{laudo.conteudo or ''}".strip()
        yield "laudo", laudo.id, laudo.processo_id, laudo.titulo, texto

    for ev in db.scalars(select(Evidencia)):
        texto = f"{ev.nome_original}\n{ev.descricao or ''}".strip()
        yield "evidencia", ev.id, ev.processo_id, ev.nome_original, texto

    for doc in db.scalars(select(Documento)):
        texto = f"{doc.nome_original}\n{doc.categoria or ''}".strip()
        yield "documento", doc.id, doc.processo_id, doc.nome_original, texto


def reindexar(db: Session) -> int:
    """Reconstrói o índice de embeddings do zero. Retorna a quantidade indexada."""
    db.query(EmbeddingBusca).delete()
    db.flush()

    total = 0
    for tipo, entidade_id, processo_id, titulo, texto in _itens_indexaveis(db):
        if not texto:
            continue
        vetor = ia_service.gerar_embedding(texto)
        db.add(
            EmbeddingBusca(
                tipo_entidade=tipo,
                entidade_id=entidade_id,
                processo_id=processo_id,
                titulo=titulo[:255],
                texto=texto,
                embedding=json.dumps(vetor),
            )
        )
        total += 1

    db.commit()
    return total


def buscar(db: Session, usuario: Usuario, consulta: str, limite: int = 8) -> list[dict]:
    tipos_permitidos = {t for t, p in _PERMISSAO_POR_TIPO.items() if _tem_permissao(usuario, p)}
    if not tipos_permitidos:
        return []

    linhas = list(
        db.scalars(select(EmbeddingBusca).where(EmbeddingBusca.tipo_entidade.in_(tipos_permitidos)))
    )
    if not linhas:
        return []

    vetor_consulta = ia_service.gerar_embedding(consulta)

    pontuados = []
    for linha in linhas:
        score = _cosseno(vetor_consulta, json.loads(linha.embedding))
        url = _URL_POR_TIPO[linha.tipo_entidade].format(id=linha.entidade_id, processo=linha.processo_id)
        snippet = linha.texto[:200] + ("…" if len(linha.texto) > 200 else "")
        pontuados.append(
            {
                "tipo": linha.tipo_entidade,
                "id": linha.entidade_id,
                "processo_id": linha.processo_id,
                "titulo": linha.titulo,
                "score": round(score, 4),
                "snippet": snippet,
                "url": url,
            }
        )

    pontuados.sort(key=lambda r: r["score"], reverse=True)
    return pontuados[:limite]
