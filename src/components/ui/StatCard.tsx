import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  accent?: string
  icon?: React.ReactNode
}

export function StatCard({ title, value, subtitle, accent = 'bg-gray-50', icon }: StatCardProps) {
  return (
    <div className={cn('rounded-lg border border-gray-200 p-6', accent)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-2xl font-serif font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
        </div>
        {icon && <div className="text-coral text-2xl">{icon}</div>}
      </div>
    </div>
  )
}
