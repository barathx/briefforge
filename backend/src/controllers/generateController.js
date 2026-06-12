import supabase from '../db/supabase.js';
import { callAIGenerate } from '../services/aiClient.js';

const GENERATION_TYPES = ['caption', 'ad_copy', 'hook', 'cta', 'concept'];

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
    .insert({ brief_id, type, platform, content })
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

  // 2. Mark as processing
  await setBriefStatus(briefId, 'processing');

  try {
    // 3. Call AI service
    const aiResponse = await callAIGenerate({
      brief,
      tone: brief.tone,
      platforms: brief.platforms,
      types: GENERATION_TYPES,
    });

    /**
     * Expected AI response shape:
     * {
     *   results: {
     *     [platform]: {
     *       [type]: string | string[]
     *     }
     *   }
     * }
     */
    const results = aiResponse.results ?? {};

    // 4. Insert a generation row for each type × platform combination
    const insertPromises = [];

    for (const platform of brief.platforms) {
      for (const type of GENERATION_TYPES) {
        const rawContent = results[platform]?.[type] ?? null;

        if (rawContent !== null) {
          insertPromises.push(
            insertGeneration({
              brief_id: briefId,
              type,
              platform,
              content: typeof rawContent === 'string'
                ? { text: rawContent }
                : rawContent,
            })
          );
        }
      }
    }

    const generations = await Promise.all(insertPromises);

    // 5. Mark as complete
    await setBriefStatus(briefId, 'complete');

    return res.status(200).json({ generations });
  } catch (err) {
    console.error('[triggerGeneration]', err);
    // Set brief to error state so the client can surface it
    await setBriefStatus(briefId, 'error');
    return res.status(502).json({ error: 'AI generation failed', detail: err.message });
  }
}

/**
 * POST /api/generate/:briefId/regenerate?type=caption&platform=instagram
 * Re-generates a single type/platform pair, replacing the old row.
 */
export async function regenerate(req, res) {
  const { briefId } = req.params;
  const { type, platform } = req.query;

  if (!type || !platform) {
    return res.status(400).json({ error: 'Query params "type" and "platform" are required' });
  }

  // 1. Verify ownership
  const brief = await getOwnedBrief(briefId, req.user.id);
  if (!brief) {
    return res.status(404).json({ error: 'Brief not found' });
  }

  await setBriefStatus(briefId, 'processing');

  try {
    // 2. Call AI service for the specific type/platform
    const aiResponse = await callAIGenerate({
      brief,
      tone: brief.tone,
      platforms: [platform],
      types: [type],
    });

    const results = aiResponse.results ?? {};
    const rawContent = results[platform]?.[type] ?? null;

    if (rawContent === null) {
      await setBriefStatus(briefId, 'complete');
      return res.status(502).json({ error: 'AI service returned no content for the requested type/platform' });
    }

    // 3. Delete the existing generation row (if any) for this type+platform
    await supabase
      .from('generations')
      .delete()
      .eq('brief_id', briefId)
      .eq('type', type)
      .eq('platform', platform);

    // 4. Insert fresh generation
    const generation = await insertGeneration({
      brief_id: briefId,
      type,
      platform,
      content: typeof rawContent === 'string'
        ? { text: rawContent }
        : rawContent,
    });

    await setBriefStatus(briefId, 'complete');

    return res.status(200).json({ generation });
  } catch (err) {
    console.error('[regenerate]', err);
    await setBriefStatus(briefId, 'error');
    return res.status(502).json({ error: 'AI regeneration failed', detail: err.message });
  }
}
