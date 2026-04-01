import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { password } = await req.json()

    if (password === process.env.DASHBOARD_PASSWORD) {
      const response = NextResponse.json({ success: true })
      response.cookies.set('ss_auth', 'authenticated', {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
        sameSite: 'lax',
      })
      return response
    }

    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
