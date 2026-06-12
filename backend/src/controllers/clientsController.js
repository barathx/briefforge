import { z } from 'zod';
import supabase from '../db/supabase.js';

// ── Validation Schema ─────────────────────────────────────────────────────────
const createClientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  industry: z.string().optional(),
  notes: z.string().optional(),
});

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/clients
 * Returns all clients belonging to the authenticated user, ordered by name.
 */
export async function listClients(req, res) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', req.user.id)
      .order('name', { ascending: true });

    if (error) throw error;

    return res.status(200).json({ clients: data });
  } catch (err) {
    console.error('[listClients]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/clients
 * Creates a new client for the authenticated user.
 */
export async function createClient(req, res) {
  const parsed = createClientSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const { name, industry, notes } = parsed.data;

  try {
    const { data, error } = await supabase
      .from('clients')
      .insert({ name, industry: industry ?? null, notes: notes ?? null, user_id: req.user.id })
      .select('*')
      .single();

    if (error) throw error;

    return res.status(201).json({ client: data });
  } catch (err) {
    console.error('[createClient]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
