"""Provider-neutral, owner-approved bounded bilingual evaluation scenarios.

Used by manual Cloudflare and Groq acceptance checks. Not gameplay changes.
"""
from uuid import uuid4

from app.generation import Category, GenerationRequest, Locale, Question, retrieve

_LOCALES: tuple[Locale, ...] = ("pt-BR", "en")
# The data is referenced by allowlisted, pre-existing fact IDs, not a new prompt.
_CASES: tuple[tuple[str, Question, Category, tuple[str, ...]], ...] = (
    (
        "intro-random",
        "INTRO-RANDOM",
        "RANDOM",
        (
            "INTRO-OCTOPUS", "INTRO-PENGUIN", "INTRO-CHESS", "INTRO-HEXAGON",
            "INTRO-DOZEN", "INTRO-PIANO", "INTRO-CENTURY", "INTRO-ALPHABET",
        ),
    ),
    (
        "dog-random",
        "Q-DOG",
        "RANDOM",
        (
            "DOG-RECIPE", "DOG-SATURN", "DOG-LAUNDRY", "DOG-NEPTUNE",
            "DOG-PANCAKE", "DOG-POTATO", "DOG-TOWELS", "DOG-WASHING",
        ),
    ),
    (
        "rat-random",
        "Q-RAT",
        "RANDOM",
        (
            "RAT-RECIPE", "RAT-LAUNDRY", "RAT-PENGUIN", "RAT-KILOGRAM",
            "RAT-BREAD", "RAT-FRUIT", "RAT-CALENDAR", "RAT-BOOKS",
        ),
    ),
    ("dog-correct", "Q-DOG", "CORRECT", ("DOG-VISION", "DOG-HEARING", "DOG-WAIT")),
    ("rat-correct", "Q-RAT", "CORRECT", ("RAT-LIGHT", "RAT-CONTAINMENT")),
)


def planned_requests() -> tuple[tuple[str, GenerationRequest], ...]:
    cases: list[tuple[str, GenerationRequest]] = []
    for case_name, question, category, fact_ids in _CASES:
        for locale in _LOCALES:
            request = GenerationRequest(
                requestId=str(uuid4()),
                questionId=question,
                category=category,
                locale=locale,
                factIds=list(fact_ids),
                deadlineMs=2500,
            )
            if retrieve(request) is None:
                raise RuntimeError("Local scenario no longer matches accepted allowlist")
            cases.append((case_name, request))
    if len(cases) != 10:
        raise RuntimeError("Evaluation must use exactly ten authorized cases")
    return tuple(cases)


