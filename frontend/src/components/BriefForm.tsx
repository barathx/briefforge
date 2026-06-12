import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Loader2, Plus, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import ToneSelector, { type Tone } from './ToneSelector';
import {
  getClients,
  createClient,
  createBrief,
  generateContent,
  type Client,
} from '../services/api';

// ─── Platform config ─────────────────────────────────────────────
const ALL_PLATFORMS = [
  {
    id: 'Instagram', label: 'Instagram', color: '#e1306c',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
  },
  {
    id: 'LinkedIn', label: 'LinkedIn', color: '#0077b5',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
  {
    id: 'Twitter', label: 'Twitter / X', color: '#1da1f2',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    id: 'Facebook', label: 'Facebook', color: '#1877f2',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    id: 'TikTok', label: 'TikTok', color: '#ff0050',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.79 1.54V6.79a4.85 4.85 0 01-1.02-.1z"/>
      </svg>
    ),
  },
];

// ─── Types ────────────────────────────────────────────────────────
interface FormData {
  clientId:         string;
  newClientName:    string;
  title:            string;
  product:          string;
  audience:         string;
  goal:             string;
  deadline:         string;
  key_message:      string;
  brand_guidelines: string;
  raw_brief:        string;
  tone:             Tone | '';
  platforms:        string[];
}

interface FieldErrors {
  [key: string]: string;
}

const STEPS = ['Client & Campaign', 'Brief Content', 'Platforms'];

interface Props {
  onSuccess: (briefId: string) => void;
}

export default function BriefForm({ onSuccess }: Props) {
  const [step,    setStep]    = useState(0);
  const [clients, setClients] = useState<Client[]>([]);
  const [errors,  setErrors]  = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addingClient, setAddingClient] = useState(false);

  const [form, setForm] = useState<FormData>({
    clientId:         '',
    newClientName:    '',
    title:            '',
    product:          '',
    audience:         '',
    goal:             '',
    deadline:         '',
    key_message:      '',
    brand_guidelines: '',
    raw_brief:        '',
    tone:             '',
    platforms:        [],
  });

  // Load clients on mount
  useEffect(() => {
    getClients()
      .then(setClients)
      .catch(() => {/* ignore if backend not up */});
  }, []);

  const set = (field: keyof FormData, value: string | string[]) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const togglePlatform = (id: string) => {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(id)
        ? f.platforms.filter((p) => p !== id)
        : [...f.platforms, id],
    }));
    setErrors((e) => { const n = { ...e }; delete n.platforms; return n; });
  };

  // ── Validation per step ───────────────────────────────────────
  const validate = (s: number): boolean => {
    const errs: FieldErrors = {};
    if (s === 0) {
      if (!form.clientId && !form.newClientName.trim()) errs.clientId = 'Select or enter a client name';
      if (!form.title.trim())    errs.title    = 'Campaign title is required';
      if (!form.product.trim())  errs.product  = 'Product/service is required';
      if (!form.audience.trim()) errs.audience = 'Target audience is required';
      if (!form.goal.trim())     errs.goal     = 'Campaign goal is required';
    }
    if (s === 1) {
      if (!form.raw_brief.trim()) errs.raw_brief = 'Brief content is required';
      if (!form.tone)             errs.tone      = 'Please select a tone';
    }
    if (s === 2) {
      if (form.platforms.length === 0) errs.platforms = 'Select at least one platform';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validate(step)) setStep((s) => s + 1);
  };

  const handleBack = () => {
    setStep((s) => s - 1);
    setErrors({});
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate(2)) return;
    setIsSubmitting(true);

    try {
      // Create client if new
      let finalClientId = form.clientId;
      if (!finalClientId && form.newClientName.trim()) {
        const newClient = await createClient({ name: form.newClientName.trim() });
        finalClientId = newClient.id;
      }

      const brief = await createBrief({
        clientId:         finalClientId,
        title:            form.title,
        product:          form.product,
        audience:         form.audience,
        goal:             form.goal,
        deadline:         form.deadline || undefined,
        key_message:      form.key_message || undefined,
        brand_guidelines: form.brand_guidelines || undefined,
        raw_brief:        form.raw_brief,
        tone:             form.tone as string,
        platforms:        form.platforms,
      });

      toast.success('Brief created! Generating content…');
      generateContent(brief.id).catch(() => {/* fire and forget */});
      onSuccess(brief.id);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to create brief');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Error helper ──────────────────────────────────────────────
  const ErrMsg = ({ field }: { field: string }) =>
    errors[field] ? (
      <p className="mt-1 text-xs text-red-400">{errors[field]}</p>
    ) : null;

  const inputCls = (field: string) =>
    clsx('input-glass', errors[field] && 'error');

  // ── Render steps ──────────────────────────────────────────────
  return (
    <div className="animate-fade-in">
      {/* ── Step indicator ── */}
      <div className="flex items-center justify-center gap-0 mb-10">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={clsx(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold',
                  'border-2 transition-all duration-300',
                  i < step
                    ? 'border-violet-500 bg-violet-500 text-white'
                    : i === step
                    ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                    : 'border-white/15 bg-transparent text-gray-600'
                )}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={clsx(
                  'text-xs font-medium transition-colors duration-300 hidden sm:block',
                  i === step ? 'text-violet-300' : i < step ? 'text-gray-400' : 'text-gray-600'
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={clsx(
                  'w-16 sm:w-24 h-0.5 mx-3 mb-5 rounded transition-all duration-300',
                  i < step ? 'bg-violet-500' : 'bg-white/10'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 1: Client & Campaign ── */}
      {step === 0 && (
        <div className="space-y-5 animate-fade-in">
          <h2 className="text-xl font-semibold text-white mb-6">Client & Campaign Info</h2>

          {/* Client selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Client <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              {!addingClient ? (
                <>
                  <select
                    value={form.clientId}
                    onChange={(e) => set('clientId', e.target.value)}
                    className={clsx(inputCls('clientId'), 'flex-1 cursor-pointer')}
                    style={{ background: 'var(--bg-input)' }}
                  >
                    <option value="">Select existing client…</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => { setAddingClient(true); set('clientId', ''); }}
                    className="btn-ghost flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">New</span>
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Enter new client name…"
                    value={form.newClientName}
                    onChange={(e) => set('newClientName', e.target.value)}
                    className={clsx(inputCls('clientId'), 'flex-1')}
                  />
                  <button
                    type="button"
                    onClick={() => { setAddingClient(false); set('newClientName', ''); }}
                    className="btn-ghost flex-shrink-0 text-gray-400"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
            <ErrMsg field="clientId" />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Campaign Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Summer Launch 2025"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              className={inputCls('title')}
            />
            <ErrMsg field="title" />
          </div>

          {/* Product / service */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Product / Service <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Premium skincare serum"
              value={form.product}
              onChange={(e) => set('product', e.target.value)}
              className={inputCls('product')}
            />
            <ErrMsg field="product" />
          </div>

          {/* Target audience */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Target Audience <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Women 25-40 interested in wellness"
              value={form.audience}
              onChange={(e) => set('audience', e.target.value)}
              className={inputCls('audience')}
            />
            <ErrMsg field="audience" />
          </div>

          {/* Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Campaign Goal <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Drive product trials and brand awareness"
              value={form.goal}
              onChange={(e) => set('goal', e.target.value)}
              className={inputCls('goal')}
            />
            <ErrMsg field="goal" />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Deadline <span className="text-gray-500 text-xs font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => set('deadline', e.target.value)}
              className="input-glass"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>
      )}

      {/* ── Step 2: Brief Content ── */}
      {step === 1 && (
        <div className="space-y-5 animate-fade-in">
          <h2 className="text-xl font-semibold text-white mb-6">Brief Content</h2>

          {/* Key message */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Key Message <span className="text-gray-500 text-xs font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="The single idea you want the audience to remember"
              value={form.key_message}
              onChange={(e) => set('key_message', e.target.value)}
              className="input-glass"
            />
          </div>

          {/* Brand guidelines */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Brand Guidelines <span className="text-gray-500 text-xs font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Tone of voice, colours, what to avoid, brand values…"
              value={form.brand_guidelines}
              onChange={(e) => set('brand_guidelines', e.target.value)}
              className="input-glass resize-none"
            />
          </div>

          {/* Raw brief */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Full Brief <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={8}
              placeholder="Paste or write your full creative brief here. The more detail, the better the output…"
              value={form.raw_brief}
              onChange={(e) => set('raw_brief', e.target.value)}
              className={clsx(inputCls('raw_brief'), 'resize-y')}
            />
            <ErrMsg field="raw_brief" />
          </div>

          {/* Tone selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Tone of Voice <span className="text-red-400">*</span>
            </label>
            <ToneSelector
              value={form.tone}
              onChange={(t) => set('tone', t)}
            />
            <ErrMsg field="tone" />
          </div>
        </div>
      )}

      {/* ── Step 3: Platform Selection ── */}
      {step === 2 && (
        <div className="space-y-5 animate-fade-in">
          <h2 className="text-xl font-semibold text-white mb-2">Platform Selection</h2>
          <p className="text-gray-400 text-sm mb-6">
            Choose the platforms you want content generated for.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ALL_PLATFORMS.map((p) => {
              const selected = form.platforms.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  className={clsx(
                    'relative flex items-center gap-4 p-4 rounded-xl border text-left',
                    'transition-all duration-200 group',
                    selected
                      ? 'border-transparent'
                      : 'border-white/10 hover:border-white/20'
                  )}
                  style={
                    selected
                      ? {
                          background:  `${p.color}18`,
                          outline:     `1.5px solid ${p.color}`,
                          boxShadow:   `0 0 20px ${p.color}20`,
                        }
                      : { background: 'rgba(255,255,255,0.03)' }
                  }
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                    style={{
                      background: selected ? `${p.color}25` : 'rgba(255,255,255,0.06)',
                      color:      selected ? p.color : '#6b7280',
                    }}
                  >
                    {p.icon}
                  </div>
                  <span
                    className="font-medium text-sm"
                    style={{ color: selected ? '#ffffff' : '#d1d5db' }}
                  >
                    {p.label}
                  </span>

                  {/* Checkmark */}
                  {selected && (
                    <div
                      className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: p.color }}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <ErrMsg field="platforms" />

          {form.platforms.length > 0 && (
            <p className="text-xs text-gray-500">
              {form.platforms.length} platform{form.platforms.length > 1 ? 's' : ''} selected
            </p>
          )}
        </div>
      )}

      {/* ── Navigation buttons ── */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t"
           style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 0}
          className={clsx(
            'btn-ghost',
            step === 0 && 'opacity-0 pointer-events-none'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="btn-primary"
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary min-w-[160px] justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                Generate Content
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
