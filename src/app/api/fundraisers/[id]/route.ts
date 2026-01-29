import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']),
})

export async function GET(request: NextRequest, context: any) {
  try {
    const rawParams = context?.params
    const params = rawParams && typeof rawParams.then === 'function' ? await rawParams : rawParams
    const id = params?.id
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const { data: fundraiser, error } = await supabase
      .from('fundraisers')
      .select(`
        *,
        donations (
          id,
          amount,
          donor_address,
          donor_username,
          message,
          status,
          created_at
        ),
        fundraiser_updates (
          id,
          title,
          content,
          image_url,
          created_at
        )
      `)
      .eq('id', id)
      .single()

    if (error || !fundraiser) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Fundraiser not found' }, { status: 404 })
    }

    // Transform the response to match the expected format
    const transformedFundraiser = {
      id: fundraiser.id,
      title: fundraiser.title,
      description: fundraiser.description,
      goalAmount: parseFloat(fundraiser.goal_amount),
      totalRaisedCached: parseFloat(fundraiser.total_raised_cached),
      coverImageUrl: fundraiser.cover_image_url,
      category: fundraiser.category,
      status: fundraiser.status,
      createdAt: fundraiser.created_at,
      beneficiaryAddress: fundraiser.beneficiary_address,
      currency: fundraiser.currency || 'ETH',
      creator: { username: fundraiser.creator_username },
      donations: fundraiser.donations?.map((donation: any) => ({
        id: donation.id,
        amount: parseFloat(donation.amount),
        currency: donation.currency || 'ETH',
        donorAddress: donation.donor_address,
        donorUsername: donation.donor_username,
        message: donation.message,
        status: donation.status,
        createdAt: donation.created_at,
      })) || [],
      updates: fundraiser.fundraiser_updates?.map((update: any) => ({
        id: update.id,
        title: update.title,
        content: update.content,
        imageUrl: update.image_url,
        createdAt: update.created_at,
      })) || []
    }

    return NextResponse.json(transformedFundraiser)
  } catch (error) {
    console.error('GET /api/fundraisers/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch fundraiser' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: any) {
  try {
    const rawParams = context?.params
    const params = rawParams && typeof rawParams.then === 'function' ? await rawParams : rawParams
    const id = params?.id
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const body = await request.json()
    const data = updateStatusSchema.parse(body)

    const { data: fundraiser, error } = await supabase
      .from('fundraisers')
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error || !fundraiser) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Fundraiser not found' }, { status: 404 })
    }

    // Transform the response to match the expected format
    const transformedFundraiser = {
      id: fundraiser.id,
      title: fundraiser.title,
      description: fundraiser.description,
      goalAmount: parseFloat(fundraiser.goal_amount),
      totalRaisedCached: parseFloat(fundraiser.total_raised_cached),
      coverImageUrl: fundraiser.cover_image_url,
      category: fundraiser.category,
      status: fundraiser.status,
      createdAt: fundraiser.created_at,
      beneficiaryAddress: fundraiser.beneficiary_address,
      creator: { username: fundraiser.creator_username }
    }

    return NextResponse.json(transformedFundraiser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors }, { status: 400 })
    }
    console.error('PATCH /api/fundraisers/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update fundraiser' }, { status: 500 })
  }
}