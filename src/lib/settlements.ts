import { supabase } from './supabase';
import { 
  Settlement, 
  KurlySettlement, 
  CoupangSettlement, 
  GeneralSettlementColumn, 
  GeneralSettlementRow,
  CreateKurlySettlementDTO,
  CreateCoupangSettlementDTO,
  CreateGeneralSettlementDTO,
  BatchKurlySettlementDTO,
  BatchCoupangSettlementDTO,
  BatchGeneralSettlementDTO,
  SettlementWithDetails
} from './types/settlement';

// Common settlement functions
export async function getSettlements(courier_id?: string) {
  let query = supabase
    .from('settlements')
    .select('*')
    .order('settlement_date', { ascending: false });
    
  if (courier_id) {
    query = query.eq('courier_id', courier_id);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as Settlement[];
}

export async function getSettlementById(id: string) {
  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Settlement;
}

export async function getSettlementsByDateRange(startDate: string, endDate: string, courier_id?: string) {
  let query = supabase
    .from('settlements')
    .select('*')
    .gte('settlement_date', startDate)
    .lte('settlement_date', endDate)
    .order('settlement_date', { ascending: true });
    
  if (courier_id) {
    query = query.eq('courier_id', courier_id);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as Settlement[];
}

export async function createSettlement(
  settlement_date: string, 
  settlement_type: 'kurly' | 'coupang' | 'general',
  courier_id?: string
) {
  const { data, error } = await supabase
    .from('settlements')
    .insert({
      settlement_date,
      settlement_type,
      courier_id
    })
    .select()
    .single();

  if (error) throw error;
  return data as Settlement;
}

export async function updateSettlement(
  id: string,
  settlement_date: string
) {
  const { data, error } = await supabase
    .from('settlements')
    .update({
      settlement_date,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Settlement;
}

export async function deleteSettlement(id: string) {
  const { error } = await supabase
    .from('settlements')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// Get full settlement details based on type
export async function getSettlementWithDetails(id: string): Promise<SettlementWithDetails> {
  const settlement = await getSettlementById(id);
  
  let details;
  
  switch (settlement.settlement_type) {
    case 'kurly':
      details = await getKurlySettlements(id);
      break;
    case 'coupang':
      details = await getCoupangSettlements(id);
      break;
    case 'general':
      const generalData = await getGeneralSettlementColumns(id);
      details = generalData;
      break;
  }
  
  return {
    settlement,
    details
  };
}

// Kurly settlements
export async function getKurlySettlements(settlement_id: string) {
  const { data, error } = await supabase
    .from('kurly_settlements')
    .select('*')
    .eq('settlement_id', settlement_id)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as KurlySettlement[];
}

export async function createKurlySettlement(
  settlement_id: string,
  kurlySettlement: CreateKurlySettlementDTO
) {
  const { data, error } = await supabase
    .from('kurly_settlements')
    .insert({
      settlement_id,
      ...kurlySettlement
    })
    .select()
    .single();

  if (error) throw error;
  return data as KurlySettlement;
}

export async function batchCreateKurlySettlements(
  batchKurlyData: BatchKurlySettlementDTO
) {
  // First create the settlement parent record
  const settlement = await createSettlement(
    batchKurlyData.settlement_date,
    'kurly'
  );
  
  // Then create all the individual settlements
  const insertData = batchKurlyData.settlements.map(item => ({
    settlement_id: settlement.id,
    ...item
  }));
  
  const { data, error } = await supabase
    .from('kurly_settlements')
    .insert(insertData)
    .select();

  if (error) throw error;
  
  return {
    settlement,
    items: data as KurlySettlement[]
  };
}

export async function updateKurlySettlement(
  id: string,
  kurlySettlement: Partial<CreateKurlySettlementDTO>
) {
  const { data, error } = await supabase
    .from('kurly_settlements')
    .update({
      ...kurlySettlement,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as KurlySettlement;
}

export async function deleteKurlySettlement(id: string) {
  const { error } = await supabase
    .from('kurly_settlements')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// Coupang settlements
export async function getCoupangSettlements(settlement_id: string) {
  const { data, error } = await supabase
    .from('coupang_settlements')
    .select('*')
    .eq('settlement_id', settlement_id)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as CoupangSettlement[];
}

export async function createCoupangSettlement(
  settlement_id: string,
  coupangSettlement: CreateCoupangSettlementDTO
) {
  const { data, error } = await supabase
    .from('coupang_settlements')
    .insert({
      settlement_id,
      ...coupangSettlement
    })
    .select()
    .single();

  if (error) throw error;
  return data as CoupangSettlement;
}

export async function batchCreateCoupangSettlements(
  batchCoupangData: BatchCoupangSettlementDTO
) {
  // First create the settlement parent record
  const settlement = await createSettlement(
    batchCoupangData.settlement_date,
    'coupang'
  );
  
  // Then create all the individual settlements
  const insertData = batchCoupangData.settlements.map(item => ({
    settlement_id: settlement.id,
    ...item
  }));
  
  const { data, error } = await supabase
    .from('coupang_settlements')
    .insert(insertData)
    .select();

  if (error) throw error;
  
  return {
    settlement,
    items: data as CoupangSettlement[]
  };
}

export async function updateCoupangSettlement(
  id: string,
  coupangSettlement: Partial<CreateCoupangSettlementDTO>
) {
  const { data, error } = await supabase
    .from('coupang_settlements')
    .update({
      ...coupangSettlement,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as CoupangSettlement;
}

export async function deleteCoupangSettlement(id: string) {
  const { error } = await supabase
    .from('coupang_settlements')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// General settlements (fully editable version)
export async function getGeneralSettlementColumns(settlement_id: string) {
  const { data, error } = await supabase
    .from('general_settlements')
    .select('*')
    .eq('settlement_id', settlement_id)
    .order('row_order', { ascending: true });

  if (error) throw error;
  
  // Group by row_order to create a proper table structure
  const rows: GeneralSettlementRow[] = [];
  const columns = new Set<string>();
  
  // First, collect all unique column names
  data.forEach((col: GeneralSettlementColumn) => {
    columns.add(col.column_name);
  });
  
  // Then create rows with all columns
  const rowMap = new Map<number, GeneralSettlementRow>();
  
  data.forEach((col: GeneralSettlementColumn) => {
    if (!rowMap.has(col.row_order)) {
      rowMap.set(col.row_order, { row_id: col.row_order });
    }
    
    const row = rowMap.get(col.row_order);
    if (row) {
      row[col.column_name] = col.column_value || '';
    }
  });
  
  // Convert map to array
  rowMap.forEach((row) => {
    rows.push(row);
  });
  
  return {
    columns: Array.from(columns),
    rows
  };
}

export async function createGeneralSettlement(
  settlement_id: string,
  generalSettlement: CreateGeneralSettlementDTO
) {
  const { columns, rows } = generalSettlement;
  
  // Convert to database format
  const insertData = [];
  
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    
    for (const column of columns) {
      insertData.push({
        settlement_id,
        row_order: rowIndex,
        column_name: column,
        column_value: row[column]?.toString() || null
      });
    }
  }
  
  const { data, error } = await supabase
    .from('general_settlements')
    .insert(insertData)
    .select();

  if (error) throw error;
  return {
    columns,
    rows
  };
}

export async function batchCreateGeneralSettlement(
  batchGeneralData: BatchGeneralSettlementDTO
) {
  // First create the settlement parent record
  const settlement = await createSettlement(
    batchGeneralData.settlement_date,
    'general'
  );
  
  // Then create the general settlement data
  await createGeneralSettlement(settlement.id, {
    columns: batchGeneralData.columns,
    rows: batchGeneralData.rows
  });
  
  return {
    settlement,
    details: {
      columns: batchGeneralData.columns,
      rows: batchGeneralData.rows
    }
  };
}

export async function updateGeneralSettlement(
  settlement_id: string,
  generalSettlement: CreateGeneralSettlementDTO
) {
  // For simplicity, we'll delete all existing entries and recreate them
  
  // First delete existing entries
  const { error: deleteError } = await supabase
    .from('general_settlements')
    .delete()
    .eq('settlement_id', settlement_id);
    
  if (deleteError) throw deleteError;
  
  // Then create new ones
  return createGeneralSettlement(settlement_id, generalSettlement);
}

export async function deleteGeneralSettlement(settlement_id: string) {
  const { error } = await supabase
    .from('general_settlements')
    .delete()
    .eq('settlement_id', settlement_id);

  if (error) throw error;
  return true;
}