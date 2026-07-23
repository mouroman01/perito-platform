"""Integração com a API do Google Gemini para os recursos de IA (RF015).

Recursos: resumo de documentos/laudos, sugestão de estrutura de laudo, extração de
informações, checklist automático, organização de evidências e busca inteligente.
A chave da API vem de `settings.GEMINI_API_KEY` (definida em backend/.env, não
versionada). Sem a chave configurada, os endpoints respondem 503 com mensagem clara.

A chamada é feita direto na API REST do Gemini com a biblioteca padrão (`urllib`),
sem dependência extra. A chave vai no cabeçalho `x-goog-api-key` (nunca na URL).
"""
import json
import urllib.error
import urllib.request

from fastapi import HTTPException, status

from app.core.config import settings

_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
_TIMEOUT_SEGUNDOS = 60

# Limites de saída conservadores por recurso.
_MAX_TOKENS_RESUMO = 1500
_MAX_TOKENS_ESTRUTURA = 3000
_MAX_TOKENS_EXTRACAO = 2000
_MAX_TOKENS_CHECKLIST = 2000
_MAX_TOKENS_EVIDENCIAS = 3000
_MAX_TOKENS_BUSCA = 2500

_SYSTEM_RESUMO = (
    "Você é um assistente de um perito judicial no Brasil. Resuma o texto fornecido "
    "em português do Brasil de forma objetiva e fiel, preservando termos técnicos e "
    "jurídicos, valores, datas e nomes das partes. Não invente informações que não "
    "estejam no texto. Responda apenas com o resumo, sem preâmbulos."
)

_SYSTEM_ESTRUTURA = (
    "Você é um assistente de um perito judicial no Brasil. A partir do contexto do "
    "processo, proponha uma estrutura (esqueleto) de laudo pericial em português do "
    "Brasil, com seções e tópicos numerados (ex.: 1. Introdução, 2. Metodologia, "
    "3. Quesitos, 4. Análise, 5. Conclusão), adequada à especialidade e ao objeto do "
    "processo. Use marcadores de preenchimento entre colchetes onde couber. Responda "
    "apenas com a estrutura, sem preâmbulos."
)

_SYSTEM_EXTRACAO = (
    "Você é um assistente de um perito judicial no Brasil. Extraia do texto fornecido "
    "as informações estruturadas solicitadas. Não invente dados que não estejam no "
    "texto — se algo não aparecer, deixe a lista vazia ou o campo em branco. Preserve "
    "os valores exatamente como escritos (datas, valores monetários, números de "
    "documentos). Responda apenas no formato JSON solicitado."
)

_SYSTEM_CHECKLIST = (
    "Você é um assistente de um perito judicial no Brasil. A partir do contexto do "
    "processo, gere um checklist objetivo do que o laudo pericial precisa cobrir e "
    "das verificações que o perito deve realizar, adequado à especialidade e ao "
    "objeto. Cada item deve ser uma ação verificável e concisa. Responda apenas no "
    "formato JSON solicitado."
)

_SYSTEM_EVIDENCIAS = (
    "Você é um assistente de um perito judicial no Brasil. A partir da lista de "
    "evidências de um processo, proponha uma organização útil: agrupamento por tipo e "
    "por mídia de origem, uma linha do tempo pela data de coleta, observações sobre a "
    "cadeia de custódia (uso dos hashes SHA-256 para integridade) e apontamento de "
    "possíveis lacunas. Não invente evidências que não estejam na lista. Responda em "
    "português do Brasil, de forma organizada e sem preâmbulos."
)

_SYSTEM_BUSCA = (
    "Você é um assistente de um perito judicial no Brasil. Responda à pergunta do "
    "perito usando APENAS os itens do acervo do processo fornecidos (documentos, "
    "evidências, laudos e dados do processo). Cite os itens relevantes pelo nome e "
    "explique por que são pertinentes; se nada no acervo responder à pergunta, diga "
    "isso claramente. Não invente itens que não estejam no acervo. Responda em "
    "português do Brasil, sem preâmbulos."
)

# Esquemas de saída estruturada no formato do Gemini (Type em maiúsculas; sem
# `additionalProperties`; `propertyOrdering` fixa a ordem dos campos).
_ESQUEMA_EXTRACAO = {
    "type": "OBJECT",
    "properties": {
        "partes": {"type": "ARRAY", "items": {"type": "STRING"}},
        "valores": {"type": "ARRAY", "items": {"type": "STRING"}},
        "datas": {"type": "ARRAY", "items": {"type": "STRING"}},
        "documentos": {"type": "ARRAY", "items": {"type": "STRING"}},
        "quesitos": {"type": "ARRAY", "items": {"type": "STRING"}},
        "objeto": {"type": "STRING"},
    },
    "required": ["partes", "valores", "datas", "documentos", "quesitos", "objeto"],
    "propertyOrdering": ["partes", "valores", "datas", "documentos", "quesitos", "objeto"],
}

_ESQUEMA_CHECKLIST = {
    "type": "OBJECT",
    "properties": {"itens": {"type": "ARRAY", "items": {"type": "STRING"}}},
    "required": ["itens"],
    "propertyOrdering": ["itens"],
}


def _requisitar(caminho: str, payload: dict) -> dict:
    """POST na API do Gemini. `caminho` é algo como 'models/<modelo>:generateContent'.

    Degrada com 503 quando a chave não está configurada ou é inválida, e quando o
    serviço não responde. A chave vai no cabeçalho, nunca na URL.
    """
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="IA não configurada: defina GEMINI_API_KEY em backend/.env.",
        )

    requisicao = urllib.request.Request(
        f"{_BASE_URL}/{caminho}",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": settings.GEMINI_API_KEY,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(requisicao, timeout=_TIMEOUT_SEGUNDOS) as resposta:
            return json.loads(resposta.read().decode("utf-8"))
    except urllib.error.HTTPError as erro:
        if erro.code in (400, 401, 403):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Chave da API de IA inválida ou requisição rejeitada. Verifique GEMINI_API_KEY.",
            )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Falha ao consultar o serviço de IA (HTTP {erro.code}).",
        )
    except (urllib.error.URLError, TimeoutError):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Serviço de IA indisponível no momento.",
        )


def _texto_da_resposta(resposta: dict) -> str:
    """Extrai o texto concatenado das partes do primeiro candidato."""
    candidatos = resposta.get("candidates") or []
    if not candidatos:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="A IA não retornou conteúdo (possível bloqueio de segurança).",
        )
    partes = candidatos[0].get("content", {}).get("parts", [])
    return "".join(p.get("text", "") for p in partes).strip()


def _gerar(
    system: str,
    conteudo_usuario: str,
    max_tokens: int,
    pensar: bool,
    esquema_json: dict | None = None,
) -> str:
    generation_config: dict = {"maxOutputTokens": max_tokens}
    if not pensar:
        # Desliga o "pensamento" nos recursos simples (mais rápido e barato).
        generation_config["thinkingConfig"] = {"thinkingBudget": 0}
    if esquema_json is not None:
        generation_config["responseMimeType"] = "application/json"
        generation_config["responseSchema"] = esquema_json

    payload = {
        "systemInstruction": {"parts": [{"text": system}]},
        "contents": [{"role": "user", "parts": [{"text": conteudo_usuario}]}],
        "generationConfig": generation_config,
    }
    resposta = _requisitar(f"models/{settings.GEMINI_MODEL}:generateContent", payload)
    return _texto_da_resposta(resposta)


def _gerar_json(system: str, conteudo_usuario: str, max_tokens: int, esquema_json: dict) -> dict:
    texto = _gerar(system, conteudo_usuario, max_tokens, pensar=False, esquema_json=esquema_json)
    try:
        return json.loads(texto)
    except (json.JSONDecodeError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="A IA retornou uma resposta em formato inesperado.",
        )


def resumir(texto: str) -> str:
    return _gerar(_SYSTEM_RESUMO, texto, _MAX_TOKENS_RESUMO, pensar=False)


def sugerir_estrutura_laudo(contexto: str) -> str:
    return _gerar(_SYSTEM_ESTRUTURA, contexto, _MAX_TOKENS_ESTRUTURA, pensar=True)


def extrair_informacoes(texto: str) -> dict:
    return _gerar_json(_SYSTEM_EXTRACAO, texto, _MAX_TOKENS_EXTRACAO, _ESQUEMA_EXTRACAO)


def gerar_checklist(contexto: str) -> list[str]:
    resultado = _gerar_json(_SYSTEM_CHECKLIST, contexto, _MAX_TOKENS_CHECKLIST, _ESQUEMA_CHECKLIST)
    return resultado.get("itens", [])


def organizar_evidencias(contexto: str) -> str:
    return _gerar(_SYSTEM_EVIDENCIAS, contexto, _MAX_TOKENS_EVIDENCIAS, pensar=True)


def busca_inteligente(consulta: str, acervo: str) -> str:
    conteudo = f"Pergunta do perito: {consulta}\n\nAcervo do processo:\n{acervo}"
    return _gerar(_SYSTEM_BUSCA, conteudo, _MAX_TOKENS_BUSCA, pensar=True)


def gerar_embedding(texto: str) -> list[float]:
    """Gera o vetor de embedding de um texto (pesquisa semântica, RF015).

    Usa o modelo de embeddings do Gemini (`text-embedding-004`, 768 dimensões).
    """
    payload = {
        "model": f"models/{settings.GEMINI_EMBED_MODEL}",
        "content": {"parts": [{"text": texto}]},
    }
    resposta = _requisitar(f"models/{settings.GEMINI_EMBED_MODEL}:embedContent", payload)
    valores = resposta.get("embedding", {}).get("values")
    if not valores:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="A IA não retornou um embedding válido.",
        )
    return valores
