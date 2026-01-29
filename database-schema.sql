-- Create fundraisers table
CREATE TABLE fundraisers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  goal_amount DECIMAL(18,8) NOT NULL,
  total_raised_cached DECIMAL(18,8) DEFAULT 0,
  beneficiary_address TEXT NOT NULL,
  cover_image_url TEXT,
  category TEXT NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
  creator_username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create donations table
CREATE TABLE donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fundraiser_id UUID REFERENCES fundraisers(id) ON DELETE CASCADE,
  donor_address TEXT NOT NULL,
  donor_username TEXT,
  amount DECIMAL(18,8) NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED')),
  transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fundraiser_updates table
CREATE TABLE fundraiser_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fundraiser_id UUID REFERENCES fundraisers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reports table
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fundraiser_id UUID REFERENCES fundraisers(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_fundraisers_status ON fundraisers(status);
CREATE INDEX idx_fundraisers_category ON fundraisers(category);
CREATE INDEX idx_fundraisers_created_at ON fundraisers(created_at DESC);
CREATE INDEX idx_donations_fundraiser_id ON donations(fundraiser_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_fundraiser_updates_fundraiser_id ON fundraiser_updates(fundraiser_id);

-- Enable Row Level Security (RLS)
ALTER TABLE fundraisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraiser_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Fundraisers are viewable by everyone" ON fundraisers FOR SELECT USING (true);
CREATE POLICY "Donations are viewable by everyone" ON donations FOR SELECT USING (true);
CREATE POLICY "Updates are viewable by everyone" ON fundraiser_updates FOR SELECT USING (true);
CREATE POLICY "Reports are viewable by admins only" ON reports FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Create policies for authenticated users to create
CREATE POLICY "Anyone can create fundraisers" ON fundraisers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create donations" ON donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create updates" ON fundraiser_updates FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create reports" ON reports FOR INSERT WITH CHECK (true);

-- Create policies for creators to update their own fundraisers
CREATE POLICY "Creators can update their own fundraisers" ON fundraisers FOR UPDATE USING (auth.jwt() ->> 'username' = creator_username);
CREATE POLICY "Creators can update their own updates" ON fundraiser_updates FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM fundraisers
    WHERE fundraisers.id = fundraiser_updates.fundraiser_id
    AND fundraisers.creator_username = auth.jwt() ->> 'username'
  )
);