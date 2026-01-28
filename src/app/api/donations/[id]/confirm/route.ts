import { NextRequest, NextResponse } from 'next/server'
import { confirmDonation } from '@/lib/payments'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await confirmDonation(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}