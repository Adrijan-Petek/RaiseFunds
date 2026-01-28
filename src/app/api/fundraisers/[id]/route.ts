import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fundraiser = await prisma.fundraiser.findUnique({
      where: { id: params.id },
      include: {
        creator: true,
        donations: true,
        updates: true,
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