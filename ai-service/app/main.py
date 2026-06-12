"""
BriefForge AI Microservice — main FastAPI application entry point.
"""

import logging
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings

load_dotenv()

# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

class Settings(BaseSettings):
    OLLAMA_HOST: str = "http://localhost:11434"
    AI_MODEL: str = "mistral:7b-instruct"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("briefforge.ai")

# ---------------------------------------------------------------------------
# Pydantic request / response models
# ---------------------------------------------------------------------------

class BriefData(BaseModel):
    client_name: str = Field(..., description="Name of the client or brand")
    product: str = Field(..., description="Product or service being promoted")
    audience: str = Field(..., description="Target audience description")
    goal: str = Field(..., description="Campaign goal")
    key_message: str = Field(..., description="Core key message")
    tone: str = Field(..., description="Desired tone of voice")
    platforms: list[str] = Field(default_factory=list, description="Target platforms")
    raw_brief: Optional[str] = Field(None, description="Full raw brief text if available")


class GenerateRequest(BaseModel):
    brief: BriefData
    tone: str = Field(..., description="Tone override for generation")
    platforms: list[str] = Field(..., description="Platforms to generate content for")
    types: list[str] = Field(
        ...,
        description=(
            "Content types to generate. "
            "Valid values: captions, ad_copy, hooks, ctas, concepts"
        ),
    )


class AdCopyVariant(BaseModel):
    headline: str
    body: str


class ConceptItem(BaseModel):
    name: str
    tagline: str
    description: str
    visual_idea: str


class GenerateResponse(BaseModel):
    captions: dict[str, list[str]] = Field(default_factory=dict)
    ad_copy: dict[str, list[AdCopyVariant]] = Field(default_factory=dict)
    hooks: list[str] = Field(default_factory=list)
    ctas: list[str] = Field(default_factory=list)
    concepts: list[ConceptItem] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "BriefForge AI Service starting — model=%s host=%s",
        settings.AI_MODEL,
        settings.OLLAMA_HOST,
    )
    yield
    logger.info("BriefForge AI Service shutting down.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="BriefForge AI Service",
    version="1.0.0",
    description="LLM-powered content generation microservice for BriefForge.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health", tags=["health"])
async def health_check():
    """Liveness probe — returns service status and active model."""
    return {"status": "ok", "model": settings.AI_MODEL}


@app.post("/ai/generate", response_model=GenerateResponse, tags=["generation"])
async def generate_content(request: GenerateRequest):
    """
    Generate creative content from a creative brief.

    Supported types: captions, ad_copy, hooks, ctas, concepts.
    """
    from app.generators import generate_all  # late import avoids circular deps at startup

    valid_types = {"captions", "ad_copy", "hooks", "ctas", "concepts"}
    unknown = set(request.types) - valid_types
    if unknown:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown generation types: {sorted(unknown)}. Valid: {sorted(valid_types)}",
        )

    if not request.types:
        raise HTTPException(status_code=422, detail="'types' list must not be empty.")

    if not request.platforms:
        raise HTTPException(status_code=422, detail="'platforms' list must not be empty.")

    brief_dict = request.brief.model_dump()

    try:
        result = await generate_all(
            brief=brief_dict,
            tone=request.tone,
            platforms=request.platforms,
            types=request.types,
            ollama_host=settings.OLLAMA_HOST,
            model=settings.AI_MODEL,
        )
    except Exception as exc:
        logger.exception("Unexpected error during content generation: %s", exc)
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(exc)}")

    # Coerce ad_copy list-of-dicts into AdCopyVariant models
    coerced_ad_copy: dict[str, list[AdCopyVariant]] = {}
    for platform, variants in result.get("ad_copy", {}).items():
        coerced_ad_copy[platform] = [
            AdCopyVariant(**v) if isinstance(v, dict) else v for v in variants
        ]

    # Coerce concepts into ConceptItem models
    raw_concepts = result.get("concepts", [])
    coerced_concepts: list[ConceptItem] = [
        ConceptItem(**c) if isinstance(c, dict) else c for c in raw_concepts
    ]

    return GenerateResponse(
        captions=result.get("captions", {}),
        ad_copy=coerced_ad_copy,
        hooks=result.get("hooks", []),
        ctas=result.get("ctas", []),
        concepts=coerced_concepts,
    )
