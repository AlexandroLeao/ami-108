"""Remote evaluation rehearsal — all cases and tests are strictly offline."""
import asyncio
import sys
from types import SimpleNamespace

import pytest

from app import evaluate_cloud
from app.cloudflare_provider import CloudflareProvider

_ACCOUNT = "a" * 32
_TOKEN = "test_private_cloudflare_token_012345"
_MODEL = "@cf/google/gemma-4-26b-a4b-it"
_CONFIRM = "I_APPROVE_10_CLOUDFLARE_CALLS"


def test_planned_ten_calls_are_allowlisted_and_bilingual() -> None:
    cases = evaluate_cloud.planned_requests()
    assert len(cases) == 10
    assert [label for label, _ in cases] == [
        "intro-random", "intro-random", "dog-random", "dog-random",
        "rat-random", "rat-random", "dog-correct", "dog-correct",
        "rat-correct", "rat-correct",
    ]
    assert [request.locale for _, request in cases] == ["pt-BR", "en"] * 5
    assert all(request.deadlineMs == 2500 for _, request in cases)
    assert all(len(request.factIds) <= 8 for _, request in cases)


def test_requires_manual_confirmation_and_single_purpose_runner(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AMI_AI_PROVIDER", "cloudflare")
    monkeypatch.setenv("AMI_CLOUDFLARE_ACCOUNT_ID", _ACCOUNT)
    monkeypatch.setenv("AMI_CLOUDFLARE_API_TOKEN", _TOKEN)
    monkeypatch.setenv("AMI_CLOUDFLARE_MODEL", _MODEL)
    monkeypatch.setenv("AMI_AI_GENERATION", "0")
    monkeypatch.setenv("GITHUB_ACTIONS", "true")
    monkeypatch.delenv("AMI_CLOUD_EVAL_CONFIRM", raising=False)
    with pytest.raises(RuntimeError):
        evaluate_cloud.require_manual_authorization()
    monkeypatch.setenv("AMI_CLOUD_EVAL_CONFIRM", _CONFIRM)
    provider = evaluate_cloud.require_manual_authorization()
    assert isinstance(provider, CloudflareProvider)
    monkeypatch.setenv("AMI_AI_GENERATION", "1")
    with pytest.raises(RuntimeError):
        evaluate_cloud.require_manual_authorization()
    monkeypatch.setenv("AMI_AI_GENERATION", "0")
    monkeypatch.delenv("GITHUB_ACTIONS")
    with pytest.raises(RuntimeError):
        evaluate_cloud.require_manual_authorization()


def test_dry_run_does_not_call_remote_provider(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setattr(sys, "argv", ["evaluate_cloud", "--dry-run"])
    monkeypatch.setattr(
        evaluate_cloud, "require_manual_authorization",
        lambda: pytest.fail("No credentials in dry run"),
    )
    assert evaluate_cloud.main() == 0
    assert "OFFLINE" in capsys.readouterr().out


def test_unauthorized_run_refuses_without_printing_secret(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setattr(sys, "argv", ["evaluate_cloud"])
    monkeypatch.setenv("AMI_CLOUDFLARE_API_TOKEN", _TOKEN)
    monkeypatch.delenv("AMI_CLOUD_EVAL_CONFIRM", raising=False)
    assert evaluate_cloud.main() == 2
    output = capsys.readouterr().out
    assert "BLOCKED:" in output
    assert _TOKEN not in output


def test_ten_serial_attempts_and_only_sanitized_summary(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    seen: list[tuple[str, str]] = []

    async def stub_generate(request: object, provider: object) -> SimpleNamespace:
        assert isinstance(provider, CloudflareProvider)
        from app.generation import GenerationRequest

        assert isinstance(request, GenerationRequest)
        seen.append((request.questionId, request.locale))
        return SimpleNamespace(status="VALIDATED")

    monkeypatch.setattr(evaluate_cloud, "generate", stub_generate)
    provider = CloudflareProvider(_ACCOUNT, _TOKEN, _MODEL)
    result = asyncio.run(evaluate_cloud.evaluate(provider))
    assert len(seen) == 10
    assert len(result) == 10
    assert evaluate_cloud.summarize(result)
    output = capsys.readouterr().out
    assert "10/10 validated" in output
    assert _TOKEN not in output
    assert _ACCOUNT not in output
    assert "DOG-VISION" not in output
    assert "Octopuses" not in output


def test_failed_case_does_not_claim_acceptance(
    capsys: pytest.CaptureFixture[str],
) -> None:
    good = evaluate_cloud.Evaluation("intro-random", "pt-BR", "VALIDATED", 300.0)
    bad = evaluate_cloud.Evaluation("intro-random", "en", "FALLBACK_REQUIRED", 2000.0)
    assert not evaluate_cloud.summarize((good, bad))
    assert "1/2 validated" in capsys.readouterr().out

@pytest.mark.parametrize(
    ("account", "token", "model", "expected"),
    [
        ("", _TOKEN, _MODEL, "ACCOUNT_ID_FORMAT"),
        (_ACCOUNT, "", _MODEL, "API_TOKEN_FORMAT"),
        (_ACCOUNT, "value with spaces", _MODEL, "API_TOKEN_FORMAT"),
        (_ACCOUNT, _TOKEN, "unsupported", "MODEL_ALLOWLIST"),
    ],
)
def test_config_failure_exposes_only_safe_reason_code(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
    account: str,
    token: str,
    model: str,
    expected: str,
) -> None:
    monkeypatch.setattr(sys, "argv", ["evaluate_cloud"])
    monkeypatch.setenv("AMI_AI_PROVIDER", "cloudflare")
    monkeypatch.setenv("AMI_CLOUDFLARE_ACCOUNT_ID", account)
    monkeypatch.setenv("AMI_CLOUDFLARE_API_TOKEN", token)
    monkeypatch.setenv("AMI_CLOUDFLARE_MODEL", model)
    monkeypatch.setenv("AMI_CLOUD_EVAL_CONFIRM", _CONFIRM)
    monkeypatch.setenv("GITHUB_ACTIONS", "true")
    monkeypatch.setenv("AMI_AI_GENERATION", "0")
    assert evaluate_cloud.main() == 2
    output = capsys.readouterr().out
    assert "BLOCKED: " + expected in output
    assert _TOKEN not in output
    assert _ACCOUNT not in output
    assert "value with spaces" not in output


def test_config_diagnostic_never_makes_network_call(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AMI_CLOUDFLARE_API_TOKEN", "")
    monkeypatch.setenv("AMI_CLOUDFLARE_ACCOUNT_ID", _ACCOUNT)
    monkeypatch.setenv("AMI_CLOUDFLARE_MODEL", _MODEL)
    monkeypatch.setenv("AMI_AI_PROVIDER", "cloudflare")
    monkeypatch.setenv("AMI_CLOUD_EVAL_CONFIRM", _CONFIRM)
    monkeypatch.setenv("AMI_AI_GENERATION", "0")
    monkeypatch.setenv("GITHUB_ACTIONS", "true")
    with pytest.raises(evaluate_cloud.EvaluationBlocked) as exception:
        evaluate_cloud.require_manual_authorization()
    assert exception.value.code == "API_TOKEN_FORMAT"
