import { User, Shield, Bell, Palette } from 'lucide-react'

function Section({
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

export default function Profile() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-tx-primary">Profile</h1>
        <p className="mt-0.5 text-[13px] text-tx-muted">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile header card */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-surface-1 p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-subtle">
          <User className="h-6 w-6 text-accent" />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-tx-primary">
            Investor Profile
          </h2>
          <p className="text-[13px] text-tx-muted">
            Complete your profile to unlock personalized features.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section
          icon={User}
          title="Personal Information"
          description="Your name, email, investment experience, and goals will be managed here."
        />
        <Section
          icon={Palette}
          title="Investment Preferences"
          description="Risk preference, preferred sectors, and investment goals will appear here."
        />
        <Section
          icon={Shield}
          title="Security"
          description="Password management and account security settings will be configured here."
        />
        <Section
          icon={Bell}
          title="Notification Preferences"
          description="Choose which alerts and notifications you want to receive."
        />
      </div>
    </div>
  )
}