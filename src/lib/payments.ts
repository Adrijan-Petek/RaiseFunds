// Mock payment functions - in a real app these would integrate with payment processors

export async function createDonation(fundraiserId: string, amount: number, donorName?: string, donorAddress?: string, message?: string) {
  // Mock donation creation
  const donation = {
    id: `donation_${Date.now()}`,
    fundraiserId,
    donorName: donorName || 'Anonymous',
    donorAddress: donorAddress || '0x000...',
    amount,
    message: message || '',
    status: 'PENDING',
    createdAt: new Date(),
  }

  // In a real app, this would save to database and initiate payment
  console.log('Created donation:', donation)

  return donation
}

export async function confirmDonation(donationId: string) {
  // Mock donation confirmation
  const donation = {
    id: donationId,
    status: 'CONFIRMED',
    fundraiserId: 'mock-fundraiser-id',
    amount: 1.0, // Mock amount
  }

  // In a real app, this would update database and process payment confirmation
  console.log('Confirmed donation:', donation)

  return donation
}