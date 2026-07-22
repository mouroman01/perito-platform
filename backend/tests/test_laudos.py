"""Testes de laudos, incluindo exportação em PDF (RF016) e Word (RF017)."""


def _criar_laudo(client, headers, processo_id, titulo="Laudo de Teste"):
    resp = client.post(
        "/api/v1/laudos",
        headers=headers,
        json={"titulo": titulo, "processo_id": processo_id},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_criar_e_editar_conteudo_do_laudo(client, headers_admin, processo_id):
    laudo = _criar_laudo(client, headers_admin, processo_id)
    lid = laudo["id"]
    assert laudo["status"] == "rascunho"

    r = client.patch(
        f"/api/v1/laudos/{lid}",
        headers=headers_admin,
        json={"conteudo": "1. INTRODUÇÃO\nConteúdo com acento.", "status": "finalizado"},
    )
    assert r.status_code == 200
    assert r.json()["status"] == "finalizado"


def test_exportar_pdf(client, headers_admin, processo_id):
    laudo = _criar_laudo(client, headers_admin, processo_id)
    r = client.get(f"/api/v1/laudos/{laudo['id']}/exportar-pdf", headers=headers_admin)
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/pdf"
    assert r.content[:4] == b"%PDF"  # assinatura de arquivo PDF


def test_exportar_word_gera_docx_valido(client, headers_admin, processo_id):
    laudo = _criar_laudo(client, headers_admin, processo_id, titulo="Laudo Acentuação")
    client.patch(
        f"/api/v1/laudos/{laudo['id']}",
        headers=headers_admin,
        json={"conteudo": "1. CONCLUSÃO\nTexto com acentuação preservada."},
    )
    r = client.get(f"/api/v1/laudos/{laudo['id']}/exportar-word", headers=headers_admin)
    assert r.status_code == 200
    assert "wordprocessingml" in r.headers["content-type"]
    assert r.content[:2] == b"PK"  # .docx é um zip (assinatura PK)
    assert r.headers["content-disposition"].endswith('.docx"')

    # O conteúdo do .docx deve preservar o título e a acentuação.
    import io
    from docx import Document

    doc = Document(io.BytesIO(r.content))
    texto = "\n".join(p.text for p in doc.paragraphs)
    assert "Laudo Acentuação" in texto
    assert "CONCLUSÃO" in texto
