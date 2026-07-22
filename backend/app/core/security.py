import hashlib
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def _create_token(subject: str, expires_delta: timedelta, token_type: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(subject: str) -> str:
    return _create_token(
        subject,
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "access",
    )


def create_refresh_token(subject: str) -> str:
    return _create_token(
        subject,
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        "refresh",
    )


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def _fingerprint_senha(senha_hash: str) -> str:
    return hashlib.sha256(senha_hash.encode("utf-8")).hexdigest()[:16]


def create_reset_token(subject: str, senha_hash_atual: str) -> str:
    """Token de redefinição de senha com fingerprint da senha atual, para que
    o link se torne inválido assim que for usado uma vez (senha muda -> fingerprint muda)."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": "reset_senha",
        "fp": _fingerprint_senha(senha_hash_atual),
        "iat": now,
        "exp": now + timedelta(minutes=settings.RESET_SENHA_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def validar_fingerprint_senha(payload: dict, senha_hash_atual: str) -> bool:
    return payload.get("fp") == _fingerprint_senha(senha_hash_atual)
