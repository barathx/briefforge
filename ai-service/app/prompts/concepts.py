"""
Concepts prompt builder for BriefForge AI Service.

Generates structured creative campaign concept ideas, each with a name,
tagline, description, and visual direction.
"""


def build_concepts_prompt(brief: dict, tone: str) -> str:
    """
    Build a prompt for generating 3 full creative campaign concepts.

    Each concept includes:
    - name        : A memorable, brand-appropriate concept title.
    - tagline     : A single punchy line that encapsulates the concept.
    - description : 2–3 sentences expanding on the idea, strategy, and emotion.
    - visual_idea : A brief description of the visual / aesthetic direction.

    Args:
        brief: Dict representation of BriefData.
        tone:  Desired tone of voice.

    Returns:
        A fully-formed prompt string ready to be sent to Ollama.
    """
    client_name = brief.get("client_name", "the brand")
    product = brief.get("product", "the product")
    audience = brief.get("audience", "the target audience")
    goal = brief.get("goal", "build brand awareness")
    key_message = brief.get("key_message", "")
    platforms = brief.get("platforms", [])
    platforms_str = ", ".join(platforms) if platforms else "all major social platforms"

    prompt = f"""You are a creative director at a top-tier advertising agency. Your job is to generate original, award-worthy campaign concepts.

## Brief
- Brand / Client : {client_name}
- Product / Service : {product}
- Target Audience : {audience}
- Campaign Goal : {goal}
- Key Message : {key_message}
- Tone of Voice : {tone}
- Platforms : {platforms_str}

## Your Task
Generate EXACTLY 2 distinct, compelling creative campaign concepts.

### For each concept, provide:
1. **name** — A memorable 2–5 word title for the concept (e.g. "The Ripple Effect").
2. **tagline** — One punchy, resonant line that defines the campaign (max 10 words).
3. **description** — Exactly 2–3 sentences explaining the big idea, the emotional hook, 
   and how it connects to the audience and goal.
4. **visual_idea** — 1–2 sentences describing the visual aesthetic, colour mood, imagery 
   style, or art direction that would bring this concept to life.

### Rules
- Each concept must be genuinely different in strategy, emotion, and execution angle.
- All concepts must align with the brand tone: {tone}.
- Concepts should feel fresh, culturally relevant, and resonant for: {audience}.
- Do NOT recycle generic marketing tropes — push for originality.

## Output Format
Return ONLY valid JSON — no preamble, no explanation, no markdown fences.
The JSON must match this exact schema (2 objects in the array):
{{
  "concepts": [
    {{
      "name": "Concept Name Here",
      "tagline": "One punchy tagline here",
      "description": "Two to three sentences describing the concept and its emotional strategy.",
      "visual_idea": "One to two sentences on the visual direction and aesthetic."
    }},
    {{
      "name": "Second Concept Name",
      "tagline": "Second tagline here",
      "description": "Description of the second concept.",
      "visual_idea": "Visual direction for the second concept."
    }}
  ]
}}
"""
    return prompt.strip()
