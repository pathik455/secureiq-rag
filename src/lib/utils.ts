import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const diffInSeconds = Math.round((new Date(date).getTime() - Date.now()) / 1000)

  if (Math.abs(diffInSeconds) < 60) return rtf.format(diffInSeconds, 'second')
  const diffInMinutes = Math.round(diffInSeconds / 60)
  if (Math.abs(diffInMinutes) < 60) return rtf.format(diffInMinutes, 'minute')
  const diffInHours = Math.round(diffInMinutes / 60)
  if (Math.abs(diffInHours) < 24) return rtf.format(diffInHours, 'hour')
  const diffInDays = Math.round(diffInHours / 24)
  return rtf.format(diffInDays, 'day')
}

export function getSeverityBadgeClass(severity: string): string {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-500/15 text-red-400 border border-red-500/30'
    case 'HIGH':
      return 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
    case 'MEDIUM':
      return 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
    case 'LOW':
      return 'bg-[#00FF29]/15 text-[#00FF29] border border-[#00FF29]/30'
    case 'INFO':
    default:
      return 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
  }
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
    case 'IN_PROGRESS':
      return 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
    case 'RESOLVED':
    case 'COMPLETED':
      return 'bg-[#00FF29]/15 text-[#00FF29] border border-[#00FF29]/30 shadow-sm shadow-[#00FF29]/10'
    case 'FALSE_POSITIVE':
    case 'CANCELLED':
      return 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30'
    case 'DEFERRED':
    case 'PENDING':
    default:
      return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
  }
}
