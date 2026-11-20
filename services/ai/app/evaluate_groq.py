"""Manual Free-tier Groq acceptance: one diagnostic or ten bounded real requests.

No network in the ordinary GitHub CI, and no saved game, player identity,
unreleased scene or private manuscript is used by this runner.
"""
from __future__ import annotations

import argparse
import asyncio
import os
import statistics
import time
from dataclasses import dataclass, replace
from datetime import UTC, datetime

from app.evaluation_scenarios import planned_requests
from app.generation import generate
from app.groq_provider import GroqProvider, groq_config_issue, groq_provider

_CONFIRM_ONE = "I_APPROVE_1_GROQ_CALL"
_CONFIRM_TEN = "I_APPROVE_10_GROQ_CALLS"
_STATUSES = frozenset({"VALIDATED", "FALLBACK_REQUIRED"})
_REASONS = frozenset({
    "NONE", "UNAVAILABLE", "TIMEOUT", "INVALID_OUTPUT",
    "UNAUTHORIZED_CONTEXT", "BUDGET_EXCEEDED",
})
_CODES = frozenset({
    "HTTP_400", "HTTP_401", "HTTP_403", "HTTP_404", "HTTP_408",
    "HTTP_429", "HTTP_500", "HTTP_502", "HTTP_503", "HTTP_OTHER",
    "RESPONSE_OVERSIZED", "RESPONSE_INVALID_JSON", "RESPONSE_ENVELOPE",
    "RESPONSE_CHOICES", "RESPONSE_NOT_STOP", "RESPONSE_MESSAGE",
    "RESPONSE_SCHEMA", "SELECTION_INVALID", "SELECTION_VALID",
    "LOCAL_OPTIONS_MISMATCH", "NETWORK_TIMEOUT", "NETWORK_ERROR",
})


@dataclass(frozen=True)
class Outcome:
    case: str
    locale: str
    status: str
    duration_ms: float
    reason: str
    provider_code: str


class EvaluationBlocked(RuntimeError):
    """Only fixed, non-secret reason codes; never retain environment values."""

    def __init__(self, code: str) -> None:
        super().__init__("Protected Groq preflight rejected")
        self.code = code


def require_manual_authorization(mode: str) -> GroqProvider:
    if mode not in ("diagnostic-one", "acceptance-ten"):
        raise EvaluationBlocked("INVALID_MODE")
    expected = _CONFIRM_ONE if mode == "diagnostic-one" else _CONFIRM_TEN
    if os.getenv("AMI_GROQ_EVAL_CONFIRM") != expected:
        raise EvaluationBlocked("CONFIRMATION")
    if os.getenv("AMI_GROQ_EVAL_MODE") != mode:
        raise EvaluationBlocked("MODE_MISMATCH")
    if os.getenv("GITHUB_ACTIONS") != "true":
        raise EvaluationBlocked("NOT_GITHUB_ACTIONS")
    if os.getenv("AMI_AI_GENERATION", "0") != "0":
        raise EvaluationBlocked("GENERATION_NOT_OFF")
    issue = groq_config_issue()
    if issue is not None:
        raise EvaluationBlocked(issue)
    provider = groq_provider()
    if not isinstance(provider, GroqProvider):
        raise EvaluationBlocked("PROVIDER_REJECTED")
    return provider


async def evaluate(provider: GroqProvider, mode: str) -> tuple[Outcome, ...]:
    cases = planned_requests()[:1] if mode == "diagnostic-one" else planned_requests()
    outcomes: list[Outcome] = []
    for name, request in cases:
        codes: list[str] = []
        started = time.perf_counter()
        response = await generate(
            request,
            replace(provider, diagnostic_sink=codes.append),
        )
        duration = (time.perf_counter() - started) * 1000
        status = response.status if response.status in _STATUSES else "OTHER"
        raw_reason = getattr(response, "reason", "NONE")
        reason = raw_reason if raw_reason in _REASONS else "OTHER"
        raw_code = codes[-1] if codes else "NO_HTTP_RESULT"
        code = raw_code if raw_code in _CODES else "UNKNOWN"
        outcomes.append(Outcome(name, request.locale, status, duration, reason, code))
    return tuple(outcomes)


def summarize(outcomes: tuple[Outcome, ...], mode: str) -> bool:
    print("AMI-108 Groq Free evaluation | mode:", mode)
    print("UTC:", datetime.now(UTC).isoformat(timespec="seconds"))
    for outcome in outcomes:
        # Only fixed scenarios, approved locales, safe codes and timings.
        print(
            f"{outcome.case:14s} {outcome.locale:5s} "
            f"{outcome.status:18s} {outcome.duration_ms:.0f} ms "
            f"reason={outcome.reason} provider={outcome.provider_code}"
        )
    times = sorted(x.duration_ms for x in outcomes)
    if not times:
        return False
    passes = sum(x.status == "VALIDATED" for x in outcomes)
    p95 = times[max(0, (95 * len(times) + 99) // 100 - 1)]
    print(
        f"Summary: {passes}/{len(outcomes)} validated; "
        f"median={statistics.median(times):.0f}ms p95={p95:.0f}ms"
    )
    print("EVIDENCE_LIMIT: sample only; no gameplay deployment or general uptime claim")
    return passes == len(outcomes) and len(outcomes) == (
        1 if mode == "diagnostic-one" else 10
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Bounded private Groq Free evaluation")
    parser.add_argument("--dry-run", action="store_true", help="Offline scenario preflight")
    parser.add_argument("--diagnostic-one", action="store_true", help="Exactly one real request")
    args = parser.parse_args()
    planned = planned_requests()
    if args.dry_run:
        print(f"OFFLINE: {len(planned)} allowed bilingual cases; zero provider requests")
        return 0
    mode = "diagnostic-one" if args.diagnostic_one else "acceptance-ten"
    try:
        provider = require_manual_authorization(mode)
    except EvaluationBlocked as exc:
        print("BLOCKED:", exc.code)
        return 2
    result = asyncio.run(evaluate(provider, mode))
    return 0 if summarize(result, mode) else 1


if __name__ == "__main__":
    raise SystemExit(main())
