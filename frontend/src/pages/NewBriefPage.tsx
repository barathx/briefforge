import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BriefForm from '../components/BriefForm';
import { ChevronLeft } from 'lucide-react';

export default function NewBriefPage() {
  const navigate = useNavigate();

  const handleSuccess = (briefId: string) => {
    // Navigate directly to the newly created brief's details page
    navigate(`/briefs/${briefId}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-600/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Back navigation */}
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors mb-6 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            Create Campaign Brief
          </h1>
          <p className="text-sm text-gray-400">
            Define your campaign audience, goal, raw brief details, and let AI generate targeted multi-platform copies.
          </p>
        </div>

        {/* Form Container */}
        <div className="glass p-6 sm:p-10">
          <BriefForm onSuccess={handleSuccess} />
        </div>
      </main>
    </div>
  );
}
