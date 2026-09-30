import type { PhrasePack, RecallRating, ReviewEvent, SessionPhraseResult, SessionResultReport, StudySession } from '../types'

const RATINGS: RecallRating[] = ['again', 'hard', 'good', 'easy']

export function buildSessionResultReport(
  session: StudySession,
  pack: PhrasePack,
  reviewEvents: ReviewEvent[],
): SessionResultReport {
  if (!session.endedAt) throw new Error('A session must be completed before creating a result report.')

  const reviews = reviewEvents.filter((review) => (
    review.sessionId === session.id && review.packId === pack.id
  ))
  const reviewsByPhrase = new Map<string, ReviewEvent[]>()

  for (const review of reviews) {
    const phraseReviews = reviewsByPhrase.get(review.phraseId) ?? []
    phraseReviews.push(review)
    reviewsByPhrase.set(review.phraseId, phraseReviews)
  }

  const results = pack.phrases.flatMap((phrase): SessionPhraseResult[] => {
    const phraseReviews = reviewsByPhrase.get(phrase.id)
    if (!phraseReviews?.length) return []
    const orderedReviews = [...phraseReviews].sort((left, right) => (
      left.round - right.round || left.reviewedAt.localeCompare(right.reviewedAt)
    ))
    const latestRating = orderedReviews.at(-1)!.rating

    return [{
      phraseId: phrase.id,
      cue: phrase.cue,
      answer: phrase.answer,
      latestRating,
      needsReview: latestRating === 'again' || latestRating === 'hard',
      reviews: orderedReviews.map((review) => ({
        id: review.id,
        round: review.round,
        rating: review.rating,
        cueToRevealMs: review.cueToRevealMs,
        revealToRatingMs: review.revealToRatingMs,
        reviewedAt: review.reviewedAt,
      })),
    }]
  })

  const ratingCounts = Object.fromEntries(RATINGS.map((rating) => [rating, 0])) as Record<RecallRating, number>
  for (const review of reviews) ratingCounts[review.rating] += 1

  return {
    schemaVersion: 1,
    type: 'phrase-recall-session-result',
    session: {
      id: session.id,
      packId: pack.id,
      pack: pack.name,
      source: pack.source,
      languages: pack.languages,
      mode: session.mode,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      rounds: reviews.length ? Math.max(...reviews.map((review) => review.round)) : 0,
    },
    summary: {
      uniquePhrases: results.length,
      totalReviews: reviews.length,
      again: ratingCounts.again,
      hard: ratingCounts.hard,
      good: ratingCounts.good,
      easy: ratingCounts.easy,
      averageCueToRevealMs: reviews.length
        ? Math.round(reviews.reduce((total, review) => total + review.cueToRevealMs, 0) / reviews.length)
        : 0,
    },
    results,
  }
}

export function serializeSessionResult(report: SessionResultReport) {
  return JSON.stringify(report, null, 2)
}
