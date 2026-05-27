import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { saathiPublicProfile } from '../api/auth';
import {
  ShieldCheck, MapPin, MessageSquare, Phone, ExternalLink, Star, ArrowLeft, Store, TrendingDown,
} from 'lucide-react';

function fmt(p) {
  if (p == null) return '—';
  return '৳' + Number(p).toLocaleString('en-IN');
}

/**
 * Public storefront page for a Saathi seller — what their FB-page badge
 * links to. Renders the shop's contact channels (Messenger, WhatsApp,
 * physical address) and trust signals. Anyone can view this without
 * signing in.
 */
export default function SaathiProfile() {
  const { slug } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    saathiPublicProfile(slug)
      .then((r) => setProfile(r.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="container-tight py-16 text-center text-gray text-sm">Loading shop…</div>;
  }

  if (!profile) {
    return (
      <div className="container-tight py-20 text-center">
        <p className="font-serif text-2xl italic text-ink mb-1">Shop not found</p>
        <p className="text-gray text-sm">No Saathi shop exists at that link.</p>
        <Link to="/" className="btn-ghost mt-4 inline-flex"><ArrowLeft className="w-4 h-4" /> Home</Link>
      </div>
    );
  }

  return (
    <div className="container-tight py-8 sm:py-12 max-w-2xl">
      <div className="card-elev p-6 sm:p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-cream-soft to-yellow-soft mb-4">
          <span className="font-serif text-3xl italic text-ink">{profile.displayName?.[0] || '?'}</span>
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold italic text-ink mb-2">
          {profile.displayName}
        </h1>

        {profile.verified ? (
          <div className="inline-flex items-center gap-1.5 bg-green text-white px-3 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified by Damkemon
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 bg-cream-soft text-gray px-3 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-3">
            Unverified
          </div>
        )}

        {(profile.city || profile.area) && (
          <p className="text-sm text-gray inline-flex items-center gap-1 justify-center mb-2">
            <MapPin className="w-3.5 h-3.5" />
            {[profile.area, profile.city].filter(Boolean).join(', ')}
          </p>
        )}

        {profile.rating != null && profile.rating > 0 && (
          <div className="flex items-center justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(profile.rating) ? 'text-yellow fill-yellow' : 'text-line-strong'}`} />
            ))}
            <span className="text-xs text-ink font-mono ml-1">
              {profile.rating.toFixed(1)} · {profile.ratingCount || 0} reviews
            </span>
          </div>
        )}

        {profile.avgReplyTime && (
          <p className="text-xs text-gray mb-3">Avg reply time: <b className="text-ink">{profile.avgReplyTime}</b></p>
        )}

        {/* Categories */}
        {profile.categories?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center mb-5">
            {profile.categories.map((c) => (
              <span key={c} className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cream-soft text-ink/70 border border-line">{c}</span>
            ))}
          </div>
        )}

        {/* Contact channels */}
        <div className="space-y-2 mt-5">
          {profile.facebookUrl && (
            <a href={profile.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-blue text-white py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
              <ExternalLink className="w-4 h-4" /> Visit Facebook page
            </a>
          )}
          {profile.messengerUrl && (
            <a href={profile.messengerUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-ink text-cream py-2.5 rounded-xl font-semibold text-sm hover:bg-red transition-colors">
              <MessageSquare className="w-4 h-4" /> Message on Messenger
            </a>
          )}
          {profile.whatsapp && (
            <a href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-green text-white py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
              <Phone className="w-4 h-4" /> WhatsApp
            </a>
          )}
        </div>

        {profile.verifiedAt && (
          <p className="text-[11px] text-gray font-mono mt-5">
            Verified since {new Date(profile.verifiedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Products grid — what the seller actually offers. */}
      {profile.products?.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3">
            <Store className="w-4 h-4 text-ink/55" />
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink/55">
              {profile.products.length} {profile.products.length === 1 ? 'product' : 'products'} listed
            </h2>
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {profile.products.map((p) => {
              const diff = p.listedPrice != null && p.marketLowest != null ? p.listedPrice - p.marketLowest : null;
              return (
                <li key={p.id}>
                  <Link to={`/product/${p.id || p.slug}`} className="card-soft block overflow-hidden hover:shadow-[var(--shadow-card)] transition-shadow">
                    {p.imageUrl ? (
                      <div className="aspect-square bg-cream-soft overflow-hidden">
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                      </div>
                    ) : (
                      <div className="aspect-square bg-cream-soft flex items-center justify-center">
                        <span className="font-serif text-3xl italic text-ink/15">{(p.category || 'P')[0]}</span>
                      </div>
                    )}
                    <div className="p-2.5">
                      <h3 className="font-serif text-[13px] font-semibold text-ink line-clamp-2 mb-1.5 leading-snug">{p.name}</h3>
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="font-mono text-sm font-bold text-ink">{fmt(p.listedPrice)}</span>
                        {diff != null && diff < 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-green font-bold">
                            <TrendingDown className="w-3 h-3" /> {fmt(-diff)} below
                          </span>
                        )}
                      </div>
                      {p.inStock === false && (
                        <span className="text-[10px] font-mono text-red mt-1 block">Out of stock</span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="text-center mt-6">
        <Link to="/saathi" className="text-xs text-ink/55 hover:text-ink inline-flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> What is Damkemon Verified?
        </Link>
      </div>
    </div>
  );
}
