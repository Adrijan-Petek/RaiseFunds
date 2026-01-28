import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createReportSchema = z.object({
  fundraiserId: z.string(),
  reason: z.string().min(1),
  details: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createReportSchema.parse(body)

    // Mock report creation - in a real app this would save to a database
    const report = {
      id: `report_${Date.now()}`,
      ...data,
      createdAt: new Date(),
      status: 'PENDING'
    }

    console.log('Created report:', report)

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
  }
}