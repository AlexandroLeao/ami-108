import asyncio
import json
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

from app.generation import GenerationRequest, generate, retrieve
from app.ollama_provider import OllamaProvider, local_provider


@pytest.mark.parametrize(
    ("url", "model"),
    [
        ("https://ollama.com", "model:1b"),
        ("http://8.8.8.8:11434", "model:1b"),
        ("http://localhost:11434/path", "model:1b"),
        ("http://user@localhost:11434", "model:1b"),
        ("http://localhost:11434", "model:cloud"),
        ("http://localhost:11434", "model"),
    ],
)
def test_refuses_nonlocal_or_cloud_configuration(
    monkeypatch: pytest.MonkeyPatch, url: str, model: str
) -> None:
    monkeypatch.setenv("AMI_AI_PROVIDER", "ollama")
    monkeypatch.setenv("AMI_OLLAMA_URL", url)
    monkeypatch.setenv("AMI_OLLAMA_MODEL", model)
    assert local_provider() is None


def test_explicit_local_configuration(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AMI_OLLAMA_URL", "http://ollama:11434")
    monkeypatch.setenv("AMI_OLLAMA_MODEL", "model:1b")
    monkeypatch.delenv("AMI_AI_PROVIDER", raising=False)
    assert local_provider() is None
    monkeypatch.setenv("AMI_AI_PROVIDER", "ollama")
    assert local_provider() == OllamaProvider("ollama", 11434, "model:1b")


def test_transport_uses_bounded_nonstreaming_authorized_context() -> None:
    req = GenerationRequest(
        requestId=str(uuid4()),
        questionId="INTRO-RANDOM",
        category="RANDOM",
        locale="pt-BR",
        factIds=["INTRO-OCTOPUS", "INTRO-PENGUIN"],
        deadlineMs=2500,
    )
    context = retrieve(req)
    assert context is not None
    with (
        patch("app.ollama_provider.secrets.SystemRandom"),
        patch("app.ollama_provider.http.client.HTTPConnection") as constructor,
    ):
        conn = constructor.return_value
        response = MagicMock()
        response.status = 200
        response.read.return_value = json.dumps(
            {"done": True, "response": "1"}
        ).encode()
        conn.getresponse.return_value = response
        provider = OllamaProvider("ollama", 11434, "model:1b")
        assert provider._generate(context) == context.alternatives[0]
        method, path, body, headers = conn.request.call_args.args
        assert method == "POST"
        assert path == "/api/generate"
        assert headers == {"Content-Type": "application/json"}
        data = json.loads(body)
        assert data["model"] == "model:1b"
        assert data["stream"] is False
        assert data["keep_alive"] == "5m"
        constructor.assert_called_once_with("ollama", 11434, timeout=2.0)
        assert data["options"]["num_predict"] == 4
        prompt = json.loads(data["prompt"])
        assert prompt["options"] == {"0": "Octopuses have three hearts.", "1": "Penguins cannot fly."}
        assert prompt["locale"] == "en"
        assert set(prompt) == {"locale", "category", "options"}
        assert req.requestId not in data["prompt"]
        response.read.assert_called_once_with(16385)
        conn.close.assert_called_once()


@pytest.mark.parametrize("output", ["-1", "2", "01", "1.0", "1 because", "Penguins cannot fly.", ""])
def test_invalid_index_fails_closed(output: str) -> None:
    req = GenerationRequest(
        requestId=str(uuid4()), questionId="INTRO-RANDOM", category="RANDOM",
        locale="en", factIds=["INTRO-OCTOPUS", "INTRO-PENGUIN"], deadlineMs=2500,
    )
    with (
        patch("app.ollama_provider.secrets.SystemRandom"),
        patch("app.ollama_provider.http.client.HTTPConnection") as constructor,
    ):
        conn = constructor.return_value
        conn.getresponse.return_value.status = 200
        conn.getresponse.return_value.read.return_value = json.dumps(
            {"done": True, "response": output}
        ).encode()
        result = asyncio.run(generate(req, OllamaProvider("ollama", 11434, "model:1b")))
        assert result.status == "FALLBACK_REQUIRED"
        assert result.reason == "INVALID_OUTPUT"


@pytest.mark.parametrize(("output", "index"), [("0", 0), (" 1\n", 1), ("2", 2)])
def test_maps_only_current_context(output: str, index: int) -> None:
    req = GenerationRequest(
        requestId=str(uuid4()), questionId="Q-RAT", category="RANDOM", locale="en",
        factIds=["RAT-RECIPE", "RAT-LAUNDRY", "RAT-PENGUIN"], deadlineMs=2500,
    )
    context = retrieve(req)
    assert context is not None
    with (
        patch("app.ollama_provider.secrets.SystemRandom"),
        patch("app.ollama_provider.http.client.HTTPConnection") as constructor,
    ):
        conn = constructor.return_value
        conn.getresponse.return_value.status = 200
        conn.getresponse.return_value.read.return_value = json.dumps(
            {"done": True, "response": output}
        ).encode()
        result = asyncio.run(generate(req, OllamaProvider("ollama", 11434, "model:1b")))
        assert result.status == "VALIDATED"
        assert result.text == (context.approved_text, *context.alternatives)[index]


@pytest.mark.parametrize("locale", ["pt-BR", "en"])
def test_shared_prompt_maps_to_requested_language(locale: str) -> None:
    req = GenerationRequest.model_validate({
        "requestId": str(uuid4()), "questionId": "Q-DOG", "category": "RANDOM",
        "locale": locale, "factIds": ["DOG-RECIPE", "DOG-SATURN", "DOG-LAUNDRY"],
        "deadlineMs": 2500,
    })
    context = retrieve(req)
    assert context is not None
    with (
        patch("app.ollama_provider.secrets.SystemRandom"),
        patch("app.ollama_provider.http.client.HTTPConnection") as constructor,
    ):
        conn = constructor.return_value
        conn.getresponse.return_value.status = 200
        conn.getresponse.return_value.read.return_value = json.dumps(
            {"done": True, "response": "2"}
        ).encode()
        result = asyncio.run(generate(req, OllamaProvider("ollama", 11434, "model:1b")))
        assert result.status == "VALIDATED"
        assert result.text == context.alternatives[1]
        prompt = json.loads(json.loads(conn.request.call_args.args[2])["prompt"])
        assert prompt["locale"] == "en"
        assert prompt["options"]["2"] == "To remove stains from light fabrics, mild soap is recommended."
        assert prompt["options"]["0"] == "Three eggs. Two cups of sugar. Mix until smooth."


@pytest.mark.parametrize("locale", ["pt-BR", "en"])
def test_random_permutation_maps_index_to_same_authorized_bilingual_option(locale: str) -> None:
    req = GenerationRequest.model_validate({
        "requestId": str(uuid4()), "questionId": "Q-DOG", "category": "RANDOM",
        "locale": locale, "factIds": ["DOG-RECIPE", "DOG-SATURN", "DOG-LAUNDRY"],
        "deadlineMs": 2500,
    })
    context = retrieve(req)
    assert context is not None
    with (
        patch("app.ollama_provider.secrets.SystemRandom") as rng,
        patch("app.ollama_provider.http.client.HTTPConnection") as constructor,
    ):
        rng.return_value.shuffle.side_effect = lambda order: order.reverse()
        conn = constructor.return_value
        conn.getresponse.return_value.status = 200
        conn.getresponse.return_value.read.return_value = json.dumps(
            {"done": True, "response": "0"}
        ).encode()
        result = asyncio.run(generate(req, OllamaProvider("ollama", 11434, "model:1b")))
        assert result.status == "VALIDATED"
        assert result.text == context.alternatives[1]
        prompt = json.loads(json.loads(conn.request.call_args.args[2])["prompt"])
        assert prompt["options"]["0"] == context.selection_options[2]
        assert prompt["options"]["2"] == context.selection_options[0]
        rng.return_value.shuffle.assert_called_once()


def test_correct_order_is_not_shuffled() -> None:
    req = GenerationRequest(
        requestId=str(uuid4()), questionId="Q-DOG", category="CORRECT", locale="en",
        factIds=["DOG-VISION", "DOG-HEARING", "DOG-WAIT"], deadlineMs=2500,
    )
    context = retrieve(req)
    assert context is not None
    with (
        patch("app.ollama_provider.secrets.SystemRandom") as rng,
        patch("app.ollama_provider.http.client.HTTPConnection") as constructor,
    ):
        conn = constructor.return_value
        conn.getresponse.return_value.status = 200
        conn.getresponse.return_value.read.return_value = json.dumps(
            {"done": True, "response": "1"}
        ).encode()
        result = asyncio.run(generate(req, OllamaProvider("ollama", 11434, "model:1b")))
        assert result.status == "VALIDATED"
        assert result.text == context.alternatives[0]
        rng.assert_not_called()


@pytest.mark.parametrize("locale", ["pt-BR", "en"])
def test_expanded_pool_samples_three_and_maps_new_variant(locale: str) -> None:
    facts = [
        "RAT-RECIPE", "RAT-LAUNDRY", "RAT-PENGUIN", "RAT-KILOGRAM",
        "RAT-BREAD", "RAT-FRUIT", "RAT-CALENDAR", "RAT-BOOKS",
    ]
    req = GenerationRequest.model_validate({
        "requestId": str(uuid4()), "questionId": "Q-RAT", "category": "RANDOM",
        "locale": locale, "factIds": facts, "deadlineMs": 2500,
    })
    context = retrieve(req)
    assert context is not None
    assert len(context.selection_options) == 8
    assert retrieve(req.model_copy(update={"factIds": facts[:-1]})) is None
    assert retrieve(req.model_copy(update={"factIds": facts[:3]})) is not None
    with (
        patch("app.ollama_provider.secrets.SystemRandom") as rng,
        patch("app.ollama_provider.http.client.HTTPConnection") as constructor,
    ):
        rng.return_value.shuffle.side_effect = lambda order: order.reverse()
        conn = constructor.return_value
        conn.getresponse.return_value.status = 200
        conn.getresponse.return_value.read.return_value = json.dumps(
            {"done": True, "response": "0"}
        ).encode()
        result = asyncio.run(generate(req, OllamaProvider("ollama", 11434, "model:1b")))
        assert result.status == "VALIDATED"
        assert result.text == context.alternatives[-1]
        prompt = json.loads(json.loads(conn.request.call_args.args[2])["prompt"])
        assert list(prompt["options"].values()) == list(reversed(context.selection_options))[:3]
        conn.getresponse.return_value.read.return_value = json.dumps(
            {"done": True, "response": "7"}
        ).encode()
        invalid = asyncio.run(generate(req, OllamaProvider("ollama", 11434, "model:1b")))
        assert invalid.status == "FALLBACK_REQUIRED"
        assert invalid.reason == "INVALID_OUTPUT"


def test_resident_model_is_explicit_and_preserves_transport_deadline(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AMI_AI_PROVIDER", "ollama")
    monkeypatch.setenv("AMI_OLLAMA_URL", "http://ollama:11434")
    monkeypatch.setenv("AMI_OLLAMA_MODEL", "model:1b")
    monkeypatch.setenv("AMI_OLLAMA_KEEP_ALIVE", "-1")
    provider = local_provider()
    assert isinstance(provider, OllamaProvider)
    assert provider.timeout_seconds == 2.0
    req = GenerationRequest(
        requestId=str(uuid4()), questionId="INTRO-RANDOM", category="RANDOM",
        locale="en", factIds=["INTRO-OCTOPUS", "INTRO-PENGUIN"], deadlineMs=2500,
    )
    context = retrieve(req)
    assert context is not None
    with (
        patch("app.ollama_provider.secrets.SystemRandom"),
        patch("app.ollama_provider.http.client.HTTPConnection") as constructor,
    ):
        conn = constructor.return_value
        conn.getresponse.return_value.status = 200
        conn.getresponse.return_value.read.return_value = json.dumps(
            {"done": True, "response": "0"}
        ).encode()
        assert provider._generate(context) == context.approved_text
        assert json.loads(conn.request.call_args.args[2])["keep_alive"] == -1
        constructor.assert_called_once_with("ollama", 11434, timeout=2.0)
    monkeypatch.setenv("AMI_OLLAMA_KEEP_ALIVE", "unbounded-invalid")
    assert local_provider() is None
