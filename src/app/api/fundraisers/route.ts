import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createFundraiserSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  goalAmount: z.number().positive(),
  beneficiaryAddress: z.string(),
  coverImageUrl: z.string().optional(),
  category: z.string().min(1),
  deadline: z.string().optional(),
})

// Mock data for fundraisers
const mockFundraisers = [
  {
    id: '1',
    title: 'Help fund surgery costs',
    description: 'Supporting urgent medical expenses. Any amount helps.',
    goalAmount: 5,
    totalRaisedCached: 2.14,
    coverImageUrl: null,
    category: 'Medical',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    creator: { username: 'creator1' },
    _count: { donations: 12 }
  },
  {
    id: '2',
    title: 'Community garden project',
    description: 'Building a sustainable community garden for local families.',
    goalAmount: 10,
    totalRaisedCached: 7.5,
    coverImageUrl: null,
    category: 'Community',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-02'),
    creator: { username: 'creator2' },
    _count: { donations: 25 }
  },
  {
    id: '3',
    title: 'Open source development',
    description: 'Funding development of an open source tool for developers.',
    goalAmount: 15,
    totalRaisedCached: 12.8,
    coverImageUrl: null,
    category: 'Open source',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-03'),
    creator: { username: 'creator3' },
    _count: { donations: 45 }
  }
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createFundraiserSchema.parse(body)

    // Mock response - in a real app this would save to a database
    const newFundraiser = {
      id: Date.now().toString(),
      ...data,
      totalRaisedCached: 0,
      status: 'ACTIVE',
      createdAt: new Date(),
      creator: { username: 'new-creator' },
      _count: { donations: 0 }
    }

    return NextResponse.json(newFundraiser, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create fundraiser' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'newest'

    let filteredFundraisers = [...mockFundraisers]

    // Filter by category
    if (category) {
      filteredFundraisers = filteredFundraisers.filter(f => f.category === category)
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      filteredFundraisers = filteredFundraisers.filter(f =>
        f.title.toLowerCase().includes(searchLower) ||
        f.description.toLowerCase().includes(searchLower)
      )
    }

    // Sort
    if (sort === 'trending') {
      filteredFundraisers.sort((a, b) => b.totalRaisedCached - a.totalRaisedCached)
    } else {
      filteredFundraisers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    }

    return NextResponse.json(filteredFundraisers)
  } catch (error: any) {
    console.error('GET /api/fundraisers error:', error)
    return NextResponse.json({ error: 'Failed to fetch fundraisers' }, { status: 500 })
  }
}