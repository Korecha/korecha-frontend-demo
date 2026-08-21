import { useState } from 'react'
import type { Rating } from '../../types'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Field, Textarea } from '../ui/Input'
import { StarRating } from '../ui/StarRating'

export interface RatingCounterpart {
  userId: string
  label: string
}

/**
 * KAN-91: Shared rating submission + display card, used on the importer job detail, corporate
 * job detail, fleet shipment detail, and driver job detail pages.
 *
 * Locked decisions (KAN-90/91): only offered once the shipment is COMPLETED; one rating per
 * direction per shipment (form is replaced by a read-only view once submitted); eligibility is
 * enforced entirely server-side — this component just hides the form once `ratings` shows the
 * current user already rated a given counterpart, and surfaces backend 400s inline.
 */
export function RatingCard({
  counterparts,
  ratings,
  currentUserId,
  onSubmit,
}: {
  counterparts: RatingCounterpart[]
  ratings: Rating[]
  currentUserId: string
  onSubmit: (rateeUserId: string, score: number, comment: string) => Promise<void>
}) {
  const [scores, setScores] = useState<Record<string, number>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [error, setError] = useState('')

  if (counterparts.length === 0) return null

  const myRatingFor = (userId: string) =>
    ratings.find((r) => r.raterUserId === currentUserId && r.rateeUserId === userId) || null
  const theirRatingOfMe = (userId: string) =>
    ratings.find((r) => r.raterUserId === userId && r.rateeUserId === currentUserId) || null

  const handleSubmit = async (userId: string) => {
    const score = scores[userId]
    if (!score) {
      setError('Choose a star rating before submitting')
      return
    }
    setSubmitting(userId)
    setError('')
    try {
      await onSubmit(userId, score, comments[userId]?.trim() || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating')
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <Card>
      <h3 className="font-bold text-slate-900">Rate your experience</h3>
      {error && (
        <div className="mt-3">
          <Alert>{error}</Alert>
        </div>
      )}
      <div className="mt-4 space-y-4">
        {counterparts.map((counterpart) => {
          const mine = myRatingFor(counterpart.userId)
          const theirs = theirRatingOfMe(counterpart.userId)
          return (
            <div key={counterpart.userId} className="rounded-2xl border border-korecha-border p-4">
              <p className="text-sm font-semibold text-slate-800">{counterpart.label}</p>

              {mine ? (
                <div className="mt-3">
                  <StarRating value={mine.score} readOnly size="sm" />
                  {mine.comment && <p className="mt-2 text-sm text-slate-600">{mine.comment}</p>}
                  <p className="mt-1 text-xs text-slate-400">Your rating — submitted</p>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <StarRating
                    value={scores[counterpart.userId] || 0}
                    onChange={(score) =>
                      setScores((prev) => ({ ...prev, [counterpart.userId]: score }))
                    }
                    size="lg"
                  />
                  <Field label="Comment (optional)">
                    <Textarea
                      rows={2}
                      value={comments[counterpart.userId] || ''}
                      onChange={(e) =>
                        setComments((prev) => ({ ...prev, [counterpart.userId]: e.target.value }))
                      }
                      placeholder="How was your experience?"
                    />
                  </Field>
                  <Button
                    disabled={submitting === counterpart.userId}
                    onClick={() => handleSubmit(counterpart.userId)}
                  >
                    {submitting === counterpart.userId ? 'Submitting...' : 'Submit rating'}
                  </Button>
                </div>
              )}

              {theirs && (
                <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2">
                  <p className="text-xs font-medium text-slate-500">Their rating of you</p>
                  <div className="mt-1">
                    <StarRating value={theirs.score} readOnly size="sm" />
                  </div>
                  {theirs.comment && (
                    <p className="mt-1 text-sm text-slate-600">{theirs.comment}</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
