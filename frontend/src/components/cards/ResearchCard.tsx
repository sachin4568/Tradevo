import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react'
import type { Outlook } from '@/types/research'

const outlookConfig: Record<
  Outlook,
  { color: string; bg: string; icon: React.ElementType }
> = {
  bullish: { color: 'text-tx-success', bg: 'bg-tx-success/10', icon: TrendingUp },
  bearish: { color: 'text-tx-danger', bg: 'bg-tx-danger/10', icon: TrendingDown },
  neutral: { color: 'text-tx-warning', bg: 'bg-tx-warning/10', icon: Minus },
}

interface ResearchCardProps {
  companyId: string
  companyName: string
  symbol: string
  sector: string
  viewedAt: string
  analysisCoverage: number
  outlook: Outlook
}

export default function ResearchCard({
  companyId,
  companyName,
  symbol,
  sector,
  viewedAt,
  analysisCoverage,
  outlook,
}: ResearchCardProps) {
  const navigate = useNavigate()
  const cfg = outlookConfig[outlook]
  const OutlookIcon = cfg.icon

  return (
    <button
      onClick={() => navigate(`/research/${companyId}`)}
      className="flex w-full items-center gap-4 rounded-xl border border-border bg-surface-1 p-4 text-left transition-colors hover:border-accent/30 hover:bg-surface-2"
    >
      {/* Symbol badge */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-subtle">
        <span className="text-[13px] font-bold text-accent">
          {symbol.slice(0, 3)}
        </span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13.5px] font-semibold text-tx-primary">
            {companyName}
          </span>
          <span
            className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${cfg.color} ${cfg.bg}`}
          >
            <OutlookIcon className="h-3 w-3" />
            {outlook}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-3 text-[12px] text-tx-muted">
          <span>{symbol}</span>
          <span>&middot;</span>
          <span>{sector}</span>
          <span>&middot;</span>
          <span>Coverage: {analysisCoverage}%</span>
        </div>
      </div>

      {/* Time */}
      <div className="shrink-0 text-right">
        <div className="flex items-center gap-1 text-[11.5px] text-tx-muted">
          <Clock className="h-3 w-3" />
          {new Date(viewedAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </button>
  )
}