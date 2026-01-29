import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'

const createFundraiserSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  goalAmount: z.number().positive(),
  currency: z.enum(['ETH', 'USDC']).default('ETH'),
  beneficiaryAddress: z.string(),
  coverImageUrl: z.string().optional(),
  category: z.string().min(1),
  deadline: z.string().optional(),
  creatorUsername: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createFundraiserSchema.parse(body)

    const { data: fundraiser, error } = await supabase
      .from('fundraisers')
      .insert({
        title: data.title,
        description: data.description,
        goal_amount: data.goalAmount,
        currency: data.currency,
        beneficiary_address: data.beneficiaryAddress,
        cover_image_url: data.coverImageUrl,
        category: data.category,
        deadline: data.deadline ? new Date(data.deadline) : null,
        creator_username: data.creatorUsername,
      })
      .select(`
        *,
        _count:donations(count)
      `)
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'Failed to create fundraiser', details: error.message }, { status: 500 })
    }

    // Transform the response to match the expected format
    const transformedFundraiser = {
      id: fundraiser.id,
      title: fundraiser.title,
      description: fundraiser.description,
      goalAmount: parseFloat(fundraiser.goal_amount),
      currency: fundraiser.currency || 'ETH',
      totalRaisedCached: parseFloat(fundraiser.total_raised_cached),
      beneficiaryAddress: fundraiser.beneficiary_address,
      coverImageUrl: fundraiser.cover_image_url,
      category: fundraiser.category,
      deadline: fundraiser.deadline,
      status: fundraiser.status,
      createdAt: fundraiser.created_at,
      creator: { username: fundraiser.creator_username },
      _count: { donations: fundraiser._count?.[0]?.count || 0 }
    }

    return NextResponse.json(transformedFundraiser, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors }, { status: 400 })
    }
    console.error('POST /api/fundraisers error:', error)
    return NextResponse.json({ error: 'Failed to create fundraiser' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'newest'

    let query = supabase
      .from('fundraisers')
      .select(`
        *,
        _count:donations(count)
      `)

    // Filter by category
    if (category) {
      query = query.eq('category', category)
    }

    // Filter by search
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Sort
    if (sort === 'trending') {
      query = query.order('total_raised_cached', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data: fundraisers, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch fundraisers' }, { status: 500 })
    }

    // Transform the response to match the expected format
    const transformedFundraisers = fundraisers.map(fundraiser => ({
      id: fundraiser.id,
      title: fundraiser.title,
      description: fundraiser.description,
      goalAmount: parseFloat(fundraiser.goal_amount),
      currency: fundraiser.currency || 'ETH',
      totalRaisedCached: parseFloat(fundraiser.total_raised_cached),
      beneficiaryAddress: fundraiser.beneficiary_address,
      coverImageUrl: fundraiser.cover_image_url,
      category: fundraiser.category,
      deadline: fundraiser.deadline,
      status: fundraiser.status,
      createdAt: fundraiser.created_at,
      creator: { username: fundraiser.creator_username },
      _count: { donations: fundraiser._count?.[0]?.count || 0 }
    }))

    return NextResponse.json(transformedFundraisers)
  } catch (error: any) {
    console.error('GET /api/fundraisers error:', error)
    return NextResponse.json({ error: 'Failed to fetch fundraisers' }, { status: 500 })
  }
}