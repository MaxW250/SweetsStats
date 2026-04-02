import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

// Chaturbate public API — check if a model is currently live
// Docs: https://chaturbate.com/affiliates/ (uses the onlinerooms endpoint)
const CB_API_URL = 'https://chaturbate.com/api/public/affiliates/onlinerooms/'

interface ChaturbateRoom {
  username: string
  current_show: string
  num_users: number
  num_followers: number
  display_name: string
  subject: string
  image_url: string
  is_new: boolean
  spoken_languages: string
  tags: string[]
}

interface ChaturbateResponse {
  count: number
  next: string | null
  previous: string | null
  results: ChaturbateRoom[]
}

export async function POST(req: NextRequest) {
  try {
    const { username, apiKey } = await req.json()

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    // Build the Chaturbate API URL
    // If apiKey (affiliate/wm code) is provided use it, otherwise use public endpoint
    const params = new URLSearchParams({
      format: 'json',
      username: username.toLowerCase(),
      limit: '1',
    })
    if (apiKey) {
      params.set('wm', apiKey)
    }

    const apiUrl = `${CB_API_URL}?${params.toString()}`

    let cbData: ChaturbateResponse
    try {
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'SweetsStats Dashboard/1.0',
        },
        next: { revalidate: 0 },
      })

      if (!response.ok) {
        throw new Error(`Chaturbate API returned ${response.status}`)
      }

      cbData = await response.json()
    } catch (fetchErr) {
      console.error('Chaturbate API fetch error:', fetchErr)
      return NextResponse.json(
        { error: 'Could not reach Chaturbate API. Check your username/key.' },
        { status: 502 }
      )
    }

    // Check if the model is in the results (means she's live)
    const room = cbData.results?.find(
      (r) => r.username.toLowerCase() === username.toLowerCase()
    )

    if (!room) {
      return NextResponse.json({ live: false, viewers: 0, message: 'Not currently live' })
    }

    // Model is live — log a session if one doesn't already exist for today
    const supabase = supabaseServer
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // Check for existing session today
    const { data: existing } = await supabase
      .from('stream_sessions')
      .select('id')
      .eq('session_date', today)
      .limit(1)

    if (!existing || existing.length === 0) {
      // Insert a new session with current viewer count
      const nowTime = new Date().toTimeString().split(' ')[0] // HH:MM:SS

      const { error: insertErr } = await supabase.from('stream_sessions').insert({
        session_date: today,
        start_time: nowTime,
        avg_viewers: room.num_users,
        peak_viewers: room.num_users,
        followers_gained: 0,
        new_followers: room.num_followers,
        total_tokens: 0,
        notes: room.subject ? `Room: ${room.subject}` : null,
      })

      if (insertErr) {
        console.error('Failed to insert session:', insertErr)
        return NextResponse.json(
          { live: true, viewers: room.num_users, message: 'Live but failed to log session', error: insertErr.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        live: true,
        viewers: room.num_users,
        followers: room.num_followers,
        subject: room.subject,
        message: 'Live — new session logged!',
        sessionCreated: true,
      })
    }

    // Session already exists — just return live status
    return NextResponse.json({
      live: true,
      viewers: room.num_users,
      followers: room.num_followers,
      subject: room.subject,
      message: 'Live — session already logged for today',
      sessionCreated: false,
    })
  } catch (err) {
    console.error('Chaturbate sync error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET — lightweight status check (can be polled)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const username = searchParams.get('username')

  if (!username) {
    return NextResponse.json({ error: 'username query param required' }, { status: 400 })
  }

  const params = new URLSearchParams({
    format: 'json',
    username: username.toLowerCase(),
    limit: '1',
  })

  try {
    const response = await fetch(`${CB_API_URL}?${params.toString()}`, {
      next: { revalidate: 60 }, // cache for 60s
    })
    const data: ChaturbateResponse = await response.json()
    const room = data.results?.find(
      (r) => r.username.toLowerCase() === username.toLowerCase()
    )

    return NextResponse.json({
      live: !!room,
      viewers: room?.num_users ?? 0,
      subject: room?.subject ?? null,
    })
  } catch {
    return NextResponse.json({ error: 'API error' }, { status: 502 })
  }
}
