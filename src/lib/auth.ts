import { supabase } from './supabase';

// Twilio Verify API를 통한 인증 코드 요청
export const requestPhoneVerification = async (phone: string) => {
  try {
    // Twilio Verify API 호출 - 서버리스 함수를 통해 API 키 보호
    const response = await fetch('/api/twilio/verify/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      console.error('Phone verification request error:', result.error);
      return { success: false, error: result.error };
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Phone verification request error:', error);
    return { success: false, error };
  }
};

// Twilio Verify API를 통한 인증 코드 확인
export const verifyPhoneCode = async (phone: string, code: string) => {
  try {
    // Twilio Verify API 호출
    const response = await fetch('/api/twilio/verify/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, code }),
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      console.error('Phone verification error:', result.error);
      return { success: false, error: result.error };
    }
    
    // 핸드폰 번호로 사용자 검색
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    return { 
      success: true, 
      data: { 
        verified: true,
        existingUser: existingUser
      },
      error: null 
    };
  } catch (error) {
    console.error('Phone verification error:', error);
    return { success: false, error };
  }
};

// 핸드폰 인증 및 회원가입 (Supabase Authentication 사용)
export const signUpWithPhone = async (
  phone: string, 
  email: string | null, 
  password: string, 
  userData: { 
    name: string, 
    role: 'admin' | 'courier' 
  }
) => {
  // 1. 사용자 인증 계정 생성 - 이메일 필요
  // 이메일이 없는 경우 가상 이메일 생성
  const userEmail = email || `${phone.replace(/[^\d]/g, '')}@phone.user`;
  
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userEmail,
    password: password,
    options: {
      data: {
        phone_number: phone,
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

// 핸드폰 번호로 조회하여 이메일 찾은 후 로그인
export const signInWithPhone = async (phone: string, password: string) => {
  // 먼저 핸드폰 번호로 사용자 이메일 조회
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single();
  
  if (userError) {
    console.error('Error fetching user by phone:', userError);
    return { data: null, error: { message: '등록되지 않은 핸드폰 번호입니다.' } };
  }
  
  // 이메일로 로그인
  const { data, error } = await supabase.auth.signInWithPassword({
    email: userData.email,
    password,
  });
  
  if (error) {
    console.error('Login error:', error);
    return { data: null, error };
  }

  return { 
    data: {
      ...data,
      profile: userData
    }, 
    error: null 
  };
};

// 핸드폰 인증 후 세션 없이 로그인 (별도의 API 필요)
export const signInWithPhoneVerified = async (phone: string) => {
  try {
    // 핸드폰 번호로 사용자 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();
    
    if (userError) {
      console.error('Error fetching user by phone:', userError);
      return { data: null, error: { message: '등록되지 않은 핸드폰 번호입니다.' } };
    }
    
    // 서버리스 함수를 통해 사용자 ID로 세션 생성 요청
    // 이 부분은 보안상 서버사이드에서 처리되어야 함
    const response = await fetch('/api/auth/login-with-phone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: userData.id }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return { data: null, error: result.error };
    }
    
    // 세션 설정
    if (result.session) {
      await supabase.auth.setSession(result.session);
    }
    
    return { 
      data: {
        session: result.session,
        profile: userData
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Login error:', error);
    return { data: null, error };
  }
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