from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.advogado import Advogado
from app.models.cliente import Cliente
from app.models.comarca import Comarca
from app.models.contato import Contato
from app.models.escritorio import Escritorio
from app.models.laudo import Laudo
from app.models.magistrado import Magistrado
from app.models.processo import Processo
from app.models.usuario import Usuario
from app.schemas.busca import ResultadoBusca

LIMITE_POR_TIPO = 8


def _tem_permissao(usuario: Usuario, permissao: str) -> bool:
    permissoes = usuario.perfil.permissoes or []
    return "*" in permissoes or permissao in permissoes


def buscar(db: Session, usuario: Usuario, termo: str) -> list[ResultadoBusca]:
    padrao = f"%{termo}%"
    resultados: list[ResultadoBusca] = []

    if _tem_permissao(usuario, "processos:read"):
        processos = db.scalars(
            select(Processo)
            .where(
                or_(
                    Processo.numero.ilike(padrao),
                    Processo.partes.ilike(padrao),
                    Processo.objeto.ilike(padrao),
                )
            )
            .limit(LIMITE_POR_TIPO)
        )
        resultados += [
            ResultadoBusca(tipo="processo", id=p.id, titulo=p.numero, subtitulo=p.partes, url=f"/processos/{p.id}")
            for p in processos
        ]

    if _tem_permissao(usuario, "crm:read"):
        clientes = db.scalars(
            select(Cliente)
            .where(or_(Cliente.nome.ilike(padrao), Cliente.documento.ilike(padrao)))
            .limit(LIMITE_POR_TIPO)
        )
        resultados += [
            ResultadoBusca(tipo="cliente", id=c.id, titulo=c.nome, subtitulo=c.documento, url="/crm/clientes")
            for c in clientes
        ]

        advogados = db.scalars(
            select(Advogado)
            .where(or_(Advogado.nome.ilike(padrao), Advogado.oab.ilike(padrao)))
            .limit(LIMITE_POR_TIPO)
        )
        resultados += [
            ResultadoBusca(tipo="advogado", id=a.id, titulo=a.nome, subtitulo=a.oab, url="/crm/advogados")
            for a in advogados
        ]

        escritorios = db.scalars(
            select(Escritorio)
            .where(or_(Escritorio.nome.ilike(padrao), Escritorio.cnpj.ilike(padrao)))
            .limit(LIMITE_POR_TIPO)
        )
        resultados += [
            ResultadoBusca(tipo="escritorio", id=e.id, titulo=e.nome, subtitulo=e.cnpj, url="/crm/escritorios")
            for e in escritorios
        ]

        contatos = db.scalars(
            select(Contato)
            .where(or_(Contato.nome.ilike(padrao), Contato.organizacao.ilike(padrao)))
            .limit(LIMITE_POR_TIPO)
        )
        resultados += [
            ResultadoBusca(tipo="contato", id=ct.id, titulo=ct.nome, subtitulo=ct.organizacao, url="/crm/contatos")
            for ct in contatos
        ]

        magistrados = db.scalars(select(Magistrado).where(Magistrado.nome.ilike(padrao)).limit(LIMITE_POR_TIPO))
        resultados += [
            ResultadoBusca(tipo="magistrado", id=m.id, titulo=m.nome, subtitulo=m.vara, url="/crm/magistrados")
            for m in magistrados
        ]

        comarcas = db.scalars(select(Comarca).where(Comarca.nome.ilike(padrao)).limit(LIMITE_POR_TIPO))
        resultados += [
            ResultadoBusca(tipo="comarca", id=co.id, titulo=co.nome, subtitulo=co.uf, url="/crm/comarcas")
            for co in comarcas
        ]

    if _tem_permissao(usuario, "laudos:read"):
        laudos = db.scalars(select(Laudo).where(Laudo.titulo.ilike(padrao)).limit(LIMITE_POR_TIPO))
        resultados += [
            ResultadoBusca(tipo="laudo", id=l.id, titulo=l.titulo, subtitulo=None, url=f"/laudos/{l.id}")
            for l in laudos
        ]

    return resultados
