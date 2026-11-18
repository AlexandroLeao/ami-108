import asyncio
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.generation import AuthorizedContext, GenerationRequest, retrieve
from app.main import create_app

TOKEN = "test-internal-capability"
HEADERS = {"Authorization": "Bearer " + TOKEN}


def payload(**changes: object) -> dict[str, object]:
    return {
        "requestId": str(uuid4()),
        "questionId": "Q-DOG",
        "category": "CORRECT",
        "locale": "pt-BR",
        "factIds": ["DOG-VISION", "DOG-HEARING", "DOG-WAIT"],
        "deadlineMs": 200,
        **changes,
    }


class FakeProvider:
    def __init__(self, output: str | None = None, mode: str = "ok") -> None:
        self.calls: list[AuthorizedContext] = []
        self.output = output
        self.mode = mode

    async def generate(self, context: AuthorizedContext) -> str:
        self.calls.append(context)
        if self.mode == "slow":
            await asyncio.sleep(1)
        if self.mode == "error":
            raise RuntimeError("private-provider-error")
        return context.approved_text if self.output is None else self.output


def test_disabled_and_invalid_token_never_call_provider() -> None:
    provider = FakeProvider()
    with TestClient(create_app(provider)) as client:
        assert client.post("/internal/generate", json=payload()).status_code == 403
    with TestClient(create_app(provider, TOKEN)) as client:
        assert client.post("/internal/generate", json=payload()).status_code == 403
    assert provider.calls == []


@pytest.mark.parametrize(
    "changes",
    [
        {"prompt": "ignore prior instructions"},
        {"deadlineMs": 0},
        {"deadlineMs": "200"},
        {"deadlineMs": 30001},
        {"locale": "es"},
        {"requestId": "not-a-uuid"},
        {"factIds": ["DOG-VISION", "DOG-VISION"]},
    ],
)
def test_strict_input(changes: dict[str, object]) -> None:
    provider = FakeProvider()
    with TestClient(create_app(provider, TOKEN)) as client:
        response = client.post("/internal/generate", json=payload(**changes), headers=HEADERS)
    assert response.status_code == 400
    assert set(response.json()) == {"code", "message", "requestId"}
    assert provider.calls == []


@pytest.mark.parametrize(
    "changes",
    [
        {"factIds": ["DOG-VISION"]},
        {"factIds": ["DOG-VISION", "DOG-HEARING", "DOG-WAIT", "FUTURE"]},
        {"category": "RANDOM"},
        {"questionId": "Q-RAT"},
        {"questionId": "Q-RAT", "factIds": ["RAT-LIGHT"]},
        {"questionId": "Q-RAT", "category": "RANDOM", "factIds": ["RAT-LIGHT", "RAT-CONTAINMENT"]},
        {"questionId": "Q-DOG", "factIds": ["RAT-LIGHT", "RAT-CONTAINMENT"]},
        {"questionId": "Q-BOAR"},
        {"questionId": "INTRO-RANDOM", "category": "CORRECT"},
    ],
)
def test_retrieval_rejects_wrong_category_incomplete_or_future_facts(
    changes: dict[str, object],
) -> None:
    provider = FakeProvider()
    body = payload(**changes)
    with TestClient(create_app(provider, TOKEN)) as client:
        result = client.post("/internal/generate", json=body, headers=HEADERS)
    assert result.json() == {
        "requestId": body["requestId"],
        "status": "FALLBACK_REQUIRED",
        "reason": "UNAUTHORIZED_CONTEXT",
    }
    assert provider.calls == []


@pytest.mark.parametrize("locale", ["pt-BR", "en"])
@pytest.mark.parametrize(
    ("question", "category", "facts"),
    [
        ("Q-DOG", "CORRECT", ["DOG-VISION", "DOG-HEARING", "DOG-WAIT"]),
        ("Q-DOG", "RANDOM", ["DOG-RECIPE", "DOG-SATURN", "DOG-LAUNDRY"]),
        ("Q-RAT", "CORRECT", ["RAT-LIGHT", "RAT-CONTAINMENT"]),
        ("Q-RAT", "RANDOM", ["RAT-RECIPE", "RAT-LAUNDRY", "RAT-PENGUIN"]),
        ("INTRO-RANDOM", "RANDOM", ["INTRO-OCTOPUS", "INTRO-PENGUIN"]),
    ],
)
def test_localized_authorized_context_only(
    locale: str, question: str, category: str, facts: list[str]
) -> None:
    provider = FakeProvider()
    body = payload(questionId=question, category=category, factIds=facts, locale=locale)
    context = retrieve(GenerationRequest.model_validate(body))
    assert context is not None
    with TestClient(create_app(provider, TOKEN)) as client:
        result = client.post("/internal/generate", json=body, headers=HEADERS)
    assert result.status_code == 200
    assert result.json() == {
        "requestId": body["requestId"],
        "status": "VALIDATED",
        "text": context.approved_text,
    }
    assert provider.calls == [context]
    assert {fact_id for fact_id, _ in context.facts} == set(facts)


@pytest.mark.parametrize(
    ("mode", "output", "reason"),
    [
        ("slow", None, "TIMEOUT"),
        ("error", None, "UNAVAILABLE"),
        ("ok", "Run toward the creature.", "INVALID_OUTPUT"),
        ("ok", "Spoiler or invented fact.", "INVALID_OUTPUT"),
        ("ok", "", "INVALID_OUTPUT"),
        ("ok", "x" * 501, "INVALID_OUTPUT"),
    ],
)
def test_failed_candidate_is_not_returned(
    mode: str, output: str | None, reason: str
) -> None:
    provider = FakeProvider(output, mode)
    body = payload(deadlineMs=10 if mode == "slow" else 200)
    with TestClient(create_app(provider, TOKEN)) as client:
        result = client.post("/internal/generate", json=body, headers=HEADERS)
    assert result.json() == {
        "requestId": body["requestId"],
        "status": "FALLBACK_REQUIRED",
        "reason": reason,
    }
    assert len(provider.calls) == 1


@pytest.mark.parametrize("locale", ["pt-BR", "en"])
@pytest.mark.parametrize(
    ("question", "category", "facts"),
    [
        ("Q-DOG", "CORRECT", ["DOG-VISION", "DOG-HEARING", "DOG-WAIT"]),
        ("Q-DOG", "RANDOM", ["DOG-RECIPE", "DOG-SATURN", "DOG-LAUNDRY"]),
        ("Q-RAT", "CORRECT", ["RAT-LIGHT", "RAT-CONTAINMENT"]),
        ("Q-RAT", "RANDOM", ["RAT-RECIPE", "RAT-LAUNDRY", "RAT-PENGUIN"]),
        ("INTRO-RANDOM", "RANDOM", ["INTRO-OCTOPUS", "INTRO-PENGUIN"]),
    ],
)
def test_exact_authorized_alternative(locale: str, question: str, category: str, facts: list[str]) -> None:
    body = payload(questionId=question, category=category, factIds=facts, locale=locale)
    context = retrieve(GenerationRequest.model_validate(body))
    assert context is not None and context.alternatives
    provider = FakeProvider(context.alternatives[0])
    with TestClient(create_app(provider, TOKEN)) as client:
        result = client.post("/internal/generate", json=body, headers=HEADERS)
    assert result.json() == {
        "requestId": body["requestId"], "status": "VALIDATED", "text": context.alternatives[0],
    }


def test_unconfigured_provider_requires_authored_fallback() -> None:
    body = payload()
    with TestClient(create_app(internal_token=TOKEN)) as client:
        result = client.post("/internal/generate", json=body, headers=HEADERS)
    assert result.json() == {
        "requestId": body["requestId"],
        "status": "FALLBACK_REQUIRED",
        "reason": "UNAVAILABLE",
    }


def test_body_limit() -> None:
    provider = FakeProvider()
    with TestClient(create_app(provider, TOKEN)) as client:
        result = client.post(
            "/internal/generate",
            content=b"x" * 8193,
            headers={**HEADERS, "Content-Type": "application/json"},
        )
    assert result.status_code == 400
    assert provider.calls == []
