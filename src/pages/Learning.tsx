import {
  GraduationCap,
  Wallet,
  Target,
  AlertTriangle,
  Clock,
  Dna,
  TrendingUp,
} from 'lucide-react'

function LearningCard({
  icon: Icon,
  title,
  value,
  subtitle,
}: {
  icon: React.ElementType
  title: string
  value: string
  subtitle: string
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-tx-muted" />
        <span className="text-[12px] text-tx-muted">{title}</span>
      </div>
      <p className="text-xl font-semibold text-tx-primary">{value}</p>
      <p className="mt-0.5 text-[12px] text-tx-muted">{subtitle}</p>
    </div>
  )
}

function SectionCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-1">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Icon className="h-4 w-4 text-tx-muted" />
        <h3 className="text-[13px] font-semibold text-tx-primary">{title}</h3>
      </div>
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Icon className="mb-2.5 h-8 w-8 text-tx-muted/40" />
        <p className="max-w-xs text-[13px] text-tx-muted">{description}</p>
      </div>
    </div>
  )
}

export default function Learning() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-tx-primary">Learning</h1>
        <p className="mt-0.5 text-[13px] text-tx-muted">
          Practice investing and track your improvement
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <LearningCard
          icon={Wallet}
          title="Virtual Balance"
          value="--"
          subtitle="Available capital"
        />
        <LearningCard
          icon={Target}
          title="Sessions Completed"
          value="--"
          subtitle="Learning sessions"
        />
        <LearningCard
          icon={TrendingUp}
          title="Win Rate"
          value="--"
          subtitle="Successful decisions"
        />
        <LearningCard
          icon={Clock}
          title="Time Invested"
          value="--"
          subtitle="Total learning time"
        />
      </div>

      {/* Simulator */}
      <div className="rounded-xl border border-border bg-surface-1">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <GraduationCap className="h-4 w-4 text-tx-muted" />
          <h3 className="text-[13px] font-semibold text-tx-primary">
            Virtual Trading Simulator
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <GraduationCap className="mb-3 h-10 w-10 text-tx-muted/40" />
          <p className="mb-1 text-[14px] font-medium text-tx-primary">
            Ready to start learning
          </p>
          <p className="mb-5 max-w-sm text-[13px] text-tx-muted">
            Practice investing with virtual capital. Your decisions will be
            tracked and used to generate personalized learning insights.
          </p>
          <button className="rounded-lg bg-accent-subtle px-5 py-2.5 text-[13.5px] font-semibold text-accent transition-colors hover:bg-accent-subtle-hover">
            Start Learning Session
          </button>
        </div>
      </div>

      {/* Bottom sections */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <SectionCard
          icon={AlertTriangle}
          title="Mistake Map"
          description="Recurring investment mistakes will be identified and displayed here as you trade."
        />
        <SectionCard
          icon={Clock}
          title="Decision Timeline"
          description="A chronological history of your AI-assisted investment decisions will appear here."
        />
        <SectionCard
          icon={Dna}
          title="Investment DNA"
          description="Your behavioral investment profile will be generated after you begin trading."
        />
      </div>
    </div>
  )
}