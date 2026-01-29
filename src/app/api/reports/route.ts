import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'

const createReportSchema = z.object({
  fundraiserId: z.string(),
  reason: z.string().min(1),
  details: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createReportSchema.parse(body)

    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        fundraiser_id: data.fundraiserId,
        reason: data.reason,
        details: data.details,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
    }

    // Transform the response to match the expected format
    const transformedReport = {
      id: report.id,
      fundraiserId: report.fundraiser_id,
      reason: report.reason,
      details: report.details,
      status: report.status,
      createdAt: report.created_at,
    }

    return NextResponse.json(transformedReport, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors }, { status: 400 })
    }
    console.error('POST /api/reports error:', error)
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
  }
}