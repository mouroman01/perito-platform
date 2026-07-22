from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jwt import ExpiredSignatureError, InvalidTokenError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import (
    create_access_token,
    create_refresh_token,
    create_reset_token,
    decode_token,
    hash_password,
    validar_fingerprint_senha,
)
from app.models.usuario import Usuario
from app.schemas.auth import (
    EsqueciSenhaRequest,
    LoginResponse,
    RedefinirSenhaRequest,
    RefreshRequest,
    Token,
)
from app.schemas.usuario import UsuarioOut
from app.services import usuario_service
from app.services.email_service import enviar_email

router = APIRouter(prefix="/auth", tags=["autenticação"])

MENSAGEM_ESQUECI_SENHA = "Se o e-mail existir em nossa base, um link de redefinição foi enviado."


@router.post("/login", response_model=LoginResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = usuario_service.autenticar(db, form_data.username, form_data.password)
    return LoginResponse(
        access_token=create_access_token(str(usuario.id)),
        refresh_token=create_refresh_token(str(usuario.id)),
        usuario=usuario,
    )


@router.post("/refresh", response_model=Token)
def refresh(dados: RefreshRequest, db: Session = Depends(get_db)):
    erro = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token inválido")
    try:
        payload = decode_token(dados.refresh_token)
    except (ExpiredSignatureError, InvalidTokenError):
        raise erro

    if payload.get("type") != "refresh":
        raise erro

    usuario_id = payload.get("sub")
    usuario = db.get(Usuario, int(usuario_id)) if usuario_id else None
    if usuario is None or not usuario.ativo:
        raise erro

    return Token(
        access_token=create_access_token(str(usuario.id)),
        refresh_token=create_refresh_token(str(usuario.id)),
    )


@router.get("/me", response_model=UsuarioOut)
def me(usuario_atual: Usuario = Depends(get_current_user)):
    return usuario_atual


@router.post("/esqueci-senha")
def esqueci_senha(dados: EsqueciSenhaRequest, db: Session = Depends(get_db)):
    usuario = usuario_service.obter_por_email(db, dados.email)
    if usuario is not None and usuario.ativo:
        token = create_reset_token(str(usuario.id), usuario.senha_hash)
        link = f"{settings.FRONTEND_URL}/redefinir-senha?token={token}"
        enviar_email(
            usuario.email,
            "Redefinição de senha - Perito OS",
            f"Olá {usuario.nome},\n\n"
            f"Recebemos uma solicitação para redefinir sua senha no Perito OS.\n"
            f"Clique no link abaixo para escolher uma nova senha (válido por "
            f"{settings.RESET_SENHA_EXPIRE_MINUTES} minutos):\n\n{link}\n\n"
            f"Se você não solicitou essa alteração, ignore este e-mail.",
        )
    # Sempre retorna a mesma mensagem, independente de o e-mail existir ou não
    return {"detail": MENSAGEM_ESQUECI_SENHA}


@router.post("/redefinir-senha")
def redefinir_senha(dados: RedefinirSenhaRequest, db: Session = Depends(get_db)):
    erro = HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Link inválido ou expirado")
    try:
        payload = decode_token(dados.token)
    except (ExpiredSignatureError, InvalidTokenError):
        raise erro

    if payload.get("type") != "reset_senha":
        raise erro

    usuario_id = payload.get("sub")
    usuario = db.get(Usuario, int(usuario_id)) if usuario_id else None
    if usuario is None or not usuario.ativo:
        raise erro

    if not validar_fingerprint_senha(payload, usuario.senha_hash):
        # Token já foi usado uma vez (a senha mudou desde que o link foi gerado)
        raise erro

    usuario.senha_hash = hash_password(dados.nova_senha)
    db.commit()
    return {"detail": "Senha redefinida com sucesso."}
