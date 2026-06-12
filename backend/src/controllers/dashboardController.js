import supabase from '../db/supabase.js';

/**
 * GET /api/dashboard/stats
 * Returns total briefs, total clients, and generations created today for the authenticated user.
 */
export async function getDashboardStats(req, res, next) {
  try {
    const userId = req.user.id;

    // 1. Count total briefs
    const { count: totalBriefs, error: briefsError } = await supabase
      .from('briefs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (briefsError) throw briefsError;

    // 2. Count total clients
    const { count: totalClients, error: clientsError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (clientsError) throw clientsError;

    // 3. Count generations created today (since midnight UTC)
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    // To count generations, we fetch all generations for briefs owned by this user
    // created after startOfToday.
    // We can do a join or subquery. In Supabase JS:
    const { data: generationsTodayData, error: generationsError } = await supabase
      .from('generations')
      .select('id, briefs!inner(user_id)')
      .eq('briefs.user_id', userId)
      .gte('created_at', startOfToday.toISOString());

    if (generationsError) throw generationsError;

    const generationsToday = generationsTodayData ? generationsTodayData.length : 0;

    return res.status(200).json({
      totalBriefs: totalBriefs || 0,
      totalClients: totalClients || 0,
      generationsToday: generationsToday || 0,
    });
  } catch (err) {
    next(err);
  }
}
