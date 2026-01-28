import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const fundraisers = await prisma.fundraiser.findMany({
      include: {
        creator: true,
        donations: true,
        updates: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(fundraisers)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch fundraisers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      creatorUserId,
      title,
      description,
      goalAmountWei,
      chainId,
      beneficiaryAddress,
      coverImageUrl,
      category,
      deadline,
    } = body

    const fundraiser = await prisma.fundraiser.create({
      data: {
        creatorUserId,
        title,
        description,
        goalAmountWei,
        chainId,
        beneficiaryAddress,
        coverImageUrl,
        category,
        deadline: deadline ? new Date(deadline) : null,
      },
    })
    return NextResponse.json(fundraiser, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create fundraiser' }, { status: 500 })
  }
}