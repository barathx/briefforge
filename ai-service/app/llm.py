"""
OllamaClient — async HTTP client for the Ollama inference server.
"""

import json
import logging
import re

import httpx

logger = logging.getLogger("briefforge.ai.llm")


class OllamaClient:
    """Async client for Ollama's /api/generate endpoint."""

    def __init__(self, host: str, model: str) -> None:
        self.host = host.rstrip("/")
        self.model = model
        self._timeout = httpx.Timeout(300.0, connect=10.0)

    # ------------------------------------------------------------------
    # Core generation
    # ------------------------------------------------------------------

    async def generate(self, prompt: str) -> str:
        """
        Send a prompt to Ollama and return the raw response string.

        Args:
            prompt: The full prompt to send to the model.

        Returns:
            The model's response as a plain string.

        Raises:
            httpx.HTTPStatusError: On non-2xx HTTP responses.
            httpx.RequestError: On network-level failures.
        """
        url = f"{self.host}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "format": "json",
        }

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            logger.debug("POST %s  model=%s  prompt_len=%d", url, self.model, len(prompt))
            response = await client.post(url, json=payload)
            response.raise_for_status()

        data = response.json()
        raw_text: str = data.get("response", "")
        logger.debug("Ollama raw response length: %d chars", len(raw_text))
        return raw_text

    # ------------------------------------------------------------------
    # JSON parsing
    # ------------------------------------------------------------------

    def parse_json_response(self, text: str) -> dict:
        """
        Parse a JSON object from the model's response text.

        Attempts a direct parse first; falls back to extracting the first
        JSON object found between the outermost ``{`` and ``}`` braces.

        Args:
            text: Raw text potentially containing a JSON payload.

        Returns:
            Parsed Python dict.

        Raises:
            ValueError: If no valid JSON object can be extracted.
        """
        text = text.strip()

        # Attempt 1 — direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Attempt 2 — extract first {...} block
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            candidate = text[start : end + 1]
            try:
                return json.loads(candidate)
            except json.JSONDecodeError:
                pass

        # Attempt 3 — strip markdown code fences if present
        code_fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if code_fence_match:
            try:
                return json.loads(code_fence_match.group(1))
            except json.JSONDecodeError:
                pass

        raise ValueError(
            f"Unable to parse a valid JSON object from model response. "
            f"First 200 chars: {text[:200]!r}"
        )

    # ------------------------------------------------------------------
    # High-level JSON generation with retry
    # ------------------------------------------------------------------

    async def generate_json(self, prompt: str, max_retries: int = 2) -> dict:
        """
        Generate a response and parse it as JSON, retrying on parse errors.

        Args:
            prompt: The prompt to send.
            max_retries: How many additional attempts to make on parse failure
                         (total attempts = max_retries + 1).

        Returns:
            Parsed dict from the model's JSON response.

        Raises:
            ValueError: If all attempts fail to produce valid JSON.
            httpx.HTTPStatusError / httpx.RequestError: On network failures.
        """
        last_error: Exception = ValueError("No attempts made.")
        for attempt in range(max_retries + 1):
            try:
                raw = await self.generate(prompt)
                return self.parse_json_response(raw)
            except ValueError as exc:
                last_error = exc
                logger.warning(
                    "JSON parse failed (attempt %d/%d): %s",
                    attempt + 1,
                    max_retries + 1,
                    exc,
                )
            except (httpx.HTTPStatusError, httpx.RequestError) as exc:
                logger.error("Ollama HTTP error on attempt %d: %s", attempt + 1, exc)
                raise  # Don't retry network errors — surface immediately

        raise ValueError(
            f"Failed to obtain valid JSON after {max_retries + 1} attempts. "
            f"Last error: {last_error}"
        )
