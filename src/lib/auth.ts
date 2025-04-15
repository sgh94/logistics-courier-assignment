import { supabase } from './supabase';

// 핸드폰 번호로 인증 코드 요청
export const requestPhoneVerification = async (phone: string) => {
  // Supabase의 OTP 기능을 사용하여 SMS 발송
  const { data, error } = await supabase.auth.signInWithOtp({
    phone: phone,
  });
  
  if (error) {
    console.error('Phone verification request error:', error);
    return { success: false, error };
  }
  
  return { success: true, error: null };
};

// 핸드폰 인증 코드 확인
export const verifyPhoneCode = async (phone: string, code: string) => {
  // Supabase의 OTP 검증 기능 사용
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phone,
    token: code,
    type: 'sms'
  });
  
  if (error) {
    console.error('Phone verification error:', error);
    return { success: false, error };
  }
  
  // 인증 성공 시 사용자 프로필 확인
  const { data: existingUser, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  return { 
    success: true, 
    data: { 
      session: data.session, 
      user: data.user,
      existingUser: existingUser
    },
    error: null 
  };
};

// 핸드폰 인증 및 회원가입
export const signUpWithPhone = async (
  phone: string, 
  email: string | null, 
  password: string, 
  userData: { 
    name: string, 
    role: 'admin' | 'courier' 
  }
) => {
  // 1. 사용자 인증 계정 생성
  const { data: authData, error: authError } = await supabase.auth.signUp({
    phone: phone,
    password: password,
    email: email || undefined,
    options: {
      data: {
        name: userData.name,
        role: userData.role
      }
    }
  });
  
  if (authError) return { data: null, error: authError };
  
  // 2. 사용자 프로필 정보 저장
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        { 
          id: authData.user.id,
          phone: phone,
          email: email || null,
          name: userData.name,
          role: userData.role
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

// 핸드폰 번호로 로그인
export const signInWithPhone = async (phone: string, password: string) => {
  // Supabase 인증으로 직접 전화번호 로그인
  const { data, error } = await supabase.auth.signInWithPassword({
    phone: phone,
    password: password,
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
    return { data, error: profileError };
  }
  
  return { 
    data: {
      ...data,
      profile: userData
    }, 
    error: null 
  };
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