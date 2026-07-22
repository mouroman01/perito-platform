from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core import historico_listener  # noqa: F401 — registra o listener de histórico de alterações
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.middleware import AuditoriaMiddleware

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(AuditoriaMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["health"])
def health():
    banco_ok = True
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception:
        banco_ok = False

    return {
        "status": "ok" if banco_ok else "degraded",
        "projeto": settings.PROJECT_NAME,
        "banco_de_dados": "ok" if banco_ok else "indisponivel",
    }
