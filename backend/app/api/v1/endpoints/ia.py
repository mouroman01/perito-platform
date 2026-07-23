from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_permission
from app.models.processo import Processo
from app.models.usuario import Usuario
from app.schemas.ia import (
    BuscaInteligenteRequest,
    BuscaInteligenteResponse,
    ChecklistRequest,
    ChecklistResponse,
    EstruturaLaudoRequest,
    EstruturaResponse,
    ExtracaoResponse,
    ExtrairRequest,
    OrganizacaoEvidenciasResponse,
    OrganizarEvidenciasRequest,
    PesquisaSemanticaRequest,
    PesquisaSemanticaResponse,
    ReindexarResponse,
    ResumirRequest,
    ResumoResponse,
)
from app.services import (
    documento_service,
    evidencia_service,
    ia_service,
    laudo_service,
    pesquisa_semantica_service,
    processo_service,
)

router = APIRouter(prefix="/ia", tags=["ia"])


def _contexto_processo(processo: Processo) -> str:
    return (
        f"Número do processo: {processo.numero}\n"
        f"Comarca: {processo.comarca.nome}/{processo.comarca.uf}\n"
        f"Especialidade: {processo.especialidade or 'não informada'}\n"
        f"Objeto: {processo.objeto or 'não informado'}\n"
        f"Partes: {processo.partes or 'não informadas'}"
    )


@router.post("/resumir", response_model=ResumoResponse)
def resumir_texto(
    dados: ResumirRequest,
    _: Usuario = Depends(require_permission("ia:usar")),
):
    return ResumoResponse(resumo=ia_service.resumir(dados.texto))


@router.post("/estrutura-laudo", response_model=EstruturaResponse)
def sugerir_estrutura_laudo(
    dados: EstruturaLaudoRequest,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("ia:usar")),
):
    if dados.processo_id is not None:
        contexto = _contexto_processo(processo_service.obter_ou_404(db, dados.processo_id))
    else:
        contexto = dados.contexto

    return EstruturaResponse(estrutura=ia_service.sugerir_estrutura_laudo(contexto))


@router.post("/extrair", response_model=ExtracaoResponse)
def extrair_informacoes(
    dados: ExtrairRequest,
    _: Usuario = Depends(require_permission("ia:usar")),
):
    return ExtracaoResponse(**ia_service.extrair_informacoes(dados.texto))


@router.post("/checklist", response_model=ChecklistResponse)
def gerar_checklist(
    dados: ChecklistRequest,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("ia:usar")),
):
    if dados.processo_id is not None:
        contexto = _contexto_processo(processo_service.obter_ou_404(db, dados.processo_id))
    else:
        contexto = dados.contexto

    return ChecklistResponse(itens=ia_service.gerar_checklist(contexto))


@router.post("/organizar-evidencias", response_model=OrganizacaoEvidenciasResponse)
def organizar_evidencias(
    dados: OrganizarEvidenciasRequest,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("ia:usar")),
):
    processo = processo_service.obter_ou_404(db, dados.processo_id)
    evidencias = evidencia_service.listar_por_processo(db, processo.id)

    linhas = [_contexto_processo(processo), "", "Evidências cadastradas:"]
    for ev in evidencias:
        coleta = ev.criado_em.strftime("%d/%m/%Y %H:%M") if ev.criado_em else "sem data"
        midia = ev.midia_origem.value if ev.midia_origem else "não informada"
        linhas.append(
            f"- {ev.nome_original} | tipo: {ev.tipo.value} | mídia: {midia} | "
            f"coleta: {coleta} | hash SHA-256: {ev.hash_sha256} | "
            f"descrição: {ev.descricao or 'sem descrição'}"
        )
    if not evidencias:
        linhas.append("(nenhuma evidência cadastrada)")

    return OrganizacaoEvidenciasResponse(organizacao=ia_service.organizar_evidencias("\n".join(linhas)))


@router.post("/busca-inteligente", response_model=BuscaInteligenteResponse)
def busca_inteligente(
    dados: BuscaInteligenteRequest,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("ia:usar")),
):
    processo = processo_service.obter_ou_404(db, dados.processo_id)

    partes = [_contexto_processo(processo), "", "Documentos:"]
    for doc in documento_service.listar_por_processo(db, processo.id):
        partes.append(f"- {doc.nome_original} | categoria: {doc.categoria or 'sem categoria'}")

    partes.append("")
    partes.append("Evidências:")
    for ev in evidencia_service.listar_por_processo(db, processo.id):
        partes.append(
            f"- {ev.nome_original} | tipo: {ev.tipo.value} | "
            f"descrição: {ev.descricao or 'sem descrição'}"
        )

    partes.append("")
    partes.append("Laudos:")
    for laudo in laudo_service.listar(db, processo.id):
        trecho = (laudo.conteudo or "")[:2000]
        partes.append(f"- {laudo.titulo} | status: {laudo.status.value} | conteúdo: {trecho}")

    resposta = ia_service.busca_inteligente(dados.consulta, "\n".join(partes))
    return BuscaInteligenteResponse(resposta=resposta)


@router.post("/pesquisa-semantica/reindexar", response_model=ReindexarResponse)
def reindexar_pesquisa_semantica(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("ia:usar")),
):
    return ReindexarResponse(indexados=pesquisa_semantica_service.reindexar(db))


@router.post("/pesquisa-semantica", response_model=PesquisaSemanticaResponse)
def pesquisa_semantica(
    dados: PesquisaSemanticaRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_permission("ia:usar")),
):
    resultados = pesquisa_semantica_service.buscar(db, usuario, dados.consulta, dados.limite)
    return PesquisaSemanticaResponse(resultados=resultados)
