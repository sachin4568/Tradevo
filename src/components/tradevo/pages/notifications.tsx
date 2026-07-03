'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  Bell,
  Sparkles,
  FileText,
  GraduationCap,
  AlertTriangle,
  Shield,
  DollarSign,
  PieChart,
  Eye,
  Info,
  Zap,
  CheckCircle2,
  IndianRupee,
  Landmark,
  Repeat,
  Calendar,
  BarChart3,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/tradevo/shared/page-header'
import { Button } from '@/components/ui/button'
import { mockNotifications } from '@/lib/mock-data'

/* ───────────────────────────── Types ───────────────────────────── */

type NotifType = (typeof mockNotifications)[number]['type']
type FilterTab = 'all' | NotifType

/* ───────────────────────────── Icon Map ───────────────────────────── */

const ICON_MAP: Record<string, LucideIcon> = {
  TrendingUp,
  Bell,
  Sparkles,
  FileText,
  GraduationCap,
  AlertTriangle,
  Shield,
  DollarSign,
  PieChart,
  Eye,
  Info,
  Zap,
  IndianRupee,
  Landmark,
  Repeat,
  Calendar,
  BarChart3,
  ShieldAlert,
}

/* ───────────────────────────── Helpers ───────────────────────────── */

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'market', label: 'Market' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'ai', label: 'AI' },
  { value: 'research', label: 'Research' },
  { value: 'learning', label: 'Learning' },
  { value: 'alert', label: 'Alerts' },
  { value: 'watchlist', label: 'Watchlist' },
]

const TYPE_COLORS: Record<string, { bg: string; text: string; iconBg: string }> = {
  market: { bg: 'bg-tv-blue-muted', text: 'text-tv-blue', iconBg: 'bg-tv-blue-muted' },
  portfolio: { bg: 'bg-tv-emerald-muted', text: 'text-tv-emerald', iconBg: 'bg-tv-emerald-muted' },
  ai: { bg: 'bg-tv-cyan-muted', text: 'text-tv-cyan', iconBg: 'bg-tv-cyan-muted' },
  research: { bg: 'bg-tv-amber-muted', text: 'text-tv-amber', iconBg: 'bg-tv-amber-muted' },
  learning: { bg: 'bg-tv-emerald-muted', text: 'text-tv-emerald', iconBg: 'bg-tv-emerald-muted' },
  alert: { bg: 'bg-tv-coral-muted', text: 'text-tv-coral', iconBg: 'bg-tv-coral-muted' },
  watchlist: { bg: 'bg-tv-blue-muted', text: 'text-tv-blue', iconBg: 'bg-tv-blue-muted' },
}

/* ───────────────────────────── Notification Card ───────────────────────────── */

function NotificationCard({
  notification,
  index,
  onMarkRead,
}: {
  notification: (typeof mockNotifications)[number]
  index: number
  onMarkRead: (id: string) => void
}) {
  const colors = TYPE_COLORS[notification.type] ?? TYPE_COLORS['ai']
  const IconComponent = ICON_MAP[notification.icon] ?? Info

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => {
        if (!notification.read) onMarkRead(notification.id)
      }}
      className={cn(
        'surface-card-static p-4 flex items-start gap-4 transition-colors cursor-pointer',
        notification.read
          ? 'opacity-60'
          : cn(
              'border-l-2',
              notification.type === 'market' && 'border-l-tv-blue',
              notification.type === 'portfolio' && 'border-l-tv-emerald',
              notification.type === 'ai' && 'border-l-tv-cyan',
              notification.type === 'research' && 'border-l-tv-amber',
              notification.type === 'learning' && 'border-l-tv-emerald',
              notification.type === 'alert' && 'border-l-tv-coral',
              notification.type === 'watchlist' && 'border-l-tv-blue'
            )
      )}
    >
      {/* Icon circle */}
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full shrink-0',
          colors.iconBg
        )}
      >
        <IconComponent className={cn('size-4.5', colors.text)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm leading-snug',
              notification.read
                ? 'font-medium text-text-secondary'
                : 'font-medium text-text-primary'
            )}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <span className="flex h-2 w-2 rounded-full bg-tv-cyan shrink-0 mt-1.5 animate-pulse-soft" />
          )}
        </div>
        <p className="text-sm text-text-secondary mt-1 leading-relaxed line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-text-tertiary mt-2">{notification.time}</p>
      </div>
    </motion.div>
  )
}

/* ───────────────────────────── Empty State ───────────────────────────── */

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-tv-emerald-muted mb-4">
        <CheckCircle2 className="size-7 text-tv-emerald" />
      </div>
      <p className="text-sm font-medium text-text-secondary">
        No notifications in this category
      </p>
      <p className="text-xs text-text-tertiary mt-1.5 max-w-[240px]">
        You&apos;re all caught up!
      </p>
    </motion.div>
  )
}

/* ───────────────────────────── Notifications Page ───────────────────────────── */

export function NotificationsPage() {
  const [filter, setFilter] = useState<FilterTab>('all')
  const [localNotifications, setLocalNotifications] = useState(mockNotifications)
  const unreadCount = localNotifications.filter((n) => !n.read).length

  const filteredNotifications = useMemo(
    () =>
      filter === 'all'
        ? localNotifications
        : localNotifications.filter((n) => n.type === filter),
    [filter, localNotifications]
  )

  const handleMarkAllRead = () => {
    setLocalNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleMarkRead = (id: string) => {
    setLocalNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Notifications"
        actions={
          unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-tv-cyan hover:text-tv-cyan hover:bg-tv-cyan-muted"
            >
              <CheckCircle2 className="size-3.5" />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {/* Unread indicator */}
      {unreadCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <span className="flex h-2 w-2 rounded-full bg-tv-cyan" />
          <span>
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-surface-1 rounded-lg overflow-x-auto">
        {FILTER_TABS.map((tab) => {
          const count =
            tab.value === 'all'
              ? localNotifications.length
              : localNotifications.filter((n) => n.type === tab.value).length
          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap',
                filter === tab.value
                  ? 'bg-surface-3 text-text-primary shadow-sm'
                  : 'text-text-tertiary hover:text-text-secondary'
              )}
            >
              {tab.label}
              <span className="ml-1 opacity-60">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Notification Cards */}
      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin pr-1">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif, i) => (
              <NotificationCard
                key={notif.id}
                notification={notif}
                index={i}
                onMarkRead={handleMarkRead}
              />
            ))
          ) : (
            <EmptyState />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}