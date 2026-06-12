import clsx from 'clsx';
import {
  Briefcase,
  Laugh,
  Flame,
  Sparkles,
  Lightbulb,
  Minimize2,
  Crown,
} from 'lucide-react';

export type Tone =
  | 'Professional'
  | 'Playful'
  | 'Bold'
  | 'Inspirational'
  | 'Witty'
  | 'Minimal'
  | 'Luxury';

interface ToneConfig {
  label: Tone;
  icon:  React.ComponentType<{ className?: string }>;
  color: string;       // accent colour for selected state
  bg:    string;       // subtle bg tint
  desc:  string;
}

const TONES: ToneConfig[] = [
  {
    label: 'Professional',
    icon:  Briefcase,
    color: '#60a5fa',
    bg:    'rgba(96,165,250,0.12)',
    desc:  'Polished & credible',
  },
  {
    label: 'Playful',
    icon:  Laugh,
    color: '#fb923c',
    bg:    'rgba(251,146,60,0.12)',
    desc:  'Fun & energetic',
  },
  {
    label: 'Bold',
    icon:  Flame,
    color: '#f43f5e',
    bg:    'rgba(244,63,94,0.12)',
    desc:  'Daring & impactful',
  },
  {
    label: 'Inspirational',
    icon:  Sparkles,
    color: '#a855f7',
    bg:    'rgba(168,85,247,0.12)',
    desc:  'Motivating & uplifting',
  },
  {
    label: 'Witty',
    icon:  Lightbulb,
    color: '#facc15',
    bg:    'rgba(250,204,21,0.12)',
    desc:  'Clever & humorous',
  },
  {
    label: 'Minimal',
    icon:  Minimize2,
    color: '#94a3b8',
    bg:    'rgba(148,163,184,0.12)',
    desc:  'Clean & concise',
  },
  {
    label: 'Luxury',
    icon:  Crown,
    color: '#d4af37',
    bg:    'rgba(212,175,55,0.12)',
    desc:  'Exclusive & refined',
  },
];

interface Props {
  value:    string;
  onChange: (tone: Tone) => void;
}

export default function ToneSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {TONES.map((tone) => {
        const isSelected = value === tone.label;
        const Icon = tone.icon;

        return (
          <button
            key={tone.label}
            type="button"
            onClick={() => onChange(tone.label)}
            className={clsx(
              'relative flex flex-col items-start gap-2.5 p-4 rounded-xl border text-left',
              'transition-all duration-200 group overflow-hidden',
              isSelected
                ? 'border-transparent'
                : 'border-white/10 hover:border-white/20 hover:bg-white/05'
            )}
            style={
              isSelected
                ? {
                    background:  tone.bg,
                    borderColor: tone.color,
                    boxShadow:   `0 0 20px ${tone.color}30`,
                    outline:     `1.5px solid ${tone.color}`,
                  }
                : { background: 'rgba(255,255,255,0.03)' }
            }
          >
            {/* Icon circle */}
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
              style={{
                background: isSelected ? `${tone.color}25` : 'rgba(255,255,255,0.06)',
              }}
            >
              <Icon
                className="w-4.5 h-4.5 transition-colors duration-200"
                style={{ color: isSelected ? tone.color : '#6b7280' } as React.CSSProperties}
              />
            </div>

            {/* Label */}
            <div>
              <p
                className="text-sm font-semibold leading-tight transition-colors duration-200"
                style={{ color: isSelected ? tone.color : '#e5e7eb' }}
              >
                {tone.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 leading-tight">{tone.desc}</p>
            </div>

            {/* Selected checkmark */}
            {isSelected && (
              <div
                className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: tone.color }}
              >
                <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none">
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
