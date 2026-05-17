import { Star, BadgeCheck } from 'lucide-react';

const avatarColors = ['bg-lime', 'bg-yellow', 'bg-blue-soft', 'bg-red-soft', 'bg-green-soft'];

export default function ReviewCard({ review, index = 0 }) {
  const {
    reviewerName = 'Anonymous',
    rating = 0,
    date,
    content = '',
    siteName = 'Unknown',
    verified = false,
  } = review;

  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';
  const colorClass = avatarColors[index % avatarColors.length];

  return (
    <div className="card-soft p-4 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4 mb-3">
        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full ${colorClass} flex items-center justify-center text-ink font-serif font-bold text-base italic shrink-0`}>
          {reviewerName[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-ink font-semibold text-sm sm:text-[15px]">{reviewerName}</span>
            {verified && (
              <span className="inline-flex items-center gap-1 text-[11px] text-green font-medium">
                <BadgeCheck className="w-3.5 h-3.5" />
                Verified
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                    i < Math.round(rating) ? 'text-yellow fill-yellow' : 'text-line-strong'
                  }`}
                />
              ))}
            </div>
            {formattedDate && (
              <span className="text-gray text-[11px] sm:text-xs">{formattedDate}</span>
            )}
          </div>
        </div>
        <span className="chip chip-ghost text-[9px] sm:text-[10px] !py-1 !px-2 shrink-0">
          {siteName}
        </span>
      </div>

      <p className="text-ink/75 text-sm sm:text-[14.5px] leading-relaxed">{content}</p>
    </div>
  );
}
