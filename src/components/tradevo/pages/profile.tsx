'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Pencil,
  CheckCircle2,
  Shield,
  Smartphone,
  Monitor,
  Globe,
  ChevronRight,
  Lock,
  Mail,
  MessageSquare,
  BellRing,
  Moon,
  Sun,
  Sparkles,
  AlertTriangle,
  LogIn,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/tradevo/shared/page-header'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTradevoStore } from '@/store/tradevo-store'
import { mockUser } from '@/lib/mock-data'

/* ───────────────────────────── Types ───────────────────────────── */

type ProfileTab = 'profile' | 'investment' | 'security' | 'preferences'

/* ───────────────────────────── Constants ───────────────────────────── */

const PROFILE_TABS: { value: ProfileTab; label: string }[] = [
  { value: 'profile', label: 'Profile' },
  { value: 'investment', label: 'Investment' },
  { value: 'security', label: 'Security' },
  { value: 'preferences', label: 'Preferences' },
]

/* ───────────────────────────── Profile Tab ───────────────────────────── */

function ProfileTabContent() {
  const fields = [
    { label: 'Full Name', value: mockUser.name, verified: false },
    { label: 'Email', value: mockUser.email, verified: mockUser.emailVerified },
    { label: 'Phone', value: mockUser.phone, verified: mockUser.phoneVerified },
    { label: 'PAN', value: 'ABCPM1234K', verified: mockUser.panVerified },
    { label: 'KYC Status', value: 'Verified', verified: mockUser.kycStatus === 'verified' },
    { label: 'Occupation', value: mockUser.occupation, verified: false },
  ]

  return (
    <div className="space-y-1">
      {fields.map((field, i) => (
        <div
          key={field.label}
          className="flex items-center justify-between py-3.5 group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm text-text-secondary w-28 shrink-0">
              {field.label}
            </span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-text-primary truncate">
                {field.value}
              </span>
              {field.verified && (
                <span className="inline-flex items-center gap-1 text-tv-emerald shrink-0">
                  <CheckCircle2 className="size-3.5" />
                  <span className="text-xs font-medium">Verified</span>
                </span>
              )}
            </div>
          </div>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity text-text-tertiary hover:text-text-secondary p-1">
            <Pencil className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

/* ───────────────────────────── Investment Tab ───────────────────────────── */

function InvestmentTabContent() {
  const riskLevels = ['Low', 'Moderate', 'High', 'Aggressive']
  const currentRisk = mockUser.riskTolerance
  const riskIndex = riskLevels.indexOf(currentRisk)

  return (
    <div className="space-y-6">
      {/* Risk Tolerance */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Risk Tolerance</span>
          <span className="text-sm font-semibold text-text-primary">{currentRisk}</span>
        </div>
        <div className="relative">
          <div className="h-2 w-full rounded-full bg-surface-3 overflow-hidden">
            <div className="h-full w-full flex">
              <div className="h-full bg-tv-emerald" style={{ width: '25%' }} />
              <div className="h-full bg-tv-amber" style={{ width: '25%' }} />
              <div className="h-full bg-tv-coral/70" style={{ width: '25%' }} />
              <div className="h-full bg-tv-coral" style={{ width: '25%' }} />
            </div>
          </div>
          {/* Indicator */}
          <motion.div
            initial={{ left: `${riskIndex * 25 + 12.5}%` }}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${riskIndex * 25 + 12.5}%` }}
          >
            <div className="h-3 w-3 rounded-full bg-text-primary border-2 border-surface-0 shadow-md" />
          </motion.div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-text-tertiary">Low</span>
            <span className="text-[10px] text-text-tertiary">High</span>
          </div>
        </div>
      </div>

      <Separator className="!bg-border-subtle" />

      {/* Investment Goal */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">Investment Goal</span>
        <span className="text-sm font-medium text-text-primary">
          {mockUser.investmentGoal}
        </span>
      </div>

      <Separator className="!bg-border-subtle" />

      {/* Investment Horizon */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">Investment Horizon</span>
        <span className="text-sm font-medium text-text-primary">5-10 years</span>
      </div>

      <Separator className="!bg-border-subtle" />

      {/* Preferred Sectors */}
      <div className="space-y-2">
        <span className="text-sm text-text-secondary">Preferred Sectors</span>
        <div className="flex items-center gap-2 flex-wrap">
          {['Technology', 'Financial Services', 'Energy', 'FMCG'].map(
            (sector) => (
              <span
                key={sector}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-tv-cyan-muted text-tv-cyan"
              >
                {sector}
              </span>
            )
          )}
          <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-text-tertiary hover:text-text-secondary hover:bg-surface-2 transition-colors">
            <Pencil className="size-3" />
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────────── Security Tab ───────────────────────────── */

function SecurityTabContent() {
  const [twoFactor, setTwoFactor] = useState(true)

  return (
    <div className="space-y-6">
      {/* Password */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2">
            <Lock className="size-4 text-text-secondary" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Password</p>
            <p className="text-xs text-text-tertiary">Last changed 30 days ago</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          Change
        </Button>
      </div>

      <Separator className="!bg-border-subtle" />

      {/* Two-Factor Auth */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-tv-emerald-muted">
            <Shield className="size-4 text-tv-emerald" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Two-Factor Authentication</p>
            <p className="text-xs text-text-tertiary">
              {twoFactor ? 'Enabled — extra security for your account' : 'Disabled'}
            </p>
          </div>
        </div>
        <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
      </div>

      <Separator className="!bg-border-subtle" />

      {/* Active Sessions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Active Sessions</span>
          <span className="text-xs text-text-tertiary">2 devices</span>
        </div>
        <div className="space-y-2">
          {[
            { device: 'MacBook Pro', icon: Monitor, location: 'Mumbai, India', current: true },
            { device: 'iPhone 15', icon: Smartphone, location: 'Mumbai, India', current: false },
          ].map((session) => {
            const Icon = session.icon
            return (
              <div
                key={session.device}
                className="flex items-center justify-between p-3 rounded-lg bg-surface-1"
              >
                <div className="flex items-center gap-3">
                  <Icon className="size-4 text-text-tertiary" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {session.device}
                      {session.current && (
                        <span className="ml-2 text-[10px] font-medium text-tv-emerald bg-tv-emerald-muted px-1.5 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-text-tertiary">{session.location}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Separator className="!bg-border-subtle" />

      {/* Login History */}
      <div className="space-y-3">
        <span className="text-sm text-text-secondary">Login History</span>
        <div className="space-y-2">
          {[
            { device: 'MacBook Pro', time: 'Today, 10:30 AM', icon: Monitor },
            { device: 'iPhone 15', time: 'Yesterday, 8:15 PM', icon: Smartphone },
            { device: 'Windows PC', time: '3 days ago, 2:00 PM', icon: Globe },
          ].map((login) => {
            const Icon = login.icon
            return (
              <div key={login.time} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Icon className="size-3.5 text-text-tertiary" />
                  <span className="text-sm text-text-primary">{login.device}</span>
                </div>
                <span className="text-xs text-text-tertiary">{login.time}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────────── Toggle Row (shared) ───────────────────────────── */

function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ElementType
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 shrink-0">
          <Icon className="size-4 text-text-secondary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary">{label}</p>
          <p className="text-xs text-text-tertiary truncate">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

/* ───────────────────────────── Preferences Tab ───────────────────────────── */

function PreferencesTabContent() {
  const [darkMode, setDarkMode] = useState(true)
  const [emailNotif, setEmailNotif] = useState(true)
  const [pushNotif, setPushNotif] = useState(true)
  const [smsNotif, setSmsNotif] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState(true)
  const [marketAlerts, setMarketAlerts] = useState(true)

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <ToggleRow
        icon={darkMode ? Moon : Sun}
        label="Dark Mode"
        description="Toggle between light and dark appearance"
        checked={darkMode}
        onChange={setDarkMode}
      />

      <Separator className="!bg-border-subtle" />

      {/* Notifications */}
      <div className="space-y-4">
        <span className="text-sm font-medium text-text-primary">Notifications</span>
        <ToggleRow
          icon={Mail}
          label="Email Notifications"
          description="Receive updates via email"
          checked={emailNotif}
          onChange={setEmailNotif}
        />
        <ToggleRow
          icon={BellRing}
          label="Push Notifications"
          description="Get real-time push alerts"
          checked={pushNotif}
          onChange={setPushNotif}
        />
        <ToggleRow
          icon={MessageSquare}
          label="SMS Notifications"
          description="Receive alerts via SMS"
          checked={smsNotif}
          onChange={setSmsNotif}
        />
      </div>

      <Separator className="!bg-border-subtle" />

      {/* Language */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2">
            <Globe className="size-4 text-text-secondary" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Language</p>
            <p className="text-xs text-text-tertiary">Select your preferred language</p>
          </div>
        </div>
        <Select defaultValue="en">
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="hi">Hindi</SelectItem>
            <SelectItem value="mr">Marathi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator className="!bg-border-subtle" />

      {/* AI & Alerts */}
      <div className="space-y-4">
        <span className="text-sm font-medium text-text-primary">Intelligence</span>
        <ToggleRow
          icon={Sparkles}
          label="AI Suggestions"
          description="Get personalized investment suggestions"
          checked={aiSuggestions}
          onChange={setAiSuggestions}
        />
        <ToggleRow
          icon={AlertTriangle}
          label="Market Alerts"
          description="Important price and market movement alerts"
          checked={marketAlerts}
          onChange={setMarketAlerts}
        />
      </div>
    </div>
  )
}

/* ───────────────────────────── Profile & Settings Page ───────────────────────────── */

export function ProfilePage() {
  const { currentPage } = useTradevoStore()
  const [activeTab, setActiveTab] = useState<ProfileTab>(
    currentPage === 'settings' ? 'preferences' : 'profile'
  )

  const tabContent: Record<ProfileTab, React.ReactNode> = {
    profile: <ProfileTabContent />,
    investment: <InvestmentTabContent />,
    security: <SecurityTabContent />,
    preferences: <PreferencesTabContent />,
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="Profile & Settings" />

      {/* User Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="surface-card-static p-6"
      >
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-tv-cyan-muted text-tv-cyan text-xl font-bold shrink-0">
            {mockUser.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-text-primary">
              {mockUser.name}
            </h2>
            <p className="text-sm text-text-secondary mt-0.5">{mockUser.email}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-xs text-text-tertiary">{mockUser.occupation}</span>
              <span className="text-xs text-text-tertiary">·</span>
              <span className="text-xs text-text-tertiary">Joined Jan 2025</span>
              {mockUser.kycStatus === 'verified' && (
                <>
                  <span className="text-xs text-text-tertiary">·</span>
                  <span className="inline-flex items-center gap-1 text-xs text-tv-emerald">
                    <CheckCircle2 className="size-3" />
                    KYC Verified
                  </span>
                </>
              )}
            </div>
          </div>
          <button className="text-text-tertiary hover:text-text-secondary transition-colors p-2 rounded-lg hover:bg-surface-2">
            <Pencil className="size-4" />
          </button>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-surface-1 rounded-lg w-fit">
        {PROFILE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
              activeTab === tab.value
                ? 'bg-surface-3 text-text-primary shadow-sm'
                : 'text-text-tertiary hover:text-text-secondary'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="surface-card-static p-6"
      >
        {tabContent[activeTab]}
      </motion.div>
    </div>
  )
}