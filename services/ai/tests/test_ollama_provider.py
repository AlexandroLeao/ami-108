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
    with patch("app.ollama_provider.http.client.HTTPConnection") as constructor:
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
        assert data["options"]["num_predict"] == 4
        prompt = json.loads(data["prompt"])
        assert prompt["options"] == {"0": context.approved_text, "1": context.alternatives[0]}
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
    with patch("app.ollama_provider.http.client.HTTPConnection") as constructor:
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
    with patch("app.ollama_provider.http.client.HTTPConnection") as constructor:
        conn = constructor.return_value
        conn.getresponse.return_value.status = 200
        conn.getresponse.return_value.read.return_value = json.dumps(
            {"done": True, "response": output}
        ).encode()
        result = asyncio.run(generate(req, OllamaProvider("ollama", 11434, "model:1b")))
        assert result.status == "VALIDATED"
        assert result.text == (context.approved_text, *context.alternatives)[index]
