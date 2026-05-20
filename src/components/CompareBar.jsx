import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Scale, X, ChevronRight } from 'lucide-react';
import { getQueue, subscribe, remove, clear } from '../api/compareQueue';

/**
 * Floating bottom bar that appears when the user has staged 1+ products for
 * comparison. Auto-hides on the Compare page itself.
 */
export default function CompareBar() {
  const [queue, setQueue] = useState(getQueue());
  const { pathname } = useLocation();

  useEffect(() => subscribe((q) => setQueue([...q])), []);

  if (queue.length === 0) return null;
  if (pathname.startsWith('/compare')) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-md pointer-events-none">
      <div className="pointer-events-auto bg-ink text-cream rounded-2xl shadow-[var(--shadow-lift)] flex items-center gap-2 p-2 pl-3">
        <Scale className="w-4 h-4 text-lime shrink-0" />
        <span className="text-xs font-mono uppercase tracking-wider shrink-0">{queue.length}/4</span>
        <div className="flex-1 flex gap-1 overflow-x-auto no-scrollbar">
          {queue.map((id) => (
            <button
              key={id}
              onClick={() => remove(id)}
              className="shrink-0 inline-flex items-center gap-1 bg-cream/10 hover:bg-red text-cream text-[11px] font-mono px-2 py-1 rounded-full"
              title="Remove"
            >
              {id.slice(0, 6)}… <X className="w-2.5 h-2.5 opacity-70" />
            </button>
          ))}
        </div>
        <button
          onClick={clear}
          className="shrink-0 text-[11px] text-cream/60 hover:text-cream px-2"
          title="Clear all"
        >
          clear
        </button>
        <Link
          to={`/compare?ids=${queue.join(',')}`}
          className="shrink-0 inline-flex items-center gap-1 bg-lime text-ink text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-yellow transition-colors"
        >
          Compare <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
