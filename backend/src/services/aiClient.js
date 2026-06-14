import axios from 'axios';

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Types that the AI returns per-platform (keyed by lowercase platform name)
const PLATFORM_TYPES = ['caption', 'ad_copy'];
// Types that the AI returns globally (flat arrays)
const GLOBAL_TYPE_MAP = {
  'hook':    'hooks',
  'cta':     'ctas',
  'concept': 'concepts',
};

/**
 * Calls the AI microservice and normalises the response.
 *
 * Returns:
 *   {
 *     platformResults: { [platform]: { caption: [...], ad_copy: [...] } },
 *     globals:         { hook: [...], cta: [...], concept: [...] }
 *   }
 */
export async function callAIGenerate(payload) {
  const briefObj = payload.brief;

  // Extract client name if populated
  const clientName = (briefObj && typeof briefObj === 'object')
    ? (briefObj.clients?.name || briefObj.client_name || 'Client')
    : 'Client';

  // Lowercase platforms so the AI service prompt builders find the right config
  const platforms = (payload.platforms ?? []).map((p) => p.toLowerCase());

  // Map singular type names → plural types the FastAPI service expects
  const types = (payload.types ?? []).map((t) => {
    if (t === 'caption')  return 'captions';
    if (t === 'hook')     return 'hooks';
    if (t === 'cta')      return 'ctas';
    if (t === 'concept')  return 'concepts';
    return t; // 'ad_copy' stays 'ad_copy'
  });

  // Construct structured request payload for FastAPI
  const fastapiPayload = {
    brief: (briefObj && typeof briefObj === 'object') ? {
      client_name: clientName,
      product:     briefObj.product    || '',
      audience:    briefObj.audience   || '',
      goal:        briefObj.goal       || '',
      key_message: briefObj.key_message || '',
      tone:        briefObj.tone        || '',
      platforms,
      raw_brief:   briefObj.raw_brief  || '',
    } : {
      client_name: 'Client',
      product:  '',
      audience: '',
      goal:     '',
      key_message: '',
      tone:     payload.tone || '',
      platforms,
      raw_brief: String(briefObj || ''),
    },
    tone:      payload.tone,
    platforms,
    types,
  };

  const { data } = await axios.post(`${AI_URL}/ai/generate`, fastapiPayload, {
    timeout: 600000, // 10 minutes — LLM inference on CPU can be slow
    headers: { 'Content-Type': 'application/json' },
  });

  return normaliseAIResponse(data, platforms, payload.platforms ?? []);
}

/**
 * Transforms the flat AI service response into two buckets:
 *  - platformResults: per-platform types (caption, ad_copy)
 *  - globals:         global types (hook, cta, concept) — single value for all platforms
 */
function normaliseAIResponse(aiData, lowercasePlatforms, originalPlatforms) {
  const platformResults = {};

  // Build per-platform results using lowercase platform key but store under original case
  for (let i = 0; i < originalPlatforms.length; i++) {
    const original = originalPlatforms[i];
    const lower    = lowercasePlatforms[i];

    platformResults[original] = {
      caption:  aiData.captions?.[lower] ?? [],
      ad_copy:  aiData.ad_copy?.[lower]  ?? [],
    };
  }

  // Global types: extract flat arrays from the AI response
  const globals = {
    hook:    aiData.hooks     ?? [],
    cta:     aiData.ctas      ?? [],
    concept: (aiData.concepts ?? []).map((c) =>
      // Ensure concept objects are plain objects (FastAPI may return Pydantic models)
      (c && typeof c === 'object') ? c : {}
    ),
  };

  return { platformResults, globals };
}
