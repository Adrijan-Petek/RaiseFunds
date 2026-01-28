import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createUpdateSchema = z.object({
  text: z.string().min(1),
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

    // Mock update creation - in a real app this would save to a database
    const update = {
      id: `update_${Date.now()}`,
      fundraiserId: id,
      ...data,
      createdAt: new Date(),
    }

    console.log('Created update:', update)

    return NextResponse.json(update, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create update' }, { status: 500 })
  }
}