// src/lib/types/settlement.ts
export type Settlement = {
  id: string;
  courier_id: string;
  delivery_date: string;
  delivery_fee: number;
  created_at: string;
  courier?: {
    name: string;
  };
};

export type KurlySettlement = Settlement & {
  shift?: string;
  sequence?: string;
};

export type CoupangSettlement = Settlement & {
  delivery_code?: string;
  delivery_count?: number;
  unit_price?: number;
  weight?: number | null;
};

export type SettlementStatement = {
  id: string;
  courier_id: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  commission_rate: number;
  commission_amount: number;
  final_amount: number;
  vat_amount: number;
  payment_status: 'pending' | 'paid' | 'cancelled';
  payment_date: string | null;
  created_at: string;
  courier?: {
    name: string;
  };
  kurly_settlements?: KurlySettlement[];
  coupang_settlements?: CoupangSettlement[];
  adjustments?: SettlementAdjustment[];
};

export type SettlementAdjustment = {
  id: string;
  statement_id: string;
  description: string;
  amount: number;
  type: 'expense' | 'income' | 'tax' | 'other';
  created_at: string;
};