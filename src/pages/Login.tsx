import { Link } from 'react-router-dom'
import { useState } from 'react'
import { TrendingUp, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)

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

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2.5 text-[13.5px] text-tx-primary outline-none transition-colors placeholder:text-tx-muted focus:border-accent/40"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
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
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-[12.5px] text-tx-secondary">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-border accent-accent"
                />
                Remember me
              </label>
              <button
                type="button"
                className="text-[12.5px] font-medium text-accent transition-colors hover:text-accent-hover"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-accent py-2.5 text-[13.5px] font-semibold text-surface-0 transition-colors hover:bg-accent-hover"
            >
              Sign In
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