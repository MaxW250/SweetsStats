import { supabaseServer } from '@/lib/supabase-server'
import { GrowthCharts } from '@/components/charts/GrowthCharts'
import type { StreamSession, Goal } from '@/types'

export default async function GrowthPage() {
  const [sessionsResponse, goalsResponse] = await Promise.all([
    supabaseServer.from('stream_sessions').select('*').order('session_date', { ascending: false }),
    supabaseServer.from('goals').select('*').eq('is_active', true),
  ])

  const sessions = (sessionsResponse.data || []) as StreamSession[]
  const goals = (goalsResponse.data || []) as Goal[]

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">
          Growth Analytics
        </h1>
        <p className="text-gray-600 mt-2">Track your growth over time</p>
      </div>

      <GrowthCharts sessions={sessions} goals={goals} />
    </div>
  )
}
