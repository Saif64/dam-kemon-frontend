/**
 * Skeleton shaped to match SearchProductCard. Used during initial search
 * load to avoid jank.
 */
export default function SearchProductCardSkeleton() {
  return (
    <div className="card-soft overflow-hidden animate-pulse">
      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-48 lg:w-56 aspect-[4/3] sm:aspect-square bg-cream-soft" />
        <div className="flex-1 p-4 sm:p-5 space-y-3">
          <div className="h-3 w-16 bg-cream-soft rounded" />
          <div className="h-5 w-5/6 bg-cream-soft rounded" />
          <div className="h-3 w-3/4 bg-cream-soft rounded" />
          <div className="h-3 w-2/4 bg-cream-soft rounded" />
          <div className="flex items-baseline gap-3 mt-3">
            <div className="h-7 w-24 bg-cream-soft rounded" />
            <div className="h-3 w-20 bg-cream-soft rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
