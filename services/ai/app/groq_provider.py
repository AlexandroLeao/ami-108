"""Opt-in GroqCloud GPT-OSS inference with strict output and zero gameplay authority.

The model selects one of at most three already-approved English choices. The
server maps that index to a preapproved localized utterance. Free-plan limits,
timeouts and every malformed/unauthorized result fail closed via the existing
authored fallback. No Groq SDK or implicit network work is required.
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

_HOST = "api.groq.com"
_PATH = "/openai/v1/chat/completions"
_MODEL = "openai/gpt-oss-20b"
_TOKEN = re.compile(r"[A-Za-z0-9_-]{20,256}")
_HTTP_CODES = frozenset({400, 401, 403, 404, 408, 429, 500, 502, 503})


@dataclass(frozen=True, repr=False)
class GroqProvider:
    api_key: str
    model: str = _MODEL
    timeout_seconds: float = 2.0
    diagnostic_sink: Callable[[str], None] | None = field(
        default=None, repr=False, compare=False
    )

    def _note(self, code: str) -> None:
        """Emit only fixed internal codes, never provider text or credentials."""
        if self.diagnostic_sink is not None:
            self.diagnostic_sink(code)

    async def generate(self, context: AuthorizedContext) -> str:
        return await asyncio.to_thread(self._generate, context)

    def _generate(self, context: AuthorizedContext) -> str:
        approved = (context.approved_text, *context.alternatives)
        if len(approved) != len(context.selection_options) or not approved:
            self._note("LOCAL_OPTIONS_MISMATCH")
            return ""

        order = list(range(len(approved)))
        if context.category == "RANDOM":
            secrets.SystemRandom().shuffle(order)
            order = order[:3]
        # Schema enum is generated only from server-authorized option indices.
        # Never transmit a player identifier, save, prompt, private manuscript,
        # future facts, session token or raw state to the remote provider.
        allowed = {str(i): approved[j] for i, j in enumerate(order)}
        options = {
            str(i): context.selection_options[j]
            for i, j in enumerate(order)
        }
        schema = {
            "type": "object",
            "properties": {
                "selection": {
                    "type": "string",
                    "enum": list(allowed),
                }
            },
            "required": ["selection"],
            "additionalProperties": False,
        }
        payload = json.dumps(
            {
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "Select exactly one option from the supplied list. "
                            "Return only the schema-constrained selection field. "
                            "Do not answer questions or introduce new facts."
                        ),
                    },
                    {
                        "role": "user",
                        "content": json.dumps({"options": options}, ensure_ascii=False),
                    },
                ],
                "response_format": {
                    "type": "json_schema",
                    "json_schema": {
                        "name": "ami_approved_selection",
                        "strict": True,
                        "schema": schema,
                    },
                },
                "reasoning_effort": "low",
                "temperature": 0,
                "max_completion_tokens": 96,
                "stream": False,
            },
            ensure_ascii=False,
        ).encode("utf-8")

        conn = http.client.HTTPSConnection(_HOST, 443, timeout=self.timeout_seconds)
        try:
            conn.request(
                "POST",
                _PATH,
                payload,
                {
                    "Authorization": "Bearer " + self.api_key,
                    "Content-Type": "application/json",
                },
            )
            response = conn.getresponse()
            if response.status != 200:
                self._note(
                    f"HTTP_{response.status}"
                    if response.status in _HTTP_CODES else "HTTP_OTHER"
                )
                raise RuntimeError("Remote inference unavailable")
            raw = response.read(16385)
            if len(raw) > 16384:
                self._note("RESPONSE_OVERSIZED")
                raise ValueError("Oversized provider response")
            try:
                envelope = json.loads(raw)
            except (UnicodeDecodeError, json.JSONDecodeError):
                self._note("RESPONSE_INVALID_JSON")
                raise
            if not isinstance(envelope, dict):
                self._note("RESPONSE_ENVELOPE")
                raise TypeError("Invalid response envelope")
            choices = envelope.get("choices")
            if not isinstance(choices, list) or len(choices) != 1:
                self._note("RESPONSE_CHOICES")
                raise ValueError("Invalid response choices")
            choice = choices[0]
            if not isinstance(choice, dict) or choice.get("finish_reason") != "stop":
                self._note("RESPONSE_NOT_STOP")
                raise ValueError("Incomplete response")
            message = choice.get("message")
            if not isinstance(message, dict) or not isinstance(message.get("content"), str):
                self._note("RESPONSE_MESSAGE")
                raise TypeError("Invalid model message")
            try:
                parsed = json.loads(message["content"])
            except (UnicodeDecodeError, json.JSONDecodeError):
                self._note("RESPONSE_INVALID_JSON")
                raise
            if not isinstance(parsed, dict) or set(parsed) != {"selection"}:
                self._note("RESPONSE_SCHEMA")
                return ""
            selected = parsed["selection"]
            if not isinstance(selected, str) or selected not in allowed:
                self._note("SELECTION_INVALID")
                return ""
            self._note("SELECTION_VALID")
            return allowed[selected]
        except TimeoutError:
            self._note("NETWORK_TIMEOUT")
            raise
        except OSError:
            self._note("NETWORK_ERROR")
            raise
        finally:
            conn.close()


def groq_config_issue() -> str | None:
    """Return only constant error codes; never interpolate environment values."""
    if os.getenv("AMI_AI_PROVIDER") != "groq":
        return "PROVIDER_MODE"
    if _TOKEN.fullmatch(os.getenv("AMI_GROQ_API_KEY", "")) is None:
        return "API_KEY_FORMAT"
    if os.getenv("AMI_GROQ_MODEL", "") != _MODEL:
        return "MODEL_ALLOWLIST"
    return None


def groq_provider() -> Provider | None:
    """Opt-in only. Never contact Groq or load an implicit model at import time."""
    if groq_config_issue() is not None:
        return None
    return GroqProvider(
        api_key=os.environ["AMI_GROQ_API_KEY"],
        model=os.environ["AMI_GROQ_MODEL"],
    )
