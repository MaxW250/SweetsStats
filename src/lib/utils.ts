export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatTokens(amount: number): string {
  return `${amount.toLocaleString()} tokens`
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string, time: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(`${date}T${time}`))
}

export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  const remaining = mins % 60
  if (remaining === 0) return `${hours}h`
  return `${hours}h ${remaining}m`
}

export function computeDayScore(
  usd: number,
  tips: number,
  viewers: number,
  followers: number,
  weights: { usd: number; tips: number; viewers: number; followers: number }
): number {
  const normalizedUsd = Math.min(usd / 500, 1)
  const normalizedTips = Math.min(tips / 300, 1)
  const normalizedViewers = Math.min(viewers / 1000, 1)
  const normalizedFollowers = Math.min(followers / 50, 1)

  return (
    normalizedUsd * weights.usd +
    normalizedTips * weights.tips +
    normalizedViewers * weights.viewers +
    normalizedFollowers * weights.followers
  ) * 100
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getDateRange(days: number): { start: string; end: string } {
  const end = new Date()
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

export function getDayOfWeek(date: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[new Date(date).getDay()]
}

export function getMonthYear(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function getLast12Months(): string[] {
  const months = []
  for (let i = 11; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}
