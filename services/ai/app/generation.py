"""AMI-007 foundation: strict internal contracts and fail-closed retrieval.

No game state, random draws, budget ownership, external network calls or provider
configuration live here. The NestJS reservation/finalization adapter is later work.
"""
import asyncio
from dataclasses import dataclass
from typing import Annotated, Literal, Protocol
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

Locale = Literal["pt-BR", "en"]
Question = Literal["Q-DOG", "Q-RAT", "Q-BOAR", "INTRO-RANDOM"]
Category = Literal["CORRECT", "RANDOM"]
Reason = Literal[
    "UNAVAILABLE", "TIMEOUT", "INVALID_OUTPUT", "BUDGET_EXCEEDED", "UNAUTHORIZED_CONTEXT"
]
FactId = Annotated[str, Field(min_length=1, max_length=64)]


class GenerationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    requestId: Annotated[str, Field(min_length=36, max_length=36)]
    questionId: Question
    category: Category
    locale: Locale
    factIds: Annotated[list[FactId], Field(max_length=12)]
    deadlineMs: Annotated[int, Field(ge=1, le=30000)]

    @field_validator("requestId")
    @classmethod
    def validate_request_id(cls, value: str) -> str:
        if str(UUID(value)) != value.lower():
            raise ValueError("Invalid UUID")
        return value

    @field_validator("factIds")
    @classmethod
    def unique_facts(cls, value: list[str]) -> list[str]:
        if len(value) != len(set(value)):
            raise ValueError("Duplicate fact ID")
        return value


class Validated(BaseModel):
    model_config = ConfigDict(extra="forbid")

    requestId: str
    status: Literal["VALIDATED"] = "VALIDATED"
    text: Annotated[str, Field(min_length=1, max_length=500)]


class FallbackRequired(BaseModel):
    model_config = ConfigDict(extra="forbid")

    requestId: str
    status: Literal["FALLBACK_REQUIRED"] = "FALLBACK_REQUIRED"
    reason: Reason


GenerationResult = Validated | FallbackRequired


@dataclass(frozen=True)
class Localized:
    pt: str
    en: str

    def text(self, locale: Locale) -> str:
        return self.pt if locale == "pt-BR" else self.en


@dataclass(frozen=True)
class AuthorizedContext:
    """Only the selected utterance context, never the whole catalog or player data."""

    question_id: Question
    category: Category
    locale: Locale
    facts: tuple[tuple[str, str], ...]
    approved_text: str


@dataclass(frozen=True)
class Rule:
    facts: tuple[tuple[str, Localized], ...]
    approved: Localized


# The only enabled contexts are those already present in the accepted campaign.
# Later questions are recognized by the wire contract but denied by retrieval.
_DOG_CORRECT = Rule(
    facts=(
        ("DOG-VISION", Localized("Visão comprometida.", "Impaired vision.")),
        ("DOG-HEARING", Localized("Audição ampliada.", "Heightened hearing.")),
        (
            "DOG-WAIT",
            Localized(
                "Permanecer imóvel até a criatura deixar a área.",
                "Remain still until the creature leaves the area.",
            ),
        ),
    ),
    approved=Localized(
        "A mutação comprometeu sua visão, mas ampliou significativamente sua capacidade "
        "auditiva. Permaneça imóvel até que ela abandone a área.",
        "The mutation impaired its vision but significantly heightened its hearing. "
        "Remain still until it leaves the area.",
    ),
)
_DOG_RANDOM = Localized(
    "Três ovos. Duas xícaras de açúcar. Misture até obter uma consistência homogênea.",
    "Three eggs. Two cups of sugar. Mix until smooth.",
)
_INTRO_RANDOM = Localized("Os polvos têm três corações.", "Octopuses have three hearts.")
_RULES: dict[tuple[Question, Category], Rule] = {
    ("Q-DOG", "CORRECT"): _DOG_CORRECT,
    ("Q-DOG", "RANDOM"): Rule((("DOG-RECIPE", _DOG_RANDOM),), _DOG_RANDOM),
    ("INTRO-RANDOM", "RANDOM"): Rule((("INTRO-OCTOPUS", _INTRO_RANDOM),), _INTRO_RANDOM),
}


def retrieve(request: GenerationRequest) -> AuthorizedContext | None:
    rule = _RULES.get((request.questionId, request.category))
    if rule is None:
        return None
    # Require exactly the complete authorized set, not an arbitrary subset.
    if set(request.factIds) != {fact_id for fact_id, _ in rule.facts}:
        return None
    return AuthorizedContext(
        question_id=request.questionId,
        category=request.category,
        locale=request.locale,
        facts=tuple((fact_id, fact.text(request.locale)) for fact_id, fact in rule.facts),
        approved_text=rule.approved.text(request.locale),
    )


class Provider(Protocol):
    async def generate(self, context: AuthorizedContext) -> str: ...


def fallback(request: GenerationRequest, reason: Reason) -> FallbackRequired:
    return FallbackRequired(requestId=request.requestId, reason=reason)


async def generate(
    request: GenerationRequest, provider: Provider | None
) -> GenerationResult:
    context = retrieve(request)
    if context is None:
        return fallback(request, "UNAUTHORIZED_CONTEXT")
    if provider is None:
        return fallback(request, "UNAVAILABLE")
    try:
        candidate = await asyncio.wait_for(
            provider.generate(context), timeout=request.deadlineMs / 1000
        )
    except TimeoutError:
        return fallback(request, "TIMEOUT")
    except Exception:  # noqa: BLE001 - untrusted provider boundary must fail closed
        # No provider exception content or secret is returned.
        return fallback(request, "UNAVAILABLE")

    # Conservative first increment: accept only the canonical localized utterance
    # (outer whitespace is harmless). A reviewed paraphrase validator and real
    # provider evaluation remain separate acceptance gates. Never let a model
    # invent a solution or leak a future fact.
    if not isinstance(candidate, str) or len(candidate) > 500:
        return fallback(request, "INVALID_OUTPUT")
    if candidate.strip() != context.approved_text:
        return fallback(request, "INVALID_OUTPUT")
    return Validated(requestId=request.requestId, text=context.approved_text)
