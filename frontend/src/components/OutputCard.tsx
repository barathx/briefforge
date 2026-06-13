import { useState } from 'react';
import { Copy, Check, RefreshCw, Zap, FileText, Anchor, MousePointer, Lightbulb } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import type { Generation } from '../services/api';

type ContentType = Generation['type'];

interface BadgeConfig {
  label: string;
  color: string;
  bg:    string;
  icon:  React.ComponentType<{ className?: string }>;
}

const TYPE_CONFIG: Record<ContentType, BadgeConfig> = {
  caption:  { label: 'Caption',         color: '#a855f7', bg: 'rgba(168,85,247,0.15)',  icon: FileText    },
  ad_copy:  { label: 'Ad Copy',         color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',   icon: Zap         },
  hook:     { label: 'Hook Line',        color: '#f43f5e', bg: 'rgba(244,63,94,0.15)',   icon: Anchor      },
  cta:      { label: 'Call to Action',   color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: MousePointer },
  concept:  { label: 'Creative Concept', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: Lightbulb   },
};

interface Props {
  type:           ContentType;
  platform?:      string;
  content:        any[];
  onRegenerate:   () => void;
  isRegenerating: boolean;
}

export default function OutputCard({ type, platform, content, onRegenerate, isRegenerating }: Props) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll,   setCopiedAll]   = useState(false);

  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;

  const getCopyText = (item: any): string => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      if ('headline' in item || 'body' in item) {
        return `Headline: ${item.headline || ''}\nBody: ${item.body || ''}`;
      }
      if ('name' in item || 'description' in item) {
        return `Concept: ${item.name || ''}\nTagline: ${item.tagline || ''}\nDescription: ${item.description || ''}\nVisual Idea: ${item.visual_idea || ''}`;
      }
    }
    return JSON.stringify(item);
  };

  const handleCopyOne = async (item: any, idx: number) => {
    try {
      const text = getCopyText(item);
      await navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      toast.success('Copied variant to clipboard!');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleCopyAll = async () => {
    try {
      const text = content.map((c, i) => `${i + 1}.\n${getCopyText(c)}`).join('\n\n');
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      toast.success('All variants copied!');
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const renderItemContent = (item: any) => {
    if (typeof item === 'string') {
      return <span className="whitespace-pre-wrap">{item}</span>;
    }

    if (item && typeof item === 'object') {
      // Ad Copy Variant
      if ('headline' in item || 'body' in item) {
        return (
          <div className="space-y-1.5 flex-1">
            {item.headline && (
              <h4 className="text-white font-semibold text-sm">
                <span className="text-gray-400 font-normal mr-1">Headline:</span>
                {item.headline}
              </h4>
            )}
            {item.body && (
              <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                {item.body}
              </p>
            )}
          </div>
        );
      }

      // Campaign Concept
      if ('name' in item || 'tagline' in item || 'description' in item) {
        return (
          <div className="space-y-2 flex-1">
            {item.name && (
              <h4 className="text-white font-bold text-sm bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                {item.name}
              </h4>
            )}
            {item.tagline && (
              <p className="text-cyan-400 text-xs italic">
                &ldquo;{item.tagline}&rdquo;
              </p>
            )}
            {item.description && (
              <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                {item.description}
              </p>
            )}
            {item.visual_idea && (
              <div className="bg-white/5 border border-white/5 rounded-xl p-3 mt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block mb-1">
                  Visual Concept
                </span>
                <p className="text-gray-400 text-xs leading-relaxed">
                  {item.visual_idea}
                </p>
              </div>
            )}
          </div>
        );
      }
    }

    return <span>{JSON.stringify(item)}</span>;
  };

  return (
    <div
      className="glass rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 group"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-3">
          {/* Type badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            <Icon className="w-3.5 h-3.5" />
            {cfg.label}
          </div>

          {/* Platform badge */}
          {platform && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#9ca3af' }}
            >
              {platform}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Copy all */}
          <button
            onClick={handleCopyAll}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
              copiedAll
                ? 'bg-green-500/20 text-green-400'
                : 'text-gray-400 hover:text-white hover:bg-white/08'
            )}
          >
            {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedAll ? 'Copied!' : 'Copy all'}
          </button>

          {/* Regenerate */}
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
              isRegenerating
                ? 'opacity-50 cursor-not-allowed text-gray-500'
                : 'text-violet-400 hover:text-violet-300 hover:bg-violet-500/10'
            )}
          >
            <RefreshCw
              className={clsx('w-3.5 h-3.5', isRegenerating && 'animate-spin')}
            />
            {isRegenerating ? 'Generating…' : 'Regenerate'}
          </button>
        </div>
      </div>

      {/* ── Content variants ── */}
      <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        {content.length === 0 && (
          <div className="px-5 py-8 text-center text-gray-500 text-sm">
            No variants generated yet.
          </div>
        )}
        {content.map((item, idx) => (
          <div
            key={idx}
            className="group/item flex gap-4 px-5 py-4 hover:bg-white/03 transition-colors duration-150"
          >
            {/* Number */}
            <span
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              {idx + 1}
            </span>

            {/* Structured Item Content */}
            {renderItemContent(item)}

            {/* Per-item copy */}
            <button
              onClick={() => handleCopyOne(item, idx)}
              className={clsx(
                'flex-shrink-0 p-1.5 rounded-lg transition-all duration-150 opacity-0 group-hover/item:opacity-100 h-fit self-start',
                copiedIndex === idx
                  ? 'text-green-400 bg-green-500/15'
                  : 'text-gray-500 hover:text-white hover:bg-white/08'
              )}
            >
              {copiedIndex === idx ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
