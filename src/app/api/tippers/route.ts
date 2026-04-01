import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'total_usd_all_time'
    const limit = searchParams.get('limit') || '100'

    let query = supabaseServer
      .from('tippers')
      .select('*')
      .limit(parseInt(limit))

    if (search) {
      query = query.ilike('username', `%${search}%`)
    }

    query = query.order(sort, { ascending: sort === 'last_seen_date' })

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { data, error } = await supabaseServer
      .from('tippers')
      .insert([body])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
