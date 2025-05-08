export interface SettlementReport {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CourierSettlementReport {
  id: string;
  report_id: string;
  courier_id: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  courier_name?: string; // Join with users table
}

export interface ReportSettlementItem {
  id: string;
  courier_settlement_report_id: string;
  settlement_id: string;
  settlement_type: 'kurly' | 'coupang' | 'general';
  item_id: string;
  amount: number;
  created_at: string;
  updated_at: string;
  item_details?: any; // Details of the actual settlement item
}

export interface SettlementReportWithCouriers extends SettlementReport {
  couriers: CourierSettlementReportWithItems[];
}

export interface CourierSettlementReportWithItems extends CourierSettlementReport {
  items: ReportSettlementItemWithDetails[];
}

export interface ReportSettlementItemWithDetails extends ReportSettlementItem {
  details: any; // Will be KurlySettlement, CoupangSettlement, or GeneralSettlementRow
}

// DTO interfaces
export interface CreateSettlementReportDTO {
  title: string;
  start_date: string;
  end_date: string;
}

export interface AddCourierToReportDTO {
  report_id: string;
  courier_id: string;
}

export interface AddSettlementItemToReportDTO {
  courier_settlement_report_id: string;
  settlement_id: string;
  settlement_type: 'kurly' | 'coupang' | 'general';
  item_id: string;
  amount: number;
}

// View models
export interface SettlementReportListItem extends SettlementReport {
  courier_count: number;
  total_amount: number;
}

export interface CourierReportViewModel {
  report: SettlementReport;
  courier: CourierSettlementReport;
  items: ReportSettlementItemWithDetails[];
  total_amount: number;
}

export interface BatchImportResult {
  successCount: number;
  errorCount: number;
  errors: { row: number; message: string }[];
}
