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

    // 3. Count generations created today by first fetching brief IDs owned by user
    //    then counting generations for those briefs created after midnight UTC today.
    //    (Supabase JS v2 does not support cross-table .eq() with embedded joins)
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    // Get brief IDs for this user
    const { data: userBriefs, error: userBriefsError } = await supabase
      .from('briefs')
      .select('id')
      .eq('user_id', userId);

    if (userBriefsError) throw userBriefsError;

    let generationsToday = 0;
    if (userBriefs && userBriefs.length > 0) {
      const briefIds = userBriefs.map((b) => b.id);

      const { count: genCount, error: generationsError } = await supabase
        .from('generations')
        .select('*', { count: 'exact', head: true })
        .in('brief_id', briefIds)
        .gte('created_at', startOfToday.toISOString());

      if (generationsError) throw generationsError;
      generationsToday = genCount || 0;
    }

    return res.status(200).json({
      totalBriefs:      totalBriefs      || 0,
      totalClients:     totalClients     || 0,
      generationsToday: generationsToday || 0,
    });
  } catch (err) {
    next(err);
  }
}
