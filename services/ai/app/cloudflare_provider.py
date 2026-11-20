"""Opt-in Cloudflare Workers AI transport; no credentials or network calls by default.

Selects only an index from previously approved, bounded responses. This adapter
does not authorize any story facts, player state, provider activation or billing.
Those permissions belong to the owner and the authoritative game backend.
"""
import asyncio
import http.client
import json
import os
import re
import secrets
from collections.abc import Callable
from dataclasses import dataclass, field

from app.generation import AuthorizedContext, Provider

_HOST = "api.cloudflare.com"
# Explicit allowlist: verify current Free-plan eligibility before any real use.
# Do not add paid/third-party or retired models without a new review and tests.
_ALLOWED_MODELS = frozenset({"@cf/google/gemma-4-26b-a4b-it"})
_ID_PATTERN = re.compile(r"[a-fA-F0-9]{32}")
_TOKEN_PATTERN = re.compile(r"[A-Za-z0-9_-]{20,256}")


@dataclass(frozen=True, repr=False)
class CloudflareProvider:
    account_id: str
    api_token: str
    model: str
    timeout_seconds: float = 2.0
    diagnostic_sink: Callable[[str], None] | None = field(
        default=None, repr=False, compare=False
    )

    def _note(self, code: str) -> None:
        """Only fixed status codes can reach an opt-in manual diagnostic sink."""
        if self.diagnostic_sink is not None:
            self.diagnostic_sink(code)

    async def generate(self, context: AuthorizedContext) -> str:
        return await asyncio.to_thread(self._generate, context)

    def _generate(self, context: AuthorizedContext) -> str:
        choices = (context.approved_text, *context.alternatives)
        if len(choices) != len(context.selection_options):
            self._note("LOCAL_OPTIONS_MISMATCH")
            return ""
        # Match the accepted Ollama contract: sample at most 3 approved RANDOM
        # options, map only the exact returned numeric index to localized text.
        order = list(range(len(choices)))
        if context.category == "RANDOM":
            secrets.SystemRandom().shuffle(order)
            order = order[:3]
        prompt = json.dumps(
            {"options": {str(i): context.selection_options[index] for i, index in enumerate(order)}},
            ensure_ascii=False,
        )
        payload = json.dumps(
            {
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": "Select one allowed option. Return only its numeric index. No explanation.",
                    },
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0,
                # Gemma 4 is a reasoning-capable model. Eight output tokens can
                # terminate a completion before its final numeric index.
                # Still require finish_reason=stop and an exact allowed index.
                "max_completion_tokens": 64,
                "stream": False,
                "options": {"rejectIfBusy": True},
            },
            ensure_ascii=False,
        ).encode("utf-8")
        # Fixed HTTPS host and path, no user-defined URL, redirects, proxies,
        # cookies, identity, save data or future narrative context.
        target = f"/client/v4/accounts/{self.account_id}/ai/v1/chat/completions"
        conn = http.client.HTTPSConnection(_HOST, 443, timeout=self.timeout_seconds)
        try:
            conn.request(
                "POST",
                target,
                payload,
                {
                    "Authorization": "Bearer " + self.api_token,
                    "Content-Type": "application/json",
                },
            )
            response = conn.getresponse()
            if response.status != 200:
                status_codes = {
                    400: "HTTP_400", 401: "HTTP_401", 403: "HTTP_403",
                    404: "HTTP_404", 408: "HTTP_408", 429: "HTTP_429",
                    500: "HTTP_500", 502: "HTTP_502", 503: "HTTP_503",
                }
                self._note(status_codes.get(response.status, "HTTP_OTHER"))
                raise RuntimeError("Remote inference unavailable")
            self._note("HTTP_200")
            raw = response.read(16385)
            if len(raw) > 16384:
                self._note("RESPONSE_OVERSIZED")
                raise ValueError("Oversized inference response")
            try:
                result = json.loads(raw)
            except (UnicodeDecodeError, json.JSONDecodeError):
                self._note("RESPONSE_INVALID_JSON")
                raise
            if not isinstance(result, dict):
                self._note("RESPONSE_ENVELOPE")
                raise TypeError("Invalid response envelope")
            items = result.get("choices")
            if not isinstance(items, list) or len(items) != 1:
                self._note("RESPONSE_CHOICES")
                raise ValueError("Invalid response choices")
            item = items[0]
            if not isinstance(item, dict):
                self._note("RESPONSE_CHOICE_SHAPE")
                raise TypeError("Invalid provider choice")
            finish = item.get("finish_reason")
            if finish != "stop":
                # Fixed diagnostic categories only. Never log raw finish
                # reason, generated text, provider payload or secrets.
                if finish == "length":
                    self._note("RESPONSE_LENGTH")
                elif finish is None:
                    self._note("RESPONSE_MISSING_FINISH")
                else:
                    self._note("RESPONSE_OTHER_FINISH")
                raise ValueError("Incomplete provider response")
            message = item.get("message")
            if not isinstance(message, dict):
                self._note("RESPONSE_MESSAGE")
                raise TypeError("Invalid provider message")
            content = message.get("content")
            if not isinstance(content, str):
                self._note("RESPONSE_CONTENT")
                raise TypeError("Invalid provider text")
            result_text = {str(i): choices[index] for i, index in enumerate(order)}.get(
                content.strip(), ""
            )
            self._note("INDEX_VALID" if result_text else "INDEX_INVALID")
            return result_text
        except TimeoutError:
            self._note("NETWORK_TIMEOUT")
            raise
        except OSError:
            self._note("NETWORK_ERROR")
            raise
        finally:
            conn.close()


def cloudflare_config_issue() -> str | None:
    """Return only a fixed, non-sensitive reason code, never secret material."""
    if os.getenv("AMI_AI_PROVIDER") != "cloudflare":
        return "PROVIDER_MODE"
    if _ID_PATTERN.fullmatch(os.getenv("AMI_CLOUDFLARE_ACCOUNT_ID", "")) is None:
        return "ACCOUNT_ID_FORMAT"
    if _TOKEN_PATTERN.fullmatch(os.getenv("AMI_CLOUDFLARE_API_TOKEN", "")) is None:
        return "API_TOKEN_FORMAT"
    if os.getenv("AMI_CLOUDFLARE_MODEL", "") not in _ALLOWED_MODELS:
        return "MODEL_ALLOWLIST"
    return None


def cloudflare_provider() -> Provider | None:
    """No remote provider without an explicit mode, identity, token and model."""
    if cloudflare_config_issue() is not None:
        return None
    return CloudflareProvider(
        os.environ["AMI_CLOUDFLARE_ACCOUNT_ID"].lower(),
        os.environ["AMI_CLOUDFLARE_API_TOKEN"],
        os.environ["AMI_CLOUDFLARE_MODEL"],
    )
