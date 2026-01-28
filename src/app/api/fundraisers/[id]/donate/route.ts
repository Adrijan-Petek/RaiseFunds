import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createDonation } from '@/lib/payments'

const donateSchema = z.object({
  donorName: z.string().optional(),
  donorAddress: z.string().optional(),
  amount: z.number().positive(),
  message: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = donateSchema.parse(body)

    const donation = await createDonation(params.id, data.donorName, data.donorAddress, data.amount, data.message)
    return NextResponse.json(donation, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create donation' }, { status: 500 })
  }
}