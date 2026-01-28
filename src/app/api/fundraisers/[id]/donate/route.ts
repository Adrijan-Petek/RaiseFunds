import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createDonation } from '@/lib/payments'

const donateSchema = z.object({
  donorName: z.string().optional(),
  donorAddress: z.string().optional(),
  amount: z.number().positive(),
  message: z.string().optional(),
})

export async function POST(request: NextRequest, context: any) {
  try {
    const rawParams = context?.params
    const params = rawParams && typeof rawParams.then === 'function' ? await rawParams : rawParams
    const id = params?.id
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const body = await request.json()
    const data = donateSchema.parse(body)

    const donation = await createDonation(id, data.amount, data.donorName, data.donorAddress, data.message)
    return NextResponse.json(donation, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create donation' }, { status: 500 })
  }
}