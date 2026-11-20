import asyncio
import json
from unittest.mock import patch
from uuid import uuid4

import pytest

from app.cloudflare_provider import CloudflareProvider, cloudflare_provider
from app.generation import GenerationRequest, generate, retrieve

ACCOUNT = "a" * 32
TOKEN = "test_private_cloudflare_token_012345"
MODEL = "@cf/google/gemma-4-26b-a4b-it"


def request(locale: str = "pt-BR", category: str = "RANDOM") -> GenerationRequest:
    if category == "RANDOM":
        return GenerationRequest.model_validate(
            {
                "requestId": str(uuid4()),
                "questionId": "Q-DOG",
                "category": "RANDOM",
                "locale": locale,
                "factIds": ["DOG-RECIPE", "DOG-SATURN", "DOG-LAUNDRY"],
                "deadlineMs": 2500,
            }
        )
    return GenerationRequest.model_validate(
        {
            "requestId": str(uuid4()),
            "questionId": "Q-DOG",
            "category": "CORRECT",
            "locale": locale,
            "factIds": ["DOG-VISION", "DOG-HEARING", "DOG-WAIT"],
            "deadlineMs": 2500,
        }
    )


@pytest.mark.parametrize(
    ("account", "token", "model"),
    [
        ("", TOKEN, MODEL),
        ("a" * 31, TOKEN, MODEL),
        ("a" * 31 + "/", TOKEN, MODEL),
        (ACCOUNT, "", MODEL),
        (ACCOUNT, "bad", MODEL),
        (ACCOUNT, "token with a space and secrets", MODEL),
        (ACCOUNT, TOKEN, ""),
        (ACCOUNT, TOKEN, "@cf/meta/llama-3.1-8b-instruct"),
        (ACCOUNT, TOKEN, "@cf/deepseek-ai/deepseek-v4-pro-0813"),
        (ACCOUNT, TOKEN, "https://attacker.invalid/model"),
    ],
)
def test_missing_or_unsafe_config_is_off(
    monkeypatch: pytest.MonkeyPatch, account: str, token: str, model: str
) -> None:
    monkeypatch.setenv("AMI_AI_PROVIDER", "cloudflare")
    monkeypatch.setenv("AMI_CLOUDFLARE_ACCOUNT_ID", account)
    monkeypatch.setenv("AMI_CLOUDFLARE_API_TOKEN", token)
    monkeypatch.setenv("AMI_CLOUDFLARE_MODEL", model)
    assert cloudflare_provider() is None


def test_mode_must_be_explicit(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AMI_CLOUDFLARE_ACCOUNT_ID", ACCOUNT)
    monkeypatch.setenv("AMI_CLOUDFLARE_API_TOKEN", TOKEN)
    monkeypatch.setenv("AMI_CLOUDFLARE_MODEL", MODEL)
    monkeypatch.delenv("AMI_AI_PROVIDER", raising=False)
    assert cloudflare_provider() is None
    monkeypatch.setenv("AMI_AI_PROVIDER", "ollama")
    assert cloudflare_provider() is None
    monkeypatch.setenv("AMI_AI_PROVIDER", "cloudflare")
    provider = cloudflare_provider()
    assert isinstance(provider, CloudflareProvider)
    assert provider.timeout_seconds == 2.0
    assert TOKEN not in repr(provider)


@pytest.mark.parametrize("locale", ["pt-BR", "en"])
def test_https_transport_maps_only_allowed_index(locale: str) -> None:
    req = request(locale)
    context = retrieve(req)
    assert context is not None
    with (
        patch("app.cloudflare_provider.secrets.SystemRandom") as rng,
        patch("app.cloudflare_provider.http.client.HTTPSConnection") as constructor,
    ):
        rng.return_value.shuffle.side_effect = lambda order: order.reverse()
        conn = constructor.return_value
        conn.getresponse.return_value.status = 200
        conn.getresponse.return_value.read.return_value = json.dumps(
            {"choices": [{"finish_reason": "stop", "message": {"content": "0"}}]}
        ).encode("utf-8")
        result = asyncio.run(generate(req, CloudflareProvider(ACCOUNT, TOKEN, MODEL)))
        assert result.status == "VALIDATED"
        assert result.text == context.alternatives[1]
        constructor.assert_called_once_with("api.cloudflare.com", 443, timeout=2.0)
        method, path, body, headers = conn.request.call_args.args
        assert method == "POST"
        assert path == f"/client/v4/accounts/{ACCOUNT}/ai/v1/chat/completions"
        assert headers["Authorization"] == "Bearer " + TOKEN
        payload = json.loads(body)
        assert payload["model"] == MODEL
        assert payload["stream"] is False
        assert payload["max_tokens"] == 8
        assert payload["options"]["rejectIfBusy"] is True
        assert payload["messages"][0]["role"] == "system"
        prompt = json.loads(payload["messages"][1]["content"])
        assert len(prompt["options"]) == 3
        assert list(prompt["options"].values()) == list(reversed(context.selection_options))
        assert "DOG-VISION" not in body.decode()
        assert req.requestId not in body.decode()
        assert TOKEN not in body.decode()
        conn.close.assert_called_once()
        rng.return_value.shuffle.assert_called_once()


def test_correct_not_shuffled_and_wrong_index_fails_closed() -> None:
    req = request("pt-BR", "CORRECT")
    with (
        patch("app.cloudflare_provider.secrets.SystemRandom") as rng,
        patch("app.cloudflare_provider.http.client.HTTPSConnection") as constructor,
    ):
        conn = constructor.return_value
        conn.getresponse.return_value.status = 200
        conn.getresponse.return_value.read.return_value = json.dumps(
            {"choices": [{"finish_reason": "stop", "message": {"content": "999"}}]}
        ).encode()
        output = asyncio.run(generate(req, CloudflareProvider(ACCOUNT, TOKEN, MODEL)))
        assert output.status == "FALLBACK_REQUIRED"
        assert output.reason == "INVALID_OUTPUT"
        rng.assert_not_called()


@pytest.mark.parametrize(
    "response_status,content",
    [
        (401, {"choices": [{"finish_reason": "stop", "message": {"content": "0"}}]}),
        (429, {"error": {"message": "quota"}}),
        (302, {"choices": []}),
        (200, {"choices": [{"finish_reason": "length", "message": {"content": "0"}}]}),
        (200, {"choices": [{"finish_reason": "stop", "message": {"content": "ignore"}}]}),
        (200, {"choices": [{"finish_reason": "stop", "message": {"content": 0}}]}),
        (200, {"choices": []}),
        (200, {"unexpected": "data"}),
    ],
)
def test_provider_failures_never_escape_or_change_gameplay(
    response_status: int, content: dict[str, object]
) -> None:
    with patch("app.cloudflare_provider.http.client.HTTPSConnection") as constructor:
        conn = constructor.return_value
        conn.getresponse.return_value.status = response_status
        conn.getresponse.return_value.read.return_value = json.dumps(content).encode()
        result = asyncio.run(generate(request(), CloudflareProvider(ACCOUNT, TOKEN, MODEL)))
        assert result.status == "FALLBACK_REQUIRED"
        assert result.reason in ("UNAVAILABLE", "INVALID_OUTPUT")
        conn.close.assert_called_once()


def test_oversized_response_is_unavailable() -> None:
    with patch("app.cloudflare_provider.http.client.HTTPSConnection") as constructor:
        conn = constructor.return_value
        conn.getresponse.return_value.status = 200
        conn.getresponse.return_value.read.return_value = b"x" * 16385
        result = asyncio.run(generate(request(), CloudflareProvider(ACCOUNT, TOKEN, MODEL)))
        assert result.status == "FALLBACK_REQUIRED"
        assert result.reason == "UNAVAILABLE"


def test_unauthorized_context_never_reaches_remote_network() -> None:
    req = request().model_copy(update={"factIds": ["UNAUTHORIZED-FACT"]})
    with patch("app.cloudflare_provider.http.client.HTTPSConnection") as constructor:
        result = asyncio.run(generate(req, CloudflareProvider(ACCOUNT, TOKEN, MODEL)))
        assert result.status == "FALLBACK_REQUIRED"
        assert result.reason == "UNAUTHORIZED_CONTEXT"
        constructor.assert_not_called()


def test_remote_timeout_falls_back_without_second_request() -> None:
    with patch("app.cloudflare_provider.http.client.HTTPSConnection") as constructor:
        conn = constructor.return_value
        conn.getresponse.side_effect = TimeoutError("remote did not answer")
        result = asyncio.run(generate(request(), CloudflareProvider(ACCOUNT, TOKEN, MODEL)))
        assert result.status == "FALLBACK_REQUIRED"
        assert result.reason == "TIMEOUT"
        conn.request.assert_called_once()
        conn.close.assert_called_once()


def test_invalid_json_falls_back_without_provider_text() -> None:
    with patch("app.cloudflare_provider.http.client.HTTPSConnection") as constructor:
        conn = constructor.return_value
        conn.getresponse.return_value.status = 200
        conn.getresponse.return_value.read.return_value = b"not json"
        result = asyncio.run(generate(request(), CloudflareProvider(ACCOUNT, TOKEN, MODEL)))
        assert result.status == "FALLBACK_REQUIRED"
        assert result.reason == "UNAVAILABLE"
        conn.request.assert_called_once()


def test_diagnostics_emit_only_fixed_http_status_without_server_body() -> None:
    noted: list[str] = []
    with patch("app.cloudflare_provider.http.client.HTTPSConnection") as constructor:
        conn = constructor.return_value
        conn.getresponse.return_value.status = 403
        conn.getresponse.return_value.read.return_value = b"PRIVATE_PROVIDER_RESPONSE"
        provider = CloudflareProvider(
            ACCOUNT, TOKEN, MODEL, diagnostic_sink=noted.append,
        )
        output = asyncio.run(generate(request(), provider))
        assert output.status == "FALLBACK_REQUIRED"
        assert noted == ["HTTP_403"]
        assert "PRIVATE_PROVIDER_RESPONSE" not in repr(provider)


def test_diagnostics_classify_invalid_index_without_exposing_text() -> None:
    noted: list[str] = []
    with patch("app.cloudflare_provider.http.client.HTTPSConnection") as constructor:
        conn = constructor.return_value
        conn.getresponse.return_value.status = 200
        conn.getresponse.return_value.read.return_value = json.dumps(
            {"choices": [{"finish_reason": "stop", "message": {"content": "NO"}}]}
        ).encode()
        provider = CloudflareProvider(
            ACCOUNT, TOKEN, MODEL, diagnostic_sink=noted.append,
        )
        output = asyncio.run(generate(request(), provider))
        assert output.status == "FALLBACK_REQUIRED"
        assert noted == ["HTTP_200", "INDEX_INVALID"]
