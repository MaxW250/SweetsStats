-- Stream Sessions Table
CREATE TABLE stream_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  stream_length_minutes INTEGER NOT NULL,
  most_viewers INTEGER NOT NULL,
  avg_viewers INTEGER NOT NULL,
  best_rank INTEGER NOT NULL,
  avg_rank INTEGER NOT NULL,
  best_gender_rank INTEGER NOT NULL,
  avg_gender_rank INTEGER NOT NULL,
  page_number INTEGER NOT NULL,
  start_followers INTEGER NOT NULL,
  end_followers INTEGER NOT NULL,
  followers_gained INTEGER GENERATED ALWAYS AS (end_followers - start_followers) STORED,
  tips_this_session INTEGER NOT NULL,
  members_tipped INTEGER NOT NULL,
  usd_per_hour NUMERIC(10, 2) NOT NULL,
  total_usd_session NUMERIC(10, 2) NOT NULL,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Daily Earnings Table
CREATE TABLE daily_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  earnings_date DATE NOT NULL UNIQUE,
  total_usd NUMERIC(10, 2) NOT NULL,
  total_tokens INTEGER NOT NULL,
  number_of_tips INTEGER NOT NULL,
  avg_tip_usd NUMERIC(10, 2) NOT NULL,
  avg_tip_tokens INTEGER NOT NULL,
  highest_tipper_username VARCHAR(255),
  highest_tip_tokens INTEGER,
  highest_tip_usd NUMERIC(10, 2),
  number_of_streams INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tippers Table
CREATE TABLE tippers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) NOT NULL UNIQUE,
  total_tokens_all_time INTEGER NOT NULL,
  total_usd_all_time NUMERIC(10, 2) NOT NULL,
  number_of_tips INTEGER NOT NULL,
  biggest_single_tip_tokens INTEGER NOT NULL,
  biggest_single_tip_usd NUMERIC(10, 2) NOT NULL,
  first_seen_date DATE NOT NULL,
  last_seen_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Goals Table
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_type VARCHAR(255) NOT NULL,
  target_value INTEGER NOT NULL,
  current_value INTEGER NOT NULL,
  period VARCHAR(50) NOT NULL,
  month VARCHAR(7),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Settings Table
CREATE TABLE settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_stream_sessions_date ON stream_sessions(session_date);
CREATE INDEX idx_daily_earnings_date ON daily_earnings(earnings_date);
CREATE INDEX idx_tippers_username ON tippers(username);
CREATE INDEX idx_goals_active ON goals(is_active);
