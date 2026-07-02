import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  FileText,
  BarChart3,
  Shield,
  TrendingUp,
  Newspaper,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react'

function ReportSection({
  icon: Icon,
  title,
}: {
  icon: React.ElementType
  title: string
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-tx-muted" />
        <h4 className="text-[12.5px] font-semibold text-tx-primary">{title}</h4>
      </div>
      <div className="space-y-1.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-3 rounded bg-border-subtle"
            style={{ width: `${90 - i * 15}%` }}
          />
        ))}
      </div>
    </div>
  )
}

export default function DeepResearch() {
  const navigate = useNavigate()
  const { reportId } = useParams()

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/research')}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-tx-secondary transition-colors hover:bg-surface-2 hover:text-tx-primary"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-tx-primary">
            Deep Research Report
          </h1>
          <p className="mt-0.5 text-[13px] text-tx-muted">
            {reportId ? `Report ${reportId}` : 'AI-generated company analysis'}
          </p>
        </div>
      </div>

      {/* Generating state */}
      <div className="flex flex-col items-center justify-center rounded-xl border border-accent/20 bg-accent-subtle/30 py-12">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-accent" />
        <p className="mb-1 text-[14px] font-medium text-tx-primary">
          Generate a research report
        </p>
        <p className="max-w-md text-center text-[13px] text-tx-secondary">
          Select a company from the market page and click "Deep Research" to
          generate a comprehensive AI analysis.
        </p>
      </div>

      {/* Report structure preview */}
      <div className="space-y-4">
        <h3 className="text-[13px] font-semibold text-tx-secondary">
          Report Structure
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ReportSection icon={FileText} title="Executive Summary" />
          <ReportSection icon={BarChart3} title="Financial Health" />
          <ReportSection icon={TrendingUp} title="Technical Analysis" />
          <ReportSection icon={Newspaper} title="News Intelligence" />
          <ReportSection icon={Shield} title="Risk Intelligence" />
          <ReportSection icon={AlertTriangle} title="Portfolio Impact" />
          <ReportSection icon={Lightbulb} title="AI Explanation" />
          <ReportSection icon={FileText} title="Confidence & Limitations" />
        </div>
      </div>
    </div>
  )
}