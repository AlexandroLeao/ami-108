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
    alternatives: tuple[str, ...] = ()
    selection_options: tuple[str, ...] = ()


@dataclass(frozen=True)
class Rule:
    facts: tuple[tuple[str, Localized], ...]
    approved: Localized
    alternatives: tuple[Localized, ...] = ()


# The only enabled contexts are those already present in the accepted campaign.
# Q-BOAR is recognized by the wire contract but denied until its narrative gate exists.
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
    alternatives=(
        Localized(
            "A visão da criatura está comprometida e sua audição foi ampliada. "
            "Permaneça imóvel até que ela abandone a área.",
            "The creature's vision is impaired and its hearing is heightened. "
            "Remain still until it leaves the area.",
        ),
    ),
)
_DOG_RANDOM = Localized(
    "Três ovos. Duas xícaras de açúcar. Misture até obter uma consistência homogênea.",
    "Three eggs. Two cups of sugar. Mix until smooth.",
)
_RAT_CORRECT = Rule(
    facts=(
        (
            "RAT-LIGHT",
            Localized(
                "Organismos da primeira geração são intolerantes à luz intensa.",
                "First-generation organisms are intolerant of intense light.",
            ),
        ),
        (
            "RAT-CONTAINMENT",
            Localized(
                "A iluminação de contenção força o organismo a recuar.",
                "Containment lighting forces the organism to retreat.",
            ),
        ),
    ),
    approved=Localized(
        "Os organismos da primeira geração desenvolveram intolerância à luz intensa. "
        "O sistema de iluminação de contenção deverá forçá-lo a recuar.",
        "First-generation organisms developed an intolerance to intense light. "
        "The containment lighting system should force it to retreat.",
    ),
    alternatives=(
        Localized(
            "Organismos da primeira geração são intolerantes à luz intensa. "
            "A iluminação de contenção deverá forçá-lo a recuar.",
            "First-generation organisms are intolerant of intense light. "
            "The containment lighting should force it to retreat.",
        ),
    ),
)
_RAT_RANDOM = Localized(
    "Para remover a casca de um ovo cozido, recomenda-se mergulhá-lo em água fria.",
    "To remove the shell from a boiled egg, immersing it in cold water is recommended.",
)
_INTRO_RANDOM = Localized("Os polvos têm três corações.", "Octopuses have three hearts.")
_INTRO_PENGUIN = Localized(
    "Os pinguins não sabem voar.",
    "Penguins cannot fly.",
)
_DOG_SATURN = Localized(
    "Saturno possui um sistema de anéis composto principalmente por partículas de gelo.",
    "Saturn has a ring system composed primarily of ice particles.",
)
_DOG_LAUNDRY = Localized(
    "Para remover manchas de tecidos claros, recomenda-se utilizar sabão neutro.",
    "To remove stains from light fabrics, mild soap is recommended.",
)
_RAT_LAUNDRY = Localized(
    "Recomenda-se dobrar a roupa imediatamente após a secagem.",
    "Folding clothes immediately after drying is recommended.",
)
_RAT_PENGUIN = Localized(
    "Os pinguins são incapazes de voar.",
    "Penguins are incapable of flight.",
)
_RULES: dict[tuple[Question, Category], Rule] = {
    ("Q-DOG", "CORRECT"): _DOG_CORRECT,
    ("Q-DOG", "RANDOM"): Rule(
        (("DOG-RECIPE", _DOG_RANDOM), ("DOG-SATURN", _DOG_SATURN), ("DOG-LAUNDRY", _DOG_LAUNDRY)),
        _DOG_RANDOM,
        (_DOG_SATURN, _DOG_LAUNDRY),
    ),
    ("Q-RAT", "CORRECT"): _RAT_CORRECT,
    ("Q-RAT", "RANDOM"): Rule(
        (("RAT-RECIPE", _RAT_RANDOM), ("RAT-LAUNDRY", _RAT_LAUNDRY), ("RAT-PENGUIN", _RAT_PENGUIN)),
        _RAT_RANDOM,
        (_RAT_LAUNDRY, _RAT_PENGUIN),
    ),
    ("INTRO-RANDOM", "RANDOM"): Rule(
        (("INTRO-OCTOPUS", _INTRO_RANDOM), ("INTRO-PENGUIN", _INTRO_PENGUIN)),
        _INTRO_RANDOM,
        (_INTRO_PENGUIN,),
    ),
}


# Expanded topical pools are limited to owner-requested RANDOM variety.
# Legacy complete sets remain valid for pending reservations and old clients.
_EXTRA_RANDOM_FACTS: dict[tuple[Question, Category], tuple[tuple[str, Localized], ...]] = {
    ("INTRO-RANDOM", "RANDOM"): (
        (
            "INTRO-CHESS",
            Localized(
                "O xadrez é disputado em um tabuleiro de 64 casas.",
                "Chess is played on a board of 64 squares.",
            ),
        ),
        ("INTRO-HEXAGON", Localized("Um hexágono possui seis lados.", "A hexagon has six sides.")),
        (
            "INTRO-DOZEN",
            Localized(
                "Uma dúzia corresponde a doze unidades.",
                "A dozen equals twelve units.",
            ),
        ),
        (
            "INTRO-PIANO",
            Localized(
                "O piano possui teclas brancas e pretas.",
                "A piano has black and white keys.",
            ),
        ),
        (
            "INTRO-CENTURY",
            Localized(
                "Um século corresponde a cem anos.",
                "A century equals one hundred years.",
            ),
        ),
        (
            "INTRO-ALPHABET",
            Localized(
                "A letra M ocupa a décima terceira posição no alfabeto latino.",
                "The letter M is thirteenth in the Latin alphabet.",
            ),
        ),
    ),
    ("Q-DOG", "RANDOM"): (
        (
            "DOG-NEPTUNE",
            Localized(
                "Netuno é o oitavo planeta a partir do Sol.",
                "Neptune is the eighth planet from the Sun.",
            ),
        ),
        (
            "DOG-PANCAKE",
            Localized(
                "Para preparar panquecas, misture farinha, leite e ovos.",
                "To make pancakes, mix flour, milk and eggs.",
            ),
        ),
        (
            "DOG-POTATO",
            Localized(
                "Para preparar purê, amasse as batatas cozidas.",
                "To make mashed potatoes, mash the cooked potatoes.",
            ),
        ),
        (
            "DOG-TOWELS",
            Localized(
                "Recomenda-se dobrar as toalhas antes de guardá-las.",
                "Folding towels before storing them is recommended.",
            ),
        ),
        (
            "DOG-WASHING",
            Localized(
                "Recomenda-se separar roupas claras e escuras antes da lavagem.",
                "Separating light and dark clothes before washing is recommended.",
            ),
        ),
    ),
    ("Q-RAT", "RANDOM"): (
        (
            "RAT-KILOGRAM",
            Localized(
                "Um quilograma corresponde a mil gramas.",
                "A kilogram equals one thousand grams.",
            ),
        ),
        (
            "RAT-BREAD",
            Localized(
                "A massa de pão pode ser preparada com farinha, água e fermento.",
                "Bread dough can be made with flour, water and yeast.",
            ),
        ),
        (
            "RAT-FRUIT",
            Localized(
                "Para preparar salada de frutas, misture pedaços de frutas.",
                "To make fruit salad, mix pieces of fruit.",
            ),
        ),
        (
            "RAT-CALENDAR",
            Localized(
                "O calendário gregoriano possui doze meses.",
                "The Gregorian calendar has twelve months.",
            ),
        ),
        (
            "RAT-BOOKS",
            Localized(
                "Recomenda-se organizar os livros por ordem alfabética.",
                "Organizing books alphabetically is recommended.",
            ),
        ),
    ),
}


def retrieve(request: GenerationRequest) -> AuthorizedContext | None:
    rule = _RULES.get((request.questionId, request.category))
    if rule is None:
        return None
    # Accept either the complete legacy set or the complete expanded set.
    # Never accept arbitrary subsets, cross-context facts or unauthorized extras.
    extras = _EXTRA_RANDOM_FACTS.get((request.questionId, request.category), ())
    expanded = (*rule.facts, *extras)
    if extras and set(request.factIds) == {fact_id for fact_id, _ in expanded}:
        rule = Rule(expanded, rule.approved, (*rule.alternatives, *(text for _, text in extras)))
    elif set(request.factIds) != {fact_id for fact_id, _ in rule.facts}:
        return None
    return AuthorizedContext(
        question_id=request.questionId,
        category=request.category,
        locale=request.locale,
        facts=tuple((fact_id, fact.text(request.locale)) for fact_id, fact in rule.facts),
        approved_text=rule.approved.text(request.locale),
        alternatives=tuple(text.text(request.locale) for text in rule.alternatives),
        # The same bilingual rule supplies a compact shared selection language.
        # Index ordering is identical to the requested localized utterances.
        selection_options=(rule.approved.en, *(text.en for text in rule.alternatives)),
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

    # Only the authorized localized fallback or an exact, pre-reviewed
    # alternative is admissible. Never accept a new fact or solution.
    if not isinstance(candidate, str) or len(candidate) > 500:
        return fallback(request, "INVALID_OUTPUT")
    candidate = candidate.strip()
    if candidate not in (context.approved_text, *context.alternatives):
        return fallback(request, "INVALID_OUTPUT")
    return Validated(requestId=request.requestId, text=candidate)
