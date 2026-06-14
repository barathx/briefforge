"""
Combined prompt builder for BriefForge AI Service.

Allows generating all requested content types in a single LLM call to save time.
"""

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

def build_combined_prompt(brief: dict, tone: str, platforms: list[str], types: list[str]) -> str:
    client_name = brief.get("client_name", "the brand")
    product = brief.get("product", "the product")
    audience = brief.get("audience", "the target audience")
    goal = brief.get("goal", "drive engagement and conversions")
    key_message = brief.get("key_message", "")
    platforms_str = ", ".join(platforms) if platforms else "all major social platforms"

    # Assemble task details dynamically based on requested types
    task_instructions = []
    expected_schema = {}
    expected_example = {}

    if "captions" in types:
        cap_instr = []
        cap_instr.append("### Captions Task:")
        cap_instr.append(f"Generate EXACTLY 3 distinct social-media captions for each platform in: {platforms_str}.")
        cap_instr.append("Rules for captions:")
        for platform in platforms:
            platform_lower = platform.lower()
            char_limit = PLATFORM_LIMITS.get(platform_lower, 2200)
            voice = PLATFORM_VOICE.get(platform_lower, "engaging and on-brand")
            cap_instr.append(f"  - For {platform.upper()}: style must be {voice}, max {char_limit} characters. Must immediately grab attention.")
        task_instructions.append("\n".join(cap_instr))

        expected_schema["captions"] = {p.lower(): ["List of 3 strings"] for p in platforms}
        expected_example["captions"] = {p.lower(): [f"{p.title()} caption 1...", f"{p.title()} caption 2...", f"{p.title()} caption 3..."] for p in platforms}

    if "ad_copy" in types:
        ad_instr = []
        ad_instr.append("### Ad Copy Task:")
        ad_instr.append(f"Generate EXACTLY 2 distinct paid ad copy variants for each platform in: {platforms_str}.")
        ad_instr.append("Each variant must consist of:")
        ad_instr.append("  1. headline: max 60 characters. Attention-grabbing & benefit-focused.")
        ad_instr.append("  2. body: max 150 characters. Clearly communicate value and nudge toward action.")
        task_instructions.append("\n".join(ad_instr))

        expected_schema["ad_copy"] = {p.lower(): [{"headline": "string", "body": "string"}] for p in platforms}
        expected_example["ad_copy"] = {p.lower(): [
            {"headline": "Benefit-focused headline 1", "body": "Action-oriented body copy 1"},
            {"headline": "Attention-grabbing headline 2", "body": "Value-packed body copy 2"}
        ] for p in platforms}

    if "hooks" in types:
        hook_instr = []
        hook_instr.append("### Hooks Task:")
        hook_instr.append("Generate EXACTLY 3 scroll-stopping opening hook lines (100 characters or fewer each).")
        hook_instr.append("Use pattern-interrupt techniques (unexpected, bold, or provocative claims). Do NOT include any CTA in the hooks.")
        task_instructions.append("\n".join(hook_instr))

        expected_schema["hooks"] = ["List of 3 strings"]
        expected_example["hooks"] = ["Bold provocative hook 1", "Counter-intuitive hook 2", "Pain-point hook 3"]

    if "ctas" in types:
        cta_instr = []
        cta_instr.append("### CTAs Task:")
        cta_instr.append("Generate EXACTLY 3 action-oriented call-to-action phrases (5-12 words each) in the following order:")
        cta_instr.append("  1. Urgency (time pressure or scarcity)")
        cta_instr.append("  2. Benefit (tangible gain/outcome)")
        cta_instr.append("  3. Command (direct imperative)")
        task_instructions.append("\n".join(cta_instr))

        expected_schema["ctas"] = ["List of 3 strings"]
        expected_example["ctas"] = [
            "Get yours today before stock runs out!",
            "Start saving time with our tool now.",
            "Sign up for free and begin today."
        ]

    if "concepts" in types:
        concept_instr = []
        concept_instr.append("### Concepts Task:")
        concept_instr.append("Generate EXACTLY 2 distinct, compelling creative campaign concepts.")
        concept_instr.append("For each concept, provide:")
        concept_instr.append("  - name: 2-5 words title (e.g. 'The Ripple Effect')")
        concept_instr.append("  - tagline: punchy resonant line (max 10 words)")
        concept_instr.append("  - description: 2-3 sentences explaining big idea/emotional strategy")
        concept_instr.append("  - visual_idea: 1-2 sentences on visual direction/aesthetic")
        task_instructions.append("\n".join(concept_instr))

        expected_schema["concepts"] = [{
            "name": "string",
            "tagline": "string",
            "description": "string",
            "visual_idea": "string"
        }]
        expected_example["concepts"] = [
            {
                "name": "The Ripple Effect",
                "tagline": "Small steps lead to massive change.",
                "description": "This concept targets audience self-reflection by showing how individual decisions compound. We highlight long-term benefits to drive deep brand trust.",
                "visual_idea": "Vibrant blue and teal ocean waves ripple outward, showing a single drop transforming into a wave with clean, minimalist typography."
            },
            {
                "name": "Concept Two Title",
                "tagline": "Tagline two here.",
                "description": "Description of the second concept.",
                "visual_idea": "Visual direction description for second concept."
            }
        ]

    tasks_block = "\n\n".join(task_instructions)

    import json
    schema_str = json.dumps(expected_schema, indent=2)
    example_str = json.dumps(expected_example, indent=2)

    prompt = f"""You are a world-class advertising creative director and copywriter. Your goal is to generate high-quality campaign copy and concepts.

## Campaign Brief
- Brand / Client : {client_name}
- Product / Service : {product}
- Target Audience : {audience}
- Campaign Goal : {goal}
- Key Message : {key_message}
- Tone of Voice : {tone}
- Platforms : {platforms_str}

## Your Tasks
{tasks_block}

## Instructions
- Match the tone "{tone}" consistently throughout all content.
- Ensure all copy directly targets: {audience}.
- Do NOT include any intro text, intro markdown syntax, outro text, markdown formatting (like ```json), or explanations. 
- Return ONLY a single valid JSON object containing exactly the requested keys.

## JSON Schema to Follow:
{schema_str}

## Example Output:
{example_str}
"""
    return prompt.strip()
