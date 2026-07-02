import { Settings, Monitor, Globe, Moon, HelpCircle, LogOut } from 'lucide-react'

const settingsSections = [
  {
    icon: Monitor,
    title: 'Display',
    description: 'Theme, density, and display preferences.',
  },
  {
    icon: Globe,
    title: 'Language & Region',
    description: 'Language, currency, and regional settings.',
  },
  {
    icon: Moon,
    title: 'Appearance',
    description: 'Dark mode, accent color customization.',
  },
  {
    icon: HelpCircle,
    title: 'Help & Support',
    description: 'Documentation, FAQs, and contact support.',
  },
]

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-tx-primary">Settings</h1>
        <p className="mt-0.5 text-[13px] text-tx-muted">
          Configure your application preferences
        </p>
      </div>

      {/* Settings list */}
      <div className="space-y-2">
        {settingsSections.map((section) => (
          <button
            key={section.title}
            className="flex w-full items-center gap-4 rounded-xl border border-border bg-surface-1 p-4 text-left transition-colors hover:bg-surface-2"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2">
              <section.icon className="h-4.5 w-4.5 text-tx-muted" />
            </div>
            <div className="flex-1">
              <p className="text-[13.5px] font-medium text-tx-primary">
                {section.title}
              </p>
              <p className="mt-0.5 text-[12px] text-tx-muted">
                {section.description}
              </p>
            </div>
            <Settings className="h-4 w-4 text-tx-muted/50" />
          </button>
        ))}
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-tx-danger/20 bg-tx-danger/5 p-4">
        <button className="flex items-center gap-2 text-[13.5px] font-medium text-tx-danger transition-colors hover:text-tx-danger/80">
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}