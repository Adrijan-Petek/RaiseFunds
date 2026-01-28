import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const createReportSchema = z.object({
  fundraiserId: z.string(),
  reason: z.string().min(1),
  details: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createReportSchema.parse(body)

    const report = await prisma.report.create({
      data: data,
    })
    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
  }
}