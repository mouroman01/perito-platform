from fastapi import APIRouter

from app.api.v1.endpoints import (
    advogados,
    agenda,
    auditoria,
    auth,
    biblioteca,
    busca,
    clientes,
    comarcas,
    contatos,
    dashboard,
    documentos,
    escritorios,
    evidencias,
    financeiro,
    historico,
    laudos,
    magistrados,
    perfis,
    processos,
    prospeccoes,
    relatorios,
    usuarios,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(usuarios.router)
api_router.include_router(perfis.router)
api_router.include_router(comarcas.router)
api_router.include_router(magistrados.router)
api_router.include_router(escritorios.router)
api_router.include_router(advogados.router)
api_router.include_router(contatos.router)
api_router.include_router(clientes.router)
api_router.include_router(prospeccoes.router)
api_router.include_router(processos.router)
api_router.include_router(agenda.router)
api_router.include_router(documentos.router)
api_router.include_router(evidencias.router)
api_router.include_router(financeiro.router)
api_router.include_router(biblioteca.router)
api_router.include_router(laudos.router)
api_router.include_router(relatorios.router)
api_router.include_router(auditoria.router)
api_router.include_router(historico.router)
api_router.include_router(dashboard.router)
api_router.include_router(busca.router)
