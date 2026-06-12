"""
Hooks prompt builder for BriefForge AI Service.

Generates scroll-stopping opening hook lines for social and video content.
"""


def build_hooks_prompt(brief: dict, tone: str) -> str:
    """
    Build a prompt for generating 5 pattern-interrupt opening hooks.

    Each hook is:
    - Max 100 characters.
    - Designed to stop the scroll / grab attention in the first second.
    - Written in a pattern-interrupt style (unexpected angle, bold claim,
      relatable pain point, surprising stat, or provocative question).

    Args:
        brief: Dict representation of BriefData.
        tone:  Desired tone of voice.

    Returns:
        A fully-formed prompt string ready to be sent to Ollama.
    """
    client_name = brief.get("client_name", "the brand")
    product = brief.get("product", "the product")
    audience = brief.get("audience", "the target audience")
    goal = brief.get("goal", "drive engagement")
    key_message = brief.get("key_message", "")

    prompt = f"""You are a viral content strategist who specialises in writing opening hooks that instantly capture attention.

## Brief
- Brand / Client : {client_name}
- Product / Service : {product}
- Target Audience : {audience}
- Campaign Goal : {goal}
- Key Message : {key_message}
- Tone of Voice : {tone}

## Your Task
Write EXACTLY 5 scroll-stopping opening hook lines.

### Rules
1. Every hook must be 100 characters or fewer.
2. Use pattern-interrupt techniques — each hook should feel unexpected, bold, or irresistible.
3. Vary the style across the 5 hooks. Use at least 3 of these approaches:
   - Bold provocative statement
   - Surprising or counter-intuitive claim
   - Relatable pain point or frustration
   - Compelling question that demands an answer
   - Vivid "what if" scenario
4. Hooks must resonate with the target audience: {audience}.
5. Match the tone "{tone}".
6. Do NOT include a call-to-action — hooks only.

## Output Format
Return ONLY valid JSON — no preamble, no explanation, no markdown fences.
The JSON must match this exact schema:
{{
  "hooks": [
    "Hook line 1 here",
    "Hook line 2 here",
    "Hook line 3 here",
    "Hook line 4 here",
    "Hook line 5 here"
  ]
}}
"""
    return prompt.strip()
