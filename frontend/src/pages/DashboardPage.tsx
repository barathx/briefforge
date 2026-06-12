import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardStats, getBriefs, type Brief, type DashboardStats } from '../services/api';
import { FileText, Users, Zap, ChevronRight, Plus, Calendar, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBriefs, setRecentBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, briefsResponse] = await Promise.all([
          getDashboardStats(),
          getBriefs({ limit: 5 }),
        ]);
        setStats(statsData);
        setRecentBriefs(briefsResponse.briefs || []);
      } catch (err: any) {
        console.error(err);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getStatusStyle = (status: Brief['status']) => {
    switch (status) {
      case 'complete':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'processing':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse';
      case 'error':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 relative overflow-hidden">
        {/* Decorative Orbs */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-600/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1.5">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                {user?.name || 'Creator'}
              </span>
            </h1>
            <p className="text-sm text-gray-400">
              Here's an overview of your creative campaign briefs and generations.
            </p>
          </div>
          <Link
            to="/briefs/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-semibold text-sm transition-all duration-300 shadow-[0_4px_20px_rgba(168,85,247,0.25)] hover:shadow-[0_4px_25px_rgba(168,85,247,0.4)]"
          >
            <Plus className="w-4.5 h-4.5" />
            Create New Brief
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Card 1: Briefs */}
          <div className="glass p-6 flex items-center justify-between hover:border-purple-500/30 transition-all duration-300">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400 mb-1">
                Total Briefs
              </p>
              <h3 className="text-3xl font-extrabold text-white">
                {loading ? '...' : stats?.totalBriefs ?? 0}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-400" />
            </div>
          </div>

          {/* Card 2: Clients */}
          <div className="glass p-6 flex items-center justify-between hover:border-purple-500/30 transition-all duration-300">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400 mb-1">
                Active Clients
              </p>
              <h3 className="text-3xl font-extrabold text-white">
                {loading ? '...' : stats?.totalClients ?? 0}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-cyan-400" />
            </div>
          </div>

          {/* Card 3: Generations today */}
          <div className="glass p-6 flex items-center justify-between hover:border-purple-500/30 transition-all duration-300">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400 mb-1">
                Generations Today
              </p>
              <h3 className="text-3xl font-extrabold text-white">
                {loading ? '...' : stats?.generationsToday ?? 0}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Recent Briefs Section */}
        <div className="glass overflow-hidden">
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Recent Briefs</h2>
            <Link
              to="/history"
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
            >
              View Full History
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-12 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            </div>
          ) : recentBriefs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-sm text-gray-400 mb-4">No campaign briefs created yet.</p>
              <Link
                to="/briefs/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium text-xs border border-white/10 transition-colors"
              >
                Create your first brief
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead>
                  <tr className="bg-white/2 uppercase text-xs font-semibold text-gray-400 border-b border-white/5">
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Tone</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created At</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentBriefs.map((brief) => (
                    <tr
                      key={brief.id}
                      onClick={() => navigate(`/briefs/${brief.id}`)}
                      className="hover:bg-white/2 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4 font-medium text-white max-w-[200px] truncate">
                        {brief.title}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {brief.client?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 border border-white/10">
                          {brief.tone}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusStyle(
                            brief.status
                          )}`}
                        >
                          {brief.status.charAt(0).toUpperCase() + brief.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        <span className="flex items-center gap-1.5 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          {new Date(brief.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
