import { supabase } from './supabase';

// 핸드폰 번호로 인증 코드 요청
export const requestPhoneVerification = async (phone: string) => {
  // 디버깅을 위한 로그 추가
  console.log('Requesting phone verification for:', phone);
  
  try {
    // Supabase의 OTP 기능을 사용하여 SMS 발송
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone,
    });
    
    // 응답 로깅
    console.log('Supabase OTP response:', { data, error });
    
    if (error) {
      console.error('Phone verification request error:', error);
      return { success: false, error };
    }
    
    return { success: true, error: null };
  } catch (e) {
    // 예외 로깅
    console.error('Exception during phone verification request:', e);
    return { success: false, error: e };
  }
};

// 핸드폰 인증 코드 확인
export const verifyPhoneCode = async (phone: string, code: string) => {
  // 디버깅 로그
  console.log('Verifying code for phone:', phone, 'Code:', code);
  
  try {
    // Supabase의 OTP 검증 기능 사용
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: code,
      type: 'sms'
    });
    
    // 응답 로깅
    console.log('Supabase verify OTP response:', { data, error });
    
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
    
    // 사용자 조회 결과 로깅
    console.log('User lookup result:', { existingUser, userError });

    return { 
      success: true, 
      data: { 
        session: data.session, 
        user: data.user,
        existingUser: existingUser
      },
      error: null 
    };
  } catch (e) {
    // 예외 로깅
    console.error('Exception during code verification:', e);
    return { success: false, error: e };
  }
};

// 핸드폰 인증 및 회원가입 - 수정된 버전
export const signUpWithPhone = async (
  phone: string, 
  email: string | null, 
  password: string, 
  userData: { 
    name: string, 
    role: 'admin' | 'courier' 
  }
) => {
  // 디버깅 로그
  console.log('Signing up user with phone:', phone, 'email:', email);
  
  try {
    // 현재 인증 세션 가져오기
    const { data: { session } } = await supabase.auth.getSession();
    
    // 세션이 없으면 오류 반환
    if (!session || !session.user) {
      console.error('회원가입 실패: 유효한 인증 세션이 없습니다');
      return { 
        data: null, 
        error: { message: '핸드폰 인증 세션이 만료되었거나 유효하지 않습니다. 다시 인증해주세요.' } 
      };
    }
    
    console.log('Using existing auth session:', session.user.id);
    
    // 사용자 메타데이터 업데이트
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
      email: email || undefined,
      data: {
        name: userData.name,
        role: userData.role,
        phone: phone
      }
    });
    
    if (updateError) {
      console.error('사용자 정보 업데이트 실패:', updateError);
      return { data: null, error: updateError };
    }
    
    // 사용자 프로필 정보 저장
    const { error: profileError } = await supabase
      .from('users')
      .insert([{ 
        id: session.user.id,
        phone: phone,
        email: email || null,
        name: userData.name,
        role: userData.role
      }]);
    
    // 프로필 생성 로깅
    console.log('User profile creation result:', { profileError });
    
    if (profileError) {
      console.error('사용자 프로필 생성 실패:', profileError);
      return { data: null, error: profileError };
    }
    
    return { data: { user: session.user }, error: null };
  } catch (e) {
    // 예외 로깅
    console.error('Exception during signup:', e);
    return { data: null, error: e };
  }
};

// 핸드폰 번호로 로그인
export const signInWithPhone = async (phone: string, password: string) => {
  // 디버깅 로그
  console.log('Signing in with phone:', phone);
  
  try {
    // Supabase 인증으로 직접 전화번호 로그인
    const { data, error } = await supabase.auth.signInWithPassword({
      phone: phone,
      password: password,
    });
    
    // 응답 로깅
    console.log('Supabase sign in response:', { data, error });
    
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
    
    // 사용자 프로필 로깅
    console.log('User profile fetch result:', { userData, profileError });
    
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
  } catch (e) {
    // 예외 로깅
    console.error('Exception during sign in:', e);
    return { data: null, error: e };
  }
};

export const signInWithSocial = async (provider: 'google' | 'kakao') => {
  console.log('Signing in with social provider:', provider);
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    }
  });
  
  console.log('Social sign in response:', { data, error });
  
  return { data, error };
};

export const signOut = async () => {
  console.log('Signing out user');
  
  const { error } = await supabase.auth.signOut();
  
  console.log('Sign out result:', { error });
  
  return { error };
};

export const getCurrentUser = async () => {
  console.log('Getting current user');
  
  const { data: { session } } = await supabase.auth.getSession();
  
  console.log('Current session:', session);
  
  if (!session) return { user: null };
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  console.log('Current user data:', { data, error });
  
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