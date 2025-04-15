import { supabase, Vote, VotePreferredCenter, LogisticsCenter } from './supabase';

// 특정 기사의 투표 가져오기
export async function getUserVotes(courierId: string, fromDate?: string, toDate?: string) {
  let query = supabase
    .from('votes')
    .select(`
      *
    `)
    .eq('courier_id', courierId)
    .order('date', { ascending: true });

  if (fromDate) {
    query = query.gte('date', fromDate);
  }

  if (toDate) {
    query = query.lte('date', toDate);
  }

  const { data: votes, error } = await query;

  if (error) {
    console.error(`Error fetching votes for courier ${courierId}:`, error);
    throw error;
  }

  // 각 투표에 대한 선호 물류센터 가져오기
  const votesWithCenters = await Promise.all(votes.map(async (vote) => {
    const { data: centers, error: centersError } = await supabase
      .from('vote_preferred_centers')
      .select(`
        center_id,
        logistics_centers:center_id(id, name, address)
      `)
      .eq('vote_id', vote.id);

    if (centersError) {
      console.error(`Error fetching preferred centers for vote ${vote.id}:`, centersError);
      return vote;
    }

    return {
      ...vote,
      preferred_centers: centers.map(c => c.logistics_centers) as unknown as LogisticsCenter[]
    };
  }));

  return votesWithCenters as Vote[];
}

// 특정 날짜의 모든 투표 가져오기
export async function getVotesByDate(date: string) {
  const { data: votes, error } = await supabase
    .from('votes')
    .select(`
      *,
      users:courier_id(name, email, phone)
    `)
    .eq('date', date);

  if (error) {
    console.error(`Error fetching votes for date ${date}:`, error);
    throw error;
  }

  // 각 투표에 대한 선호 물류센터 가져오기
  const votesWithCenters = await Promise.all(votes.map(async (vote) => {
    const { data: centers, error: centersError } = await supabase
      .from('vote_preferred_centers')
      .select(`
        center_id,
        logistics_centers:center_id(id, name, address)
      `)
      .eq('vote_id', vote.id);

    if (centersError) {
      console.error(`Error fetching preferred centers for vote ${vote.id}:`, centersError);
      return vote;
    }

    return {
      ...vote,
      preferred_centers: centers.map(c => c.logistics_centers)
    };
  }));

  return votesWithCenters;
}

// 특정 날짜 범위의 투표 가져오기 (관리자용)
export async function getAllVotes(fromDate?: string, toDate?: string) {
  let query = supabase
    .from('votes')
    .select(`
      *,
      users:courier_id(name, email, phone)
    `)
    .order('date', { ascending: true });

  if (fromDate) {
    query = query.gte('date', fromDate);
  }

  if (toDate) {
    query = query.lte('date', toDate);
  }

  const { data: votes, error } = await query;

  if (error) {
    console.error('Error fetching all votes:', error);
    throw error;
  }

  // 각 투표에 대한 선호 물류센터 가져오기
  const votesWithCenters = await Promise.all(votes.map(async (vote) => {
    const { data: centers, error: centersError } = await supabase
      .from('vote_preferred_centers')
      .select(`
        center_id,
        logistics_centers:center_id(id, name, address)
      `)
      .eq('vote_id', vote.id);

    if (centersError) {
      console.error(`Error fetching preferred centers for vote ${vote.id}:`, centersError);
      return vote;
    }

    return {
      ...vote,
      preferred_centers: centers.map(c => c.logistics_centers)
    };
  }));

  return votesWithCenters;
}

// 투표 생성 또는 업데이트
export async function saveVote(vote: Omit<Vote, 'id' | 'created_at'> & { preferred_center_ids?: string[] }) {
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

  let voteData: Vote;

  if (existingVote) {
    // 기존 투표 업데이트
    const { data, error } = await supabase
      .from('votes')
      .update({
        is_available: vote.is_available,
        notes: vote.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingVote.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating vote:', error);
      throw error;
    }

    voteData = data as Vote;

    // 기존 선호 물류센터 연결 모두 삭제
    const { error: deleteError } = await supabase
      .from('vote_preferred_centers')
      .delete()
      .eq('vote_id', existingVote.id);

    if (deleteError) {
      console.error('Error deleting existing preferred centers:', deleteError);
      throw deleteError;
    }
  } else {
    // 새 투표 생성
    const { data, error } = await supabase
      .from('votes')
      .insert([{
        courier_id: vote.courier_id,
        date: vote.date,
        is_available: vote.is_available,
        notes: vote.notes
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating vote:', error);
      throw error;
    }

    voteData = data as Vote;
  }

  // 선호 물류센터 연결 생성 (여러 개 가능)
  if (vote.preferred_center_ids && vote.preferred_center_ids.length > 0) {
    const centerConnections = vote.preferred_center_ids.map(centerId => ({
      vote_id: voteData.id,
      center_id: centerId
    }));

    const { error: insertError } = await supabase
      .from('vote_preferred_centers')
      .insert(centerConnections);

    if (insertError) {
      console.error('Error creating preferred center connections:', insertError);
      throw insertError;
    }
  }

  // 완성된 투표 데이터 (선호 물류센터 포함) 가져오기
  return getUserVoteById(voteData.id);
}

// 투표 ID로 투표 데이터 가져오기 (선호 물류센터 포함)
async function getUserVoteById(voteId: string) {
  const { data: vote, error } = await supabase
    .from('votes')
    .select('*')
    .eq('id', voteId)
    .single();

  if (error) {
    console.error(`Error fetching vote ${voteId}:`, error);
    throw error;
  }

  const { data: centers, error: centersError } = await supabase
    .from('vote_preferred_centers')
    .select(`
      center_id,
      logistics_centers:center_id(id, name, address)
    `)
    .eq('vote_id', voteId);

  if (centersError) {
    console.error(`Error fetching preferred centers for vote ${voteId}:`, centersError);
    return vote;
  }

  return {
    ...vote,
    preferred_centers: centers.map(c => c.logistics_centers)
  } as Vote;
}

// 특정 기사의 투표 삭제
export async function deleteVote(voteId: string) {
  // 연결된 선호 물류센터 항목 먼저 삭제 - CASCADE 설정이 있으므로 실제로는 필요 없지만 명시적으로 처리
  const { error: centerError } = await supabase
    .from('vote_preferred_centers')
    .delete()
    .eq('vote_id', voteId);

  if (centerError) {
    console.error(`Error deleting preferred centers for vote ${voteId}:`, centerError);
    throw centerError;
  }

  // 투표 삭제
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