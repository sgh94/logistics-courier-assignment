import { supabase } from './supabase';
import { 
  SettlementReport, 
  CourierSettlementReport, 
  ReportSettlementItem,
  CreateSettlementReportDTO,
  AddCourierToReportDTO,
  AddSettlementItemToReportDTO,
  SettlementReportListItem,
  CourierReportViewModel,
  SettlementReportWithCouriers
} from './types/settlement-report';
import { getSettlementWithDetails } from './settlements';

// Settlement report functions
export async function getSettlementReports() {
  const { data, error } = await supabase
    .from('settlement_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as SettlementReport[];
}

export async function getSettlementReportsList(): Promise<SettlementReportListItem[]> {
  // Get all reports with summary information
  const { data, error } = await supabase
    .from('settlement_reports')
    .select(`
      *,
      courier_settlement_reports!inner (
        id,
        total_amount
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Transform into the list view model
  return data.map((item: any) => {
    const courierReports = item.courier_settlement_reports || [];
    const total_amount = courierReports.reduce((sum: number, report: any) => 
      sum + (parseFloat(report.total_amount) || 0), 0);
    
    return {
      ...item,
      courier_count: courierReports.length,
      total_amount
    };
  }) as SettlementReportListItem[];
}

export async function getSettlementReportById(id: string): Promise<SettlementReport> {
  const { data, error } = await supabase
    .from('settlement_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as SettlementReport;
}

export async function getSettlementReportWithCouriers(id: string): Promise<SettlementReportWithCouriers> {
  // Get report and courier reports in a single query
  const { data, error } = await supabase
    .from('settlement_reports')
    .select(`
      *,
      courier_settlement_reports (
        *,
        report_settlement_items (*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  
  // Fetch all the courier names in a separate query
  const courierIds = data.courier_settlement_reports.map((cr: any) => cr.courier_id);
  
  const { data: couriers, error: courierError } = await supabase
    .from('users')
    .select('id, name')
    .in('id', courierIds);
    
  if (courierError) throw courierError;
  
  // Map courier names to their IDs
  const courierMap = new Map();
  couriers.forEach((courier: any) => {
    courierMap.set(courier.id, courier.name);
  });
  
  // Add courier names to the reports
  const courierReports = data.courier_settlement_reports.map((cr: any) => ({
    ...cr,
    courier_name: courierMap.get(cr.courier_id) || 'Unknown'
  }));
  
  return {
    ...data,
    couriers: courierReports
  } as SettlementReportWithCouriers;
}

export async function getCourierReportDetails(reportId: string, courierId: string): Promise<CourierReportViewModel> {
  // Get report and courier report
  const { data: report, error: reportError } = await supabase
    .from('settlement_reports')
    .select('*')
    .eq('id', reportId)
    .single();
    
  if (reportError) throw reportError;
  
  const { data: courierReport, error: courierError } = await supabase
    .from('courier_settlement_reports')
    .select('*')
    .eq('report_id', reportId)
    .eq('courier_id', courierId)
    .single();
    
  if (courierError) throw courierError;
  
  // Get courier name
  const { data: courier, error: courierNameError } = await supabase
    .from('users')
    .select('name')
    .eq('id', courierId)
    .single();
    
  if (courierNameError) throw courierNameError;
  
  // Get all settlement items
  const { data: items, error: itemsError } = await supabase
    .from('report_settlement_items')
    .select('*')
    .eq('courier_settlement_report_id', courierReport.id)
    .order('created_at', { ascending: true });
    
  if (itemsError) throw itemsError;
  
  // Get details for each settlement item
  const itemsWithDetails = await Promise.all(items.map(async (item) => {
    const details = await getSettlementWithDetails(item.settlement_id);
    return {
      ...item,
      details: details
    };
  }));
  
  return {
    report,
    courier: {
      ...courierReport,
      courier_name: courier.name
    },
    items: itemsWithDetails,
    total_amount: parseFloat(courierReport.total_amount) || 0
  };
}

export async function createSettlementReport(
  reportData: CreateSettlementReportDTO
): Promise<SettlementReport> {
  const { data, error } = await supabase
    .from('settlement_reports')
    .insert(reportData)
    .select()
    .single();

  if (error) throw error;
  return data as SettlementReport;
}

export async function updateSettlementReport(
  id: string,
  reportData: Partial<CreateSettlementReportDTO>
): Promise<SettlementReport> {
  const { data, error } = await supabase
    .from('settlement_reports')
    .update({
      ...reportData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as SettlementReport;
}

export async function deleteSettlementReport(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('settlement_reports')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function addCourierToReport(
  data: AddCourierToReportDTO
): Promise<CourierSettlementReport> {
  const { data: result, error } = await supabase
    .from('courier_settlement_reports')
    .insert({
      report_id: data.report_id,
      courier_id: data.courier_id,
      total_amount: 0 // Initial amount
    })
    .select()
    .single();

  if (error) throw error;
  return result as CourierSettlementReport;
}

export async function addSettlementItemToReport(
  data: AddSettlementItemToReportDTO
): Promise<ReportSettlementItem> {
  const { data: result, error } = await supabase
    .from('report_settlement_items')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  
  // Update the total amount in the courier settlement report
  await updateCourierReportTotalAmount(data.courier_settlement_report_id);
  
  return result as ReportSettlementItem;
}

export async function removeSettlementItemFromReport(id: string): Promise<boolean> {
  // First get the item to know which courier report to update
  const { data: item, error: getError } = await supabase
    .from('report_settlement_items')
    .select('courier_settlement_report_id')
    .eq('id', id)
    .single();
    
  if (getError) throw getError;
  
  // Delete the item
  const { error } = await supabase
    .from('report_settlement_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
  
  // Update the total amount
  await updateCourierReportTotalAmount(item.courier_settlement_report_id);
  
  return true;
}

export async function removeCourierFromReport(reportId: string, courierId: string): Promise<boolean> {
  const { error } = await supabase
    .from('courier_settlement_reports')
    .delete()
    .eq('report_id', reportId)
    .eq('courier_id', courierId);

  if (error) throw error;
  return true;
}

// Helper to recalculate and update the total amount for a courier report
async function updateCourierReportTotalAmount(courierReportId: string): Promise<void> {
  // Get all items for this courier report
  const { data: items, error } = await supabase
    .from('report_settlement_items')
    .select('amount')
    .eq('courier_settlement_report_id', courierReportId);
    
  if (error) throw error;
  
  // Calculate total
  const totalAmount = items.reduce((sum, item) => 
    sum + (parseFloat(item.amount) || 0), 0);
  
  // Update the courier report
  const { error: updateError } = await supabase
    .from('courier_settlement_reports')
    .update({
      total_amount: totalAmount,
      updated_at: new Date().toISOString()
    })
    .eq('id', courierReportId);
    
  if (updateError) throw updateError;
}

// Get settlements for a date range that can be added to a report
export async function getAvailableSettlementsForReport(
  startDate: string, 
  endDate: string, 
  courierId?: string,
  excludeSettlementIds: string[] = []
) {
  let query = supabase
    .from('settlements')
    .select(`
      *,
      kurly_settlements(*),
      coupang_settlements(*),
      general_settlements(*)
    `)
    .gte('settlement_date', startDate)
    .lte('settlement_date', endDate);
    
  if (courierId) {
    query = query.eq('courier_id', courierId);
  }
  
  if (excludeSettlementIds.length > 0) {
    query = query.not('id', 'in', `(${excludeSettlementIds.join(',')})`);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data;
}

// Get settlements for a specific courier within a date range
export async function getCourierSettlementsByDateRange(
  courierId: string, 
  startDate: string, 
  endDate: string
) {
  const { data, error } = await supabase
    .from('settlements')
    .select(`
      *,
      kurly_settlements(*),
      coupang_settlements(*),
      general_settlements(*)
    `)
    .eq('courier_id', courierId)
    .gte('settlement_date', startDate)
    .lte('settlement_date', endDate)
    .order('settlement_date', { ascending: true });
    
  if (error) throw error;
  
  return data;
}
