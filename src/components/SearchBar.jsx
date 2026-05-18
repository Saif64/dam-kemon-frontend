import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Sparkles, Store } from 'lucide-react';
import { suggestProducts } from '../api/api';

function fmt(p) {
  if (p == null) return '';
  return '৳' + Number(p).toLocaleString('en-IN');
}

export default function SearchBar({ large = false, onSearch, placeholder }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Hide dropdown when clicking outside
  useEffect(() => {
    const onClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);

  // Debounced autosuggest
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      suggestProducts(query.trim(), 8)
        .then((res) => setSuggestions(Array.isArray(res.data) ? res.data : []))
        .catch(() => setSuggestions([]));
    }, 180);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [query]);

  const submitQuery = (q) => {
    const term = (q || query).trim();
    if (!term) return;
    setFocused(false);
    setActiveIndex(-1);
    if (onSearch) onSearch(term);
    else navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      const s = suggestions[activeIndex];
      if (s.id || s.slug) navigate(`/product/${s.id || s.slug}`);
      else submitQuery(s.name);
    } else {
      submitQuery();
    }
  };

  const handleKey = (e) => {
    if (!focused || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(suggestions.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(-1, i - 1));
    } else if (e.key === 'Escape') {
      setFocused(false); setActiveIndex(-1);
    }
  };

  const ph = placeholder || 'iPhone 16, Walton AC, Mi Band 8…';
  const showDropdown = focused && suggestions.length > 0;

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto relative">
      <form onSubmit={handleSubmit}>
        <div
          className={`relative flex items-center bg-white rounded-2xl border transition-all duration-300 ${
            large ? 'p-1.5 pl-4 sm:pl-5 sm:p-2' : 'p-1 pl-3 sm:p-1.5 sm:pl-4'
          } ${
            focused
              ? 'border-ink shadow-[0_20px_40px_-15px_rgba(21,19,26,0.18),0_0_0_4px_rgba(21,19,26,0.04)]'
              : 'border-line-strong shadow-[0_10px_30px_-10px_rgba(21,19,26,0.12)]'
          } ${showDropdown ? 'rounded-b-none' : ''}`}
        >
          <Search className={`${large ? 'w-5 h-5 sm:w-[22px] sm:h-[22px]' : 'w-4 h-4 sm:w-[18px] sm:h-[18px]'} text-gray shrink-0`} />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(-1); }}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKey}
            placeholder={ph}
            className={`flex-1 min-w-0 bg-transparent border-none outline-none text-ink placeholder-gray-soft mx-2 sm:mx-3 ${
              large ? 'text-[15px] sm:text-base lg:text-lg py-2.5 sm:py-3' : 'text-sm sm:text-base py-2'
            }`}
          />
          <button
            type="submit"
            className={`bg-ink text-cream font-semibold rounded-xl shrink-0 hover:bg-red active:scale-95 transition-all flex items-center gap-1.5 group ${
              large ? 'px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-[15px]' : 'px-3.5 sm:px-5 py-2 text-sm'
            }`}
          >
            <span className={large ? 'hidden sm:inline' : 'hidden xs:inline'}>Compare</span>
            <ArrowRight className={`${large ? 'w-4 h-4 sm:w-[18px] sm:h-[18px]' : 'w-4 h-4'} transition-transform group-hover:translate-x-0.5`} />
          </button>
        </div>

        {showDropdown && (
          <div className="absolute top-full left-0 right-0 bg-white border border-t-0 border-ink rounded-b-2xl shadow-[0_20px_40px_-15px_rgba(21,19,26,0.18)] z-50 max-h-[70vh] overflow-y-auto">
            {suggestions.map((s, i) => {
              const active = i === activeIndex;
              return (
                <button
                  type="button"
                  key={(s.id || s.slug || s.name) + i}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setFocused(false);
                    if (s.id || s.slug) navigate(`/product/${s.id || s.slug}`);
                    else submitQuery(s.name);
                  }}
                  className={`w-full text-left flex items-center gap-3 px-4 py-2.5 border-t border-line first:border-t-0 ${active ? 'bg-cream-soft' : 'hover:bg-cream-soft/60'} transition-colors`}
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-cream-soft flex items-center justify-center shrink-0">
                    {s.imageUrl ? (
                      <img src={s.imageUrl} alt="" className="w-full h-full object-cover" onError={(e)=>{e.target.style.display='none'}} />
                    ) : (
                      <Search className="w-4 h-4 text-ink/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-ink truncate">{s.name}</div>
                    <div className="text-[11px] text-gray flex items-center gap-2 mt-0.5">
                      {s.category && <span className="capitalize">{s.category}</span>}
                      {s.sellerCount > 0 && <span className="inline-flex items-center gap-0.5"><Store className="w-3 h-3" />{s.sellerCount}</span>}
                    </div>
                  </div>
                  {s.lowestPrice != null && (
                    <div className="font-mono text-[13px] font-bold text-ink shrink-0">{fmt(s.lowestPrice)}</div>
                  )}
                </button>
              );
            })}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => submitQuery()}
              className="w-full text-left flex items-center gap-2 px-4 py-2.5 border-t border-line text-[12px] font-semibold text-ink/70 hover:bg-cream-soft transition-colors"
            >
              <Search className="w-3.5 h-3.5" /> Search all results for "{query}"
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </button>
          </div>
        )}
      </form>

      {large && !showDropdown && (
        <p className="mt-3 text-xs sm:text-sm text-gray flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-yellow" />
          60+ BD shops indexed nightly · Type 2+ chars for suggestions
        </p>
      )}
    </div>
  );
}
