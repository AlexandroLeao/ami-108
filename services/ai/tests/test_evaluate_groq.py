"""No-network manual Groq evaluation tests: consent, scope and safe logging."""
import asyncio
import sys
from types import SimpleNamespace
from unittest.mock import patch

import pytest

from app import evaluate_groq
from app.groq_provider import GroqProvider

_KEY = "gsk_test_private_api_key_0123456789abcdef"
_MODEL = "openai/gpt-oss-20b"


def configure(monkeypatch: pytest.MonkeyPatch, mode: str = "diagnostic-one") -> None:
    monkeypatch.setenv("AMI_AI_PROVIDER", "groq")
    monkeypatch.setenv("AMI_GROQ_API_KEY", _KEY)
    monkeypatch.setenv("AMI_GROQ_MODEL", _MODEL)
    monkeypatch.setenv("AMI_AI_GENERATION", "0")
    monkeypatch.setenv("GITHUB_ACTIONS", "true")
    monkeypatch.setenv("AMI_GROQ_EVAL_MODE", mode)
    monkeypatch.setenv(
        "AMI_GROQ_EVAL_CONFIRM",
        "I_APPROVE_1_GROQ_CALL" if mode == "diagnostic-one" else "I_APPROVE_10_GROQ_CALLS",
    )


def test_default_dry_run_never_instantiates_network(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setattr(sys, "argv", ["evaluate_groq", "--dry-run"])
    monkeypatch.setattr(
        evaluate_groq,
        "require_manual_authorization",
        lambda mode: pytest.fail("dry-run should not require a key"),
    )
    assert evaluate_groq.main() == 0
    assert "OFFLINE: 10" in capsys.readouterr().out


def test_configuration_requires_matching_consent(
    monkeypatch: pytest.MonkeyPatch
) -> None:
    configure(monkeypatch)
    assert isinstance(
        evaluate_groq.require_manual_authorization("diagnostic-one"), GroqProvider,
    )
    with pytest.raises(evaluate_groq.EvaluationBlocked) as exc:
        evaluate_groq.require_manual_authorization("acceptance-ten")
    assert exc.value.code == "CONFIRMATION"

    monkeypatch.setenv("AMI_GROQ_EVAL_MODE", "acceptance-ten")
    with pytest.raises(evaluate_groq.EvaluationBlocked) as exc:
        evaluate_groq.require_manual_authorization("diagnostic-one")
    assert exc.value.code == "MODE_MISMATCH"

    monkeypatch.setenv("AMI_GROQ_EVAL_MODE", "diagnostic-one")
    monkeypatch.setenv("AMI_AI_GENERATION", "1")
    with pytest.raises(evaluate_groq.EvaluationBlocked) as exc:
        evaluate_groq.require_manual_authorization("diagnostic-one")
    assert exc.value.code == "GENERATION_NOT_OFF"

    monkeypatch.setenv("AMI_AI_GENERATION", "0")
    monkeypatch.delenv("GITHUB_ACTIONS")
    with pytest.raises(evaluate_groq.EvaluationBlocked) as exc:
        evaluate_groq.require_manual_authorization("diagnostic-one")
    assert exc.value.code == "NOT_GITHUB_ACTIONS"


@pytest.mark.parametrize(
    ("mode", "expected_count"),
    [("diagnostic-one", 1), ("acceptance-ten", 10)],
)
def test_serial_evaluation_and_no_secret_output(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
    mode: str,
    expected_count: int,
) -> None:
    seen: list[tuple[str, str]] = []

    async def fake_generate(request: object, provider: object) -> SimpleNamespace:
        from app.generation import GenerationRequest

        assert isinstance(request, GenerationRequest)
        assert isinstance(provider, GroqProvider)
        seen.append((request.questionId, request.locale))
        if provider.diagnostic_sink is not None:
            provider.diagnostic_sink("SELECTION_VALID")
        return SimpleNamespace(status="VALIDATED")

    monkeypatch.setattr(evaluate_groq, "generate", fake_generate)
    outcomes = asyncio.run(evaluate_groq.evaluate(GroqProvider(_KEY), mode))
    assert len(seen) == expected_count
    assert len(outcomes) == expected_count
    assert evaluate_groq.summarize(outcomes, mode)
    output = capsys.readouterr().out
    assert f"{expected_count}/{expected_count} validated" in output
    assert _KEY not in output
    assert "gsk_" not in output
    assert "DOG-VISION" not in output
    assert "Octopuses" not in output
    assert seen[0] == ("INTRO-RANDOM", "pt-BR")


def test_failure_does_not_claim_real_acceptance(
    capsys: pytest.CaptureFixture[str],
) -> None:
    result = evaluate_groq.Outcome(
        "intro-random", "pt-BR", "FALLBACK_REQUIRED",
        350.0, "UNAVAILABLE", "HTTP_429",
    )
    assert not evaluate_groq.summarize((result,), "diagnostic-one")
    assert "provider=HTTP_429" in capsys.readouterr().out


def test_bad_key_is_reported_as_safe_code(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    configure(monkeypatch)
    monkeypatch.setenv("AMI_GROQ_API_KEY", "invalid token with spaces")
    monkeypatch.setattr(sys, "argv", ["evaluate_groq", "--diagnostic-one"])
    with patch("app.groq_provider.http.client.HTTPSConnection") as constructor:
        assert evaluate_groq.main() == 2
        constructor.assert_not_called()
    logs = capsys.readouterr().out
    assert "BLOCKED: API_KEY_FORMAT" in logs
    assert "invalid token with spaces" not in logs
