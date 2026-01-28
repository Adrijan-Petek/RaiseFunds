import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'ENDED', 'HIDDEN']),
})

// Mock data for detailed fundraiser view
const mockFundraiserDetails = {
  '1': {
    id: '1',
    title: 'Help fund surgery costs',
    description: 'Supporting urgent medical expenses. Any amount helps.',
    goalAmount: 5,
    totalRaisedCached: 2.14,
    coverImageUrl: null,
    category: 'Medical',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    beneficiaryAddress: '0x123...',
    creator: { username: 'creator1' },
    donations: [
      { id: 'd1', amount: 0.5, donorAddress: '0xabc...', createdAt: new Date('2024-01-15') },
      { id: 'd2', amount: 1.0, donorAddress: '0xdef...', createdAt: new Date('2024-01-16') },
    ],
    updates: []
  },
  '2': {
    id: '2',
    title: 'Community garden project',
    description: 'Building a sustainable community garden for local families.',
    goalAmount: 10,
    totalRaisedCached: 7.5,
    coverImageUrl: null,
    category: 'Community',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-02'),
    beneficiaryAddress: '0x456...',
    creator: { username: 'creator2' },
    donations: [
      { id: 'd3', amount: 2.0, donorAddress: '0xghi...', createdAt: new Date('2024-01-10') },
    ],
    updates: []
  },
  '3': {
    id: '3',
    title: 'Open source development',
    description: 'Funding development of an open source tool for developers.',
    goalAmount: 15,
    totalRaisedCached: 12.8,
    coverImageUrl: null,
    category: 'Open source',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-03'),
    beneficiaryAddress: '0x789...',
    creator: { username: 'creator3' },
    donations: [],
    updates: []
  }
}

export async function GET(request: NextRequest, context: any) {
  try {
    const rawParams = context?.params
    const params = rawParams && typeof rawParams.then === 'function' ? await rawParams : rawParams
    const id = params?.id
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const fundraiser = mockFundraiserDetails[id as keyof typeof mockFundraiserDetails]
    if (!fundraiser) {
      return NextResponse.json({ error: 'Fundraiser not found' }, { status: 404 })
    }
    return NextResponse.json(fundraiser)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch fundraiser' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: any) {
  try {
    const rawParams = context?.params
    const params = rawParams && typeof rawParams.then === 'function' ? await rawParams : rawParams
    const id = params?.id
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const body = await request.json()
    const data = updateStatusSchema.parse(body)

    // Mock update - in a real app this would update the database
    const fundraiser = mockFundraiserDetails[id as keyof typeof mockFundraiserDetails]
    if (!fundraiser) {
      return NextResponse.json({ error: 'Fundraiser not found' }, { status: 404 })
    }

    const updatedFundraiser = { ...fundraiser, status: data.status }
    return NextResponse.json(updatedFundraiser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update fundraiser' }, { status: 500 })
  }
}