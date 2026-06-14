"""
Caption prompt builder for BriefForge AI Service.

Provides per-platform character limits, voice guidelines, and a factory
function that constructs a structured prompt for caption generation.
"""

# ---------------------------------------------------------------------------
# Platform configuration
# ---------------------------------------------------------------------------

PLATFORM_LIMITS: dict[str, int] = {
    "instagram": 2200,
    "twitter": 280,
    "linkedin": 3000,
    "facebook": 63206,
    "tiktok": 2200,
}

PLATFORM_VOICE: dict[str, str] = {
    "instagram": "visual, emoji-rich, hashtag-focused, aspirational",
    "twitter": "punchy, witty, concise, trend-aware — max 280 chars each",
    "linkedin": "professional yet human, story-driven, thought leadership",
    "facebook": "community-oriented, conversational, engaging",
    "tiktok": "casual, trend-jacking, hook-first, energetic",
}

# ---------------------------------------------------------------------------
# Prompt builder
# ---------------------------------------------------------------------------


def build_caption_prompt(brief: dict, platform: str, tone: str) -> str:
    """
    Build a prompt that instructs the LLM to produce exactly 5 social-media
    captions for *platform*, honouring its character limit and voice.

    Args:
        brief:    Dict representation of BriefData.
        platform: Target social platform (lowercase).
        tone:     Desired tone of voice for this generation run.

    Returns:
        A fully-formed prompt string ready to be sent to Ollama.
    """
    platform_key = platform.lower()
    char_limit = PLATFORM_LIMITS.get(platform_key, 2200)
    voice = PLATFORM_VOICE.get(platform_key, "engaging and on-brand")

    client_name = brief.get("client_name", "the brand")
    product = brief.get("product", "the product")
    audience = brief.get("audience", "the target audience")
    goal = brief.get("goal", "drive engagement")
    key_message = brief.get("key_message", "")

    prompt = f"""You are an expert social media copywriter specialising in {platform} content.

## Brief
- Brand / Client : {client_name}
- Product / Service : {product}
- Target Audience : {audience}
- Campaign Goal : {goal}
- Key Message : {key_message}
- Tone of Voice : {tone}

## Platform Rules — {platform.upper()}
- Voice style : {voice}
- Maximum characters per caption : {char_limit}
- Every caption MUST stay within the character limit.

## Your Task
Generate EXACTLY 3 distinct, high-performing {platform} captions for the product above.
Each caption must:
1. Immediately grab attention with a strong opening line.
2. Reflect the tone "{tone}" throughout.
3. Speak directly to the target audience: {audience}.
4. Reinforce the key message: {key_message}.
5. Stay within {char_limit} characters.
6. Feel native to {platform} — follow the voice style described above.

## Output Format
Return ONLY valid JSON — no preamble, no explanation, no markdown fences.
The JSON must match this exact schema:
{{
  "captions": [
    "caption 1 text here",
    "caption 2 text here",
    "caption 3 text here"
  ]
}}
"""
    return prompt.strip()
