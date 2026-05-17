import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Sparkles } from 'lucide-react';

export default function SearchBar({ large = false, onSearch, placeholder }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      if (onSearch) onSearch(query.trim());
      else navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const ph = placeholder || 'iPhone 16, Walton AC, Mi Band 8…';

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
      <div
        className={`relative flex items-center bg-white rounded-2xl border transition-all duration-300 ${
          large
            ? 'p-1.5 pl-4 sm:pl-5 sm:p-2'
            : 'p-1 pl-3 sm:p-1.5 sm:pl-4'
        } ${
          focused
            ? 'border-ink shadow-[0_20px_40px_-15px_rgba(21,19,26,0.18),0_0_0_4px_rgba(21,19,26,0.04)]'
            : 'border-line-strong shadow-[0_10px_30px_-10px_rgba(21,19,26,0.12)]'
        }`}
      >
        <Search className={`${large ? 'w-5 h-5 sm:w-[22px] sm:h-[22px]' : 'w-4 h-4 sm:w-[18px] sm:h-[18px]'} text-gray shrink-0`} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={ph}
          className={`flex-1 min-w-0 bg-transparent border-none outline-none text-ink placeholder-gray-soft mx-2 sm:mx-3 ${
            large ? 'text-[15px] sm:text-base lg:text-lg py-2.5 sm:py-3' : 'text-sm sm:text-base py-2'
          }`}
        />
        <button
          type="submit"
          className={`bg-ink text-cream font-semibold rounded-xl shrink-0 hover:bg-red active:scale-95 transition-all flex items-center gap-1.5 group ${
            large
              ? 'px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-[15px]'
              : 'px-3.5 sm:px-5 py-2 text-sm'
          }`}
        >
          <span className={large ? 'hidden sm:inline' : 'hidden xs:inline'}>Compare</span>
          <ArrowRight className={`${large ? 'w-4 h-4 sm:w-[18px] sm:h-[18px]' : 'w-4 h-4'} transition-transform group-hover:translate-x-0.5`} />
        </button>
      </div>
      {large && (
        <p className="mt-3 text-xs sm:text-sm text-gray flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-yellow" />
          AI-powered · Live across 50+ shops · Bengali queries supported
        </p>
      )}
    </form>
  );
}
