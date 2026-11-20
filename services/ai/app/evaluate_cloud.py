"""One-off, owner-approved Workers AI acceptance checks; no gameplay or saved data.

Runs 10 bounded authenticated calls only when explicitly armed. The sample
consists of existing approved response options; no identities, secrets, saved
sessions, private manuscripts or unreleased scenes leave the test process.
By default, --dry-run is entirely offline and needs no credentials.
"""
from __future__ import annotations

import argparse
import asyncio
import os
import statistics
import time
from dataclasses import dataclass, replace
from datetime import UTC, datetime

from app.cloudflare_provider import CloudflareProvider, cloudflare_config_issue, cloudflare_provider
from app.evaluation_scenarios import planned_requests
from app.generation import Locale, generate

_CONFIRM = "I_APPROVE_10_CLOUDFLARE_CALLS"
_DIAGNOSTIC_CONFIRM = "I_APPROVE_1_CLOUDFLARE_CALL"
@dataclass(frozen=True)
class Evaluation:
    case: str
    locale: Locale
    status: str
    duration_ms: float
    fallback_reason: str = "NONE"
    provider_code: str = "NO_DIAGNOSTIC"


class EvaluationBlocked(RuntimeError):
    """Internal safe error code; no secret or user-provided string is retained."""

    def __init__(self, code: str) -> None:
        super().__init__("Evaluation preflight rejected")
        self.code = code


def require_manual_authorization(mode: str = "acceptance-ten") -> CloudflareProvider:
    if mode not in ("diagnostic-one", "acceptance-ten"):
        raise EvaluationBlocked("INVALID_MODE")
    expected = _DIAGNOSTIC_CONFIRM if mode == "diagnostic-one" else _CONFIRM
    if os.getenv("AMI_CLOUD_EVAL_CONFIRM") != expected:
        raise EvaluationBlocked("CONFIRMATION")
    if os.getenv("AMI_CLOUD_EVAL_MODE", "acceptance-ten") != mode:
        raise EvaluationBlocked("MODE_MISMATCH")
    if os.getenv("AMI_AI_GENERATION", "0") != "0":
        raise EvaluationBlocked("GENERATION_NOT_OFF")
    if os.getenv("GITHUB_ACTIONS") != "true":
        raise EvaluationBlocked("RUNNER_NOT_GITHUB_ACTIONS")
    issue = cloudflare_config_issue()
    if issue is not None:
        raise EvaluationBlocked(issue)
    model = cloudflare_provider()
    if not isinstance(model, CloudflareProvider):
        raise EvaluationBlocked("PROVIDER_REJECTED")
    return model


async def evaluate(
    provider: CloudflareProvider,
    diagnostic_one: bool = False,
) -> tuple[Evaluation, ...]:
    outcomes: list[Evaluation] = []
    # One manual diagnostic or ten acceptance cases. Serial; never retry.
    cases = planned_requests()[:1] if diagnostic_one else planned_requests()
    for name, request in cases:
        codes: list[str] = []
        scoped = replace(provider, diagnostic_sink=codes.append)
        t0 = time.perf_counter()
        result = await generate(request, scoped)
        elapsed = (time.perf_counter() - t0) * 1000
        reason = getattr(result, "reason", "NONE")
        # Strictly bounded internal Reason enum, never a provider-supplied string.
        if reason not in (
            "NONE", "UNAVAILABLE", "TIMEOUT",
            "INVALID_OUTPUT", "UNAUTHORIZED_CONTEXT",
        ):
            reason = "OTHER"
        outcomes.append(
            Evaluation(
                name, request.locale, result.status, elapsed,
                reason, codes[-1] if codes else "NO_HTTP_RESULT",
            )
        )
    return tuple(outcomes)


def summarize(results: tuple[Evaluation, ...]) -> bool:
    print("AMI-108: remote approved-options-only evaluation")
    print("Timestamp (UTC):", datetime.now(UTC).isoformat(timespec="seconds"))
    print("Calls:", len(results), "| unapproved content: none")
    for result in results:
        # Do not log response text, tokens, prompts, session identifiers or secrets.
        print(
            f"{result.case:14s} {result.locale:5s} "
            f"{result.status:18s} {result.duration_ms:.0f} ms "
            f"reason={result.fallback_reason} provider={result.provider_code}"
        )
    times = sorted(x.duration_ms for x in results)
    passed = sum(x.status == "VALIDATED" for x in results)
    if not times:
        return False
    # Nearest-rank p95; do not mistake a ten-case sample for production SLO.
    p95 = times[max(0, int(0.95 * len(times) + 0.999999) - 1)]
    print(
        f"Summary: {passed}/{len(results)} validated; "
        f"median={statistics.median(times):.0f}ms p95={p95:.0f}ms"
    )
    print("EVIDENCE_LIMIT: only this manual 10-call sample, not deployment acceptance")
    return len(results) == 10 and passed == 10


def main() -> int:
    parser = argparse.ArgumentParser(description="Bounded Cloudflare Workers AI evaluation")
    parser.add_argument("--dry-run", action="store_true", help="Check scenarios without network")
    parser.add_argument(
        "--diagnostic-one", action="store_true",
        help="Exactly one guarded remote request, not an acceptance test",
    )
    args = parser.parse_args()
    cases = planned_requests()
    if args.dry_run:
        print("OFFLINE: ten allowlisted cases in both locales; no network")
        print("Counts:", len(cases), "| status: DRY_RUN_ONLY")
        return 0
    try:
        provider = require_manual_authorization(
            "diagnostic-one" if args.diagnostic_one else "acceptance-ten"
        )
    except EvaluationBlocked as exc:
        # Only one fixed reason code; never echo any account ID, token or value.
        print(f"BLOCKED: {exc.code}")
        return 2
    results = asyncio.run(evaluate(provider, diagnostic_one=args.diagnostic_one))
    if args.diagnostic_one:
        print("DIAGNOSTIC_ONLY: one attempt; NOT a ten-case acceptance result")
    return 0 if summarize(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
