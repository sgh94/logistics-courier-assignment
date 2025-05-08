// src/lib/settlements.ts
import { createClient } from '@/lib/supabase';
import { 
  Settlement, 
  KurlySettlement, 
  CoupangSettlement, 
  SettlementStatement, 
  SettlementAdjustment 
} from '@/lib/types/settlement';

// Get all settlements
export async function getSettlements(startDate?: string, endDate?: string) {
  const supabase = createClient();
  
  let query = supabase
    .from('settlements')
    .select(`
      *,
      courier:courier_id(name)
    `)
    .order('delivery_date', { ascending: false });
    
  if (startDate) {
    query = query.gte('delivery_date', startDate);
  }
  
  if (endDate) {
    query = query.lte('delivery_date', endDate);
  }
  
  const { data, error } = await query;
    
  if (error) {
    console.error('Error fetching settlements:', error);
    throw error;
  }
  
  return data as Settlement[];
}

// Get courier's settlements
export async function getCourierSettlements(courierId: string, startDate?: string, endDate?: string) {
  const supabase = createClient();
  
  let query = supabase
    .from('settlements')
    .select('*')
    .eq('courier_id', courierId)
    .order('delivery_date', { ascending: false });
    
  if (startDate) {
    query = query.gte('delivery_date', startDate);
  }
  
  if (endDate) {
    query = query.lte('delivery_date', endDate);
  }
  
  const { data, error } = await query;
    
  if (error) {
    console.error('Error fetching courier settlements:', error);
    throw error;
  }
  
  return data as Settlement[];
}

// Get Kurly settlements
export async function getKurlySettlements(courierId?: string, startDate?: string, endDate?: string) {
  const supabase = createClient();
  
  let query = supabase
    .from('kurly_settlements')
    .select(`
      *,
      courier:courier_id(name)
    `)
    .order('delivery_date', { ascending: false });
    
  if (courierId) {
    query = query.eq('courier_id', courierId);
  }
  
  if (startDate) {
    query = query.gte('delivery_date', startDate);
  }
  
  if (endDate) {
    query = query.lte('delivery_date', endDate);
  }
  
  const { data, error } = await query;
    
  if (error) {
    console.error('Error fetching Kurly settlements:', error);
    throw error;
  }
  
  return data as KurlySettlement[];
}

// Get Coupang settlements
export async function getCoupangSettlements(courierId?: string, startDate?: string, endDate?: string) {
  const supabase = createClient();
  
  let query = supabase
    .from('coupang_settlements')
    .select(`
      *,
      courier:courier_id(name)
    `)
    .order('delivery_date', { ascending: false });
    
  if (courierId) {
    query = query.eq('courier_id', courierId);
  }
  
  if (startDate) {
    query = query.gte('delivery_date', startDate);
  }
  
  if (endDate) {
    query = query.lte('delivery_date', endDate);
  }
  
  const { data, error } = await query;
    
  if (error) {
    console.error('Error fetching Coupang settlements:', error);
    throw error;
  }
  
  return data as CoupangSettlement[];
}

// Create Kurly settlement
export async function createKurlySettlement(settlement: Omit<KurlySettlement, 'id' | 'created_at'>) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('kurly_settlements')
    .insert([settlement])
    .select()
    .single();
    
  if (error) {
    console.error('Error creating Kurly settlement:', error);
    throw error;
  }
  
  return data as KurlySettlement;
}

// Create Coupang settlement
export async function createCoupangSettlement(settlement: Omit<CoupangSettlement, 'id' | 'created_at'>) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('coupang_settlements')
    .insert([settlement])
    .select()
    .single();
    
  if (error) {
    console.error('Error creating Coupang settlement:', error);
    throw error;
  }
  
  return data as CoupangSettlement;
}

// Create batch Kurly settlements
export async function createBatchKurlySettlements(settlements: Omit<KurlySettlement, 'id' | 'created_at'>[]) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('kurly_settlements')
    .insert(settlements)
    .select();
    
  if (error) {
    console.error('Error creating batch Kurly settlements:', error);
    throw error;
  }
  
  return data as KurlySettlement[];
}

// Create batch Coupang settlements
export async function createBatchCoupangSettlements(settlements: Omit<CoupangSettlement, 'id' | 'created_at'>[]) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('coupang_settlements')
    .insert(settlements)
    .select();
    
  if (error) {
    console.error('Error creating batch Coupang settlements:', error);
    throw error;
  }
  
  return data as CoupangSettlement[];
}

// Get settlement statements
export async function getSettlementStatements(courierId?: string) {
  const supabase = createClient();
  
  let query = supabase
    .from('settlement_statements')
    .select(`
      *,
      courier:courier_id(name)
    `)
    .order('end_date', { ascending: false });
    
  if (courierId) {
    query = query.eq('courier_id', courierId);
  }
  
  const { data, error } = await query;
    
  if (error) {
    console.error('Error fetching settlement statements:', error);
    throw error;
  }
  
  return data as SettlementStatement[];
}

// Get settlement statement by ID
export async function getSettlementStatementById(statementId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('settlement_statements')
    .select(`
      *,
      courier:courier_id(name),
      kurly_settlements(*),
      coupang_settlements(*),
      adjustments:settlement_adjustments(*)
    `)
    .eq('id', statementId)
    .single();
    
  if (error) {
    console.error('Error fetching settlement statement:', error);
    throw error;
  }
  
  return data as SettlementStatement;
}

// Create settlement statement
export async function createSettlementStatement(
  statement: Omit<SettlementStatement, 'id' | 'created_at' | 'kurly_settlements' | 'coupang_settlements' | 'adjustments'>
) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('settlement_statements')
    .insert([statement])
    .select()
    .single();
    
  if (error) {
    console.error('Error creating settlement statement:', error);
    throw error;
  }
  
  return data as SettlementStatement;
}

// Create settlement adjustment
export async function createSettlementAdjustment(
  adjustment: Omit<SettlementAdjustment, 'id' | 'created_at'>
) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('settlement_adjustments')
    .insert([adjustment])
    .select()
    .single();
    
  if (error) {
    console.error('Error creating settlement adjustment:', error);
    throw error;
  }
  
  return data as SettlementAdjustment;
}