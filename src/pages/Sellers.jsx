import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getSellers } from '../api/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  ArrowLeft, BadgeCheck, MessageCircle, MapPin, Clock, Store, Search,
  ExternalLink, Sparkles, AlertTriangle,
} from 'lucide-react';

const CITY_FILTERS = ['All', 'Dhaka', 'Chittagong'];
// Category IDs match the lowercase strings the sellers seed + Saathi
// signup write to the DB (e.g. "smartphone", not "SMARTPHONE"). Mismatch
// here was previously hiding every seller from filtered views.
const CATEGORY_FILTERS = [
  { id: '',            label: 'All'         },
  { id: 'smartphone',  label: 'Phones'      },
  { id: 'fashion',     label: 'Fashion'     },
  { id: 'beauty',      label: 'Beauty'      },
  { id: 'book',        label: 'Books'       },
  { id: 'appliance',   label: 'Appliances'  },
  { id: 'grocery',     label: 'Grocery'     },
  { id: 'furniture',   label: 'Furniture'   },
  { id: 'laptop',      label: 'Laptops'     },
];

const avatarColors = ['#1877F2', '#FF4521', '#0F4D2A', '#FFD23F', '#7B61FF', '#15131A'];

function formatFollowers(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

export default function Sellers() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('All');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setLoading(true); setError(null);
    getSellers()
      .then((res) => setSellers(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('network'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => sellers.filter((s) => {
    if (category && !(s.categories || []).includes(category)) return false;
    if (city !== 'All' && (s.city || '').toLowerCase() !== city.toLowerCase()) return false;
    if (verifiedOnly && !s.verified) return false;
    if (query) {
      const q = query.toLowerCase();
      const hay = (s.name + ' ' + (s.area || '') + ' ' + (s.brands || []).join(' ')).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [sellers, category, city, verifiedOnly, query]);

  return (
    <div className="container-tight py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5 sm:mb-7">
        <Link to="/" className="inline-flex items-center gap-1.5 text-gray hover:text-ink text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <div className="mb-6 sm:mb-8 relative">
        <div className="tag-bar text-blue mb-2 sm:mb-3"><MessageCircle className="w-4 h-4" /> The fcommerce angle</div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold italic text-ink tracking-tight leading-[1.05]">
          Facebook <em className="text-blue">sellers</em> across Bangladesh
        </h1>
        <p className="text-gray text-sm sm:text-base mt-2 max-w-2xl">
          Curated BD F-commerce shops with Facebook, Messenger, or WhatsApp
          presence. Verified entries have passed Damkemon's identity and
          refund-history checks.
        </p>
        {/* Always show the "list your shop" CTA so the directory grows
            organically. The Saathi link is the high-leverage path; the
            free Submit-shop form is the low-friction one. */}
        <div className="mt-4 inline-flex flex-wrap gap-2">
          <Link to="/saathi" className="btn-primary text-sm">
            <BadgeCheck className="w-4 h-4" /> List my shop on Saathi
          </Link>
          <Link to="/submit-shop" className="btn-ghost text-sm">
            <Store className="w-4 h-4" /> Or submit a free listing
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card-elev p-3 sm:p-4 mb-4 sm:mb-5">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a seller, brand, or area…"
              className="w-full pl-10 pr-3 py-2.5 bg-cream-soft border border-line rounded-xl text-sm text-ink placeholder-gray-soft focus:outline-none focus:border-ink/40"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {CITY_FILTERS.map((c) => (
              <button
                key={c}
                onClick={() => setCity(c)}
                className={`font-mono text-[11px] sm:text-xs px-3 py-2 rounded-full border transition-all ${
                  city === c ? 'bg-ink text-cream border-ink' : 'bg-white text-ink/70 border-line hover:border-line-strong'
                }`}
              >{c}</button>
            ))}
            <button
              onClick={() => setVerifiedOnly((v) => !v)}
              className={`font-mono text-[11px] sm:text-xs px-3 py-2 rounded-full border transition-all inline-flex items-center gap-1 ${
                verifiedOnly ? 'bg-blue text-white border-blue' : 'bg-white text-ink/70 border-line hover:border-line-strong'
              }`}
            >
              <BadgeCheck className="w-3.5 h-3.5" /> Verified
            </button>
          </div>
        </div>
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 mt-3 pt-3 border-t border-line">
          {CATEGORY_FILTERS.map((c) => (
            <button
              key={c.id || 'all'}
              onClick={() => setCategory(c.id)}
              className={`shrink-0 font-mono text-[11px] sm:text-xs px-3 sm:px-3.5 py-1.5 rounded-full border transition-all whitespace-nowrap ${
                category === c.id ? 'bg-ink text-cream border-ink' : 'bg-cream-soft text-ink/70 border-line hover:border-line-strong'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status row */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray">
          {loading ? 'Loading…' : (
            <>Showing <span className="font-mono font-bold text-ink">{filtered.length}</span> {filtered.length === 1 ? 'seller' : 'sellers'}</>
          )}
        </div>
        <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-gray font-mono">
          <Sparkles className="w-3 h-3 text-yellow" /> Self-listed shops marked Verified
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Loading sellers…" />
      ) : error ? (
        <div className="card-soft p-8 sm:p-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-red-soft mb-4">
            <AlertTriangle className="w-8 h-8 text-red" />
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold italic text-ink mb-2">Backend unreachable</h2>
          <p className="text-gray text-sm">Start the Spring Boot server on port 8080.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-soft p-8 sm:p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-cream-soft mb-4">
            <Store className="w-8 h-8 text-ink/30" />
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold italic text-ink mb-2">
            {sellers.length === 0 ? 'No sellers listed yet' : 'No sellers match'}
          </h2>
          <p className="text-gray text-sm max-w-md mx-auto mb-4">
            {sellers.length === 0 ? (
              <>
                Most Bangladesh F-commerce sellers live on Facebook with no structured catalog.
                If you run one, list yours below and we'll surface your inventory next to the big shops.
              </>
            ) : (
              <>Try clearing some filters.</>
            )}
          </p>
          {sellers.length === 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link to="/fcommerce/signup" className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-ink text-cream text-sm font-semibold hover:bg-red transition-colors">
                List your shop
              </Link>
              <Link to="/" className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-line text-ink text-sm font-semibold hover:border-ink transition-colors">
                Browse catalog
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((s, i) => {
            const avatarColor = avatarColors[i % avatarColors.length];
            const initials = (s.name || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div key={s.id} className="card-soft p-4 sm:p-5 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-serif font-bold italic text-base sm:text-lg shrink-0" style={{ backgroundColor: avatarColor, color: avatarColor === '#FFD23F' ? '#15131A' : 'white' }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-serif text-base sm:text-lg font-semibold text-ink truncate">{s.name}</h3>
                      {s.verified && <BadgeCheck className="w-4 h-4 text-blue shrink-0" />}
                    </div>
                    {(s.city || s.area) && (
                      <div className="text-[11px] text-gray flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {[s.area, s.city].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center bg-cream-soft/60 rounded-xl py-2.5">
                  <div>
                    <div className="text-[11px] text-gray font-mono uppercase">Followers</div>
                    <div className="text-sm font-bold text-ink">{formatFollowers(s.followers)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray font-mono uppercase">Rating</div>
                    <div className="text-sm font-bold text-yellow">{s.rating ? s.rating.toFixed(1) + '★' : '—'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray font-mono uppercase">Reviews</div>
                    <div className="text-sm font-bold text-ink">{s.reviewCount ?? '—'}</div>
                  </div>
                </div>

                {(s.categories || []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {s.categories.slice(0, 3).map((c) => (
                      <span key={c} className="chip chip-ghost !text-[10px] !py-0.5 !px-2 capitalize">{c.toLowerCase()}</span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-1 text-[11px] text-gray">
                  {s.codAvailable && <span className="inline-flex items-center gap-1"><Sparkles className="w-3 h-3 text-green" /> COD</span>}
                  {s.sameDayDelivery && <span className="inline-flex items-center gap-1"><Sparkles className="w-3 h-3 text-yellow" /> Same-day</span>}
                  {s.avgReplyTime && <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {s.avgReplyTime}</span>}
                </div>

                <div className="flex gap-2 mt-auto pt-2">
                  {s.messengerUrl && (
                    <a
                      href={s.messengerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue text-white text-sm font-semibold py-2 rounded-xl hover:bg-blue/90 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" /> Message
                    </a>
                  )}
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 bg-cream-soft text-ink text-sm font-semibold py-2 px-3 rounded-xl hover:bg-ink hover:text-cream transition-colors"
                    >
                      Visit <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
