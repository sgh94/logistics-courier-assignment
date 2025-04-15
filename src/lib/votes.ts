import { supabase, Vote } from './supabase';

// 특정 기사의 투표 가져오기
export async function getUserVotes(courierId: string, fromDate?: string, toDate?: string) {
  let query = supabase
    .from('votes')
    .select('*')
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
    console.error(`Error fetching votes for courier ${courierId}:`, error);
    throw error;
  }
  
  return data as Vote[];
}

// 특정 날짜의 모든 투표 가져오기
export async function getVotesByDate(date: string) {
  const { data, error } = await supabase
    .from('votes')
    .select('*, users:courier_id(name, email, phone)')
    .eq('date', date);
  
  if (error) {
    console.error(`Error fetching votes for date ${date}:`, error);
    throw error;
  }
  
  return data;
}

// 특정 날짜 범위의 투표 가져오기 (관리자용)
export async function getAllVotes(fromDate?: string, toDate?: string) {
  let query = supabase
    .from('votes')
    .select('*, users:courier_id(name, email, phone)')
    .order('date', { ascending: true });
  
  if (fromDate) {
    query = query.gte('date', fromDate);
  }
  
  if (toDate) {
    query = query.lte('date', toDate);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching all votes:', error);
    throw error;
  }
  
  return data;
}

// 투표 생성 또는 업데이트
export async function saveVote(vote: Omit<Vote, 'id' | 'created_at'>) {
  // 먼저 해당 날짜와 기사에 대한 투표가 있는지 확인
  const { data: existingVote, error: fetchError } = await supabase
    .from('votes')
    .select('id')
    .eq('courier_id', vote.courier_id)
    .eq('date', vote.date)
    .maybeSingle();
  
  if (fetchError) {
    console.error('Error checking existing vote:', fetchError);
    throw fetchError;
  }
  
  if (existingVote) {
    // 기존 투표 업데이트
    const { data, error } = await supabase
      .from('votes')
      .update({
        is_available: vote.is_available,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingVote.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating vote:', error);
      throw error;
    }
    
    return data as Vote;
  } else {
    // 새 투표 생성
    const { data, error } = await supabase
      .from('votes')
      .insert([vote])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating vote:', error);
      throw error;
    }
    
    return data as Vote;
  }
}

// 특정 기사의 투표 삭제
export async function deleteVote(voteId: string) {
  const { error } = await supabase
    .from('votes')
    .delete()
    .eq('id', voteId);
  
  if (error) {
    console.error(`Error deleting vote with id ${voteId}:`, error);
    throw error;
  }
  
  return true;
}