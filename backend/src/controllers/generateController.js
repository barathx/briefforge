import supabase from '../db/supabase.js';
import { callAIGenerate } from '../services/aiClient.js';

// Types that apply per-platform
const PLATFORM_TYPES = ['caption', 'ad_copy'];
// Types that are global (not per-platform)
const GLOBAL_TYPES = ['hook', 'cta', 'concept'];
const ALL_TYPES = [...PLATFORM_TYPES, ...GLOBAL_TYPES];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Fetches a brief and verifies ownership by the requesting user.
 * @returns {object|null} brief row or null
 */
async function getOwnedBrief(briefId, userId) {
  const { data, error } = await supabase
    .from('briefs')
    .select('*, clients(name)')
    .eq('id', briefId)
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data;
}

/**
 * Sets brief.status in the database.
 */
async function setBriefStatus(briefId, status) {
  await supabase
    .from('briefs')
    .update({ status })
    .eq('id', briefId);
}

/**
 * Inserts a generation row into the generations table.
 */
async function insertGeneration({ brief_id, type, platform, content }) {
  const { data, error } = await supabase
    .from('generations')
    .insert({ brief_id, type, platform: platform ?? null, content })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/generate/:briefId
 * Triggers full AI generation for all types across all platforms.
 */
export async function triggerGeneration(req, res) {
  const { briefId } = req.params;

  // 1. Verify ownership
  const brief = await getOwnedBrief(briefId, req.user.id);
  if (!brief) {
    return res.status(404).json({ error: 'Brief not found' });
  }

  // 2. Mark as processing immediately so the UI can show the spinner
  await setBriefStatus(briefId, 'processing');

  // 3. Respond to the client immediately — generation runs async
  res.status(202).json({ message: 'Generation started', briefId });

  // 4. Run generation asynchronously (fire-and-forget from the request lifecycle)
  try {
    const aiResponse = await callAIGenerate({
      brief,
      tone: brief.tone,
      platforms: brief.platforms,
      types: ALL_TYPES,
    });

    /**
     * normalised AI response shape from aiClient.js:
     * {
     *   platformResults: { [platform]: { caption: [...], ad_copy: [...] } },
     *   globals: { hook: [...], cta: [...], concept: [...] }
     * }
     */
    const { platformResults = {}, globals = {} } = aiResponse;

    const insertPromises = [];

    // Insert per-platform types (caption, ad_copy)
    for (const platform of brief.platforms) {
      for (const type of PLATFORM_TYPES) {
        const content = platformResults[platform]?.[type];
        if (content && content.length > 0) {
          insertPromises.push(
            insertGeneration({ brief_id: briefId, type, platform, content })
          );
        }
      }
    }

    // Insert global types (hook, cta, concept) — one row each, no platform
    for (const type of GLOBAL_TYPES) {
      const content = globals[type];
      if (content && content.length > 0) {
        insertPromises.push(
          insertGeneration({ brief_id: briefId, type, platform: null, content })
        );
      }
    }

    await Promise.all(insertPromises);

    // 5. Mark as complete
    await setBriefStatus(briefId, 'complete');
  } catch (err) {
    console.error('[triggerGeneration] async error:', err);
    await setBriefStatus(briefId, 'error');
  }
}

/**
 * POST /api/generate/:briefId/regenerate?type=caption&platform=instagram
 * Re-generates a single type/platform pair (or a global type), replacing the old row.
 */
export async function regenerate(req, res) {
  const { briefId } = req.params;
  const { type, platform } = req.query;

  if (!type) {
    return res.status(400).json({ error: 'Query param "type" is required' });
  }

  // platform is only required for per-platform types
  const isGlobal = GLOBAL_TYPES.includes(type);
  if (!isGlobal && !platform) {
    return res.status(400).json({ error: 'Query param "platform" is required for caption and ad_copy types' });
  }

  // 1. Verify ownership
  const brief = await getOwnedBrief(briefId, req.user.id);
  if (!brief) {
    return res.status(404).json({ error: 'Brief not found' });
  }

  try {
    // 2. Call AI service for the specific type
    const targetPlatforms = isGlobal ? brief.platforms : [platform];
    const aiResponse = await callAIGenerate({
      brief,
      tone: brief.tone,
      platforms: targetPlatforms,
      types: [type],
    });

    const { platformResults = {}, globals = {} } = aiResponse;

    let content;
    if (isGlobal) {
      content = globals[type] ?? null;
    } else {
      content = platformResults[platform]?.[type] ?? null;
    }

    if (!content || content.length === 0) {
      return res.status(502).json({ error: 'AI service returned no content for the requested type' });
    }

    // 3. Delete existing generation row (if any)
    const deleteQuery = supabase
      .from('generations')
      .delete()
      .eq('brief_id', briefId)
      .eq('type', type);

    if (isGlobal) {
      await deleteQuery.is('platform', null);
    } else {
      await deleteQuery.eq('platform', platform);
    }

    // 4. Insert fresh generation
    const generation = await insertGeneration({
      brief_id: briefId,
      type,
      platform: isGlobal ? null : platform,
      content,
    });

    return res.status(200).json({ generation });
  } catch (err) {
    console.error('[regenerate]', err);
    return res.status(502).json({ error: 'AI regeneration failed', detail: err.message });
  }
}
