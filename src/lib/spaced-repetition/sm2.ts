/**
 * SM-2 Spaced Repetition algorithm
 * Based on SuperMemo-2 algorithm by Piotr Woźniak
 */

export interface ReviewItem {
  easeFactor: number  // 1.3 – 2.5 (default 2.5)
  interval: number    // days until next review
  correctCount: number
  incorrectCount: number
}

export interface ReviewResult {
  easeFactor: number
  interval: number
  nextReviewAt: Date
  masteryScore: number
}

/**
 * Quality: 0-5 scale
 * 0 = blackout (complete failure)
 * 1 = incorrect, but remembered on seeing the answer
 * 2 = incorrect, but correct answer was easy to recall
 * 3 = correct, but required significant effort
 * 4 = correct, after some hesitation
 * 5 = perfect response
 */
export function calculateNextReview(item: ReviewItem, quality: number): ReviewResult {
  // Clamp quality to 0-5
  const q = Math.max(0, Math.min(5, quality))

  let { easeFactor, interval } = item

  if (q >= 3) {
    // Correct response
    if (interval === 0) {
      interval = 1
    } else if (interval === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }

    // Update ease factor
    easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = Math.max(1.3, easeFactor)
  } else {
    // Incorrect response — reset interval
    interval = 1
    // Ease factor decreases on failure
    easeFactor = Math.max(1.3, easeFactor - 0.2)
  }

  const nextReviewAt = new Date()
  nextReviewAt.setDate(nextReviewAt.getDate() + interval)

  // Mastery score: 0-100 based on interval and ease factor
  const masteryScore = Math.min(
    100,
    (interval / 90) * 50 + ((easeFactor - 1.3) / 1.2) * 50
  )

  return {
    easeFactor,
    interval,
    nextReviewAt,
    masteryScore,
  }
}

/**
 * Convert a boolean answer to quality score
 */
export function answerToQuality(correct: boolean, responseTimeMs?: number): number {
  if (!correct) return 1

  // Faster correct response = higher quality
  if (!responseTimeMs) return 4

  if (responseTimeMs < 2000) return 5
  if (responseTimeMs < 5000) return 4
  if (responseTimeMs < 10000) return 3
  return 3
}

/**
 * Get items due for review now
 */
export function isDueForReview(nextReviewAt: Date | null): boolean {
  if (!nextReviewAt) return true
  return new Date() >= nextReviewAt
}
