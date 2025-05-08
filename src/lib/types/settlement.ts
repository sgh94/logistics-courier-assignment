export interface Settlement {
  id: string;
  settlement_date: string;
  settlement_type: 'kurly' | 'coupang' | 'general';
  created_at: string;
  updated_at: string;
  created_by: string;
  courier_id?: string; // 배송기사가 직접 등록한 경우
}

export interface KurlySettlement {
  id: string;
  settlement_id: string;
  company_name: string; // 업체명
  settlement_date?: string; // 날짜
  support_type?: string; // 지원/대처
  amount: number; // 금액(만원)
  note?: string; // 비고
  settlement_amount: number; // 정산금액
  supply_price: number; // 공급가
  delivery_count?: number; // 딜리건수
  unit_price?: number; // 단가
  center?: string; // 센터
  region?: string; // 지역
  created_at: string;
  updated_at: string;
}

export interface CoupangSettlement {
  id: string;
  settlement_id: string;
  settlement_date: string; // 날짜
  day_or_night?: string; // 주/야
  delivery_area?: string; // 배송구역
  courier_name: string; // 이름
  delivery_count: number; // 건수
  unit_price: number; // 단가(vat별도)
  supply_price: number; // 공급가
  vat: number; // 부가세
  total_amount: number; // 합계
  profit: number; // 수익금
  invoice_status?: string; // 계산서
  payment_type?: string; // 입금형태
  note?: string; // 비고
  transaction_partner?: string; // 거래처(입금처)
  return_count?: number; // 반품건수
  camp?: string; // 캠프
  route_id?: string; // 라우트
  pdd?: string; // PDD
  created_at: string;
  updated_at: string;
}

export interface GeneralSettlementColumn {
  id: string;
  settlement_id: string;
  row_order: number;
  column_name: string;
  column_value?: string;
  created_at: string;
  updated_at: string;
}

export interface GeneralSettlementRow {
  [columnName: string]: string | number | null | undefined;
}

export interface CreateKurlySettlementDTO {
  company_name: string;
  settlement_date: string;
  support_type?: string;
  amount: number;
  note?: string;
  settlement_amount: number;
  supply_price: number;
  delivery_count?: number;
  unit_price?: number;
  center?: string;
  region?: string;
}

export interface CreateCoupangSettlementDTO {
  settlement_date: string;
  day_or_night?: string;
  delivery_area?: string;
  courier_name: string;
  delivery_count: number;
  unit_price: number;
  supply_price: number;
  vat: number;
  total_amount: number;
  profit: number;
  invoice_status?: string;
  payment_type?: string;
  note?: string;
  transaction_partner?: string;
  return_count?: number;
  camp?: string;
  route_id?: string;
  pdd?: string;
}

export interface CreateGeneralSettlementDTO {
  columns: string[];
  rows: GeneralSettlementRow[];
}

// New batch import interfaces for multiple entries at once
export interface BatchKurlySettlementDTO {
  settlement_date: string;
  settlements: CreateKurlySettlementDTO[];
}

export interface BatchCoupangSettlementDTO {
  settlement_date: string;
  settlements: CreateCoupangSettlementDTO[];
}

export interface BatchGeneralSettlementDTO {
  settlement_date: string;
  columns: string[];
  rows: GeneralSettlementRow[];
}

export interface SettlementWithDetails {
  settlement: Settlement;
  details: KurlySettlement[] | CoupangSettlement[] | { columns: string[], rows: GeneralSettlementRow[] };
}
