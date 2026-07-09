import { useState, useEffect } from 'react'
import {
  User,
  Shield,
  SlidersHorizontal,
  FileCheck,
  CreditCard,
  Palette,
  Info,
  Sun,
  Moon,
  Bell,
  Mail,
  Smartphone,
  Check,
  ChevronRight,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import type { User as UserType } from '@/types/auth'

// ─── Toggle Component ───

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? 'bg-accent' : 'bg-surface-3'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : ''}`}
      />
    </button>
  )
}

// ─── Tab Types ───

interface TabDef {
  id: string
  label: string
  icon: LucideIcon
}

const tabs: TabDef[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'investment', label: 'Investment', icon: SlidersHorizontal },
  { id: 'kyc', label: 'KYC', icon: FileCheck },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'preferences', label: 'Preferences', icon: Palette },
  { id: 'about', label: 'About', icon: Info },
]

// ─── Preferences Storage ───

const PREFS_KEY = 'tradevo_preferences'

interface Prefs {
  defaultOrderType: 'market' | 'limit'
  defaultQuantity: string
  showBrokerage: boolean
  currency: string
  language: string
  emailNotif: boolean
  pushNotif: boolean
  smsNotif: boolean
}

const defaultPrefs: Prefs = {
  defaultOrderType: 'market',
  defaultQuantity: '1',
  showBrokerage: true,
  currency: 'INR',
  language: 'en',
  emailNotif: true,
  pushNotif: true,
  smsNotif: false,
}

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) return { ...defaultPrefs, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...defaultPrefs }
}

function savePrefs(p: Prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(p))
}

// ─── Section Card ───

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: LucideIcon
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-1">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
        <Icon className="h-4 w-4 text-tx-muted" />
        <h3 className="text-[13px] font-semibold text-tx-primary">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ─── Field Row ───

function FieldRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-[13px] text-tx-secondary shrink-0">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

// ─── Input ───

function SInput({
  value,
  onChange,
  type = 'text',
  placeholder,
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  className?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-[13px] text-tx-primary outline-none transition-colors placeholder:text-tx-muted focus:border-accent/40 ${className}`}
    />
  )
}

// ─── Button ───

function SButton({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
}: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  onClick?: () => void
  disabled?: boolean
}) {
  const base =
    'flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors disabled:opacity-50'
  const styles =
    variant === 'primary'
      ? 'bg-accent text-surface-0 hover:bg-accent-hover'
      : 'border border-border bg-surface-2 text-tx-secondary hover:bg-surface-3 hover:text-tx-primary'
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {children}
    </button>
  )
}

// ─── Tab Panels ───

function ProfileTab() {
  const { user, updateProfile } = useAuth()
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [experience, setExperience] = useState<UserType['experienceLevel']>(user?.experienceLevel ?? 'intermediate')
  const [risk, setRisk] = useState<UserType['riskPreference']>(user?.riskPreference ?? 'moderate')

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setExperience(user.experienceLevel)
      setRisk(user.riskPreference)
    }
  }, [user])

  if (!user) return null

  function handleSave() {
    updateProfile({ name, email, experienceLevel: experience, riskPreference: risk })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const experienceOptions: Array<{ value: UserType['experienceLevel']; label: string }> = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ]

  const riskOptions: Array<{ value: UserType['riskPreference']; label: string; desc: string }> = [
    { value: 'conservative', label: 'Conservative', desc: 'Prioritize capital protection' },
    { value: 'moderate', label: 'Moderate', desc: 'Balanced growth and risk' },
    { value: 'aggressive', label: 'Aggressive', desc: 'Maximize returns' },
  ]

  return (
    <div className="space-y-5">
      <SectionCard title="Personal Information" icon={User}>
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">Full Name</label>
            <SInput value={name} onChange={setName} placeholder="Your name" className="w-full" />
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">Email</label>
            <SInput value={email} onChange={setEmail} type="email" placeholder="you@example.com" className="w-full" />
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">
              Investment Experience
            </label>
            <div className="flex flex-wrap gap-2">
              {experienceOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setExperience(o.value)}
                  className={`rounded-lg border px-4 py-2 text-[13px] transition-colors cursor-pointer ${
                    experience === o.value
                      ? 'border-accent/40 bg-accent-subtle text-accent'
                      : 'border-border bg-surface-2 text-tx-secondary hover:text-tx-primary'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">Risk Appetite</label>
            <div className="space-y-2">
              {riskOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setRisk(o.value)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-[13px] transition-colors cursor-pointer ${
                    risk === o.value
                      ? 'border-accent/40 bg-accent-subtle text-accent'
                      : 'border-border bg-surface-2 text-tx-secondary hover:text-tx-primary'
                  }`}
                >
                  <span className="font-medium">{o.label}</span>
                  <span className="text-tx-muted">— {o.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="pt-2">
            <SButton onClick={handleSave}>
              {saved ? <Check className="h-4 w-4" /> : null}
              {saved ? 'Saved' : 'Save Changes'}
            </SButton>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

function SecurityTab() {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [twoFA, setTwoFA] = useState(false)
  const [saved, setSaved] = useState(false)

  function handleChangePassword() {
    if (!currentPw || !newPw || !confirmPw) return
    if (newPw !== confirmPw) return
    // Demo-only — just show saved
    setSaved(true)
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Change Password" icon={Shield}>
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">Email</label>
            <SInput value="demo@tradevo.ai" onChange={() => {}} disabled className="w-full opacity-60" />
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">Current Password</label>
            <SInput value={currentPw} onChange={setCurrentPw} type="password" placeholder="Enter current password" className="w-full" />
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">New Password</label>
            <SInput value={newPw} onChange={setNewPw} type="password" placeholder="Enter new password" className="w-full" />
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">Confirm New Password</label>
            <SInput value={confirmPw} onChange={setConfirmPw} type="password" placeholder="Confirm new password" className="w-full" />
            {confirmPw && newPw !== confirmPw && (
              <p className="mt-1 text-[12px] text-tx-danger">Passwords do not match</p>
            )}
          </div>
          <SButton onClick={handleChangePassword} disabled={!currentPw || !newPw || newPw !== confirmPw}>
            {saved ? <Check className="h-4 w-4" /> : null}
            {saved ? 'Password Updated' : 'Update Password'}
          </SButton>
        </div>
      </SectionCard>

      <SectionCard title="Two-Factor Authentication" icon={Shield}>
        <FieldRow label="Enable 2FA">
          <Toggle enabled={twoFA} onChange={setTwoFA} />
        </FieldRow>
        {twoFA && (
          <p className="mt-2 text-[12px] text-tx-muted">
            Scan the QR code from your authenticator app to complete setup.
          </p>
        )}
      </SectionCard>
    </div>
  )
}

function InvestmentTab() {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs)

  function updatePref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    savePrefs(next)
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Order Defaults" icon={SlidersHorizontal}>
        <div className="space-y-0 max-w-lg">
          <FieldRow label="Default Order Type">
            <div className="flex gap-2">
              {(['market', 'limit'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => updatePref('defaultOrderType', t)}
                  className={`rounded-lg border px-4 py-2 text-[13px] capitalize transition-colors cursor-pointer ${
                    prefs.defaultOrderType === t
                      ? 'border-accent/40 bg-accent-subtle text-accent'
                      : 'border-border bg-surface-2 text-tx-secondary hover:text-tx-primary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </FieldRow>
          <FieldRow label="Default Quantity">
            <SInput
              value={prefs.defaultQuantity}
              onChange={(v) => updatePref('defaultQuantity', v)}
              type="number"
              className="w-24 text-right"
            />
          </FieldRow>
          <FieldRow label="Show Brokerage">
            <Toggle
              enabled={prefs.showBrokerage}
              onChange={(v) => updatePref('showBrokerage', v)}
            />
          </FieldRow>
        </div>
      </SectionCard>
    </div>
  )
}

function KYCTab() {
  const { user, updateProfile } = useAuth()
  const [pan, setPan] = useState(user?.pan ?? '')
  const [aadhaar, setAadhaar] = useState(user?.aadhaar ?? '')
  const [dob, setDob] = useState(user?.dob ?? '')
  const [address, setAddress] = useState(user?.address ?? '')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user) {
      setPan(user.pan ?? '')
      setAadhaar(user.aadhaar ?? '')
      setDob(user.dob ?? '')
      setAddress(user.address ?? '')
    }
  }, [user])

  if (!user) return null

  function handleSave() {
    updateProfile({ pan, aadhaar, dob, address })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5">
      <SectionCard title="KYC Details" icon={FileCheck}>
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">PAN Number</label>
            <SInput
              value={pan}
              onChange={setPan}
              placeholder="ABCDE1234F"
              className="w-full uppercase"
              maxLength={10}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">Aadhaar Number</label>
            <SInput
              value={aadhaar}
              onChange={setAadhaar}
              placeholder="1234 5678 9012"
              className="w-full"
              maxLength={14}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">Date of Birth</label>
            <SInput value={dob} onChange={setDob} type="date" className="w-full" />
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Your full address"
              rows={3}
              className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-[13px] text-tx-primary outline-none transition-colors placeholder:text-tx-muted focus:border-accent/40 resize-none"
            />
          </div>
          <div className="pt-2">
            <SButton onClick={handleSave}>
              {saved ? <Check className="h-4 w-4" /> : null}
              {saved ? 'Saved' : 'Save KYC Details'}
            </SButton>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

function PaymentTab() {
  const { user, updateProfile } = useAuth()
  const [bank, setBank] = useState(user?.bankAccount ?? '')
  const [upi, setUpi] = useState(user?.upiId ?? '')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user) {
      setBank(user.bankAccount ?? '')
      setUpi(user.upiId ?? '')
    }
  }, [user])

  if (!user) return null

  function handleSave() {
    updateProfile({ bankAccount: bank, upiId: upi })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Bank Account" icon={CreditCard}>
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">Bank Account</label>
            <SInput
              value={bank}
              onChange={setBank}
              placeholder="Bank Name ****1234"
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">UPI ID</label>
            <SInput
              value={upi}
              onChange={setUpi}
              placeholder="name@upi"
              className="w-full"
            />
          </div>
          <div className="pt-2">
            <SButton onClick={handleSave}>
              {saved ? <Check className="h-4 w-4" /> : null}
              {saved ? 'Saved' : 'Save Payment Details'}
            </SButton>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

function PreferencesTab() {
  const { theme, setTheme, isDark } = useTheme()
  const { user } = useAuth()
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs)

  function updatePref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    savePrefs(next)
  }

  const riskLabels: Record<string, string> = {
    conservative: 'Conservative',
    moderate: 'Moderate',
    aggressive: 'Aggressive',
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Appearance" icon={Palette}>
        <div className="space-y-0 max-w-lg">
          <FieldRow label="Theme">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 p-1">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] transition-colors cursor-pointer ${
                  isDark ? 'bg-accent text-surface-0' : 'text-tx-secondary hover:text-tx-primary'
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                Dark
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] transition-colors cursor-pointer ${
                  !isDark ? 'bg-accent text-surface-0' : 'text-tx-secondary hover:text-tx-primary'
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                Light
              </button>
            </div>
          </FieldRow>
        </div>
      </SectionCard>

      <SectionCard title="Language & Region" icon={Palette}>
        <div className="space-y-0 max-w-lg">
          <FieldRow label="Currency">
            <select
              value={prefs.currency}
              onChange={(e) => updatePref('currency', e.target.value)}
              className="rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-[13px] text-tx-primary outline-none transition-colors focus:border-accent/40 cursor-pointer"
            >
              <option value="INR">INR ₹</option>
            </select>
          </FieldRow>
          <FieldRow label="Language">
            <select
              value={prefs.language}
              onChange={(e) => updatePref('language', e.target.value)}
              className="rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-[13px] text-tx-primary outline-none transition-colors focus:border-accent/40 cursor-pointer"
            >
              <option value="en">English</option>
            </select>
          </FieldRow>
          <FieldRow label="Risk Level">
            <span className="text-[13px] font-medium text-accent">
              {riskLabels[user?.riskPreference ?? 'moderate']}
            </span>
          </FieldRow>
        </div>
      </SectionCard>

      <SectionCard title="Notifications" icon={Bell}>
        <div className="space-y-0 max-w-lg">
          <FieldRow label="Email Notifications">
            <Toggle
              enabled={prefs.emailNotif}
              onChange={(v) => updatePref('emailNotif', v)}
            />
          </FieldRow>
          <FieldRow label="Push Notifications">
            <Toggle
              enabled={prefs.pushNotif}
              onChange={(v) => updatePref('pushNotif', v)}
            />
          </FieldRow>
          <FieldRow label="SMS Notifications">
            <Toggle
              enabled={prefs.smsNotif}
              onChange={(v) => updatePref('smsNotif', v)}
            />
          </FieldRow>
        </div>
      </SectionCard>
    </div>
  )
}

function AboutTab() {
  return (
    <div className="space-y-5">
      <SectionCard title="About Tradevo" icon={Info}>
        <div className="space-y-0 max-w-lg">
          <FieldRow label="App Version">
            <span className="text-[13px] text-tx-primary">1.0.0</span>
          </FieldRow>
          <FieldRow label="Build">
            <span className="text-[13px] text-tx-primary">2025.07.06</span>
          </FieldRow>
          <FieldRow label="Platform">
            <span className="text-[13px] text-tx-primary">Web (React + Vite)</span>
          </FieldRow>
        </div>
      </SectionCard>

      <SectionCard title="Resources" icon={Info}>
        <div className="space-y-0">
          <button
            type="button"
            className="flex w-full items-center justify-between py-3 text-[13px] text-tx-secondary transition-colors hover:text-tx-primary cursor-pointer"
          >
            Documentation
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-between py-3 text-[13px] text-tx-secondary transition-colors hover:text-tx-primary cursor-pointer"
          >
            Privacy Policy
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-between py-3 text-[13px] text-tx-secondary transition-colors hover:text-tx-primary cursor-pointer"
          >
            Terms of Service
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Main Settings Page ───

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const navigate = useNavigate()
  const { logout } = useAuth()

  function handleSignOut() {
    logout()
    navigate('/login', { replace: true })
  }

  const tabContent: Record<string, () => React.ReactNode> = {
    profile: ProfileTab,
    security: SecurityTab,
    investment: InvestmentTab,
    kyc: KYCTab,
    payment: PaymentTab,
    preferences: PreferencesTab,
    about: AboutTab,
  }

  const ActivePanel = tabContent[activeTab]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-tx-primary">Settings</h1>
        <p className="mt-0.5 text-[13px] text-tx-muted">
          Configure your application preferences
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface-1 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-accent-subtle text-accent'
                : 'text-tx-secondary hover:bg-surface-2 hover:text-tx-primary'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {ActivePanel && <ActivePanel />}

      {/* Sign Out */}
      <div className="rounded-xl border border-tx-danger/20 bg-tx-danger/5 p-4">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-2 text-[13.5px] font-medium text-tx-danger transition-colors hover:text-tx-danger/80 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}