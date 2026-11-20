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
from dataclasses import dataclass

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

    async def generate(self, context: AuthorizedContext) -> str:
        return await asyncio.to_thread(self._generate, context)

    def _generate(self, context: AuthorizedContext) -> str:
        choices = (context.approved_text, *context.alternatives)
        if len(choices) != len(context.selection_options):
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
                "max_tokens": 8,
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
                raise RuntimeError("Remote inference unavailable")
            raw = response.read(16385)
            if len(raw) > 16384:
                raise ValueError("Oversized inference response")
            result = json.loads(raw)
            if not isinstance(result, dict):
                raise ValueError("Invalid response envelope")
            items = result.get("choices")
            if not isinstance(items, list) or len(items) != 1:
                raise ValueError("Invalid response choices")
            item = items[0]
            if not isinstance(item, dict) or item.get("finish_reason") != "stop":
                raise ValueError("Incomplete provider response")
            message = item.get("message")
            if not isinstance(message, dict):
                raise ValueError("Invalid provider message")
            content = message.get("content")
            if not isinstance(content, str):
                raise ValueError("Invalid provider text")
            return {str(i): choices[index] for i, index in enumerate(order)}.get(
                content.strip(), ""
            )
        finally:
            conn.close()


def cloudflare_provider() -> Provider | None:
    """No remote provider without an explicit mode, identity, token and model."""
    if os.getenv("AMI_AI_PROVIDER") != "cloudflare":
        return None
    account = os.getenv("AMI_CLOUDFLARE_ACCOUNT_ID", "")
    token = os.getenv("AMI_CLOUDFLARE_API_TOKEN", "")
    model = os.getenv("AMI_CLOUDFLARE_MODEL", "")
    if (
        _ID_PATTERN.fullmatch(account) is None
        or _TOKEN_PATTERN.fullmatch(token) is None
        or model not in _ALLOWED_MODELS
    ):
        return None
    return CloudflareProvider(account.lower(), token, model)
