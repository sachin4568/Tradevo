import { useState } from 'react'
import { User, Shield, CheckCircle2, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import type { User as UserType } from '@/types/auth'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  riskPreference: z.enum(['conservative', 'moderate', 'aggressive']),
})

type FormData = z.infer<typeof schema>

const experienceLabels: Record<UserType['experienceLevel'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

const riskLabels: Record<UserType['riskPreference'], string> = {
  conservative: 'Conservative — Prioritize capital protection',
  moderate: 'Moderate — Balanced growth and risk',
  aggressive: 'Aggressive — Maximize returns',
}

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: user
      ? {
          name: user.name,
          experienceLevel: user.experienceLevel,
          riskPreference: user.riskPreference,
        }
      : undefined,
  })

  if (!user) return null

  async function onSubmit(data: FormData) {
    try {
      updateProfile(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // Profile update is local-only in M6
    }
  }

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

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
          <span className="text-[16px] font-bold text-accent">
            {initials}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-semibold text-tx-primary">
            {user.name}
          </h2>
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

      {/* Editable form */}
      <div className="rounded-xl border border-border bg-surface-1">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <User className="h-4 w-4 text-tx-muted" />
          <h3 className="text-[13px] font-semibold text-tx-primary">
            Personal Information
          </h3>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-5">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">
              Full Name
            </label>
            <input
              type="text"
              {...register('name')}
              className="w-full max-w-sm rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2.5 text-[13.5px] text-tx-primary outline-none transition-colors placeholder:text-tx-muted focus:border-accent/40"
            />
            {errors.name && (
              <p className="mt-1 text-[12px] text-tx-danger">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">
              Investment Experience
            </label>
            <div className="flex gap-3">
              {(Object.keys(experienceLabels) as Array<UserType['experienceLevel']>).map(
                (level) => (
                  <label
                    key={level}
                    className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-[13px] text-tx-secondary transition-colors has-[:checked]:border-accent/40 has-[:checked]:bg-accent-subtle has-[:checked]:text-accent cursor-pointer"
                  >
                    <input
                      type="radio"
                      value={level}
                      {...register('experienceLevel')}
                      className="accent-accent"
                    />
                    {experienceLabels[level]}
                  </label>
                ),
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">
              Risk Preference
            </label>
            <div className="flex flex-col gap-2">
              {(Object.keys(riskLabels) as Array<UserType['riskPreference']>).map(
                (level) => (
                  <label
                    key={level}
                    className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-4 py-3 text-[13px] text-tx-secondary transition-colors has-[:checked]:border-accent/40 has-[:checked]:bg-accent-subtle has-[:checked]:text-accent cursor-pointer"
                  >
                    <input
                      type="radio"
                      value={level}
                      {...register('riskPreference')}
                      className="accent-accent"
                    />
                    {riskLabels[level]}
                  </label>
                ),
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-[13px] font-semibold text-surface-0 transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : null}
              {saved ? 'Saved' : isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Security placeholder */}
      <div className="rounded-xl border border-border bg-surface-1">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Shield className="h-4 w-4 text-tx-muted" />
          <h3 className="text-[13px] font-semibold text-tx-primary">
            Security
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Shield className="mb-2.5 h-8 w-8 text-tx-muted/40" />
          <p className="max-w-xs text-[13px] text-tx-muted">
            Password management and account security settings will be
            configured here when the backend is connected.
          </p>
        </div>
      </div>
    </div>
  )
}