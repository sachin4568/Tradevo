import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TrendingUp, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
})

type FormData = z.infer<typeof schema>

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(data: FormData) {
    setServerError('')
    try {
      await login(data.email, data.password)
      const from = (window as any).__loginRedirect || '/dashboard'
      delete (window as any).__loginRedirect
      navigate(from, { replace: true })
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-0 px-4">
      <div className="w-full max-w-[380px]">
        {/* Brand */}
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-subtle">
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-tx-primary">
            Tradevo
          </span>
        </div>

        {/* Form card */}
        <div className="rounded-xl border border-border bg-surface-1 p-6">
          <h1 className="mb-1 text-[16px] font-semibold text-tx-primary">
            Welcome back
          </h1>
          <p className="mb-6 text-[13px] text-tx-muted">
            Sign in to your account
          </p>

          {serverError && (
            <div className="mb-4 rounded-lg border border-tx-danger/20 bg-tx-danger/5 px-3.5 py-2.5 text-[13px] text-tx-danger">
              {serverError}
            </div>
          )}

          <form
            className="space-y-4"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2.5 text-[13.5px] text-tx-primary outline-none transition-colors placeholder:text-tx-muted focus:border-accent/40"
              />
              {errors.email && (
                <p className="mt-1 text-[12px] text-tx-danger">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password')}
                  className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2.5 pr-10 text-[13.5px] text-tx-primary outline-none transition-colors placeholder:text-tx-muted focus:border-accent/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-tx-muted transition-colors hover:text-tx-secondary"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-[12px] text-tx-danger">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-[13.5px] font-semibold text-surface-0 transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[13px] text-tx-muted">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-accent transition-colors hover:text-accent-hover"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}