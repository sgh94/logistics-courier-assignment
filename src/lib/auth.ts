import { supabase } from './supabase';

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error('Login error:', error);
    return { data: null, error };
  }

  // 사용자 프로필 정보 가져오기
  const { data: userData, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();
  
  if (profileError) {
    console.error('Error fetching user profile:', profileError);
    // 로그인은 성공했으나 프로필 로드 실패
    return { data, error: profileError };
  }
  
  // 수정된 데이터 반환 (인증 + 프로필 정보)
  return { 
    data: {
      ...data,
      profile: userData
    }, 
    error: null 
  };
};

export const signUpWithEmail = async (email: string, password: string, userData: { name: string, role: 'admin' | 'courier', phone?: string }) => {
  // 1. 사용자 인증 계정 생성
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (authError) return { data: null, error: authError };
  
  // 2. 사용자 프로필 정보 저장
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        { 
          id: authData.user.id,
          email: authData.user.email,
          name: userData.name,
          role: userData.role,
          phone: userData.phone || null
        }
      ]);
    
    if (profileError) {
      console.error('Error creating user profile:', profileError);
      
      // 프로필 생성 실패 시 인증 계정 삭제 시도 (롤백)
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (deleteError) {
        console.error('Error rolling back user creation:', deleteError);
      }
      
      return { data: null, error: profileError };
    }
  }
  
  return { data: authData, error: null };
};

export const signInWithSocial = async (provider: 'google' | 'kakao') => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    }
  });
  
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return { user: null };
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  if (error) {
    console.error('Error fetching user profile:', error);
    return { user: null };
  }
  
  return { user: data };
};

export const getUserRole = async (): Promise<'admin' | 'courier' | null> => {
  const { user } = await getCurrentUser();
  return user ? user.role : null;
};