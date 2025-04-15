import { supabase, LogisticsCenter } from './supabase';

// 물류센터 목록 가져오기
export async function getLogisticsCenters() {
  const { data, error } = await supabase
    .from('logistics_centers')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching logistics centers:', error);
    throw error;
  }
  
  return data as LogisticsCenter[];
}

// 특정 물류센터 정보 가져오기
export async function getLogisticsCenter(id: string) {
  const { data, error } = await supabase
    .from('logistics_centers')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching logistics center with id ${id}:`, error);
    throw error;
  }
  
  return data as LogisticsCenter;
}

// 물류센터 추가하기
export async function createLogisticsCenter(centerData: Omit<LogisticsCenter, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('logistics_centers')
    .insert([centerData])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating logistics center:', error);
    throw error;
  }
  
  return data as LogisticsCenter;
}

// 물류센터 정보 업데이트하기
export async function updateLogisticsCenter(id: string, centerData: Partial<LogisticsCenter>) {
  const { data, error } = await supabase
    .from('logistics_centers')
    .update(centerData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating logistics center with id ${id}:`, error);
    throw error;
  }
  
  return data as LogisticsCenter;
}

// 물류센터 삭제하기
export async function deleteLogisticsCenter(id: string) {
  const { error } = await supabase
    .from('logistics_centers')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting logistics center with id ${id}:`, error);
    throw error;
  }
  
  return true;
}