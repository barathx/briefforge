import axios from 'axios';

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Calls the AI microservice and normalises the response.
 * Maps incoming singular types to plural types for FastAPI,
 * and normalises the output.
 */
export async function callAIGenerate(payload) {
  const briefObj = payload.brief;

  // Extract client name if populated, otherwise default
  const clientName = (briefObj && typeof briefObj === 'object')
    ? (briefObj.clients?.name || 'Client')
    : 'Client';

  // Construct structured request payload for FastAPI
  const fastapiPayload = {
    brief: (briefObj && typeof briefObj === 'object') ? {
      client_name: clientName,
      product: briefObj.product || '',
      audience: briefObj.audience || '',
      goal: briefObj.goal || '',
      key_message: briefObj.key_message || '',
      tone: briefObj.tone || '',
      platforms: briefObj.platforms || [],
      raw_brief: briefObj.raw_brief || '',
    } : {
      client_name: 'Client',
      product: '',
      audience: '',
      goal: '',
      key_message: '',
      tone: payload.tone || '',
      platforms: payload.platforms || [],
      raw_brief: String(briefObj || ''),
    },
    tone: payload.tone,
    platforms: payload.platforms,
    types: (payload.types ?? []).map((t) => {
      if (t === 'caption') return 'captions';
      if (t === 'hook') return 'hooks';
      if (t === 'cta') return 'ctas';
      if (t === 'concept') return 'concepts';
      return t; // 'ad_copy' remains 'ad_copy'
    }),
  };

  const { data } = await axios.post(`${AI_URL}/ai/generate`, fastapiPayload, {
    timeout: 180000, // 3 minutes — LLM inference can be slow
    headers: { 'Content-Type': 'application/json' },
  });

  return normaliseAIResponse(data, payload.platforms ?? []);
}

/**
 * Transforms the flat AI service response into the nested
 * results[platform][type] structure used by the controller.
 */
function normaliseAIResponse(aiData, platforms) {
  const results = {};

  for (const platform of platforms) {
    results[platform] = {
      // Platform-specific content arrays
      caption: aiData.captions?.[platform] ?? [],
      ad_copy: aiData.ad_copy?.[platform] ?? [],
      // Global content (same across all platforms)
      hook: aiData.hooks ?? [],
      cta: aiData.ctas ?? [],
      concept: aiData.concepts ?? [],
    };
  }

  return { results };
}
