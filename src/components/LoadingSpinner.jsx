export default function LoadingSpinner({ text = 'Scanning 50+ shops…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-line" />
        <div className="absolute inset-0 rounded-full border-2 border-red border-t-transparent animate-spin" />
        <div className="absolute inset-2 rounded-full border border-yellow border-b-transparent animate-spin" style={{ animationDuration: '1.4s', animationDirection: 'reverse' }} />
        <span className="font-serif italic text-lg font-bold text-ink">৳</span>
      </div>
      <p className="mt-5 sm:mt-6 text-gray text-sm font-medium animate-pulse">{text}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card-soft overflow-hidden">
      <div className="aspect-[4/3] skeleton !rounded-none" />
      <div className="p-3 sm:p-4 space-y-2.5">
        <div className="skeleton h-4 w-4/5" />
        <div className="skeleton h-4 w-3/5" />
        <div className="skeleton h-5 w-1/2 mt-2" />
        <div className="skeleton h-3 w-2/3" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="card-soft p-3 sm:p-4 flex items-center gap-3">
      <div className="skeleton w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3.5 w-1/3" />
        <div className="skeleton h-3 w-1/4" />
      </div>
      <div className="skeleton h-6 w-20" />
    </div>
  );
}
