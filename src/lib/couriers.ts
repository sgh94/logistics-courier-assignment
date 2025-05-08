import { supabase } from './supabase';
import { User } from './auth';

// 모든 택배기사 가져오기 (getAllCouriers는 이전 이름, getCouriers는 새 이름)
export async function getCouriers() {
  return getAllCouriers();
}

// 모든 택배기사 가져오기
export async function getAllCouriers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'courier')
    .order('name');

  if (error) {
    console.error('Error fetching couriers:', error);
    throw error;
  }

  return data as User[];
}

// 특정 택배기사 정보 가져오기 (getCourier는 이전 이름, getCourierById는 새 이름)
export async function getCourierById(id: string) {
  return getCourier(id);
}

// 특정 택배기사 정보 가져오기
export async function getCourier(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .eq('role', 'courier')
    .single();

  if (error) {
    console.error(`Error fetching courier with id ${id}:`, error);
    throw error;
  }

  return data as User;
}

// 근무 가능한 택배기사 가져오기
export async function getAvailableCouriers(date: string) {
  const { data, error } = await supabase
    .from('votes')
    .select('*, users:courier_id(*)')
    .eq('date', date)
    .eq('is_available', true);

  if (error) {
    console.error(`Error fetching available couriers for date ${date}:`, error);
    throw error;
  }

  // 사용자 정보만 추출
  return data.map(vote => vote.users as User);
}

// 특정 날짜의 모든 택배기사 정보 (투표 상태 포함)
export async function getAllCouriersWithVoteStatus(date: string) {
  // 1. 모든 택배기사 가져오기
  const { data: couriers, error: courierError } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'courier')
    .order('name');

  if (courierError) {
    console.error('Error fetching all couriers:', courierError);
    throw courierError;
  }

  // 2. 해당 날짜의 모든 투표 가져오기
  const { data: votes, error: voteError } = await supabase
    .from('votes')
    .select('*')
    .eq('date', date);

  if (voteError) {
    console.error(`Error fetching votes for date ${date}:`, voteError);
    throw voteError;
  }

  // 3. 투표 정보 매핑
  const voteMap = new Map();
  votes.forEach(vote => {
    voteMap.set(vote.courier_id, vote.is_available);
  });

  // 4. 각 기사에 투표 상태 추가
  const couriersWithVoteStatus = couriers.map(courier => ({
    ...courier,
    vote_status: voteMap.has(courier.id)
      ? (voteMap.get(courier.id) ? 'available' : 'unavailable')
      : 'not_voted'
  }));

  return couriersWithVoteStatus;
}

// 이미 배치된 택배기사 가져오기
export async function getAssignedCouriers(date: string) {
  const { data, error } = await supabase
    .from('assignments')
    .select('courier_id')
    .eq('date', date);

  if (error) {
    console.error(`Error fetching assigned couriers for date ${date}:`, error);
    throw error;
  }

  return data.map(assignment => assignment.courier_id);
}

// 택배기사 정보 업데이트하기
export async function updateCourier(id: string, userData: Partial<User>) {
  const { data, error } = await supabase
    .from('users')
    .update(userData)
    .eq('id', id)
    .eq('role', 'courier')
    .select()
    .single();

  if (error) {
    console.error(`Error updating courier with id ${id}:`, error);
    throw error;
  }

  return data as User;
}

// 택배기사 통계 가져오기
export async function getCourierStats(id: string, fromDate?: string, toDate?: string) {
  const today = new Date();
  const startDate = fromDate || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const endDate = toDate || today.toISOString().split('T')[0];

  // 총 배치 횟수
  const { count: totalAssignments, error: countError } = await supabase
    .from('assignments')
    .select('*', { count: 'exact', head: true })
    .eq('courier_id', id)
    .gte('date', startDate)
    .lte('date', endDate);

  if (countError) {
    console.error(`Error getting assignment count for courier ${id}:`, countError);
    throw countError;
  }

  // 물류센터별 배치 횟수
  const { data: centerAssignments, error: centerError } = await supabase
    .from('assignments')
    .select(`
      logistics_center_id,
      centers:logistics_center_id(name)
    `)
    .eq('courier_id', id)
    .gte('date', startDate)
    .lte('date', endDate);

  if (centerError) {
    console.error(`Error getting center assignments for courier ${id}:`, centerError);
    throw centerError;
  }

  // 물류센터별 집계
  const centerStats: Record<string, { centerId: string, centerName: string, count: number }> = {};
  centerAssignments.forEach(assignment => {
    const centerId = assignment.logistics_center_id;
    const centerName = assignment.centers ? assignment.centers[0].name : '알 수 없음';

    if (!centerStats[centerId]) {
      centerStats[centerId] = {
        centerId,
        centerName,
        count: 0
      };
    }

    centerStats[centerId].count++;
  });

  return {
    totalAssignments: totalAssignments || 0,
    centerStats: Object.values(centerStats)
  };
}

// 알림 설정 가져오기
export async function getCourierNotificationSettings(id: string) {
  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116: 결과가 없음
    console.error(`Error fetching notification settings for courier ${id}:`, error);
    throw error;
  }

  return data || {
    user_id: id,
    sms_enabled: false,
    email_enabled: true,
    kakao_enabled: false
  };
}

// 알림 설정 업데이트하기
export async function updateCourierNotificationSettings(id: string, settings: {
  sms_enabled?: boolean;
  email_enabled?: boolean;
  kakao_enabled?: boolean;
}) {
  // 먼저 설정이 있는지 확인
  const { data: existingSettings, error: fetchError } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', id)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error(`Error checking notification settings for courier ${id}:`, fetchError);
    throw fetchError;
  }

  if (existingSettings) {
    // 기존 설정 업데이트
    const { data, error } = await supabase
      .from('notification_settings')
      .update(settings)
      .eq('user_id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating notification settings for courier ${id}:`, error);
      throw error;
    }

    return data;
  } else {
    // 새 설정 생성
    const { data, error } = await supabase
      .from('notification_settings')
      .insert([{
        user_id: id,
        sms_enabled: settings.sms_enabled ?? false,
        email_enabled: settings.email_enabled ?? true,
        kakao_enabled: settings.kakao_enabled ?? false
      }])
      .select()
      .single();

    if (error) {
      console.error(`Error creating notification settings for courier ${id}:`, error);
      throw error;
    }

    return data;
  }
}