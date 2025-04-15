import { supabase } from './supabase';

// 핸드폰 번호로 로그인
export const signInWithPhone = async (phone: string, password: string) => {
  // 먼저 핸드폰 번호로 사용자 이메일 조회
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single();
  
  if (userError) {
    console.error('Error fetching user by phone:', userError);
    return { data: null, error: { message: 'Phone number not found' } };
  }
  
  // 찾은 이메일로 로그인
  const { data, error } = await supabase.auth.signInWithPassword({
    email: userData.email,
    password,
  });
  
  if (error) {
    console.error('Login error:', error);
    return { data: null, error };
  }

  // 완전한 사용자 프로필 정보 포함
  return { 
    data: {
      ...data,
      profile: userData
    }, 
    error: null 
  };
};

// 핸드폰 번호 SMS 인증 요청
export const requestPhoneVerification = async (phone: string) => {
  // SMS 인증 코드 요청 API를 추가해야 함
  // 이 예시에서는 가상의 함수를 사용합니다
  try {
    // 실제 SMS API 연동 필요
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    // SMS 전송 API 호출 (실제 구현 필요)
    
    // 세션에 인증 코드와 번호 저장 (간단한 구현을 위해)
    sessionStorage.setItem('verification_code', verificationCode);
    sessionStorage.setItem('verification_phone', phone);
    
    console.log('Verification code (testing only):', verificationCode);
    return { success: true, error: null };
  } catch (error) {
    console.error('SMS verification request error:', error);
    return { success: false, error };
  }
};

// 핸드폰 인증 코드 확인
export const verifyPhoneCode = async (phone: string, code: string) => {
  const storedCode = sessionStorage.getItem('verification_code');
  const storedPhone = sessionStorage.getItem('verification_phone');
  
  if (storedCode === code && storedPhone === phone) {
    // 인증 성공
    sessionStorage.removeItem('verification_code');
    sessionStorage.removeItem('verification_phone');
    return { success: true, error: null };
  }
  
  return { success: false, error: { message: 'Invalid verification code' } };
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
  // 이메일 없는 경우 가상 이메일 생성 (인증을 위해)
  const userEmail = email || `${phone.replace(/[^0-9]/g, '')}@phone.user`;
  
  // 1. 사용자 인증 계정 생성
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userEmail,
    password,
    options: {
      // 이메일 인증 없이 즉시 인증 처리를 위한 옵션 (실제 환경에서는 SMS 인증 완료 후)
      data: {
        phone_verified: true
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