import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const createFundraiserSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  goalAmount: z.number().positive(),
  beneficiaryAddress: z.string(),
  coverImageUrl: z.string().optional(),
  category: z.string().min(1),
  deadline: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createFundraiserSchema.parse(body)

    // For MVP, assume creatorUserId is fixed or from cookie
    const creatorUserId = 'dummy-user-id' // TODO: from auth

    const fundraiser = await prisma.fundraiser.create({
      data: {
        ...data,
        creatorUserId,
        deadline: data.deadline ? new Date(data.deadline) : null,
      },
    })
    return NextResponse.json(fundraiser, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
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

    let orderBy: any = { createdAt: 'desc' }
    if (sort === 'trending') {
      // Simple trending: raised / age in days
      orderBy = [
        { totalRaisedCached: 'desc' },
        { createdAt: 'desc' },
      ]
    }

    const fundraisers = await prisma.fundraiser.findMany({
      where: {
        status: 'ACTIVE',
        ...(category && { category }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        creator: true,
        _count: {
          select: { donations: true },
        },
      },
      orderBy,
    })
    return NextResponse.json(fundraisers)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch fundraisers' }, { status: 500 })
  }
}