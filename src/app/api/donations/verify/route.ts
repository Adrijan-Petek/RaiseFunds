import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fundraiserId, txHash } = body

    // Get fundraiser
    const fundraiser = await prisma.fundraiser.findUnique({
      where: { id: fundraiserId },
    })
    if (!fundraiser) {
      return NextResponse.json({ error: 'Fundraiser not found' }, { status: 404 })
    }

    // Check if tx hash already exists
    const existing = await prisma.donation.findUnique({
      where: { txHash },
    })
    if (existing) {
      return NextResponse.json({ error: 'Donation already recorded' }, { status: 400 })
    }

    // Verify tx onchain
    const client = createPublicClient({
      chain: base, // assuming Base
      transport: http(),
    })

    const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` })

    if (receipt.status !== 'success') {
      return NextResponse.json({ error: 'Transaction failed' }, { status: 400 })
    }

    const tx = await client.getTransaction({ hash: txHash as `0x${string}` })

    if (tx.to?.toLowerCase() !== fundraiser.beneficiaryAddress.toLowerCase()) {
      return NextResponse.json({ error: 'Invalid recipient' }, { status: 400 })
    }

    if (tx.value === 0n) {
      return NextResponse.json({ error: 'No value sent' }, { status: 400 })
    }

    // Store donation
    const donation = await prisma.donation.create({
      data: {
        fundraiserId,
        donorAddress: tx.from,
        amountWei: tx.value.toString(),
        txHash,
        chainId: fundraiser.chainId,
      },
    })

    return NextResponse.json(donation, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to verify donation' }, { status: 500 })
  }
}