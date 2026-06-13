import { z } from 'zod';
import supabase from '../db/supabase.js';

// ── Validation Schema ─────────────────────────────────────────────────────────
const createBriefSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  raw_brief: z.string().min(1, 'Brief content is required'),
  product: z.string().min(1, 'Product is required'),
  audience: z.string().min(1, 'Target audience is required'),
  goal: z.string().min(1, 'Goal is required'),
  key_message: z.string().optional().nullable(),
  tone: z.string().min(1, 'Tone is required'),
  platforms: z.array(z.string()).min(1, 'At least one platform is required'),
  client_id: z.string().uuid().optional().nullable(),
  deadline: z.string().optional().nullable(),
  brand_guidelines: z.string().optional().nullable(),
});

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/briefs
 */
export async function createBrief(req, res) {
  const parsed = createBriefSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const {
    title, raw_brief, product, audience, goal, key_message,
    tone, platforms, client_id, deadline, brand_guidelines,
  } = parsed.data;

  try {
    const { data, error } = await supabase
      .from('briefs')
      .insert({
        user_id: req.user.id,
        title,
        raw_brief,
        product,
        audience,
        goal,
        key_message: key_message ?? '',
        tone,
        platforms,
        client_id: client_id ?? null,
        deadline: deadline ?? null,
        brand_guidelines: brand_guidelines ?? null,
        status: 'draft',
      })
      .select('*')
      .single();

    if (error) throw error;

    return res.status(201).json({ brief: data });
  } catch (err) {
    console.error('[createBrief]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/briefs
 * Supports optional query params: client_id, tone, date_from, date_to, search, page, limit
 */
export async function listBriefs(req, res) {
  try {
    const { client_id, tone, date_from, date_to, search, page, limit } = req.query;

    // Start building query with count option
    let query = supabase
      .from('briefs')
      .select('*, clients(name)', { count: 'exact' })
      .eq('user_id', req.user.id);

    if (client_id) {
      query = query.eq('client_id', client_id);
    }

    if (tone) {
      query = query.eq('tone', tone);
    }

    if (date_from) {
      query = query.gte('created_at', date_from);
    }

    if (date_to) {
      query = query.lte('created_at', date_to);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,product.ilike.%${search}%,audience.ilike.%${search}%`);
    }

    // Sort order
    query = query.order('created_at', { ascending: false });

    // Pagination bounds calculation
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) throw error;

    // Flatten client name onto each brief for convenience
    const briefs = data.map(({ clients, ...brief }) => ({
      ...brief,
      client_name: clients?.name ?? null,
    }));

    return res.status(200).json({
      briefs,
      total: count || 0,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error('[listBriefs]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/briefs/:id
 * Returns the brief along with all of its generations.
 */
export async function getBrief(req, res) {
  const { id } = req.params;

  try {
    // Fetch the brief (ensure ownership)
    const { data: brief, error: briefError } = await supabase
      .from('briefs')
      .select('*, clients(name)')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (briefError) {
      if (briefError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Brief not found' });
      }
      throw briefError;
    }

    // Fetch associated generations
    const { data: generations, error: genError } = await supabase
      .from('generations')
      .select('*')
      .eq('brief_id', id)
      .order('created_at', { ascending: false });

    if (genError) throw genError;

    const { clients, ...briefData } = brief;

    return res.status(200).json({
      brief: { ...briefData, client_name: clients?.name ?? null },
      generations,
    });
  } catch (err) {
    console.error('[getBrief]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/briefs/:id
 */
export async function deleteBrief(req, res) {
  const { id } = req.params;

  try {
    const { error, count } = await supabase
      .from('briefs')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    if (count === 0) {
      return res.status(404).json({ error: 'Brief not found' });
    }

    return res.status(204).send();
  } catch (err) {
    console.error('[deleteBrief]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
