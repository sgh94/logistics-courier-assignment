-- database/migration_settlement_system.sql

-- 1. Create table for general settlements (legacy support)
CREATE TABLE IF NOT EXISTS settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_id UUID REFERENCES users(id) NOT NULL,
  delivery_date DATE NOT NULL,
  delivery_fee NUMERIC(10, 0) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create table for Kurly settlements
CREATE TABLE IF NOT EXISTS kurly_settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_id UUID REFERENCES users(id) NOT NULL,
  delivery_date DATE NOT NULL,
  shift TEXT,
  sequence TEXT,
  delivery_fee NUMERIC(10, 0) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 3. Create table for Coupang settlements
CREATE TABLE IF NOT EXISTS coupang_settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_id UUID REFERENCES users(id) NOT NULL,
  delivery_date DATE NOT NULL,
  delivery_code TEXT,
  delivery_count INTEGER,
  unit_price NUMERIC(10, 0),
  weight NUMERIC(10, 1),
  delivery_fee NUMERIC(10, 0) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 4. Create table for settlement statements
CREATE TABLE IF NOT EXISTS settlement_statements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_id UUID REFERENCES users(id) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount NUMERIC(12, 0) NOT NULL,
  commission_rate NUMERIC(5, 2) NOT NULL,
  commission_amount NUMERIC(12, 0) NOT NULL,
  final_amount NUMERIC(12, 0) NOT NULL,
  vat_amount NUMERIC(12, 0) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 5. Create table for settlement adjustments
CREATE TABLE IF NOT EXISTS settlement_adjustments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  statement_id UUID REFERENCES settlement_statements(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(10, 0) NOT NULL,
  type TEXT CHECK (type IN ('expense', 'income', 'tax', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- 6. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_settlements_courier_date ON settlements (courier_id, delivery_date);
CREATE INDEX IF NOT EXISTS idx_kurly_settlements_courier_date ON kurly_settlements (courier_id, delivery_date);
CREATE INDEX IF NOT EXISTS idx_coupang_settlements_courier_date ON coupang_settlements (courier_id, delivery_date);
CREATE INDEX IF NOT EXISTS idx_settlement_statements_courier ON settlement_statements (courier_id);

-- 7. Set up RLS (Row Level Security) policies
-- For settlements
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY settlements_select_policy ON settlements
  FOR SELECT USING (
    auth.uid() = courier_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY settlements_insert_policy ON settlements
  FOR INSERT WITH CHECK (
    auth.uid() = courier_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- For kurly_settlements
ALTER TABLE kurly_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY kurly_settlements_select_policy ON kurly_settlements
  FOR SELECT USING (
    auth.uid() = courier_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY kurly_settlements_insert_policy ON kurly_settlements
  FOR INSERT WITH CHECK (
    auth.uid() = courier_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- For coupang_settlements
ALTER TABLE coupang_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY coupang_settlements_select_policy ON coupang_settlements
  FOR SELECT USING (
    auth.uid() = courier_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY coupang_settlements_insert_policy ON coupang_settlements
  FOR INSERT WITH CHECK (
    auth.uid() = courier_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- For settlement_statements
ALTER TABLE settlement_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY settlement_statements_select_policy ON settlement_statements
  FOR SELECT USING (
    auth.uid() = courier_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY settlement_statements_insert_policy ON settlement_statements
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- For settlement_adjustments
ALTER TABLE settlement_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY settlement_adjustments_select_policy ON settlement_adjustments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM settlement_statements s
      WHERE s.id = settlement_adjustments.statement_id
      AND (s.courier_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY settlement_adjustments_insert_policy ON settlement_adjustments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );