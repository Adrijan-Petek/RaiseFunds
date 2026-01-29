import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'

const createUpdateSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  imageUrl: z.string().optional(),
})

export async function POST(request: NextRequest, context: any) {
  try {
    const rawParams = context?.params
    const params = rawParams && typeof rawParams.then === 'function' ? await rawParams : rawParams
    const id = params?.id
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const body = await request.json()
    const data = createUpdateSchema.parse(body)

    const { data: update, error } = await supabase
      .from('fundraiser_updates')
      .insert({
        fundraiser_id: id,
        title: data.title,
        content: data.content,
        image_url: data.imageUrl,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to create update' }, { status: 500 })
    }

    // Transform the response to match the expected format
    const transformedUpdate = {
      id: update.id,
      fundraiserId: update.fundraiser_id,
      title: update.title,
      content: update.content,
      imageUrl: update.image_url,
      createdAt: update.created_at,
    }

    return NextResponse.json(transformedUpdate, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors }, { status: 400 })
    }
    console.error('POST /api/fundraisers/[id]/updates error:', error)
    return NextResponse.json({ error: 'Failed to create update' }, { status: 500 })
  }
}