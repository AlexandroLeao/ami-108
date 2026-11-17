import os
import secrets
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError

from app.generation import GenerationRequest, GenerationResult, Provider, generate


class HealthResponse(BaseModel):
    status: str
    service: str


def create_app(
    provider: Provider | None = None, internal_token: str | None = None
) -> FastAPI:
    app = FastAPI(title="AMI-108 AI service", version="0.0.0")

    @app.get("/health", response_model=HealthResponse)
    def health() -> HealthResponse:
        return HealthResponse(status="ok", service="ai")

    def error(status: int, code: str) -> JSONResponse:
        return JSONResponse(
            status_code=status,
            content={"code": code, "message": code, "requestId": str(uuid4())},
        )

    @app.post("/internal/generate", response_model=GenerationResult)
    async def generate_utterance(request: Request) -> GenerationResult | JSONResponse:
        # Disabled by default. No authentication secret is committed or passed to
        # the provider. The browser facade cannot access this internal route.
        configured = internal_token
        supplied = request.headers.get("authorization", "")
        if not configured or not secrets.compare_digest(
            supplied.encode("utf-8"), ("Bearer " + configured).encode("utf-8")
        ):
            return error(403, "NOT_AUTHORIZED")
        if request.headers.get("content-type", "").split(";")[0].strip() != "application/json":
            return error(400, "INVALID_INPUT")
        body = bytearray()
        async for chunk in request.stream():
            if len(body) + len(chunk) > 8192:
                return error(400, "INVALID_INPUT")
            body.extend(chunk)
        try:
            parsed = GenerationRequest.model_validate_json(body)
        except ValidationError:
            return error(400, "INVALID_INPUT")
        return await generate(parsed, provider)

    return app


# No live provider is registered, even if an internal token is configured.
# Existing Compose and health behavior are unchanged.
app = create_app(internal_token=os.getenv("AMI_AI_INTERNAL_TOKEN"))
