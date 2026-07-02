import {
  ArrowUpRight,
  ArrowRightLeft,
} from 'lucide-react'
import { useLearningReflection } from '@/hooks/useLearningReflection'
import { describeOutcome } from '@/lib/chartTheme'

/**
 * Learning Reflection Timeline — visualizes trading decisions over time
 * with educational outcome descriptions.
 *
 * Uses educational language only. No evaluative terms like "mistake" or "error".
 * Each trade is described in terms of what happened (price movement), not
 * whether it was good or bad.
 *
 * Pure presentation component that wraps the useLearningReflection hook's data.
 */
export default function LearningReflectionTimeline() {
  const data = useLearningReflection()

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-2">
          <ArrowUpRight className="h-5 w-5 text-tx-muted/50" />
        </div>
        <p className="text-[13px] text-tx-muted">
          Your trading decisions will appear here as you buy and sell stocks.
          Each decision will include an educational observation about price movement.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3" role="list" aria-label="Learning reflection timeline">
      {data.slice(0, 10).map((point) => {
        const isBuy = point.action === 'buy'
        const description = describeOutcome(point.outcomePercent)

        return (
          <div
            key={point.transactionId}
            role="listitem"
            className="flex items-start gap-3 rounded-lg border border-border-subtle bg-surface-2 px-3 py-3"
          >
            {/* Action icon */}
            <div
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                isBuy ? 'bg-tx-success/10' : 'bg-tx-danger/10'
              }`}
              aria-hidden="true"
            >
              {isBuy ? (
                <ArrowUpRight className="h-4 w-4 text-tx-success" />
              ) : (
                <ArrowRightLeft className="h-4 w-4 text-tx-danger" />
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-medium text-tx-primary">
                  {isBuy ? 'Bought' : 'Sold'} {point.symbol}
                </span>
                <span className="text-[11.5px] text-tx-muted">
                  {point.quantity} shares @ ₹
                  {point.price.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="mt-1.5 flex items-center gap-3 text-[11.5px]">
                <span className="text-tx-muted">
                  Total: ₹
                  {point.total.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </span>
                <span className="text-tx-muted">
                  {new Date(point.timestamp).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Educational outcome observation */}
              <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-surface-3/60 px-2 py-1">
                <span className="text-[11px] text-tx-muted">Price since entry:</span>
                <span className="text-[11px] font-medium text-tx-secondary">
                  {description}
                </span>
                {point.outcomePercent !== 0 && (
                  <span
                    className={`text-[11px] font-semibold ${
                      point.outcomePercent >= 0
                        ? 'text-tx-success'
                        : 'text-tx-danger'
                    }`}
                  >
                    {point.outcomePercent >= 0 ? '+' : ''}
                    {point.outcomePercent.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}