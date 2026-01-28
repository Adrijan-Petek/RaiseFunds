import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.donation.deleteMany()
  await prisma.fundraiser.deleteMany()
  await prisma.user.deleteMany()

  const user = await prisma.user.create({
    data: {
      username: 'alice',
      fid: 12345,
    },
  })

  const f1 = await prisma.fundraiser.create({
    data: {
      creatorUserId: user.id,
      title: 'Medical aid for local clinic',
      description: 'Raising funds to buy medical equipment for the community clinic.',
      goalAmount: 10.5,
      beneficiaryAddress: '0x0000000000000000000000000000000000000000',
      category: 'Medical',
      coverImageUrl: '/icons/icon.png',
    },
  })

  const f2 = await prisma.fundraiser.create({
    data: {
      creatorUserId: user.id,
      title: 'Community Garden Project',
      description: 'Help us build a community garden to teach sustainable farming.',
      goalAmount: 5,
      beneficiaryAddress: '0x0000000000000000000000000000000000000000',
      category: 'Community',
    },
  })

  await prisma.donation.create({
    data: {
      fundraiserId: f1.id,
      donorName: 'Bob',
      amount: 1.25,
      message: 'Good luck!',
      status: 'CONFIRMED',
    },
  })

  await prisma.donation.create({
    data: {
      fundraiserId: f2.id,
      donorName: 'Carol',
      amount: 0.5,
      message: 'Happy to help',
      status: 'CONFIRMED',
    },
  })

  console.log('Seed complete')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
