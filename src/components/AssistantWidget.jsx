import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Send, X, Loader2 } from 'lucide-react';
import { assistantChat } from '../api/api';
import TrustBadge from './TrustBadge';

const fmt = (p) => (p == null ? '' : '৳' + Number(p).toLocaleString('en-IN'));
const cheapest = (p) => (p.prices || []).slice().sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))[0];

/**
 * "দরদাম" — floating Bangla shopping assistant. Talks to /api/assistant/chat
 * (rules-based, $0 to run). Renders the assistant's reply plus product cards
 * with trust pills and tappable suggestion chips.
 */
export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const seeded = useRef(false);

  // Seed with the greeting (empty message → backend greeting) on first open.
  useEffect(() => {
    if (open && !seeded.current) { seeded.current = true; send('', true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const send = async (text, isSeed = false) => {
    const msg = (text ?? input).trim();
    if (!isSeed) {
      if (!msg || loading) return;
      setMessages((m) => [...m, { role: 'user', text: msg }]);
      setInput('');
    }
    setLoading(true);
    try {
      const res = await assistantChat(isSeed ? '' : msg);
      const d = res.data || {};
      setMessages((m) => [...m, {
        role: 'bot', text: d.reply || '', products: d.products || [], trust: d.trust || {}, suggestions: d.suggestions || [],
      }]);
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: "Sorry — I couldn't reach the catalog. Try again in a moment.", products: [], trust: {}, suggestions: [] }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed z-40 bottom-20 right-4 md:bottom-6 md:right-6 inline-flex items-center gap-2 rounded-full pl-3.5 pr-4 py-3 font-semibold text-sm shadow-[var(--shadow-lift)] transition-all active:scale-95 ${
          open ? 'bg-ink text-cream' : 'bg-ink text-cream hover:bg-red'
        }`}
        aria-label="Open দরদাম assistant"
      >
        {open ? <X className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-lime" />}
        <span className="font-serif italic">{open ? 'Close' : 'দরদাম'}</span>
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed z-40 bottom-36 right-4 md:bottom-24 md:right-6 left-4 sm:left-auto sm:w-[380px] max-h-[70vh] flex flex-col bg-cream rounded-3xl border border-line-strong shadow-[var(--shadow-lift)] overflow-hidden animate-slide-down">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-soft via-cream-soft to-lime-soft border-b border-line shrink-0">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-ink text-lime shrink-0">
              <Sparkles className="w-4 h-4" />
            </span>
            <div className="leading-tight">
              <div className="font-serif font-bold italic text-ink">দরদাম</div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-gray">Shopping assistant · price + trust</div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 no-scrollbar">
            {messages.map((m, i) => (
              <Message key={i} m={m} onChip={(t) => send(t)} onNavigate={() => setOpen(false)} />
            ))}
            {loading && (
              <div className="inline-flex items-center gap-1.5 text-gray text-xs px-3 py-2 rounded-2xl bg-white border border-line">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> thinking…
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="p-2.5 border-t border-line bg-surface shrink-0">
            <div className="flex items-center gap-2 bg-white border border-line rounded-full pl-4 pr-1.5 py-1.5 focus-within:border-ink/40">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask… e.g. best phone under ৳30,000"
                className="flex-1 bg-transparent outline-none text-sm text-ink placeholder-gray-soft min-w-0"
              />
              <button type="submit" disabled={loading || !input.trim()} className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-ink text-cream hover:bg-red disabled:opacity-40 transition-colors shrink-0" aria-label="Send">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function Message({ m, onChip, onNavigate }) {
  if (m.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-ink text-cream text-sm px-3.5 py-2 rounded-2xl rounded-br-sm">{m.text}</div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {m.text && (
        <div className="max-w-[88%] bg-white border border-line text-ink text-sm leading-relaxed px-3.5 py-2.5 rounded-2xl rounded-bl-sm">{m.text}</div>
      )}
      {m.products?.length > 0 && (
        <div className="space-y-1.5">
          {m.products.map((p) => {
            const cp = cheapest(p);
            const slug = cp ? (cp.siteSlug || cp.siteName) : null;
            const t = slug ? m.trust?.[slug] : null;
            return (
              <Link
                key={p.id}
                to={`/product/${p.id || p.slug}`}
                state={{ product: p }}
                onClick={onNavigate}
                className="flex gap-2.5 items-center bg-white border border-line rounded-2xl p-2 hover:border-line-strong transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-cream-soft overflow-hidden shrink-0 flex items-center justify-center">
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                    : <span className="font-serif italic text-ink/20 text-lg">{(p.category || 'P')[0]}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-ink leading-snug line-clamp-2">{p.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-sm font-bold text-ink">{fmt(p.lowestPrice ?? cp?.price)}</span>
                    {t && <TrustBadge trust={t} variant="compact" />}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      {m.suggestions?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {m.suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onChip(s)}
              className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-cream-soft border border-line text-ink/70 hover:border-ink hover:text-ink transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
