import { NextRequest, NextResponse } from 'next/server'
import { confirmDonation } from '@/lib/payments'

export async function POST(request: NextRequest, context: any) {
  try {
    const rawParams = context?.params
    const params = rawParams && typeof rawParams.then === 'function' ? await rawParams : rawParams
    const id = params?.id
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await confirmDonation(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 400 })
  }
}