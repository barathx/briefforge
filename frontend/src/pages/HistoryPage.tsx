import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getBriefs, deleteBrief, type Brief } from '../services/api';
import {
  Search,
  Trash2,
  Eye,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function HistoryPage() {
  const navigate = useNavigate();

  // Filter states
  const [search, setSearch] = useState('');
  const [tone, setTone] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // List & pagination states
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Debounced/Triggered filters
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    tone: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
  });

  // Load data whenever applied filters change
  useEffect(() => {
    async function loadBriefs() {
      setLoading(true);
      try {
        const response = await getBriefs({
          search: appliedFilters.search || undefined,
          tone: appliedFilters.tone || undefined,
          dateFrom: appliedFilters.dateFrom || undefined,
          dateTo: appliedFilters.dateTo || undefined,
          page: appliedFilters.page,
          limit: 10,
        });
        setBriefs(response.briefs || []);
        setTotal(response.total || 0);
      } catch (err: any) {
        console.error(err);
        toast.error('Failed to load campaigns list');
      } finally {
        setLoading(false);
      }
    }
    loadBriefs();
  }, [appliedFilters]);

  // Apply button handler
  const handleApplyFilters = () => {
    setAppliedFilters({
      search,
      tone,
      dateFrom,
      dateTo,
      page: 1, // reset page on filter change
    });
    setPage(1);
  };

  // Reset filter inputs
  const handleResetFilters = () => {
    setSearch('');
    setTone('');
    setDateFrom('');
    setDateTo('');
    setAppliedFilters({
      search: '',
      tone: '',
      dateFrom: '',
      dateTo: '',
      page: 1,
    });
    setPage(1);
  };

  // Pagination page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setAppliedFilters((f) => ({ ...f, page: newPage }));
  };

  // Delete handler
  const handleDeleteBrief = async (e: React.MouseEvent, briefId: string) => {
    e.stopPropagation(); // prevent row click navigate
    if (!window.confirm('Are you sure you want to delete this brief and all generated assets?')) {
      return;
    }

    try {
      await deleteBrief(briefId);
      toast.success('Campaign brief deleted');
      // Update list locally
      setBriefs((prev) => prev.filter((b) => b.id !== briefId));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to delete campaign brief');
    }
  };

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

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-600/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">
              Campaign History
            </h1>
            <p className="text-sm text-gray-400">
              Browse, filter, view and manage all your past creative campaign generations.
            </p>
          </div>

          <Link
            to="/briefs/new"
            className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-semibold text-sm transition-all duration-300 shadow-[0_4px_20px_rgba(168,85,247,0.2)]"
          >
            <Plus className="w-4 h-4" />
            Create Brief
          </Link>
        </div>

        {/* Filters Panel */}
        <div className="glass p-6 mb-8 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-200 border-b border-white/5 pb-3">
            <Filter className="w-4 h-4 text-purple-400" />
            Filter Campaign Logs
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">
                Keyword Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Title or client name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Tone Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">
                Tone of voice
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-purple-500 cursor-pointer"
                style={{ background: '#12121a' }}
              >
                <option value="">All Tones</option>
                <option value="Professional">Professional</option>
                <option value="Playful">Playful</option>
                <option value="Bold">Bold</option>
                <option value="Inspirational">Inspirational</option>
                <option value="Witty">Witty</option>
                <option value="Minimal">Minimal</option>
                <option value="Luxury">Luxury</option>
              </select>
            </div>

            {/* Created From */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">
                Created From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-purple-500 cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>

            {/* Created To */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">
                Created To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-purple-500 cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Reset Filters
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-all shadow-[0_2px_10px_rgba(168,85,247,0.15)]"
            >
              Apply Filter
            </button>
          </div>
        </div>

        {/* Table Panel */}
        <div className="glass overflow-hidden">
          {loading ? (
            <div className="p-16 flex flex-col justify-center items-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
              <p className="text-sm text-gray-400">Filtering campaigns history logs...</p>
            </div>
          ) : briefs.length === 0 ? (
            <div className="p-16 text-center">
              <FolderOpen className="w-14 h-14 text-gray-600 mx-auto mb-4" />
              <h3 className="text-base font-bold text-white mb-1">No campaign briefs found</h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto mb-5">
                We couldn't find any campaign records matching your criteria. Try adjusting your filters or create a new campaign brief.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead>
                    <tr className="bg-white/2 uppercase text-xs font-semibold text-gray-400 border-b border-white/5">
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Client</th>
                      <th className="px-6 py-4">Tone</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Created Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {briefs.map((brief) => (
                      <tr
                        key={brief.id}
                        onClick={() => navigate(`/briefs/${brief.id}`)}
                        className="hover:bg-white/2 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4 font-semibold text-white max-w-[200px] truncate">
                          {brief.title}
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {brief.client?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 border border-white/10 text-gray-300">
                            {brief.tone}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getStatusStyle(
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
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/briefs/${brief.id}`);
                              }}
                              className="p-2 bg-white/5 hover:bg-purple-600/20 text-gray-400 hover:text-purple-300 rounded-lg border border-white/5 transition-all"
                              title="View Generated Copies"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteBrief(e, brief.id)}
                              className="p-2 bg-white/5 hover:bg-rose-600/20 text-gray-400 hover:text-rose-400 rounded-lg border border-white/5 transition-all"
                              title="Delete Campaign"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Showing {(page - 1) * 10 + 1} to{' '}
                    {Math.min(page * 10, total)} of {total} campaign briefs
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:hover:border-white/10 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pNum) => (
                      <button
                        key={pNum}
                        onClick={() => handlePageChange(pNum)}
                        className={`w-7.5 h-7.5 rounded-lg text-xs font-semibold border transition-all ${
                          page === pNum
                            ? 'bg-purple-600 border-purple-500 text-white shadow'
                            : 'border-white/10 hover:border-white/20 text-gray-400 hover:text-white'
                        }`}
                      >
                        {pNum}
                      </button>
                    ))}

                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:hover:border-white/10 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
