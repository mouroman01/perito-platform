from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.core.database import SessionLocal
from app.core.security import decode_token
from app.models.log_auditoria import LogAuditoria

METODOS_AUDITADOS = {"POST", "PUT", "PATCH", "DELETE"}


class AuditoriaMiddleware(BaseHTTPMiddleware):
    """Registra requisições de escrita à API para fins de auditoria (RF020)."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        if request.method in METODOS_AUDITADOS and request.url.path.startswith("/api/v1"):
            usuario_id = self._extrair_usuario_id(request)
            self._registrar(request, response.status_code, usuario_id)

        return response

    @staticmethod
    def _extrair_usuario_id(request: Request) -> int | None:
        auth_header = request.headers.get("authorization")
        if not auth_header or not auth_header.lower().startswith("bearer "):
            return None
        token = auth_header.split(" ", 1)[1]
        try:
            payload = decode_token(token)
            if payload.get("type") != "access":
                return None
            return int(payload["sub"])
        except Exception:
            return None

    @staticmethod
    def _registrar(request: Request, status_code: int, usuario_id: int | None) -> None:
        db = SessionLocal()
        try:
            db.add(
                LogAuditoria(
                    metodo=request.method,
                    caminho=request.url.path,
                    status_code=status_code,
                    ip=request.client.host if request.client else None,
                    usuario_id=usuario_id,
                )
            )
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()
