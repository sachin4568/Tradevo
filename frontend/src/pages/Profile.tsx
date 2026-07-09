import { useState } from 'react'
import { User, Shield, Pencil, X, Check, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import type { User as UserType } from '@/types/auth'

// ─── EditableField Component ───

function EditableField({
  label,
  value,
  onSave,
  type = 'text',
  multiline = false,
  placeholder,
}: {
  label: string
  value?: string
  onSave: (val: string) => void
  type?: string
  multiline?: boolean
  placeholder?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')

  function startEdit() {
    setDraft(value ?? '')
    setEditing(true)
  }

  function cancel() {
    setDraft(value ?? '')
    setEditing(false)
  }

  function save() {
    onSave(draft)
    setEditing(false)
  }

  if (editing) {
    return (
      <div>
        <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">{label}</label>
        {multiline ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2.5 text-[13.5px] text-tx-primary outline-none transition-colors placeholder:text-tx-muted focus:border-accent/40 resize-none"
            autoFocus
          />
        ) : (
          <input
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2.5 text-[13.5px] text-tx-primary outline-none transition-colors placeholder:text-tx-muted focus:border-accent/40"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') save()
              if (e.key === 'Escape') cancel()
            }}
          />
        )}
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={save}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-surface-0 transition-colors hover:bg-accent-hover cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            Save
          </button>
          <button
            type="button"
            onClick={cancel}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3.5 py-1.5 text-[12.5px] font-medium text-tx-secondary transition-colors hover:text-tx-primary cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group">
      <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">{label}</label>
      <div
        onClick={startEdit}
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-3.5 py-2.5 text-[13.5px] text-tx-primary transition-colors hover:border-border-subtle hover:bg-surface-2"
      >
        <span className={value ? '' : 'text-tx-muted italic'}>{value || placeholder || 'Not set'}</span>
        <Pencil className="ml-auto h-3.5 w-3.5 shrink-0 text-tx-muted opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </div>
  )
}

// ─── Editable Select Field ───

function EditableSelect<T extends string>({
  label,
  value,
  options,
  onSave,
}: {
  label: string
  value: T
  options: Array<{ value: T; label: string }>
  onSave: (val: T) => void
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <div>
        <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">{label}</label>
        <div className="flex flex-wrap gap-2">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onSave(o.value)
                setEditing(false)
              }}
              className={`rounded-lg border px-4 py-2 text-[13px] transition-colors cursor-pointer ${
                value === o.value
                  ? 'border-accent/40 bg-accent-subtle text-accent'
                  : 'border-border bg-surface-2 text-tx-secondary hover:text-tx-primary'
              }`}
            >
              {o.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] text-tx-muted hover:text-tx-primary cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  const current = options.find((o) => o.value === value)

  return (
    <div className="group">
      <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">{label}</label>
      <div
        onClick={() => setEditing(true)}
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-3.5 py-2.5 text-[13.5px] text-tx-primary transition-colors hover:border-border-subtle hover:bg-surface-2"
      >
        <span>{current?.label ?? value}</span>
        <Pencil className="ml-auto h-3.5 w-3.5 shrink-0 text-tx-muted opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </div>
  )
}

// ─── Main Profile Page ───

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const [saved, setSaved] = useState(false)

  if (!user) return null

  function handleUpdate(field: keyof UserType, value: string) {
    updateProfile({ [field]: value })
    showSaved()
  }

  function handleSelectUpdate<K extends 'experienceLevel' | 'riskPreference'>(field: K, value: UserType[K]) {
    updateProfile({ [field]: value })
    showSaved()
  }

  function showSaved() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const experienceOptions: Array<{ value: UserType['experienceLevel']; label: string }> = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ]

  const riskOptions: Array<{ value: UserType['riskPreference']; label: string }> = [
    { value: 'conservative', label: 'Conservative' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'aggressive', label: 'Aggressive' },
  ]

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
          <span className="text-[16px] font-bold text-accent">{initials}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-[15px] font-semibold text-tx-primary">{user.name}</h2>
            {saved && (
              <span className="flex items-center gap-1 text-[12px] text-tx-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Saved
              </span>
            )}
          </div>
          <p className="text-[13px] text-tx-muted">{user.email}</p>
          <p className="mt-1 text-[12px] text-tx-muted">
            Member since{' '}
            {new Date(user.createdAt).toLocaleDateString('en-IN', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Personal Information */}
      <div className="rounded-xl border border-border bg-surface-1">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <User className="h-4 w-4 text-tx-muted" />
          <h3 className="text-[13px] font-semibold text-tx-primary">Personal Information</h3>
        </div>
        <div className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
          <EditableField
            label="Full Name"
            value={user.name}
            onSave={(v) => handleUpdate('name', v)}
            placeholder="Your name"
          />
          <EditableField
            label="Email"
            value={user.email}
            onSave={(v) => handleUpdate('email', v)}
            type="email"
            placeholder="you@example.com"
          />
          <EditableField
            label="Phone"
            value={user.phone}
            onSave={(v) => handleUpdate('phone', v)}
            placeholder="+91 98765 43210"
          />
          <EditableField
            label="Date of Birth"
            value={user.dob}
            onSave={(v) => handleUpdate('dob', v)}
            type="date"
            placeholder="YYYY-MM-DD"
          />
          <EditableField
            label="Occupation"
            value={user.occupation}
            onSave={(v) => handleUpdate('occupation', v)}
            placeholder="Your occupation"
          />
          <EditableField
            label="Address"
            value={user.address}
            onSave={(v) => handleUpdate('address', v)}
            placeholder="Your address"
          />
          <div className="sm:col-span-2">
            <EditableField
              label="Bio"
              value={user.bio}
              onSave={(v) => handleUpdate('bio', v)}
              multiline
              placeholder="Tell us about yourself"
            />
          </div>
        </div>
      </div>

      {/* Investment Profile */}
      <div className="rounded-xl border border-border bg-surface-1">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Shield className="h-4 w-4 text-tx-muted" />
          <h3 className="text-[13px] font-semibold text-tx-primary">Investment Profile</h3>
        </div>
        <div className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
          <EditableSelect
            label="Investment Experience"
            value={user.experienceLevel}
            options={experienceOptions}
            onSave={(v) => handleSelectUpdate('experienceLevel', v)}
          />
          <EditableSelect
            label="Risk Appetite"
            value={user.riskPreference}
            options={riskOptions}
            onSave={(v) => handleSelectUpdate('riskPreference', v)}
          />
        </div>
      </div>

      {/* KYC & Payment */}
      <div className="rounded-xl border border-border bg-surface-1">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Shield className="h-4 w-4 text-tx-muted" />
          <h3 className="text-[13px] font-semibold text-tx-primary">KYC & Payment</h3>
        </div>
        <div className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
          <EditableField
            label="PAN Number"
            value={user.pan}
            onSave={(v) => handleUpdate('pan', v)}
            placeholder="ABCDE1234F"
          />
          <EditableField
            label="Aadhaar Number"
            value={user.aadhaar}
            onSave={(v) => handleUpdate('aadhaar', v)}
            placeholder="1234 5678 9012"
          />
          <EditableField
            label="Bank Account"
            value={user.bankAccount}
            onSave={(v) => handleUpdate('bankAccount', v)}
            placeholder="Bank Name ****1234"
          />
          <EditableField
            label="UPI ID"
            value={user.upiId}
            onSave={(v) => handleUpdate('upiId', v)}
            placeholder="name@upi"
          />
        </div>
      </div>
    </div>
  )
}