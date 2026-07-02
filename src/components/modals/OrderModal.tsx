import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, AlertCircle } from 'lucide-react'
import { useCompany } from '@/hooks/useCompanies'
import { usePortfolioStore } from '@/stores/portfolioStore'

const orderSchema = z.object({
  quantity: z
    .number({ invalid_type_error: 'Enter a valid number' })
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than zero'),
})

type OrderForm = z.infer<typeof orderSchema>

interface OrderModalProps {
  companyId: string
  action: 'buy' | 'sell'
  onClose: () => void
}

export default function OrderModal({
  companyId,
  action,
  onClose,
}: OrderModalProps) {
  const { data: company, isLoading } = useCompany(companyId)
  const buy = usePortfolioStore((s) => s.buy)
  const sell = usePortfolioStore((s) => s.sell)
  const holdings = usePortfolioStore((s) => s.holdings)
  const virtualCash = usePortfolioStore((s) => s.virtualCash)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OrderForm>({
    resolver: zodResolver(orderSchema),
    defaultValues: { quantity: undefined },
  })

  const quantity = watch('quantity') || 0
  const total = company ? quantity * company.currentPrice : 0

  const maxBuyQty = company
    ? Math.floor(virtualCash / company.currentPrice)
    : 0
  const currentHolding = holdings.find((h) => h.companyId === companyId)
  const maxSellQty = currentHolding?.quantity ?? 0

  function onSubmit(data: OrderForm) {
    if (!company) return
    setError('')
    try {
      if (action === 'buy') {
        buy(companyId, data.quantity, company.currentPrice)
      } else {
        sell(companyId, data.quantity, company.currentPrice)
      }
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Transaction failed',
      )
    }
  }

  if (isLoading || !company) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-surface-1 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-tx-primary">
              {action === 'buy' ? 'Buy' : 'Sell'} {company.symbol}
            </h2>
            <p className="text-[12.5px] text-tx-muted">{company.name}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-tx-muted transition-colors hover:bg-surface-2 hover:text-tx-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Price info */}
        <div className="mb-4 rounded-lg border border-border-subtle bg-surface-2 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] text-tx-muted">
              Current Price
            </span>
            <span className="text-[14px] font-semibold text-tx-primary">
              ₹
              {company.currentPrice.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[12.5px] text-tx-muted">
              Available {action === 'buy' ? 'Cash' : 'Qty'}
            </span>
            <span className="text-[13px] text-tx-secondary">
              {action === 'buy'
                ? `₹${virtualCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                : maxSellQty.toLocaleString('en-IN')}
            </span>
          </div>
          {action === 'buy' && maxBuyQty > 0 && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[12.5px] text-tx-muted">Max Buy Qty</span>
              <span className="text-[13px] text-tx-secondary">
                {maxBuyQty.toLocaleString('en-IN')}
              </span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-tx-secondary">
              Quantity
            </label>
            <input
              type="number"
              {...register('quantity', { valueAsNumber: true })}
              className="w-full rounded-lg border border-border bg-surface-input px-3 py-2.5 text-[14px] text-tx-primary outline-none focus:border-accent"
              placeholder="Enter quantity"
            />
            {errors.quantity && (
              <p className="mt-1 text-[12px] text-tx-danger">
                {errors.quantity.message}
              </p>
            )}
          </div>

          {/* Total preview */}
          <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-2 p-3">
            <span className="text-[12.5px] text-tx-muted">
              Estimated Total
            </span>
            <span className="text-[15px] font-semibold text-tx-primary">
              ₹
              {total.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-tx-danger/10 px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-tx-danger" />
              <p className="text-[12.5px] text-tx-danger">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 text-[13.5px] font-medium text-tx-secondary transition-colors hover:bg-surface-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 rounded-lg px-4 py-2.5 text-[13.5px] font-semibold transition-colors ${
                action === 'buy'
                  ? 'bg-tx-success text-surface-0 hover:bg-tx-success/90'
                  : 'bg-tx-danger text-surface-0 hover:bg-tx-danger/90'
              }`}
            >
              {action === 'buy' ? 'Buy' : 'Sell'} {company.symbol}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}