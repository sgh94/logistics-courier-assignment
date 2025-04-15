import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 기본 테이블 타입 정의
export type User = {
  id: string;
  email: string;
  role: 'admin' | 'courier';
  name: string;
  phone?: string;
  created_at: string;
};

export type LogisticsCenter = {
  id: string;
  name: string;
  description: string;
  address: string;
  map_url?: string;
  manager_name?: string;
  manager_contact?: string;
  created_at: string;
  created_by: string;
};

export type Vote = {
  id: string;
  courier_id: string;
  date: string;
  is_available: boolean;
  notes?: string;
  preferred_center_id?: string;
  created_at: string;
  updated_at?: string;
};

export type Assignment = {
  id: string;
  courier_id: string;
  logistics_center_id: string;
  date: string;
  start_time?: string;
  end_time?: string;
  created_at: string;
  created_by: string;
  notes?: string;
};