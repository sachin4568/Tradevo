import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { X, AlertCircle, Brain, TrendingUp, TrendingDown, Shield } from 'lucide-react'
import { useCompany } from '@/hooks/useCompanies'
import { usePortfolioStore } from '@/stores/portfolioStore'

const orderSchema = z.object({
  quantity: z.number({ invalid_type_error: 'Enter a valid number' }).int().positive('Quantity must be > 0'),
  price: z.number().optional(),
})

type OrderForm = z.infer<typeof orderSchema>

interface TradePanelProps {
  companyId: string
  action: 'buy' | 'sell'
  onClose: () => void
}

type OrderType = 'market' | 'limit' | 'stoploss'

export default function TradePanel({ companyId, action, onClose }: TradePanelProps) {
  const { data: company } = useCompany(companyId)
  const buy = usePortfolioStore(s => s.buy)
  const sell = usePortfolioStore(s => s.sell)
  const holdings = usePortfolioStore(s => s.holdings)
  const virtualCash = usePortfolioStore(s => s.virtualCash)
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>(action)
  const [orderType, setOrderType] = useState<OrderType>('market')
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrderForm>({
    resolver: zodResolver(orderSchema),
    defaultValues: { quantity: undefined, price: undefined },
  })

  const quantity = watch('quantity') || 0
  const price = watch('price') || (company?.currentPrice ?? 0)
  const total = quantity * price

  const maxBuyQty = company ? Math.floor(virtualCash / company.currentPrice) : 0
  const currentHolding = holdings.find(h => h.companyId === companyId)
  const maxSellQty = currentHolding?.quantity ?? 0
  const canSell = currentHolding && currentHolding.quantity > 0

  const estimatedCost = useMemo(() => ({
    total: total,
    charges: total * 0.0003 + 20, // simplified broker + exchange charges
    totalWithCharges: total + total * 0.0003 + 20,
  }), [total])

  function onSubmit(data: OrderForm) {
    if (!company) return
    setError('')
    try {
      const execPrice = orderType === 'market' ? company.currentPrice : (data.price ?? company.currentPrice)
      if (activeTab === 'buy') {
        buy(companyId, data.quantity, execPrice)
      } else {
        sell(companyId, data.quantity, execPrice)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed')
    }
  }

  if (!company) return null

  const isBuy = activeTab === 'buy'
  const accentColor = isBuy ? '#34d399' : '#f87171'

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 z-50 flex h-full w-[360px] flex-col border-l border-border bg-surface-1 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          {isBuy ? <TrendingUp className="h-4 w-4 text-tx-success" /> : <TrendingDown className="h-4 w-4 text-tx-danger" />}
          <span className="text-[13.5px] font-semibold text-tx-primary">{isBuy ? 'Buy' : 'Sell'} {company.symbol}</span>
        </div>
        <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-tx-muted hover:bg-surface-2 hover:text-tx-primary">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Buy/Sell Toggle */}
      <div className="flex border-b border-border">
        <button
          onClick={() => { setActiveTab('buy'); setError('') }}
          className={`flex-1 py-2.5 text-[13px] font-semibold transition-colors ${isBuy ? 'text-tx-success border-b-2 border-tx-success' : 'text-tx-muted hover:text-tx-secondary'}`}
        >Buy</button>
        <button
          onClick={() => { setActiveTab('sell'); setError('') }}
          className={`flex-1 py-2.5 text-[13px] font-semibold transition-colors ${!isBuy ? 'text-tx-danger border-b-2 border-tx-danger' : 'text-tx-muted hover:text-tx-secondary'}`}
        >Sell</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Order Type */}
        <div>
          <p className="text-[11px] font-semibold text-tx-muted mb-2">Order Type</p>
          <div className="grid grid-cols-3 gap-1.5">
            {([['market', 'Market'], ['limit', 'Limit'], ['stoploss', 'Stop Loss']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setOrderType(val)}
                className={`rounded-lg py-2 text-[12px] font-medium transition-colors ${
                  orderType === val ? 'bg-accent-subtle text-accent' : 'bg-surface-2 text-tx-secondary hover:bg-surface-3'
                }`}
              >{label}</button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[12px] font-medium text-tx-secondary">Quantity</label>
            {isBuy && <span className="text-[10.5px] text-tx-muted">Max: {maxBuyQty}</span>}
            {!isBuy && <span className="text-[10.5px] text-tx-muted">Available: {maxSellQty}</span>}
          </div>
          <input
            type="number"
            {...register('quantity', { valueAsNumber: true })}
            className="w-full rounded-lg border border-border bg-surface-input px-3 py-2.5 text-[14px] text-tx-primary outline-none focus:border-accent"
            placeholder="Enter quantity"
          />
          {errors.quantity && <p className="mt-1 text-[11px] text-tx-danger">{errors.quantity.message}</p>}
          {/* Quick quantity buttons */}
          <div className="mt-2 flex gap-1.5">
            {[1, 5, 10, 25, 50, 100].map(q => (
              <button
                key={q}
                onClick={() => setValue('quantity', q)}
                className="flex-1 rounded bg-surface-2 py-1.5 text-[10.5px] font-medium text-tx-secondary hover:bg-surface-3"
              >{q}</button>
            ))}
          </div>
        </div>

        {/* Price (for Limit/Stop Loss) */}
        {orderType !== 'market' && (
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-tx-secondary">
              {orderType === 'limit' ? 'Limit Price' : 'Trigger Price'}
            </label>
            <input
              type="number"
              {...register('price', { valueAsNumber: true })}
              className="w-full rounded-lg border border-border bg-surface-input px-3 py-2.5 text-[14px] text-tx-primary outline-none focus:border-accent"
              placeholder="Enter price"
            />
          </div>
        )}

        {/* Price Summary */}
        <div className="rounded-lg border border-border-subtle bg-surface-2 p-3 space-y-1.5">
          <div className="flex justify-between text-[12px]">
            <span className="text-tx-muted">Current Price</span>
            <span className="font-medium text-tx-primary">₹{company.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className="text-tx-muted">Estimated Cost</span>
            <span className="font-semibold text-tx-primary">₹{estimatedCost.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className="text-tx-muted">Charges (approx)</span>
            <span className="text-tx-secondary">₹{estimatedCost.charges.toFixed(2)}</span>
          </div>
        </div>

        {/* Available Balance / Holdings */}
        <div className="rounded-lg border border-border-subtle bg-surface-2 p-3 space-y-1.5">
          <div className="flex justify-between text-[12px]">
            <span className="text-tx-muted">{isBuy ? 'Available Cash' : 'Available Holdings'}</span>
            <span className="font-medium text-tx-primary">
              {isBuy ? `₹${virtualCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : `${maxSellQty} shares`}
            </span>
          </div>
          {isBuy ? (
            <div className="flex justify-between text-[12px]">
              <span className="text-tx-muted">After Order</span>
              <span className={`font-medium ${virtualCash - estimatedCost.totalWithCharges >= 0 ? 'text-tx-primary' : 'text-tx-danger'}`}>
                ₹{Math.max(0, virtualCash - estimatedCost.totalWithCharges).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ) : currentHolding ? (
            <div className="flex justify-between text-[12px]">
              <span className="text-tx-muted">Avg. Buy Price</span>
              <span className="font-medium text-tx-primary">₹{currentHolding.avgPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          ) : null}
        </div>

        {/* AI Recommendation */}
        <div className="rounded-lg border border-accent/20 bg-accent-subtle/30 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Brain className="h-3.5 w-3.5 text-accent" />
            <span className="text-[11.5px] font-semibold text-accent">AI Recommendation</span>
          </div>
          <p className="text-[11.5px] leading-relaxed text-tx-secondary">
            Strong institutional buying detected. Stock trading above key moving averages. Consider a {company.dayChangePercent > 0 ? 'buy on minor dips' : 'wait for consolidation before entry'}. Risk-reward favorable at current levels.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Shield className="h-3 w-3 text-tx-muted" />
            <span className="text-[10.5px] text-tx-muted">Confidence: 72% &middot; Risk: Moderate</span>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 flex items-center gap-2 rounded-lg bg-tx-danger/10 px-3 py-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-tx-danger" />
          <p className="text-[12px] text-tx-danger">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <form onSubmit={handleSubmit(onSubmit)} className="border-t border-border p-4">
        <div className="flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-lg border border-border py-2.5 text-[13px] font-medium text-tx-secondary transition-colors hover:bg-surface-2">
            Cancel
          </button>
          <button type="submit" disabled={!isBuy && !canSell}
            className={`flex-1 rounded-lg py-2.5 text-[13px] font-semibold text-white transition-colors ${
              isBuy ? 'bg-tx-success hover:bg-tx-success/90' : canSell ? 'bg-tx-danger hover:bg-tx-danger/90' : 'bg-tx-danger/30 cursor-not-allowed'
            }`}>
            {isBuy ? 'Buy' : 'Sell'} {company.symbol}
          </button>
        </div>
      </form>
    </motion.div>
  )
}