"""
BriefForge AI Service — content generators.

Each generator function calls the appropriate prompt builder, sends the prompt
to Ollama via OllamaClient, and returns structured Python data.

``generate_all`` orchestrates all requested generators concurrently using
``asyncio.gather``, collecting results and handling per-generator failures
gracefully so that one error does not abort the entire request.
"""

import asyncio
import logging
from typing import Any

from app.llm import OllamaClient
from app.prompts.ad_copy import build_ad_copy_prompt
from app.prompts.captions import build_caption_prompt
from app.prompts.concepts import build_concepts_prompt
from app.prompts.cta import build_cta_prompt
from app.prompts.hooks import build_hooks_prompt
from app.prompts.combined import build_combined_prompt

logger = logging.getLogger("briefforge.ai.generators")

# ---------------------------------------------------------------------------
# Individual generators
# ---------------------------------------------------------------------------


async def generate_captions(
    client: OllamaClient,
    brief: dict,
    platforms: list[str],
    tone: str,
) -> dict[str, list[str]]:
    """
    Generate 5 captions for each platform in *platforms*.

    Returns:
        ``{platform: [caption1, caption2, ...]}``
    """

    async def _for_platform(platform: str) -> tuple[str, list[str]]:
        prompt = build_caption_prompt(brief, platform, tone)
        logger.info("Generating captions for platform=%s", platform)
        data = await client.generate_json(prompt)
        captions: list[str] = data.get("captions", [])
        return platform, captions

    tasks = [_for_platform(p) for p in platforms]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    output: dict[str, list[str]] = {}
    for platform, result in zip(platforms, results):
        if isinstance(result, Exception):
            logger.error("Caption generation failed for platform=%s: %s", platform, result)
            output[platform] = []
        else:
            _, captions = result  # type: ignore[misc]
            output[platform] = captions

    return output


async def generate_ad_copy(
    client: OllamaClient,
    brief: dict,
    platforms: list[str],
    tone: str,
) -> dict[str, list[dict]]:
    """
    Generate 3 ad copy variants (headline + body) for each platform.

    Returns:
        ``{platform: [{"headline": ..., "body": ...}, ...]}``
    """

    async def _for_platform(platform: str) -> tuple[str, list[dict]]:
        prompt = build_ad_copy_prompt(brief, platform, tone)
        logger.info("Generating ad copy for platform=%s", platform)
        data = await client.generate_json(prompt)
        variants: list[dict] = data.get("ad_copy", [])
        return platform, variants

    tasks = [_for_platform(p) for p in platforms]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    output: dict[str, list[dict]] = {}
    for platform, result in zip(platforms, results):
        if isinstance(result, Exception):
            logger.error("Ad copy generation failed for platform=%s: %s", platform, result)
            output[platform] = []
        else:
            _, variants = result  # type: ignore[misc]
            output[platform] = variants

    return output


async def generate_hooks(
    client: OllamaClient,
    brief: dict,
    tone: str,
) -> list[str]:
    """
    Generate 5 scroll-stopping hook lines.

    Returns:
        List of hook strings.
    """
    prompt = build_hooks_prompt(brief, tone)
    logger.info("Generating hooks")
    data = await client.generate_json(prompt)
    return data.get("hooks", [])


async def generate_ctas(
    client: OllamaClient,
    brief: dict,
    tone: str,
) -> list[str]:
    """
    Generate 5 CTA phrases (urgency, benefit, question, command, social proof).

    Returns:
        List of CTA strings.
    """
    prompt = build_cta_prompt(brief, tone)
    logger.info("Generating CTAs")
    data = await client.generate_json(prompt)
    return data.get("ctas", [])


async def generate_concepts(
    client: OllamaClient,
    brief: dict,
    tone: str,
) -> list[dict]:
    """
    Generate 3 creative campaign concepts.

    Each concept is a dict with keys: name, tagline, description, visual_idea.

    Returns:
        List of concept dicts.
    """
    prompt = build_concepts_prompt(brief, tone)
    logger.info("Generating campaign concepts")
    data = await client.generate_json(prompt)
    return data.get("concepts", [])


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------


async def generate_all(
    brief: dict,
    tone: str,
    platforms: list[str],
    types: list[str],
    ollama_host: str,
    model: str,
) -> dict[str, Any]:
    """
    Orchestrate content generation using a single combined prompt to minimise execution time.
    Falls back to sequential execution in case of parsing errors or failures.

    Args:
        brief:       Dict representation of BriefData.
        tone:        Tone of voice for all generators.
        platforms:   List of target social platforms.
        types:       Which generators to run (captions, ad_copy, hooks, ctas, concepts).
        ollama_host: Base URL of the Ollama server.
        model:       Ollama model name.

    Returns:
        Dict with keys: captions, ad_copy, hooks, ctas, concepts.
        Missing / failed generators return empty structures.
    """
    client = OllamaClient(host=ollama_host, model=model)

    type_set = set(types)

    # Default safe-empty values per type
    output: dict[str, Any] = {
        "captions": {},
        "ad_copy": {},
        "hooks": [],
        "ctas": [],
        "concepts": [],
    }

    if not type_set:
        logger.warning("generate_all called with no recognised types: %s", types)
        return output

    # Try combined single-call generation first
    logger.info("Attempting combined generation for types: %s", ", ".join(sorted(type_set)))
    try:
        prompt = build_combined_prompt(brief, tone, platforms, types)
        data = await client.generate_json(prompt)
        
        # Verify and transfer results
        all_present = True
        for t in type_set:
            if t in data and data[t]:
                output[t] = data[t]
            else:
                # If a requested key is missing or empty, treat as incomplete and fallback
                all_present = False
                logger.warning("Combined generation response missing or empty key: %s", t)
        
        if all_present:
            logger.info("Combined generation completed successfully!")
            return output
        else:
            logger.warning("Combined generation was incomplete. Falling back to sequential generation...")
    except Exception as exc:
        logger.warning("Combined generation failed with exception: %s. Falling back to sequential...", exc)

    # ─── Sequential Fallback ───
    logger.info(
        "Running sequential fallback for %d generator(s): %s",
        len(type_set),
        ", ".join(sorted(type_set)),
    )

    if "captions" in type_set:
        try:
            output["captions"] = await generate_captions(client, brief, platforms, tone)
        except Exception as exc:
            logger.error("Generator 'captions' failed: %s", exc, exc_info=exc)

    if "ad_copy" in type_set:
        try:
            output["ad_copy"] = await generate_ad_copy(client, brief, platforms, tone)
        except Exception as exc:
            logger.error("Generator 'ad_copy' failed: %s", exc, exc_info=exc)

    if "hooks" in type_set:
        try:
            output["hooks"] = await generate_hooks(client, brief, tone)
        except Exception as exc:
            logger.error("Generator 'hooks' failed: %s", exc, exc_info=exc)

    if "ctas" in type_set:
        try:
            output["ctas"] = await generate_ctas(client, brief, tone)
        except Exception as exc:
            logger.error("Generator 'ctas' failed: %s", exc, exc_info=exc)

    if "concepts" in type_set:
        try:
            output["concepts"] = await generate_concepts(client, brief, tone)
        except Exception as exc:
            logger.error("Generator 'concepts' failed: %s", exc, exc_info=exc)

    return output
