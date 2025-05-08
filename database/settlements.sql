-- Settlement system tables

-- Common settlement table
CREATE TABLE settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  settlement_date DATE NOT NULL,
  settlement_type TEXT NOT NULL CHECK (settlement_type IN ('kurly', 'coupang', 'general')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id)
);

-- Kurly settlement details
CREATE TABLE kurly_settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  settlement_id UUID REFERENCES settlements(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  support_type TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  note TEXT,
  settlement_amount DECIMAL(12, 2) NOT NULL,
  supply_price DECIMAL(12, 2) NOT NULL,
  delivery_count INT,
  unit_price DECIMAL(10, 2),
  center TEXT,
  region TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coupang settlement details
CREATE TABLE coupang_settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  settlement_id UUID REFERENCES settlements(id) ON DELETE CASCADE NOT NULL,
  settlement_date DATE NOT NULL,
  day_or_night TEXT CHECK (day_or_night IN ('day', 'night')),
  delivery_area TEXT,
  courier_name TEXT NOT NULL,
  delivery_count INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  supply_price DECIMAL(12, 2) NOT NULL,
  vat DECIMAL(12, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  profit DECIMAL(12, 2) NOT NULL,
  invoice_status TEXT,
  payment_type TEXT,
  note TEXT,
  transaction_partner TEXT,
  return_count INT,
  camp TEXT,
  route_id TEXT,
  pdd TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- General settlement details (for the editable version)
CREATE TABLE general_settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  settlement_id UUID REFERENCES settlements(id) ON DELETE CASCADE NOT NULL,
  row_order INT NOT NULL,
  column_name TEXT NOT NULL,
  column_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS Policies for settlement tables
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE kurly_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupang_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_settlements ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can do everything on settlements" ON settlements 
  FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "Admins can do everything on kurly_settlements" ON kurly_settlements
  FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "Admins can do everything on coupang_settlements" ON coupang_settlements
  FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "Admins can do everything on general_settlements" ON general_settlements
  FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Regular users can only view
CREATE POLICY "Regular users can view settlements" ON settlements 
  FOR SELECT USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'courier');

CREATE POLICY "Regular users can view kurly_settlements" ON kurly_settlements
  FOR SELECT USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'courier');

CREATE POLICY "Regular users can view coupang_settlements" ON coupang_settlements
  FOR SELECT USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'courier');

CREATE POLICY "Regular users can view general_settlements" ON general_settlements
  FOR SELECT USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'courier');
