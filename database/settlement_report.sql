-- Settlement report related tables

-- Settlement report table
CREATE TABLE settlement_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id)
);

-- Courier settlement reports linking table
CREATE TABLE courier_settlement_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES settlement_reports(id) ON DELETE CASCADE NOT NULL,
  courier_id UUID REFERENCES auth.users(id) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(report_id, courier_id)
);

-- Report settlement items
CREATE TABLE report_settlement_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_settlement_report_id UUID REFERENCES courier_settlement_reports(id) ON DELETE CASCADE NOT NULL,
  settlement_id UUID REFERENCES settlements(id) ON DELETE CASCADE NOT NULL,
  settlement_type TEXT NOT NULL CHECK (settlement_type IN ('kurly', 'coupang', 'general')),
  item_id UUID NOT NULL, -- Reference to the actual settlement item (kurly_settlements, coupang_settlements, or general_settlements)
  amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add courier_id to settlements table to allow couriers to create settlements
ALTER TABLE settlements ADD COLUMN courier_id UUID REFERENCES auth.users(id);

-- Update RLS policies
ALTER TABLE settlement_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE courier_settlement_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_settlement_items ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can do everything on settlement_reports" ON settlement_reports 
  FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "Admins can do everything on courier_settlement_reports" ON courier_settlement_reports
  FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "Admins can do everything on report_settlement_items" ON report_settlement_items
  FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Regular users (couriers) can view their own settlement reports
CREATE POLICY "Couriers can view their settlement reports" ON settlement_reports 
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM courier_settlement_reports csr
    WHERE csr.report_id = settlement_reports.id
    AND csr.courier_id = auth.uid()
  ));

CREATE POLICY "Couriers can view their courier_settlement_reports" ON courier_settlement_reports
  FOR SELECT USING (courier_id = auth.uid());

CREATE POLICY "Couriers can view their report_settlement_items" ON report_settlement_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM courier_settlement_reports csr
    WHERE csr.id = report_settlement_items.courier_settlement_report_id
    AND csr.courier_id = auth.uid()
  ));

-- Add policy for couriers to create their own settlements
CREATE POLICY "Couriers can create their own settlements" ON settlements 
  FOR INSERT WITH CHECK (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'courier' AND
    courier_id = auth.uid()
  );

CREATE POLICY "Couriers can update their own settlements" ON settlements 
  FOR UPDATE USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'courier' AND
    courier_id = auth.uid()
  );

CREATE POLICY "Couriers can delete their own settlements" ON settlements 
  FOR DELETE USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'courier' AND
    courier_id = auth.uid()
  );

-- Add similar policies for settlement sub-tables
-- Kurly
CREATE POLICY "Couriers can manage kurly_settlements for their settlements" ON kurly_settlements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM settlements s
      WHERE s.id = kurly_settlements.settlement_id
      AND s.courier_id = auth.uid()
    )
  );

-- Coupang
CREATE POLICY "Couriers can manage coupang_settlements for their settlements" ON coupang_settlements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM settlements s
      WHERE s.id = coupang_settlements.settlement_id
      AND s.courier_id = auth.uid()
    )
  );

-- General
CREATE POLICY "Couriers can manage general_settlements for their settlements" ON general_settlements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM settlements s
      WHERE s.id = general_settlements.settlement_id
      AND s.courier_id = auth.uid()
    )
  );
