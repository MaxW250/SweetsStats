export interface StreamSession {
  id: string
  session_date: string
  start_time: string
  end_time: string
  stream_length_minutes: number
  most_viewers: number
  avg_viewers: number
  best_rank: number
  avg_rank: number
  best_gender_rank: number
  avg_gender_rank: number
  page_number: number
  start_followers: number
  end_followers: number
  followers_gained: number
  tips_this_session: number
  members_tipped: number
  usd_per_hour: number
  total_usd_session: number
  notes: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface DailyEarning {
  id: string
  earnings_date: string
  total_usd: number
  total_tokens: number
  number_of_tips: number
  avg_tip_usd: number
  avg_tip_tokens: number
  highest_tipper_username: string | null
  highest_tip_tokens: number | null
  highest_tip_usd: number | null
  number_of_streams: number
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface Tipper {
  id: string
  username: string
  total_tokens_all_time: number
  total_usd_all_time: number
  number_of_tips: number
  biggest_single_tip_tokens: number
  biggest_single_tip_usd: number
  first_seen_date: string
  last_seen_date: string
  notes: string | null
  created_at: string
}

export interface Goal {
  id: string
  goal_type: string
  target_value: number
  current_value: number
  period: string
  month: string | null
  is_active: boolean
  created_at: string
}

export interface Settings {
  key: string
  value: string | number | boolean
  updated_at: string
}

export interface DayScore {
  date: string
  score: number
  usd: number
  tips: number
  viewers: number
  followers: number
}
