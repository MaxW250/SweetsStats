import { Card, CardBody } from '@heroui/react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  accent?: string
  icon?: React.ReactNode
}

export function StatCard({ title, value, subtitle, accent, icon }: StatCardProps) {
  return (
    <Card
      className={cn('border border-gray-100 shadow-none', accent)}
      radius="lg"
    >
      <CardBody className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide truncate">
              {title}
            </p>
            <p className="text-2xl font-serif font-bold text-gray-900 mt-1 truncate">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1.5 truncate">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="text-coral shrink-0">{icon}</div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
