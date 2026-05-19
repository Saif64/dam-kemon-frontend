import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { Store, Upload, CheckCircle2, ArrowLeft, AlertCircle, FileSpreadsheet } from 'lucide-react';

const SAMPLE_CSV = `name,price,imageUrl,productUrl,category,description,inStock
"Bluetooth Earbuds Pro",1500,https://example.com/img.jpg,https://fb.com/your-shop/post-123,electronics,"Noise cancelling, 4h battery",true
"Cotton Saree — Red",2200,https://example.com/saree.jpg,https://fb.com/your-shop/post-124,fashion,Handloom cotton from Tangail,true
`;

const CATEGORIES = ['electronics', 'fashion', 'grocery', 'books', 'home', 'beauty', 'kids', 'sports'];

export default function FcommerceSignup() {
  const [step, setStep] = useState('register'); // register | upload | done
  const [seller, setSeller] = useState(null);
  const [form, setForm] = useState({
    name: '', url: '', city: '', area: '', codAvailable: true, sameDayDelivery: false,
    avgReplyTime: '', categories: [],
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleCategory = (c) => setForm((f) => ({
    ...f,
    categories: f.categories.includes(c) ? f.categories.filter((x) => x !== c) : [...f.categories, c],
  }));

  const onRegister = async (e) => {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      const r = await api.post('/fcommerce/sellers/submit', { ...form, type: 'facebook' });
      setSeller(r.data);
      setStep('upload');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not register');
    } finally {
      setBusy(false);
    }
  };

  const onUpload = async (e) => {
    e.preventDefault();
    const file = e.target.elements.csv.files[0];
    if (!file) { setError('Choose a CSV file first'); return; }
    setError(null); setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await api.post(`/fcommerce/sellers/${seller.slug}/products/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadResult(r.data);
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-tight py-10 sm:py-14 lg:py-16 max-w-2xl">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray hover:text-ink mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-blue-soft/40 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider mb-3">
          <Store className="w-3.5 h-3.5" /> F-commerce onboarding
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight mb-3">
          List your Facebook shop
        </h1>
        <p className="text-gray text-[15px] leading-relaxed">
          Running a Facebook page shop? We don't scrape Facebook (their ToS forbids it), so
          we work with you instead — register your page, upload your inventory CSV, and
          we'll surface your listings inline next to the big shops.
        </p>
      </div>

      <Stepper step={step} />

      {step === 'register' && (
        <form onSubmit={onRegister} className="card-soft p-6 sm:p-8 space-y-4 mt-6">
          <Field label="Shop name" required>
            <input
              type="text" required value={form.name} maxLength={80}
              onChange={(e) => upd('name', e.target.value)}
              className="input-base" placeholder="e.g. Gadget Lounge BD"
            />
          </Field>

          <Field label="Facebook page URL" required>
            <input
              type="url" required value={form.url}
              onChange={(e) => upd('url', e.target.value)}
              className="input-base" placeholder="https://www.facebook.com/yourshop"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <input type="text" value={form.city} onChange={(e) => upd('city', e.target.value)} className="input-base" placeholder="Dhaka" />
            </Field>
            <Field label="Area">
              <input type="text" value={form.area} onChange={(e) => upd('area', e.target.value)} className="input-base" placeholder="Dhanmondi" />
            </Field>
          </div>

          <Field label="Categories">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c} type="button" onClick={() => toggleCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.categories.includes(c) ? 'bg-ink text-cream border-ink' : 'bg-white text-ink border-line hover:border-ink'
                  }`}
                >{c}</button>
              ))}
            </div>
          </Field>

          <div className="flex gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.codAvailable} onChange={(e) => upd('codAvailable', e.target.checked)} />
              Cash on delivery
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.sameDayDelivery} onChange={(e) => upd('sameDayDelivery', e.target.checked)} />
              Same-day delivery
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red/10 border border-red/20 text-red px-3 py-2 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Saving…' : 'Continue to inventory upload'}
          </button>
        </form>
      )}

      {step === 'upload' && (
        <form onSubmit={onUpload} className="card-soft p-6 sm:p-8 space-y-4 mt-6">
          <p className="text-sm text-gray">
            Upload a CSV of your inventory. Required columns: <code className="font-mono text-xs bg-cream-soft px-1.5 py-0.5 rounded">name</code>, <code className="font-mono text-xs bg-cream-soft px-1.5 py-0.5 rounded">price</code>.
            Optional: <code className="font-mono text-xs bg-cream-soft px-1.5 py-0.5 rounded">imageUrl</code>, <code className="font-mono text-xs bg-cream-soft px-1.5 py-0.5 rounded">productUrl</code>, <code className="font-mono text-xs bg-cream-soft px-1.5 py-0.5 rounded">category</code>, <code className="font-mono text-xs bg-cream-soft px-1.5 py-0.5 rounded">description</code>, <code className="font-mono text-xs bg-cream-soft px-1.5 py-0.5 rounded">inStock</code>.
          </p>

          <details className="card-soft border-2 border-dashed border-line p-3 text-xs">
            <summary className="cursor-pointer font-semibold inline-flex items-center gap-1"><FileSpreadsheet className="w-3.5 h-3.5" /> CSV example</summary>
            <pre className="mt-2 bg-cream-soft p-3 rounded font-mono overflow-x-auto">{SAMPLE_CSV}</pre>
          </details>

          <input
            type="file" name="csv" accept=".csv,text/csv"
            className="block text-sm w-full file:mr-3 file:px-4 file:py-2 file:rounded-full file:border-0 file:bg-ink file:text-cream file:font-semibold file:cursor-pointer"
          />

          {error && (
            <div className="flex items-start gap-2 bg-red/10 border border-red/20 text-red px-3 py-2 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full inline-flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" /> {busy ? 'Uploading…' : 'Upload CSV'}
          </button>
        </form>
      )}

      {step === 'done' && uploadResult && (
        <div className="card-soft p-6 sm:p-8 text-center mt-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green/15 text-green mb-4">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-2xl font-semibold mb-3">All set</h2>
          <p className="text-gray mb-4">
            Created <strong>{uploadResult.created}</strong> new listings,
            merged <strong>{uploadResult.merged}</strong> existing,
            skipped <strong>{uploadResult.skipped}</strong>.
          </p>
          {uploadResult.errors?.length > 0 && (
            <div className="text-left text-xs bg-yellow/20 border border-yellow/40 rounded-lg p-3 mb-4">
              <p className="font-semibold mb-1">Some rows skipped:</p>
              <ul className="space-y-0.5">{uploadResult.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}</ul>
            </div>
          )}
          <Link to="/sellers" className="btn-primary inline-flex items-center gap-2">
            View on Sellers page <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      )}

      <style>{`
        .input-base { width:100%; background:white; border:1px solid #e5e3df; border-radius:12px; padding:10px 14px; font-size:14px; }
        .input-base:focus { outline:none; border-color:#0F4D2A; }
        .btn-primary { padding:12px 20px; border-radius:9999px; background:#1d1d1b; color:#fbf7ed; font-weight:600; font-size:14px; }
        .btn-primary:hover:not(:disabled) { background:#FF4521; }
        .btn-primary:disabled { opacity:.5; cursor:not-allowed; }
      `}</style>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-mono uppercase tracking-wider text-gray mb-1.5">
        {label}{required && <span className="text-red"> *</span>}
      </span>
      {children}
    </label>
  );
}

function Stepper({ step }) {
  const steps = ['register', 'upload', 'done'];
  const idx = steps.indexOf(step);
  return (
    <div className="flex items-center gap-2 mb-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-[11px] font-mono font-bold ${
            i <= idx ? 'bg-ink text-cream' : 'bg-cream-soft text-gray border border-line'
          }`}>{i + 1}</div>
          {i < steps.length - 1 && <div className={`w-8 h-px ${i < idx ? 'bg-ink' : 'bg-line'}`} />}
        </div>
      ))}
    </div>
  );
}
