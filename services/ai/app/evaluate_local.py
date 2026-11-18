"""Manual, explicit local model evaluation; no session data or external API.

Run only after starting an approved local Ollama model with cloud disabled.
A VALIDATED result proves the configured provider returned the canonical line,
not free paraphrasing. Fallback is expected for any mismatch or timeout.
"""
import asyncio
import json
import time
from uuid import uuid4

from app.generation import Category, GenerationRequest, Locale, Question, generate
from app.ollama_provider import local_provider


async def main() -> None:
    provider = local_provider()
    if provider is None:
        raise SystemExit("Configure an approved local Ollama endpoint and tagged model first.")
    cases: list[tuple[Question, Category, list[str]]] = [
        ("INTRO-RANDOM", "RANDOM", ["INTRO-OCTOPUS"]),
        ("Q-DOG", "CORRECT", ["DOG-VISION", "DOG-HEARING", "DOG-WAIT"]),
        ("Q-DOG", "RANDOM", ["DOG-RECIPE"]),
        ("Q-RAT", "CORRECT", ["RAT-LIGHT", "RAT-CONTAINMENT"]),
        ("Q-RAT", "RANDOM", ["RAT-RECIPE"]),
    ]
    locales: list[Locale] = ["pt-BR", "en"]
    successes = 0
    for locale in locales:
        for question, category, facts in cases:
            request = GenerationRequest(
                requestId=str(uuid4()),
                questionId=question,
                category=category,
                locale=locale,
                factIds=facts,
                deadlineMs=2500,
            )
            started = time.monotonic()
            result = await generate(request, provider)
            successes += int(result.status == "VALIDATED")
            print(json.dumps({
                "question": question,
                "category": category,
                "locale": locale,
                "status": result.status,
                "elapsedMs": round((time.monotonic() - started) * 1000),
                "reason": getattr(result, "reason", None),
            }))
    print(json.dumps({"validated": successes, "total": len(cases) * len(locales)}))
    if successes == 0:
        raise SystemExit("No validated real output; keep gameplay on fallback.")


if __name__ == "__main__":
    asyncio.run(main())
