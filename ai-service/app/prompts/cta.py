"""
CTA prompt builder for BriefForge AI Service.

Generates a diverse set of action-oriented call-to-action phrases.
"""


def build_cta_prompt(brief: dict, tone: str) -> str:
    """
    Build a prompt for generating 5 varied, action-oriented CTAs.

    The 5 CTAs must span the following style archetypes:
    1. Urgency      — time-pressure or scarcity
    2. Benefit      — what the user gains
    3. Question     — engages curiosity / dialogue
    4. Command      — direct, imperative action
    5. Social proof — peer validation / momentum

    Args:
        brief: Dict representation of BriefData.
        tone:  Desired tone of voice.

    Returns:
        A fully-formed prompt string ready to be sent to Ollama.
    """
    client_name = brief.get("client_name", "the brand")
    product = brief.get("product", "the product")
    audience = brief.get("audience", "the target audience")
    goal = brief.get("goal", "drive conversions")
    key_message = brief.get("key_message", "")

    prompt = f"""You are a conversion-focused copywriter who writes high-performing calls-to-action (CTAs).

## Brief
- Brand / Client : {client_name}
- Product / Service : {product}
- Target Audience : {audience}
- Campaign Goal : {goal}
- Key Message : {key_message}
- Tone of Voice : {tone}

## Your Task
Write EXACTLY 3 action-oriented CTA phrases — one for each of the following styles:
1. **Urgency** — Create a sense of time-pressure or limited availability.
2. **Benefit** — Lead with the tangible gain or outcome for the user.
3. **Command** — A direct, confident imperative that tells them exactly what to do.

### Rules
- Each CTA should be concise — ideally 5–12 words.
- Match the tone "{tone}" throughout.
- Every CTA must be distinct in angle and wording.
- Make them feel natural and compelling to: {audience}.
- Align with the campaign goal: {goal}.

## Output Format
Return ONLY valid JSON — no preamble, no explanation, no markdown fences.
The JSON must match this exact schema (3 strings in the array, one per style in order):
{{
  "ctas": [
    "Urgency CTA here",
    "Benefit CTA here",
    "Command CTA here"
  ]
}}
"""
    return prompt.strip()
