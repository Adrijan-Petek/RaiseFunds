import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'ENDED', 'HIDDEN']),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fundraiser = await prisma.fundraiser.findUnique({
      where: { id: params.id },
      include: {
        creator: true,
        donations: {
          orderBy: { createdAt: 'desc' },
        },
        updates: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!fundraiser) {
      return NextResponse.json({ error: 'Fundraiser not found' }, { status: 404 })
    }
    return NextResponse.json(fundraiser)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch fundraiser' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = updateStatusSchema.parse(body)

    // TODO: Check if user is creator

    const fundraiser = await prisma.fundraiser.update({
      where: { id: params.id },
      data: { status: data.status },
    })
    return NextResponse.json(fundraiser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update fundraiser' }, { status: 500 })
  }
}