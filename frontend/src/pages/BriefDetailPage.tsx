import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PlatformTabs from '../components/PlatformTabs';
import OutputCard from '../components/OutputCard';
import {
  getBrief,
  deleteBrief,
  generateContent,
  regenerateContent,
  type Brief,
  type Generation,
} from '../services/api';
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  Trash2,
  AlertCircle,
  Loader2,
  Bookmark,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BriefDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [brief, setBrief] = useState<Brief | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlatform, setActivePlatform] = useState<string>('');
  const [regeneratingKeys, setRegeneratingKeys] = useState<Record<string, boolean>>({});
  const [retrying, setRetrying] = useState(false);
  // Track whether we've set the initial active platform so loadData doesn't re-init it
  const platformInitialised = useRef(false);

  const loadData = useCallback(async (showLoading = true) => {
    if (!id) return;
    if (showLoading) setLoading(true);
    try {
      const data = await getBrief(id);
      setBrief(data.brief);
      setGenerations(data.generations || []);

      // Only set the active platform on first load
      if (!platformInitialised.current && data.brief?.platforms?.length > 0) {
        setActivePlatform(data.brief.platforms[0]);
        platformInitialised.current = true;
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load campaign details');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial load
  useEffect(() => {
    loadData();
  }, [id]);

  // Polling if status is 'processing'
  useEffect(() => {
    if (!brief || brief.status !== 'processing') return;

    const interval = setInterval(() => {
      loadData(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [brief?.status, loadData]);

  // Handle entire generation retry
  const handleRetryAll = async () => {
    if (!id) return;
    setRetrying(true);
    try {
      await generateContent(id);
      toast.success('Generation started! Content will appear shortly...');
      // Optimistically set status to processing so polling kicks in
      setBrief((prev) => prev ? { ...prev, status: 'processing' } : prev);
      loadData(false);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to trigger generation');
    } finally {
      setRetrying(false);
    }
  };

  // Handle single OutputCard regeneration
  const handleRegenerateItem = async (type: Generation['type'], platform?: string) => {
    if (!id) return;
    const key = `${type}-${platform || 'global'}`;
    setRegeneratingKeys((prev) => ({ ...prev, [key]: true }));

    try {
      toast.loading(`Regenerating ${type}...`);
      const newGen = await regenerateContent(id, type, platform);
      toast.dismiss();
      toast.success('Regenerated successfully!');

      // Update generations state with the new generation
      setGenerations((prev) => {
        const filtered = prev.filter((g) => !(g.type === type && g.platform === platform));
        return [...filtered, newGen];
      });
    } catch (err: any) {
      toast.dismiss();
      console.error(err);
      toast.error('Failed to regenerate content');
    } finally {
      setRegeneratingKeys((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Delete Campaign Brief
  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this brief and all its generated outputs? This cannot be undone.')) {
      return;
    }
    try {
      await deleteBrief(id);
      toast.success('Brief deleted successfully');
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to delete brief');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col justify-center items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        <p className="text-gray-400 text-sm">Loading campaign details...</p>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 pt-24 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold">Campaign Not Found</h2>
          <p className="text-gray-400 mt-2">The campaign brief you are looking for does not exist.</p>
          <Link to="/dashboard" className="btn-primary mt-6 inline-flex">
            Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  // Filter generations based on selected platform / global
  const getGenerationsByType = (type: Generation['type'], platform?: string) => {
    return generations.find((g) => g.type === type && g.platform === platform)?.content || [];
  };

  // Check if a platform has generated copies
  const normalizedPlatforms = brief.platforms || [];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-600/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Back navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/history"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to History
          </Link>

          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Campaign
          </button>
        </div>

        {/* Brief Title Banner */}
        <div className="glass p-6 sm:p-8 mb-8 relative">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-500/15 border border-purple-500/20 text-purple-400">
                  {brief.tone} Tone
                </span>
                {brief.client?.name && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-500/15 border border-cyan-500/20 text-cyan-400">
                    {brief.client.name}
                  </span>
                )}
                {brief.status === 'complete' && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Ready
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {brief.title}
              </h1>
              <p className="text-sm text-gray-400">
                Product: <span className="text-gray-200 font-medium">{brief.product}</span> &bull; Target: <span className="text-gray-200 font-medium">{brief.audience}</span>
              </p>
            </div>

            {/* Status indicators */}
            <div className="flex flex-col items-end gap-2 text-right">
              {brief.status === 'processing' && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-amber-400 text-sm font-semibold animate-pulse">
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  Generating Social Content...
                </div>
              )}
              {brief.status === 'error' && (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-400 text-sm font-semibold">
                    <AlertCircle className="w-4.5 h-4.5" />
                    Generation Failed
                  </div>
                  <button
                    onClick={handleRetryAll}
                    disabled={retrying}
                    className="btn-primary py-1.5 px-4 text-xs inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Retry Generation
                  </button>
                </div>
              )}
              {brief.deadline && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" />
                  Due: {new Date(brief.deadline).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Quick summary expander */}
          <details className="group mt-6 pt-5 border-t border-white/5">
            <summary className="list-none flex items-center justify-between text-xs font-semibold text-gray-400 hover:text-white cursor-pointer select-none">
              <span>View Submitted Campaign Brief Data</span>
              <span className="transition-transform group-open:rotate-180 text-gray-500">&darr;</span>
            </summary>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300 animate-slide-up">
              <div className="space-y-4">
                {brief.goal && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">Campaign Goal</h4>
                    <p className="text-gray-200">{brief.goal}</p>
                  </div>
                )}
                {brief.key_message && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">Key Message</h4>
                    <p className="text-gray-200">{brief.key_message}</p>
                  </div>
                )}
                {brief.brand_guidelines && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">Brand Guidelines</h4>
                    <p className="text-gray-200">{brief.brand_guidelines}</p>
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">Raw Brief Context</h4>
                <p className="bg-black/30 border border-white/5 rounded-xl p-4 text-xs font-mono text-gray-400 max-h-[200px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {brief.raw_brief}
                </p>
              </div>
            </div>
          </details>
        </div>

        {/* Main Content Sections */}
        {brief.status === 'processing' && generations.length === 0 ? (
          <div className="glass p-12 text-center flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
            <h3 className="text-lg font-bold text-white">BriefForge AI is forging your content...</h3>
            <p className="text-sm text-gray-400 max-w-md">
              We are generating captions, headlines, ad copy variants, CTAs, hooks, and creative concepts. This usually takes about 30–60 seconds.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* 1. Platform-Specific Copy (Captions & Ad Copy) */}
            {normalizedPlatforms.length > 0 && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-purple-400" />
                    Multi-Platform Copy Adaptations
                  </h2>

                  <PlatformTabs
                    platforms={normalizedPlatforms}
                    active={activePlatform}
                    onSelect={setActivePlatform}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Captions Card */}
                  <OutputCard
                    type="caption"
                    platform={activePlatform}
                    content={getGenerationsByType('caption', activePlatform)}
                    onRegenerate={() => handleRegenerateItem('caption', activePlatform)}
                    isRegenerating={!!regeneratingKeys[`caption-${activePlatform}`]}
                  />

                  {/* Ad Copy Card */}
                  <OutputCard
                    type="ad_copy"
                    platform={activePlatform}
                    content={getGenerationsByType('ad_copy', activePlatform)}
                    onRegenerate={() => handleRegenerateItem('ad_copy', activePlatform)}
                    isRegenerating={!!regeneratingKeys[`ad_copy-${activePlatform}`]}
                  />
                </div>
              </div>
            )}

            {/* 2. Global Campaign Assets (Hooks, CTAs, Concepts) */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Global Campaign Assets
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Scroll-stopping Hook lines */}
                <OutputCard
                  type="hook"
                  content={getGenerationsByType('hook')}
                  onRegenerate={() => handleRegenerateItem('hook')}
                  isRegenerating={!!regeneratingKeys['hook-global']}
                />

                {/* Suggested Action-Oriented CTAs */}
                <OutputCard
                  type="cta"
                  content={getGenerationsByType('cta')}
                  onRegenerate={() => handleRegenerateItem('cta')}
                  isRegenerating={!!regeneratingKeys['cta-global']}
                />

                {/* Creative Campaign Concepts */}
                <OutputCard
                  type="concept"
                  content={getGenerationsByType('concept')}
                  onRegenerate={() => handleRegenerateItem('concept')}
                  isRegenerating={!!regeneratingKeys['concept-global']}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
