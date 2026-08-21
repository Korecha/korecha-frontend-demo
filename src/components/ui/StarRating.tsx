/**
 * KAN-91: Small reusable star-rating primitive. Supports a read-only display mode (used to
 * show an average or an already-submitted rating) and an interactive input mode (used in the
 * rating submission form).
 */
export function StarRating({
  value,
  onChange,
  size = 'md',
  readOnly = false,
}: {
  value: number
  onChange?: (score: number) => void
  size?: 'sm' | 'md' | 'lg'
  readOnly?: boolean
}) {
  const sizeClass = size === 'lg' ? 'h-9 w-9' : size === 'sm' ? 'h-4 w-4' : 'h-6 w-6'
  const stars = [1, 2, 3, 4, 5]

  return (
    <div
      className="flex items-center gap-1"
      role={readOnly ? undefined : 'radiogroup'}
      aria-label="Rating"
    >
      {stars.map((star) => {
        const filled = star <= Math.round(value)
        const StarButton = readOnly ? 'span' : 'button'
        return (
          <StarButton
            key={star}
            type={readOnly ? undefined : 'button'}
            aria-label={readOnly ? undefined : `${star} star${star !== 1 ? 's' : ''}`}
            aria-pressed={readOnly ? undefined : star <= value}
            onClick={readOnly ? undefined : () => onChange?.(star)}
            className={`${sizeClass} ${readOnly ? '' : 'cursor-pointer transition-transform active:scale-90'}`}
          >
            <svg
              viewBox="0 0 20 20"
              className={`${sizeClass} ${filled ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`}
            >
              <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1 1 5.79L10 14.9l-5.21 2.6 1-5.79-4.21-4.1 5.82-.85z" />
            </svg>
          </StarButton>
        )
      })}
    </div>
  )
}
