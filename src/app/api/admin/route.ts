import { NextRequest, NextResponse } from 'next/server'

// Mock reports data
const mockReports = [
  {
    id: 'r1',
    fundraiserId: '1',
    reason: 'Suspicious activity',
    details: 'This fundraiser seems suspicious',
    createdAt: new Date('2024-01-20'),
    fundraiser: {
      id: '1',
      title: 'Help fund surgery costs',
      status: 'ACTIVE'
    }
  }
]

export async function GET(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Mock reports - in a real app this would fetch from database
    return NextResponse.json(mockReports)
  } catch (error) {
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
      // Mock update - in a real app this would update the database
      console.log(`Hiding fundraiser ${fundraiserId}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 })
  }
}