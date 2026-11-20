"""Groq integration contract tests: strictly offline; never contact the vendor."""
import asyncio
import json
from unittest.mock import patch
from uuid import uuid4

import pytest

from app.generation import GenerationRequest, generate, retrieve
from app.groq_provider import GroqProvider, groq_config_issue, groq_provider

_KEY = "gsk_test_private_api_key_0123456789abcdef"
_MODEL = "openai/gpt-oss-20b"


def request(locale: str = "pt-BR", category: str = "RANDOM") -> GenerationRequest:
    if category == "CORRECT":
        facts = ["DOG-VISION", "DOG-HEARING", "DOG-WAIT"]
    else:
        facts = ["DOG-RECIPE", "DOG-SATURN", "DOG-LAUNDRY"]
    return GenerationRequest.model_validate({
        "requestId": str(uuid4()),
        "questionId": "Q-DOG",
        "category": category,
        "locale": locale,
        "factIds": facts,
        "deadlineMs": 2500,
    })


def response(selection: object, finish: str = "stop") -> bytes:
    return json.dumps({
        "choices": [{
            "finish_reason": finish,
            "message": {"content": json.dumps({"selection": selection})},
        }]
    }).encode()


@pytest.mark.parametrize(
    ("key", "model", "error"),
    [
        ("", _MODEL, "API_KEY_FORMAT"),
        ("short", _MODEL, "API_KEY_FORMAT"),
        ("invalid key with spaces", _MODEL, "API_KEY_FORMAT"),
        (_KEY, "", "MODEL_ALLOWLIST"),
        (_KEY, "another-model", "MODEL_ALLOWLIST"),
        (_KEY, "https://evil.invalid", "MODEL_ALLOWLIST"),
    ],
)
def test_bad_config_is_disabled(
    monkeypatch: pytest.MonkeyPatch, key: str, model: str, error: str
) -> None:
    monkeypatch.setenv("AMI_AI_PROVIDER", "groq")
    monkeypatch.setenv("AMI_GROQ_API_KEY", key)
    monkeypatch.setenv("AMI_GROQ_MODEL", model)
    assert groq_config_issue() == error
    assert groq_provider() is None


def test_default_mode_off_and_key_hidden(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AMI_GROQ_API_KEY", _KEY)
    monkeypatch.setenv("AMI_GROQ_MODEL", _MODEL)
    monkeypatch.delenv("AMI_AI_PROVIDER", raising=False)
    assert groq_provider() is None
    monkeypatch.setenv("AMI_AI_PROVIDER", "cloudflare")
    assert groq_provider() is None
    monkeypatch.setenv("AMI_AI_PROVIDER", "groq")
    provider = groq_provider()
    assert isinstance(provider, GroqProvider)
    assert provider.timeout_seconds == 2.0
    assert _KEY not in repr(provider)


@pytest.mark.parametrize("locale", ["pt-BR", "en"])
def test_https_schema_strict_and_localized_selection(locale: str) -> None:
    req = request(locale)
    context = retrieve(req)
    assert context is not None
    with (
        patch("app.groq_provider.secrets.SystemRandom") as randomizer,
        patch("app.groq_provider.http.client.HTTPSConnection") as constructor,
    ):
        randomizer.return_value.shuffle.side_effect = lambda order: order.reverse()
        conn = constructor.return_value
        conn.getresponse.return_value.status = 200
        conn.getresponse.return_value.read.return_value = response("0")
        provider = GroqProvider(_KEY)
        result = asyncio.run(generate(req, provider))
        assert result.status == "VALIDATED"
        assert result.text == context.alternatives[1]
        constructor.assert_called_once_with("api.groq.com", 443, timeout=2.0)
        method, path, body, headers = conn.request.call_args.args
        assert method == "POST"
        assert path == "/openai/v1/chat/completions"
        assert headers["Authorization"] == "Bearer " + _KEY
        payload = json.loads(body)
        assert payload["model"] == _MODEL
        assert payload["response_format"]["type"] == "json_schema"
        constraint = payload["response_format"]["json_schema"]
        assert constraint["strict"] is True
        assert constraint["schema"] == {
            "type": "object",
            "properties": {
                "selection": {"type": "string", "enum": ["0", "1", "2"]}
            },
            "required": ["selection"],
            "additionalProperties": False,
        }
        assert payload["stream"] is False
        assert payload["reasoning_effort"] == "low"
        assert payload["temperature"] == 0
        assert payload["max_completion_tokens"] == 96
        prompt = json.loads(payload["messages"][1]["content"])
        assert len(prompt["options"]) == 3
        assert list(prompt["options"].values()) == list(reversed(context.selection_options))
        body_text = body.decode()
        assert _KEY not in body_text
        assert req.requestId not in body_text
        assert "DOG-VISION" not in body_text
        conn.request.assert_called_once()
        conn.close.assert_called_once()


def test_correct_does_not_shuffle() -> None:
    with (
        patch("app.groq_provider.secrets.SystemRandom") as randomizer,
        patch("app.groq_provider.http.client.HTTPSConnection") as constructor,
    ):
        conn = constructor.return_value
        conn.getresponse.return_value.status = 200
        conn.getresponse.return_value.read.return_value = response("1")
        result = asyncio.run(generate(request(category="CORRECT"), GroqProvider(_KEY)))
        assert result.status == "VALIDATED"
        randomizer.assert_not_called()


@pytest.mark.parametrize(
    ("status", "finish", "value", "reason"),
    [
        (401, "stop", "0", "UNAVAILABLE"),
        (403, "stop", "0", "UNAVAILABLE"),
        (429, "stop", "0", "UNAVAILABLE"),
        (500, "stop", "0", "UNAVAILABLE"),
        (302, "stop", "0", "UNAVAILABLE"),
        (200, "length", "0", "UNAVAILABLE"),
        (200, "stop", "99", "INVALID_OUTPUT"),
        (200, "stop", "explanation 1", "INVALID_OUTPUT"),
        (200, "stop", 1, "INVALID_OUTPUT"),
    ],
)
def test_bad_responses_fail_closed(
    status: int, finish: str, value: object, reason: str
) -> None:
    notes: list[str] = []
    with patch("app.groq_provider.http.client.HTTPSConnection") as constructor:
        conn = constructor.return_value
        conn.getresponse.return_value.status = status
        conn.getresponse.return_value.read.return_value = response(value, finish)
        result = asyncio.run(generate(
            request(), GroqProvider(_KEY, diagnostic_sink=notes.append)
        ))
        assert result.status == "FALLBACK_REQUIRED"
        assert result.reason == reason
        assert "SELECTION_VALID" not in notes
        assert notes[-1] in (
            "HTTP_401", "HTTP_403", "HTTP_429", "HTTP_500", "HTTP_OTHER",
            "RESPONSE_NOT_STOP", "SELECTION_INVALID",
        )
        conn.request.assert_called_once()
        conn.close.assert_called_once()


@pytest.mark.parametrize(
    ("body", "expected"),
    [
        (b"not json", "RESPONSE_INVALID_JSON"),
        (b"[]", "RESPONSE_ENVELOPE"),
        (b'{"choices":[]}', "RESPONSE_CHOICES"),
        (b'{"choices":[{"finish_reason":"stop","message":{"content":"{}"}}]}',
         "RESPONSE_SCHEMA"),
        (b'{"choices":[{"finish_reason":"stop","message":{"content":"{\"selection\":\"0\",\"extra\":1}"}}]}',
         "RESPONSE_SCHEMA"),
    ],
)
def test_malformed_response_rejected(body: bytes, expected: str) -> None:
    notes: list[str] = []
    with patch("app.groq_provider.http.client.HTTPSConnection") as constructor:
        conn = constructor.return_value
        conn.getresponse.return_value.status = 200
        conn.getresponse.return_value.read.return_value = body
        result = asyncio.run(generate(request(), GroqProvider(_KEY, diagnostic_sink=notes.append)))
        assert result.status == "FALLBACK_REQUIRED"
        assert notes[-1] == expected
        conn.request.assert_called_once()


def test_timeout_and_oversize_have_no_retry() -> None:
    with patch("app.groq_provider.http.client.HTTPSConnection") as constructor:
        conn = constructor.return_value
        conn.getresponse.side_effect = TimeoutError("secret server information")
        result = asyncio.run(generate(request(), GroqProvider(_KEY)))
        assert result.status == "FALLBACK_REQUIRED"
        assert result.reason == "TIMEOUT"
        conn.request.assert_called_once()
        conn.close.assert_called_once()

    with patch("app.groq_provider.http.client.HTTPSConnection") as constructor:
        conn = constructor.return_value
        conn.getresponse.return_value.status = 200
        conn.getresponse.return_value.read.return_value = b"x" * 16385
        result = asyncio.run(generate(request(), GroqProvider(_KEY)))
        assert result.status == "FALLBACK_REQUIRED"
        assert result.reason == "UNAVAILABLE"
        conn.request.assert_called_once()
        conn.close.assert_called_once()


def test_unauthorized_context_never_calls_remote_provider() -> None:
    req = request().model_copy(update={"factIds": ["NOT-APPROVED"]})
    with patch("app.groq_provider.http.client.HTTPSConnection") as constructor:
        result = asyncio.run(generate(req, GroqProvider(_KEY)))
        assert result.status == "FALLBACK_REQUIRED"
        assert result.reason == "UNAUTHORIZED_CONTEXT"
        constructor.assert_not_called()
