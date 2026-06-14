"""
Ad-copy prompt builder for BriefForge AI Service.

Produces a structured prompt that asks the LLM to return 3 ad-copy variants,
each consisting of a headline (≤ 60 chars) and body copy (≤ 150 chars).
"""


def build_ad_copy_prompt(brief: dict, platform: str, tone: str) -> str:
    """
    Build a prompt for generating 3 platform-specific ad copy variants.

    Each variant contains:
    - headline : eye-catching, max 60 characters.
    - body     : concise supporting copy, max 150 characters.

    Args:
        brief:    Dict representation of BriefData.
        platform: Target ad platform (e.g. facebook, instagram, linkedin).
        tone:     Desired tone of voice.

    Returns:
        A fully-formed prompt string ready to be sent to Ollama.
    """
    client_name = brief.get("client_name", "the brand")
    product = brief.get("product", "the product")
    audience = brief.get("audience", "the target audience")
    goal = brief.get("goal", "drive conversions")
    key_message = brief.get("key_message", "")

    prompt = f"""You are a world-class performance-marketing copywriter with deep expertise in paid advertising on {platform}.

## Campaign Brief
- Brand / Client : {client_name}
- Product / Service : {product}
- Target Audience : {audience}
- Campaign Goal : {goal}
- Key Message : {key_message}
- Tone of Voice : {tone}
- Platform : {platform.upper()}

## Your Task
Write EXACTLY 2 distinct ad copy variants for a {platform} paid ad campaign.

### Rules for each variant
1. **Headline** — maximum 60 characters. Must be attention-grabbing and benefit-focused.
2. **Body** — maximum 150 characters. Must clearly communicate value and nudge toward action.
3. Every variant must feel different in angle, framing, or emotional hook.
4. Match the tone "{tone}" throughout.
5. Speak directly to the target audience: {audience}.
6. Reinforce the campaign goal: {goal}.

## Output Format
Return ONLY valid JSON — no preamble, no explanation, no markdown fences.
The JSON must match this exact schema (2 objects in the array):
{{
  "ad_copy": [
    {{
      "headline": "Headline text here (max 60 chars)",
      "body": "Body copy text here (max 150 chars)"
    }},
    {{
      "headline": "Second headline here",
      "body": "Second body copy here"
    }}
  ]
}}
"""
    return prompt.strip()
