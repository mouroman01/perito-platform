"""Testes do módulo de Evidências (RF008): upload multipart, hash SHA-256 e RBAC.

Estes testes dependem do MinIO (armazenamento de objetos). Quando o MinIO não
está acessível, são automaticamente pulados (skip) — em CI, o serviço do MinIO
é provido pelo workflow.
"""
import hashlib
import socket

import pytest


def _minio_disponivel() -> bool:
    from app.core.config import settings

    host, _, porta = settings.MINIO_ENDPOINT.partition(":")
    try:
        with socket.create_connection((host, int(porta or 9000)), timeout=0.5):
            return True
    except OSError:
        return False


pytestmark = pytest.mark.skipif(not _minio_disponivel(), reason="MinIO indisponível")


def _upload(client, headers, processo_id, conteudo: bytes, **campos):
    return client.post(
        f"/api/v1/processos/{processo_id}/evidencias",
        headers=headers,
        data={"tipo": "foto", **campos},
        files={"arquivo": ("foto.jpg", conteudo, "image/jpeg")},
    )


def test_upload_evidencia_calcula_hash_sha256(client, headers_admin, processo_id):
    conteudo = b"conteudo binario de evidencia pericial"
    resp = _upload(client, headers_admin, processo_id, conteudo, midia_origem="pendrive", descricao="Foto do local")
    assert resp.status_code == 201, resp.text
    ev = resp.json()
    assert ev["tipo"] == "foto"
    assert ev["midia_origem"] == "pendrive"
    assert ev["hash_sha256"] == hashlib.sha256(conteudo).hexdigest()
    assert ev["responsavel"]["nome"] == "Administrador"


def test_download_evidencia_e_integro(client, headers_admin, processo_id):
    conteudo = b"bytes que devem voltar identicos"
    ev = _upload(client, headers_admin, processo_id, conteudo).json()
    r = client.get(f"/api/v1/evidencias/{ev['id']}/download", headers=headers_admin)
    assert r.status_code == 200
    assert r.content == conteudo
    assert r.headers["x-hash-sha256"] == hashlib.sha256(conteudo).hexdigest()


def test_tipo_de_evidencia_invalido_retorna_422(client, headers_admin, processo_id):
    r = _upload(client, headers_admin, processo_id, b"x", tipo="tipo_invalido")
    # 'tipo' é o primeiro campo do form; sobrescrevê-lo é a intenção do teste:
    r = client.post(
        f"/api/v1/processos/{processo_id}/evidencias",
        headers=headers_admin,
        data={"tipo": "tipo_invalido"},
        files={"arquivo": ("x.txt", b"x", "text/plain")},
    )
    assert r.status_code == 422


def test_evidencia_respeita_rbac(client, headers_admin, criar_usuario, processo_id):
    headers, _ = criar_usuario("evid_leitura", ["processos:read"])
    # Pode listar (processos:read)...
    assert client.get(f"/api/v1/processos/{processo_id}/evidencias", headers=headers).status_code == 200
    # ...mas não enviar (exige processos:write).
    r = client.post(
        f"/api/v1/processos/{processo_id}/evidencias",
        headers=headers,
        data={"tipo": "foto"},
        files={"arquivo": ("x.jpg", b"x", "image/jpeg")},
    )
    assert r.status_code == 403
