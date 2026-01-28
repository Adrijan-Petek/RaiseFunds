import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  // Onchain verification is not implemented in this MVP environment.
  // The original implementation required `viem` which is not installed in dev.
  return NextResponse.json({ error: 'Onchain verification not implemented' }, { status: 501 })
}