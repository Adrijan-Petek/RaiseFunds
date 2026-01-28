import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { walletAddress } = body

  // For MVP, accept any wallet address as valid
  // In production, you might want to verify ownership or use a whitelist
  if (walletAddress && walletAddress.startsWith('0x') && walletAddress.length === 42) {
    const response = NextResponse.json({ success: true })
    response.cookies.set('creator_wallet', walletAddress, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    return response
  }
  return NextResponse.json({ error: 'Invalid wallet address' }, { status: 401 })
}