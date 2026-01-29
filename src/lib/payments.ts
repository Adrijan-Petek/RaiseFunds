import { supabase } from './supabase'

export async function createDonation(
  fundraiserId: string,
  amount: number,
  donorName?: string,
  donorAddress?: string,
  message?: string
) {
  try {
    const { data: donation, error } = await supabase
      .from('donations')
      .insert({
        fundraiser_id: fundraiserId,
        donor_address: donorAddress || '',
        donor_username: donorName,
        amount: amount,
        message: message || '',
        status: 'PENDING'
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error creating donation:', error)
      throw new Error('Failed to create donation')
    }

    return {
      id: donation.id,
      fundraiserId: donation.fundraiser_id,
      donorName: donation.donor_username || 'Anonymous',
      donorAddress: donation.donor_address,
      amount: parseFloat(donation.amount),
      message: donation.message,
      status: donation.status,
      createdAt: donation.created_at,
    }
  } catch (error) {
    console.error('Error creating donation:', error)
    throw error
  }
}

export async function confirmDonation(donationId: string) {
  try {
    // First get the donation to update fundraiser total
    const { data: donation, error: fetchError } = await supabase
      .from('donations')
      .select('*, fundraisers(*)')
      .eq('id', donationId)
      .single()

    if (fetchError || !donation) {
      console.error('Error fetching donation:', fetchError)
      throw new Error('Donation not found')
    }

    // Update donation status
    const { error: updateError } = await supabase
      .from('donations')
      .update({ status: 'CONFIRMED' })
      .eq('id', donationId)

    if (updateError) {
      console.error('Error confirming donation:', updateError)
      throw new Error('Failed to confirm donation')
    }

    // Update fundraiser total
    const newTotal = parseFloat(donation.fundraisers.total_raised_cached) + parseFloat(donation.amount)
    const { error: fundraiserError } = await supabase
      .from('fundraisers')
      .update({ total_raised_cached: newTotal })
      .eq('id', donation.fundraiser_id)

    if (fundraiserError) {
      console.error('Error updating fundraiser total:', fundraiserError)
      // Don't throw here as the donation was confirmed
    }

    return {
      id: donation.id,
      status: 'CONFIRMED',
      fundraiserId: donation.fundraiser_id,
      amount: parseFloat(donation.amount),
    }
  } catch (error) {
    console.error('Error confirming donation:', error)
    throw error
  }
}