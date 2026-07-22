import smtplib
from datetime import datetime
from email.message import EmailMessage

from app.core.config import settings


def _registrar_em_arquivo(destinatario: str, assunto: str, corpo_texto: str) -> None:
    """Sem SMTP configurado (dev), registra o e-mail em /logs/emails.log em vez de enviar."""
    settings.LOGS_DIR.mkdir(parents=True, exist_ok=True)
    with open(settings.LOGS_DIR / "emails.log", "a", encoding="utf-8") as arquivo:
        arquivo.write(
            f"\n{'=' * 70}\n"
            f"{datetime.now().isoformat(timespec='seconds')} | Para: {destinatario} | Assunto: {assunto}\n"
            f"{'-' * 70}\n"
            f"{corpo_texto}\n"
        )


def enviar_email(destinatario: str, assunto: str, corpo_texto: str) -> None:
    if not settings.SMTP_HOST:
        _registrar_em_arquivo(destinatario, assunto, corpo_texto)
        return

    mensagem = EmailMessage()
    mensagem["Subject"] = assunto
    mensagem["From"] = settings.SMTP_FROM
    mensagem["To"] = destinatario
    mensagem.set_content(corpo_texto)

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as servidor:
        servidor.starttls()
        if settings.SMTP_USER:
            servidor.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        servidor.send_message(mensagem)
