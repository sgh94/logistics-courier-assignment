// src/lib/couriers.ts
import { createClient } from '@/lib/supabase';

export type Courier = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
};

// Get all couriers (renamed from getAllCouriers to getCouriers for compatibility)
export async function getCouriers() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'courier')
    .order('name');
    
  if (error) {
    console.error('Error fetching couriers:', error);
    throw error;
  }
  
  return data as Courier[];
}

// Get courier by ID (renamed from getCourier to getCourierById for compatibility)
export async function getCourierById(courierId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', courierId)
    .single();
    
  if (error) {
    console.error('Error fetching courier:', error);
    throw error;
  }
  
  return data as Courier;
}

// Keep original function for backward compatibility
export async function getCourier(courierId: string) {
  return getCourierById(courierId);
}

// Get all couriers (original function)
export async function getAllCouriers() {
  return getCouriers();
}

// Update courier
export async function updateCourier(courierId: string, updates: Partial<Courier>) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', courierId)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating courier:', error);
    throw error;
  }
  
  return data as Courier;
}