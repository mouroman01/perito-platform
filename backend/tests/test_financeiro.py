"""Testes do módulo Financeiro, incluindo DARF/Impostos (tipo_imposto + competência)."""


def _lancamento(**extra):
    base = {"tipo": "saida", "descricao": "Lançamento", "valor": "100.00", "vencimento": "2026-08-10"}
    base.update(extra)
    return base


def test_lancamento_normal_nao_tem_campos_de_imposto(client, headers_admin):
    resp = client.post("/api/v1/financeiro", headers=headers_admin, json=_lancamento(tipo="entrada"))
    assert resp.status_code == 201, resp.text
    corpo = resp.json()
    assert corpo["tipo_imposto"] is None
    assert corpo["competencia"] is None
    assert corpo["status"] in {"pendente", "atrasado", "pago"}


def test_lancamento_darf_persiste_tipo_e_competencia(client, headers_admin):
    resp = client.post(
        "/api/v1/financeiro",
        headers=headers_admin,
        json=_lancamento(descricao="DARF INSS", tipo_imposto="darf_inss", competencia="2026-07-01"),
    )
    assert resp.status_code == 201, resp.text
    corpo = resp.json()
    assert corpo["tipo_imposto"] == "darf_inss"
    assert corpo["competencia"] == "2026-07-01"


def test_tipo_imposto_invalido_retorna_422(client, headers_admin):
    resp = client.post(
        "/api/v1/financeiro", headers=headers_admin, json=_lancamento(tipo_imposto="inexistente")
    )
    assert resp.status_code == 422


def test_filtro_somente_impostos(client, headers_admin):
    normal = client.post("/api/v1/financeiro", headers=headers_admin, json=_lancamento()).json()
    darf = client.post(
        "/api/v1/financeiro", headers=headers_admin, json=_lancamento(tipo_imposto="iss", competencia="2026-07-01")
    ).json()

    resp = client.get("/api/v1/financeiro", headers=headers_admin, params={"somente_impostos": "true"})
    assert resp.status_code == 200
    ids = {item["id"] for item in resp.json()}
    assert darf["id"] in ids
    assert normal["id"] not in ids


def test_marcar_pago_e_desfazer(client, headers_admin):
    lanc = client.post("/api/v1/financeiro", headers=headers_admin, json=_lancamento()).json()
    lid = lanc["id"]
    r = client.patch(f"/api/v1/financeiro/{lid}", headers=headers_admin, json={"pago_em": "2026-08-01"})
    assert r.status_code == 200 and r.json()["status"] == "pago"
    r = client.patch(f"/api/v1/financeiro/{lid}", headers=headers_admin, json={"pago_em": None})
    assert r.status_code == 200 and r.json()["status"] != "pago"
