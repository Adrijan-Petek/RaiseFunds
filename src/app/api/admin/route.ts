import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: reports, error } = await supabase
      .from('reports')
      .select(`
        *,
        fundraisers (
          id,
          title,
          status
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    // Transform the response to match the expected format
    const transformedReports = reports.map(report => ({
      id: report.id,
      fundraiserId: report.fundraiser_id,
      reason: report.reason,
      details: report.details,
      status: report.status,
      createdAt: report.created_at,
      fundraiser: report.fundraisers ? {
        id: report.fundraisers.id,
        title: report.fundraisers.title,
        status: report.fundraisers.status
      } : null
    }))

    return NextResponse.json(transformedReports)
  } catch (error) {
    console.error('GET /api/admin error:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { fundraiserId, action } = body

    if (action === 'hide') {
      const { error } = await supabase
        .from('fundraisers')
        .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
        .eq('id', fundraiserId)

      if (error) {
        console.error('Supabase error:', error)
        return NextResponse.json({ error: 'Failed to hide fundraiser' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/admin error:', error)
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 })
  }
}