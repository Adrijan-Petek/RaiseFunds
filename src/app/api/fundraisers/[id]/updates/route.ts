import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { text, imageUrl } = body

    const update = await prisma.update.create({
      data: {
        fundraiserId: params.id,
        text,
        imageUrl,
      },
    })
    return NextResponse.json(update, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create update' }, { status: 500 })
  }
}