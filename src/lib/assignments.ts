import { supabase, Assignment } from './supabase';

// 모든 배치 가져오기
export async function getAllAssignments(fromDate?: string, toDate?: string) {
  let query = supabase
    .from('assignments')
    .select(`
      *,
      couriers:courier_id(id, name, email, phone),
      centers:logistics_center_id(id, name, address, manager_name, manager_contact)
    `)
    .order('date', { ascending: true });
  
  if (fromDate) {
    query = query.gte('date', fromDate);
  }
  
  if (toDate) {
    query = query.lte('date', toDate);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching assignments:', error);
    throw error;
  }
  
  return data;
}

// 특정 날짜의 배치 가져오기
export async function getAssignmentsByDate(date: string) {
  const { data, error } = await supabase
    .from('assignments')
    .select(`
      *,
      couriers:courier_id(id, name, email, phone),
      centers:logistics_center_id(id, name, address, manager_name, manager_contact)
    `)
    .eq('date', date);
  
  if (error) {
    console.error(`Error fetching assignments for date ${date}:`, error);
    throw error;
  }
  
  return data;
}

// 특정 기사의 배치 가져오기
export async function getCourierAssignments(courierId: string, fromDate?: string, toDate?: string) {
  let query = supabase
    .from('assignments')
    .select(`
      *,
      centers:logistics_center_id(id, name, address, manager_name, manager_contact)
    `)
    .eq('courier_id', courierId)
    .order('date', { ascending: true });
  
  if (fromDate) {
    query = query.gte('date', fromDate);
  }
  
  if (toDate) {
    query = query.lte('date', toDate);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error(`Error fetching assignments for courier ${courierId}:`, error);
    throw error;
  }
  
  return data;
}

// 특정 물류센터의 배치 가져오기
export async function getCenterAssignments(centerId: string, fromDate?: string, toDate?: string) {
  let query = supabase
    .from('assignments')
    .select(`
      *,
      couriers:courier_id(id, name, email, phone)
    `)
    .eq('logistics_center_id', centerId)
    .order('date', { ascending: true });
  
  if (fromDate) {
    query = query.gte('date', fromDate);
  }
  
  if (toDate) {
    query = query.lte('date', toDate);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error(`Error fetching assignments for center ${centerId}:`, error);
    throw error;
  }
  
  return data;
}

// 배치 생성하기
export async function createAssignment(assignmentData: Omit<Assignment, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('assignments')
    .insert([assignmentData])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }
  
  return data as Assignment;
}

// 배치 일괄 생성하기
export async function createMultipleAssignments(assignmentsData: Omit<Assignment, 'id' | 'created_at'>[]) {
  const { data, error } = await supabase
    .from('assignments')
    .insert(assignmentsData)
    .select();
  
  if (error) {
    console.error('Error creating multiple assignments:', error);
    throw error;
  }
  
  return data as Assignment[];
}

// 배치 업데이트하기
export async function updateAssignment(id: string, assignmentData: Partial<Assignment>) {
  const { data, error } = await supabase
    .from('assignments')
    .update(assignmentData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating assignment with id ${id}:`, error);
    throw error;
  }
  
  return data as Assignment;
}

// 배치 삭제하기
export async function deleteAssignment(id: string) {
  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting assignment with id ${id}:`, error);
    throw error;
  }
  
  return true;
}

// 특정 날짜의 배치 모두 삭제하기
export async function deleteAssignmentsByDate(date: string) {
  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('date', date);
  
  if (error) {
    console.error(`Error deleting assignments for date ${date}:`, error);
    throw error;
  }
  
  return true;
}