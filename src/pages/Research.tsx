import { useNavigate } from 'react-router-dom'
import {
  FileSearch,
  Newspaper,
  Brain,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'

export default function Research() {
  const navigate = useNavigate()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-tx-primary">Research</h1>
        <p className="mt-0.5 text-[13px] text-tx-muted">
          AI-powered investment research and market intelligence
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          onClick={() => navigate('/market')}
          className="flex items-center gap-3 rounded-xl border border-accent/20 bg-accent-subtle p-4 text-left transition-colors hover:bg-accent-subtle-hover"
        >
          <FileSearch className="h-5 w-5 shrink-0 text-accent" />
          <div>
            <p className="text-[13.5px] font-semibold text-tx-primary">
              Deep Research
            </p>
            <p className="mt-0.5 text-[12px] text-tx-secondary">
              Generate AI research report for any company
            </p>
          </div>
        </button>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-1 p-4">
          <Newspaper className="h-5 w-5 shrink-0 text-tx-muted" />
          <div>
            <p className="text-[13.5px] font-semibold text-tx-primary">
              Market Intelligence
            </p>
            <p className="mt-0.5 text-[12px] text-tx-muted">
              AI-generated market overview and analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-1 p-4">
          <Brain className="h-5 w-5 shrink-0 text-tx-muted" />
          <div>
            <p className="text-[13.5px] font-semibold text-tx-primary">
              Sector Analysis
            </p>
            <p className="mt-0.5 text-[12px] text-tx-muted">
              Sector-wise opportunities and risks
            </p>
          </div>
        </div>
      </div>

      {/* Research history */}
      <div className="rounded-xl border border-border bg-surface-1">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-[13px] font-semibold text-tx-primary">
            Research History
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileSearch className="mb-3 h-10 w-10 text-tx-muted/40" />
          <p className="mb-1 text-[14px] font-medium text-tx-primary">
            No research reports yet
          </p>
          <p className="mb-5 max-w-sm text-[13px] text-tx-muted">
            Generate your first Deep Research report to get AI-powered company
            analysis.
          </p>
          <button
            onClick={() => navigate('/market')}
            className="flex items-center gap-1.5 rounded-lg bg-accent-subtle px-4 py-2 text-[13px] font-medium text-accent transition-colors hover:bg-accent-subtle-hover"
          >
            Select a Company
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Market & Sector Intelligence */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface-1">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <TrendingUp className="h-4 w-4 text-tx-muted" />
            <h3 className="text-[13px] font-semibold text-tx-primary">
              Market Intelligence
            </h3>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp className="mb-2.5 h-8 w-8 text-tx-muted/40" />
            <p className="text-[13px] text-tx-muted">
              AI-generated market analysis will appear here.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface-1">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Brain className="h-4 w-4 text-tx-muted" />
            <h3 className="text-[13px] font-semibold text-tx-primary">
              Sector Analysis
            </h3>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Brain className="mb-2.5 h-8 w-8 text-tx-muted/40" />
            <p className="text-[13px] text-tx-muted">
              Sector-wise opportunities and risks will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}