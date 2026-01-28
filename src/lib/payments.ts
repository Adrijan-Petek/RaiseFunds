import { prisma } from './prisma'

export async function createDonation(fundraiserId: string, amount: number, donorName?: string, donorAddress?: string, message?: string) {
  const donation = await prisma.donation.create({
    data: {
      fundraiserId,
      donorName,
      donorAddress,
      amount,
      message,
      status: 'PENDING',
    },
  })
  return donation
}

export async function confirmDonation(donationId: string) {
  const donation = await prisma.donation.findUnique({
    where: { id: donationId },
  })
  if (!donation || donation.status !== 'PENDING') {
    throw new Error('Invalid donation')
  }

  // Update donation status
  await prisma.donation.update({
    where: { id: donationId },
    data: { status: 'CONFIRMED' },
  })

  // Update fundraiser totalRaisedCached
  await prisma.fundraiser.update({
    where: { id: donation.fundraiserId },
    data: {
      totalRaisedCached: {
        increment: donation.amount,
      },
    },
  })

  return donation
}