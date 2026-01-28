import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fundraiserId, reason } = body

    const report = await prisma.report.create({
      data: {
        fundraiserId,
        reason,
      },
    })
    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
  }
}