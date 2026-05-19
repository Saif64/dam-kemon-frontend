import { useState } from 'react';
import { Link } from 'react-router-dom';
import { submitShop } from '../api/api';
import { Store, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';

const PLATFORMS = [
  { value: '', label: 'Auto-detect' },
  { value: 'wordpress', label: 'WordPress / WooCommerce' },
  { value: 'shopify', label: 'Shopify' },
  { value: 'magento', label: 'Magento' },
  { value: 'opencart', label: 'OpenCart' },
  { value: 'custom', label: 'Custom / something else' },
];

const CATEGORIES = [
  'electronics', 'fashion', 'grocery', 'books', 'home',
  'beauty', 'kids', 'sports', 'auto', 'health',
];

export default function SubmitShop() {
  const [form, setForm] = useState({
    name: '',
    baseUrl: '',
    sitemapUrl: '',
    platform: '',
    notes: '',
    contactEmail: '',
    categories: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleCategory = (c) => {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(c)
        ? f.categories.filter((x) => x !== c)
        : [...f.categories, c],
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await submitShop(form);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="container-tight py-16 sm:py-24 text-center">
        <div className="max-w-md mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green/15 text-green mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-3">Thanks!</h1>
          <p className="text-gray text-[15px] leading-relaxed mb-8">
            Your shop is in the review queue. We'll test-crawl it, sanity-check the
            catalog, and email you when it goes live.
          </p>
          <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink text-cream font-semibold text-sm hover:bg-red transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-tight py-10 sm:py-14 lg:py-16 max-w-2xl">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray hover:text-ink mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 bg-lime/30 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider mb-4">
          <Store className="w-3.5 h-3.5" /> Submit your shop
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight mb-3">
          Get your shop on Dam Kemon
        </h1>
        <p className="text-gray text-[15px] leading-relaxed">
          Bangladesh-based online shop? Paste your URL below. We'll crawl your
          catalog nightly and surface your prices in side-by-side comparisons.
          No fee, no integration work — if you publish a sitemap, you're good.
        </p>
      </div>

      <form onSubmit={onSubmit} className="card-soft p-6 sm:p-8 space-y-5">
        <Field label="Shop name" required>
          <input
            type="text"
            value={form.name}
            onChange={update('name')}
            placeholder="e.g. Apple Gadgets BD"
            maxLength={80}
            required
            className="input-base"
          />
        </Field>

        <Field label="Website URL" required>
          <input
            type="url"
            value={form.baseUrl}
            onChange={update('baseUrl')}
            placeholder="https://www.yourshop.com"
            required
            className="input-base"
          />
        </Field>

        <Field label="Sitemap URL" hint="Optional but speeds up indexing massively.">
          <input
            type="url"
            value={form.sitemapUrl}
            onChange={update('sitemapUrl')}
            placeholder="https://www.yourshop.com/sitemap.xml"
            className="input-base"
          />
        </Field>

        <Field label="Platform">
          <select value={form.platform} onChange={update('platform')} className="input-base">
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Categories you carry" hint="Helps us route relevant search queries to you.">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const on = form.categories.includes(c);
              return (
                <button
                  type="button"
                  key={c}
                  onClick={() => toggleCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    on
                      ? 'bg-ink text-cream border-ink'
                      : 'bg-white text-ink border-line hover:border-ink'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Contact email" required hint="So we can confirm your shop is live.">
          <input
            type="email"
            value={form.contactEmail}
            onChange={update('contactEmail')}
            placeholder="you@yourshop.com"
            required
            className="input-base"
          />
        </Field>

        <Field label="Anything else?" hint="Optional. Tell us about your shop.">
          <textarea
            value={form.notes}
            onChange={update('notes')}
            rows={3}
            maxLength={500}
            className="input-base resize-none"
          />
        </Field>

        {error && (
          <div className="flex items-start gap-2 bg-red/10 border border-red/20 text-red px-3 py-2 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-ink text-cream font-semibold text-sm hover:bg-red disabled:opacity-50 disabled:cursor-wait transition-colors"
        >
          {submitting ? 'Submitting…' : 'Submit for review'}
        </button>
      </form>

      <style>{`
        .input-base {
          width: 100%;
          background: white;
          border: 1px solid var(--color-line, #e5e3df);
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 14px;
          color: inherit;
          transition: border-color 0.15s;
        }
        .input-base:focus {
          outline: none;
          border-color: #0F4D2A;
        }
      `}</style>
    </div>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-mono uppercase tracking-wider text-gray mb-1.5">
        {label}{required && <span className="text-red"> *</span>}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-gray mt-1">{hint}</span>}
    </label>
  );
}
