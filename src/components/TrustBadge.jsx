import {
  ShieldCheck, BadgeCheck, Store, Truck, RotateCcw, Banknote, HelpCircle,
} from 'lucide-react';

// ─── shared helpers (also used by PriceComparisonTable + ProductDetail) ───

const clamp01 = (n) => Math.max(0, Math.min(1, n));
const avgDays = (lo, hi) => {
  const a = lo == null ? hi : lo;
  const b = hi == null ? lo : hi;
  if (a == null && b == null) return null;
  return (Number(a) + Number(b)) / 2;
};

/** Map a 0..100 trust score to a tier label + palette classes. */
export function tierOf(score) {
  const s = score ?? 60;
  if (s >= 85) return { label: 'Excellent', text: 'text-green', bg: 'bg-green-soft' };
  if (s >= 72) return { label: 'Trusted',   text: 'text-green', bg: 'bg-green-soft' };
  if (s >= 60) return { label: 'Good',      text: 'text-ink',   bg: 'bg-lime-soft'  };
  if (s >= 45) return { label: 'Fair',      text: 'text-ink',   bg: 'bg-yellow-soft' };
  return        { label: 'Caution',   text: 'text-red',   bg: 'bg-red-soft'   };
}

/** Human delivery estimate, preferring buyer-reported data over the baseline. */
export function deliveryText(t) {
  if (!t) return null;
  if (t.avgReportedDelivery != null) {
    const d = Math.round(t.avgReportedDelivery);
    return d <= 0 ? 'Same day' : `~${d} day${d === 1 ? '' : 's'}`;
  }
  const lo = t.deliveryDaysMin, hi = t.deliveryDaysMax;
  if (lo == null && hi == null) return null;
  if ((lo ?? 0) <= 0 && (hi ?? 0) <= 0) return 'Same day';
  if (lo === hi) return `${lo} day${lo === 1 ? '' : 's'}`;
  if (lo === 0) return `Same–${hi} days`;
  return `${lo}–${hi} days`;
}

export function returnText(t) {
  if (!t || t.returnEase === 'none' || t.returnWindowDays === 0) return 'No returns';
  const ease = t.returnEase === 'easy' ? 'easy' : 'limited';
  return t.returnWindowDays ? `${t.returnWindowDays}d returns · ${ease}` : `Returns · ${ease}`;
}

export function authenticityMeta(a) {
  switch (a) {
    case 'authorized':     return { label: 'Authorized seller', Icon: ShieldCheck, tone: 'text-green', bg: 'bg-green-soft' };
    case 'official_store': return { label: 'Official store',     Icon: BadgeCheck,  tone: 'text-green', bg: 'bg-green-soft' };
    case 'reseller':       return { label: 'Verified reseller',  Icon: Store,       tone: 'text-ink',   bg: 'bg-cream-soft' };
    case 'marketplace':    return { label: 'Marketplace seller', Icon: Store,       tone: 'text-ink',   bg: 'bg-yellow-soft' };
    default:               return { label: 'Unverified seller',  Icon: HelpCircle,  tone: 'text-gray',  bg: 'bg-cream-soft' };
  }
}

/**
 * "Best value" beyond just price. Blends price (45%), seller trust (35%),
 * delivery speed (15%) and return ease (5%) into a single 0..100 score, so a
 * marginally pricier but far more trustworthy / faster seller can win — which
 * is exactly how people actually decide.
 */
export function valueScore({ price, lowestPrice, trust }) {
  const priceRatio = (lowestPrice && price) ? Math.min(1, lowestPrice / price) : 1;
  const trustN = (trust?.trustScore ?? 60) / 100;
  const dmid = trust
    ? (trust.avgReportedDelivery ?? avgDays(trust.deliveryDaysMin, trust.deliveryDaysMax) ?? 5)
    : 5;
  const deliveryN = clamp01(1 - dmid / 10);
  const returnsN = trust?.returnEase === 'easy' ? 1 : trust?.returnEase === 'limited' ? 0.6 : 0.2;
  return 100 * (0.45 * priceRatio + 0.35 * trustN + 0.15 * deliveryN + 0.05 * returnsN);
}

// ─── components ───

const sizeMap = {
  sm: 'text-[10px] px-1.5 py-0.5 gap-1',
  md: 'text-[11px] px-2 py-1 gap-1.5',
  lg: 'text-xs px-2.5 py-1 gap-1.5',
};

/** The trust-score pill — score number + tier label. */
export function TrustScore({ score, size = 'md', showLabel = true }) {
  const s = score ?? 60;
  const tier = tierOf(s);
  return (
    <span className={`inline-flex items-center rounded-full font-mono font-bold ${tier.bg} ${tier.text} ${sizeMap[size]}`}>
      <ShieldCheck className="w-3 h-3" />
      {s}
      {showLabel && <span className="uppercase tracking-wider">{tier.label}</span>}
    </span>
  );
}

function Chip({ Icon, tone = 'text-ink/70', bg = 'bg-cream-soft', children }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-medium ${bg} ${tone}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
}

/**
 * Per-seller trust signals. `variant="compact"` renders just a score pill +
 * delivery (for cards); `variant="full"` renders the full chip row (score,
 * authenticity, delivery, COD, returns) for the comparison table + verdict.
 */
export default function TrustBadge({ trust, variant = 'full', className = '' }) {
  if (!trust) return null;
  const dt = deliveryText(trust);

  if (variant === 'compact') {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <TrustScore score={trust.trustScore} size="sm" showLabel={false} />
        {dt && (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-gray">
            <Truck className="w-3 h-3" /> {dt}
          </span>
        )}
      </span>
    );
  }

  const auth = authenticityMeta(trust.authenticity);
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <TrustScore score={trust.trustScore} size="sm" />
      <Chip Icon={auth.Icon} tone={auth.tone} bg={auth.bg}>{auth.label}</Chip>
      {dt && <Chip Icon={Truck}>{dt}</Chip>}
      {trust.codAvailable && <Chip Icon={Banknote}>COD</Chip>}
      <Chip Icon={RotateCcw}>{returnText(trust)}</Chip>
    </div>
  );
}
