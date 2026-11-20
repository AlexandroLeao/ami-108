"""Offline HTTP-boundary regression for the opt-in Groq adapter.

No Groq credentials, vendor requests, saved sessions, or production database.
"""
import json
from unittest.mock import patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.generation import GenerationRequest, retrieve
from app.groq_provider import GroqProvider
from app.main import create_app

_TOKEN = "isolated-internal-test-token"
_KEY = "gsk_dummy_offline_key_0123456789abcdef"
_AUTH = {"Authorization": "Bearer " + _TOKEN}
_CONTEXTS = (
    ("INTRO-RANDOM", "RANDOM", ["INTRO-OCTOPUS", "INTRO-PENGUIN"]),
    ("Q-DOG", "CORRECT", ["DOG-VISION", "DOG-HEARING", "DOG-WAIT"]),
    ("Q-DOG", "RANDOM", ["DOG-RECIPE", "DOG-SATURN", "DOG-LAUNDRY"]),
    ("Q-RAT", "CORRECT", ["RAT-LIGHT", "RAT-CONTAINMENT"]),
    ("Q-RAT", "RANDOM", ["RAT-RECIPE", "RAT-LAUNDRY", "RAT-PENGUIN"]),
)


def request_body(
    question: str = "Q-DOG",
    category: str = "CORRECT",
    facts: list[str] | None = None,
    locale: str = "pt-BR",
) -> dict[str, object]:
    return {
        "requestId": str(uuid4()),
        "questionId": question,
        "category": category,
        "locale": locale,
        "factIds": facts if facts is not None else ["DOG-VISION", "DOG-HEARING", "DOG-WAIT"],
        "deadlineMs": 2500,
    }


def reply(selection: object = "0", finish_reason: str = "stop") -> bytes:
    return json.dumps({
        "choices": [{
            "finish_reason": finish_reason,
            "message": {"content": json.dumps({"selection": selection})},
        }],
    }).encode("utf-8")


@pytest.mark.parametrize("locale", ["pt-BR", "en"])
@pytest.mark.parametrize(("question", "category", "facts"), _CONTEXTS)
def test_real_groq_adapter_through_authenticated_fastapi_http(
    locale: str, question: str, category: str, facts: list[str]
) -> None:
    body = request_body(question, category, facts, locale)
    context = retrieve(GenerationRequest.model_validate(body))
    assert context is not None

    with (
        patch("app.groq_provider.http.client.HTTPSConnection") as constructor,
        patch("app.groq_provider.secrets.SystemRandom") as randomizer,
    ):
        # Stable mock order makes the schema-index mapping independently testable.
        randomizer.return_value.shuffle.side_effect = lambda order: None
        conn = constructor.return_value
        conn.getresponse.return_value.status = 200
        conn.getresponse.return_value.read.return_value = reply()
        with TestClient(create_app(GroqProvider(_KEY), _TOKEN)) as client:
            result = client.post("/internal/generate", json=body, headers=_AUTH)

        assert result.status_code == 200
        assert result.json() == {
            "requestId": body["requestId"], "status": "VALIDATED",
            "text": context.approved_text,
        }
        constructor.assert_called_once_with("api.groq.com", 443, timeout=2.0)
        conn.request.assert_called_once()
        method, path, raw, headers = conn.request.call_args.args
        assert (method, path) == ("POST", "/openai/v1/chat/completions")
        assert headers["Authorization"] == "Bearer " + _KEY
        vendor_payload = json.loads(raw)
        assert vendor_payload["model"] == "openai/gpt-oss-20b"
        assert vendor_payload["response_format"]["json_schema"]["strict"] is True
        assert vendor_payload["response_format"]["json_schema"]["schema"]["properties"][
            "selection"
        ]["enum"] == [str(i) for i in range(min(3, len(context.selection_options)))]
        vendor_options = json.loads(vendor_payload["messages"][1]["content"])["options"]
        assert vendor_options == {
            str(i): context.selection_options[i]
            for i in range(min(3, len(context.selection_options)))
        }
        assert len(vendor_options) <= 3
        assert str(body["requestId"]) not in raw.decode("utf-8")
        assert question not in raw.decode("utf-8")
        assert all(fact not in raw.decode("utf-8") for fact in facts)
        assert _KEY not in raw.decode("utf-8")
        conn.close.assert_called_once()


def test_auth_and_context_denials_do_not_contact_groq() -> None:
    body = request_body()
    with patch("app.groq_provider.http.client.HTTPSConnection") as constructor:
        with TestClient(create_app(GroqProvider(_KEY), _TOKEN)) as client:
            for headers in ({}, {"Authorization": "Bearer invalid"}):
                response = client.post("/internal/generate", json=body, headers=headers)
                assert response.status_code == 403
                assert response.json()["code"] == "NOT_AUTHORIZED"
            invalid = request_body(facts=["FUTURE-SPOILER"])
            response = client.post("/internal/generate", json=invalid, headers=_AUTH)
            assert response.status_code == 200
            assert response.json() == {
                "requestId": invalid["requestId"],
                "status": "FALLBACK_REQUIRED",
                "reason": "UNAUTHORIZED_CONTEXT",
            }
        constructor.assert_not_called()


@pytest.mark.parametrize(
    ("status", "selection", "reason"),
    [
        (401, "0", "UNAVAILABLE"),
        (403, "0", "UNAVAILABLE"),
        (429, "0", "UNAVAILABLE"),
        (200, "99", "INVALID_OUTPUT"),
        (200, 0, "INVALID_OUTPUT"),
    ],
)
def test_vendor_rejection_fails_closed_without_retry_or_secret_leak(
    status: int, selection: object, reason: str
) -> None:
    body = request_body()
    with patch("app.groq_provider.http.client.HTTPSConnection") as constructor:
        conn = constructor.return_value
        conn.getresponse.return_value.status = status
        conn.getresponse.return_value.read.return_value = reply(selection)
        with TestClient(create_app(GroqProvider(_KEY), _TOKEN)) as client:
            result = client.post("/internal/generate", json=body, headers=_AUTH)
        assert result.status_code == 200
        assert result.json() == {
            "requestId": body["requestId"], "status": "FALLBACK_REQUIRED",
            "reason": reason,
        }
        assert _KEY not in result.text
        assert conn.request.call_count == 1
        conn.close.assert_called_once()


def test_vendor_timeout_falls_back_without_retry() -> None:
    body = request_body()
    with patch("app.groq_provider.http.client.HTTPSConnection") as constructor:
        conn = constructor.return_value
        conn.getresponse.side_effect = TimeoutError("private vendor detail")
        with TestClient(create_app(GroqProvider(_KEY), _TOKEN)) as client:
            result = client.post("/internal/generate", json=body, headers=_AUTH)
        assert result.status_code == 200
        assert result.json() == {
            "requestId": body["requestId"], "status": "FALLBACK_REQUIRED",
            "reason": "TIMEOUT",
        }
        assert "private vendor detail" not in result.text
        assert conn.request.call_count == 1
        conn.close.assert_called_once()
