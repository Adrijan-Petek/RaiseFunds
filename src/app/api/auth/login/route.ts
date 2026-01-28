import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { password } = body

  if (password === process.env.CREATOR_PASSWORD) {
    const response = NextResponse.json({ success: true })
    response.cookies.set('creator_session', 'logged_in', { httpOnly: true, maxAge: 60 * 60 * 24 }) // 1 day
    return response
  }
  return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
}