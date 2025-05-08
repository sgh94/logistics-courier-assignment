import { supabase } from './supabase';
import { CreateCoupangSettlementDTO, Settlement } from './types/settlement';
import { getCurrentUser } from './auth';

// 현재 로그인한 기사의 정산 조회
export async function getMyCoupangSettlements() {
  try {
    // 현재 사용자 정보 가져오기
    const { user } = await getCurrentUser();
    
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }
    
    // 기사 정보가 있는지 확인
    if (user.role !== 'courier') {
      throw new Error('기사만 이 기능을 사용할 수 있습니다.');
    }
    
    // 정산 목록 조회
    const { data: settlementData, error: settlementError } = await supabase
      .from('settlements')
      .select('id, settlement_date, settlement_type, created_at')
      .eq('settlement_type', 'coupang')
      .order('settlement_date', { ascending: false });
      
    if (settlementError) throw settlementError;
    
    // 각 정산에 대한 상세 정보 조회
    const result = [];
    
    for (const settlement of settlementData as Settlement[]) {
      const { data: coupangData, error: coupangError } = await supabase
        .from('coupang_settlements')
        .select('*')
        .eq('settlement_id', settlement.id)
        .eq('courier_name', user.name);
        
      if (coupangError) throw coupangError;
      
      // 현재 기사와 관련된 정산 데이터만 가져오기
      if (coupangData && coupangData.length > 0) {
        result.push({
          settlement,
          details: coupangData
        });
      }
    }
    
    return result;
  } catch (error) {
    console.error('Failed to get courier settlements:', error);
    throw error;
  }
}

// 기사가 본인 쿠팡 정산 입력
export async function createMyCoupangSettlement(data: CreateCoupangSettlementDTO) {
  try {
    // 현재 사용자 정보 가져오기
    const { user } = await getCurrentUser();
    
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }
    
    // 기사 정보가 있는지 확인
    if (user.role !== 'courier') {
      throw new Error('기사만 이 기능을 사용할 수 있습니다.');
    }
    
    // 요청 데이터에 현재 기사 이름 설정
    const settlementData = {
      ...data,
      courier_name: user.name
    };
    
    // 해당 날짜에 쿠팡 정산이 있는지 확인
    const { data: existingSettlements, error: settlementsError } = await supabase
      .from('settlements')
      .select('id')
      .eq('settlement_date', data.settlement_date)
      .eq('settlement_type', 'coupang');
      
    if (settlementsError) throw settlementsError;
    
    let settlement_id;
    
    // 없으면 새로 생성
    if (!existingSettlements || existingSettlements.length === 0) {
      const { data: newSettlement, error: newSettlementError } = await supabase
        .from('settlements')
        .insert({
          settlement_date: data.settlement_date,
          settlement_type: 'coupang',
          created_by: user.id
        })
        .select()
        .single();
        
      if (newSettlementError) throw newSettlementError;
      
      settlement_id = newSettlement.id;
    } else {
      settlement_id = existingSettlements[0].id;
    }
    
    // 쿠팡 정산 데이터 추가
    const { data: coupangSettlement, error: coupangError } = await supabase
      .from('coupang_settlements')
      .insert({
        settlement_id,
        settlement_date: data.settlement_date,
        day_or_night: data.day_or_night,
        delivery_area: data.delivery_area,
        courier_name: data.courier_name,
        delivery_count: data.delivery_count,
        unit_price: data.unit_price,
        supply_price: data.supply_price,
        vat: data.vat,
        total_amount: data.total_amount,
        profit: data.profit,
        invoice_status: data.invoice_status,
        payment_type: data.payment_type,
        note: data.note,
        transaction_partner: data.transaction_partner,
        return_count: data.return_count,
        camp: data.camp,
        route_id: data.route_id,
        pdd: data.pdd
      })
      .select()
      .single();
      
    if (coupangError) throw coupangError;
    
    return coupangSettlement;
  } catch (error) {
    console.error('Failed to create courier settlement:', error);
    throw error;
  }
}

// 기사가 본인 쿠팡 정산 수정
export async function updateMyCoupangSettlement(id: string, data: Partial<CreateCoupangSettlementDTO>) {
  try {
    // 현재 사용자 정보 가져오기
    const { user } = await getCurrentUser();
    
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }
    
    // 기사 정보가 있는지 확인
    if (user.role !== 'courier') {
      throw new Error('기사만 이 기능을 사용할 수 있습니다.');
    }
    
    // 해당 정산이 현재 기사의 것인지 확인
    const { data: existingSettlement, error: settlementsError } = await supabase
      .from('coupang_settlements')
      .select('id, courier_name')
      .eq('id', id)
      .single();
      
    if (settlementsError) throw settlementsError;
    
    if (existingSettlement.courier_name !== user.name) {
      throw new Error('자신의 정산만 수정할 수 있습니다.');
    }
    
    // 쿠팡 정산 데이터 수정
    const { data: coupangSettlement, error: coupangError } = await supabase
      .from('coupang_settlements')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (coupangError) throw coupangError;
    
    return coupangSettlement;
  } catch (error) {
    console.error('Failed to update courier settlement:', error);
    throw error;
  }
}

// 기사가 본인 쿠팡 정산 삭제
export async function deleteMyCoupangSettlement(id: string) {
  try {
    // 현재 사용자 정보 가져오기
    const { user } = await getCurrentUser();
    
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }
    
    // 기사 정보가 있는지 확인
    if (user.role !== 'courier') {
      throw new Error('기사만 이 기능을 사용할 수 있습니다.');
    }
    
    // 해당 정산이 현재 기사의 것인지 확인
    const { data: existingSettlement, error: settlementsError } = await supabase
      .from('coupang_settlements')
      .select('id, courier_name')
      .eq('id', id)
      .single();
      
    if (settlementsError) throw settlementsError;
    
    if (existingSettlement.courier_name !== user.name) {
      throw new Error('자신의 정산만 삭제할 수 있습니다.');
    }
    
    // 쿠팡 정산 데이터 삭제
    const { error: coupangError } = await supabase
      .from('coupang_settlements')
      .delete()
      .eq('id', id);
      
    if (coupangError) throw coupangError;
    
    return true;
  } catch (error) {
    console.error('Failed to delete courier settlement:', error);
    throw error;
  }
}

// 특정 기간동안의 본인 정산 가져오기
export async function getMyCoupangSettlementsByPeriod(startDate: string, endDate: string) {
  try {
    // 현재 사용자 정보 가져오기
    const { user } = await getCurrentUser();
    
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }
    
    // 기사 정보가 있는지 확인
    if (user.role !== 'courier') {
      throw new Error('기사만 이 기능을 사용할 수 있습니다.');
    }
    
    // 정산 목록 조회
    const { data: settlementData, error: settlementError } = await supabase
      .from('settlements')
      .select('id, settlement_date, settlement_type, created_at')
      .eq('settlement_type', 'coupang')
      .gte('settlement_date', startDate)
      .lte('settlement_date', endDate)
      .order('settlement_date', { ascending: false });
      
    if (settlementError) throw settlementError;
    
    // 각 정산에 대한 상세 정보 조회
    const result = [];
    
    for (const settlement of settlementData as Settlement[]) {
      const { data: coupangData, error: coupangError } = await supabase
        .from('coupang_settlements')
        .select('*')
        .eq('settlement_id', settlement.id)
        .eq('courier_name', user.name);
        
      if (coupangError) throw coupangError;
      
      // 현재 기사와 관련된 정산 데이터만 가져오기
      if (coupangData && coupangData.length > 0) {
        result.push({
          settlement,
          details: coupangData
        });
      }
    }
    
    return result;
  } catch (error) {
    console.error('Failed to get courier settlements by period:', error);
    throw error;
  }
}
