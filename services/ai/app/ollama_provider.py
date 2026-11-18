"""Optional local-only Ollama transport. No cloud client or automatic model pull."""
import asyncio
import http.client
import json
import os
import re
from dataclasses import dataclass
from urllib.parse import urlsplit

from app.generation import AuthorizedContext, Provider

_LOCAL_HOSTS = {"127.0.0.1", "localhost", "::1", "ollama"}


@dataclass(frozen=True)
class OllamaProvider:
    host: str
    port: int
    model: str
    timeout_seconds: float = 2.0

    async def generate(self, context: AuthorizedContext) -> str:
        return await asyncio.to_thread(self._generate, context)

    def _generate(self, context: AuthorizedContext) -> str:
        # No identity, secret, whole catalog, arbitrary prompt, or future facts.
        # The strict validator accepts only the finite authorized utterances.
        prompt = json.dumps(
            {
                "locale": context.locale,
                "category": context.category,
                "facts": list(context.facts),
                "approved_utterance": context.approved_text,
                "alternatives": list(context.alternatives),
            },
            ensure_ascii=False,
        )
        body = json.dumps(
            {
                "model": self.model,
                "system": (
                    "You are AMI-108. Return exactly one of approved_utterance or "
                    "alternatives in the requested language. Vary your selection. "
                    "Do not add, translate, explain or alter facts."
                ),
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.5, "num_predict": 160},
                "keep_alive": "5m",
            },
            ensure_ascii=False,
        ).encode("utf-8")
        # Direct connection, no proxy or redirect handling. A local server must
        # have cloud features disabled by the operator (OLLAMA_NO_CLOUD=1).
        conn = http.client.HTTPConnection(self.host, self.port, timeout=self.timeout_seconds)
        try:
            conn.request("POST", "/api/generate", body, {"Content-Type": "application/json"})
            response = conn.getresponse()
            if response.status != 200:
                raise RuntimeError("Local generation unavailable")
            raw = response.read(16385)
            if len(raw) > 16384:
                raise ValueError("Oversized generation response")
            result = json.loads(raw)
            if not isinstance(result, dict) or result.get("done") is not True:
                raise ValueError("Incomplete generation response")
            text = result.get("response")
            if not isinstance(text, str):
                raise TypeError("Invalid generation response")
            return text
        finally:
            conn.close()


def local_provider() -> Provider | None:
    if os.getenv("AMI_AI_PROVIDER") != "ollama":
        return None
    model = os.getenv("AMI_OLLAMA_MODEL", "")
    url = os.getenv("AMI_OLLAMA_URL", "")
    # Require a named local tag, reject cloud tags, paths and implicit defaults.
    if not re.fullmatch(r"[A-Za-z0-9_.-]+:[A-Za-z0-9_.-]+", model) or "cloud" in model.lower():
        return None
    try:
        target = urlsplit(url)
        if (
            target.scheme != "http"
            or target.hostname not in _LOCAL_HOSTS
            or target.username is not None
            or target.password is not None
            or target.path not in ("", "/")
            or target.query
            or target.fragment
        ):
            return None
        return OllamaProvider(target.hostname, target.port or 11434, model)
    except ValueError:
        return None
