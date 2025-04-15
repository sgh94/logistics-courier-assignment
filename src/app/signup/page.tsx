'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUpWithPhone, requestPhoneVerification, verifyPhoneCode, signInWithSocial } from '@/lib/auth';
import { formatPhoneNumber, isValidPhoneNumber } from '@/lib/utils';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { RiKakaoTalkFill } from 'react-icons/ri';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    verificationCode: '',
    role: 'courier' as 'admin' | 'courier'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [verificationRequested, setVerificationRequested] = useState(false);
  const [verificationConfirmed, setVerificationConfirmed] = useState(false);
  const [authSession, setAuthSession] = useState(null);
  const [lastError, setLastError] = useState<any>(null);
  const router = useRouter();

  // 브라우저 정보 로깅 (디버깅용)
  useEffect(() => {
    console.log('Browser info:', {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform
    });
    
    // Supabase 설정 확인
    console.log('Checking Supabase environment variables:',
      process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SUPABASE_URL is set' : 'SUPABASE_URL is missing',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SUPABASE_ANON_KEY is set' : 'SUPABASE_ANON_KEY is missing'
    );
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRequestVerification = async () => {
    if (!formData.phone) {
      toast.error('핸드폰 번호를 입력해주세요.');
      return;
    }

    if (!isValidPhoneNumber(formData.phone)) {
      toast.error('유효하지 않은 핸드폰 번호 형식입니다.');
      return;
    }

    setLastError(null); // 오류 초기화
    
    try {
      setIsLoading(true);
      // 전화번호 국제 형식으로 변환
      const formattedPhone = formatPhoneNumber(formData.phone);
      console.log('Requesting verification for formatted phone:', formattedPhone);
      
      const { success, error } = await requestPhoneVerification(formattedPhone);
      
      console.log('Verification request result:', { success, error });
      
      if (!success) {
        const errorMessage = error?.message || '알 수 없는 오류';
        setLastError(error);
        toast.error(`인증번호 발송에 실패했습니다: ${errorMessage}`);
        console.error('Verification request error details:', error);
        return;
      }
      
      toast.success('인증번호가 발송되었습니다. SMS를 확인해주세요.');
      setVerificationRequested(true);
      
      // 전화번호 입력 필드를 형식화된 번호로 업데이트
      setFormData(prev => ({ ...prev, phone: formattedPhone }));
      
    } catch (error) {
      setLastError(error);
      toast.error('인증번호 요청 중 오류가 발생했습니다.');
      console.error('Exception during verification request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!formData.verificationCode) {
      toast.error('인증번호를 입력해주세요.');
      return;
    }

    setLastError(null); // 오류 초기화
    
    try {
      setIsLoading(true);
      console.log('Verifying code:', formData.verificationCode, 'for phone:', formData.phone);
      
      const { success, data, error } = await verifyPhoneCode(
        formData.phone, 
        formData.verificationCode
      );
      
      console.log('Verification result:', { success, data, error });
      
      if (!success) {
        const errorMessage = error?.message || '알 수 없는 오류';
        setLastError(error);
        toast.error(`인증번호가 일치하지 않습니다: ${errorMessage}`);
        console.error('Verification error details:', error);
        return;
      }
      
      toast.success('핸드폰 번호가 인증되었습니다.');
      setVerificationConfirmed(true);
      
      // 기존 가입자 확인 로직
      if (data && data.existingUser) {
        console.log('User already exists:', data.existingUser);
        toast.error('이미 가입된 전화번호입니다. 로그인 페이지로 이동합니다.');
        router.push('/login');
        return;
      }
      
      // 인증 세션 저장
      if (data && data.session) {
        console.log('Auth session received:', data.session);
        setAuthSession(data.session);
      }
      
    } catch (error) {
      setLastError(error);
      toast.error('인증 중 오류가 발생했습니다.');
      console.error('Exception during code verification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!verificationConfirmed) {
      toast.error('핸드폰 번호 인증이 필요합니다.');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }

    setLastError(null); // 오류 초기화
    
    try {
      console.log('Submitting signup with verified phone:', formData.phone);
      
      // 인증된 세션을 사용하여 회원가입 진행
      const { data, error } = await signUpWithPhone(
        formData.phone,
        formData.email || null,
        formData.password, 
        {
          name: formData.name,
          role: 'courier', // 항상 택배기사로만 가입 가능
        }
      );
      
      console.log('Signup result:', { data, error });
      
      if (error) {
        setLastError(error);
        
        if (error.message && error.message.includes('already registered')) {
          toast.error('이미 가입된 전화번호입니다. 로그인 페이지로 이동합니다.');
          router.push('/login');
          return;
        }
        
        const errorMessage = error?.message || '알 수 없는 오류';
        toast.error(`회원가입에 실패했습니다: ${errorMessage}`);
        console.error('Signup error details:', error);
        return;
      }

      toast.success('회원가입이 완료되었습니다.');
      router.push('/login');
    } catch (error) {
      setLastError(error);
      toast.error('회원가입 중 오류가 발생했습니다.');
      console.error('Exception during signup submission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'kakao') => {
    try {
      console.log('Initiating social login with provider:', provider);
      
      const { error } = await signInWithSocial(provider);
      
      if (error) {
        setLastError(error);
        toast.error(`${provider === 'google' ? '구글' : '카카오'} 로그인에 실패했습니다.`);
        console.error('Social login error:', error);
      }
    } catch (error) {
      setLastError(error);
      toast.error('소셜 로그인 중 오류가 발생했습니다.');
      console.error('Exception during social login:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6">회원가입</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-secondary-700">
              핸드폰 번호 <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-2">
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="form-input flex-1 rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="01012345678"
                required
                disabled={verificationConfirmed}
              />
              <button
                type="button"
                onClick={handleRequestVerification}
                disabled={isLoading || !formData.phone || verificationConfirmed}
                className="btn-secondary px-3"
              >
                {verificationRequested ? '재발송' : '인증요청'}
              </button>
            </div>
            <p className="mt-1 text-xs text-secondary-500">
              예시: 01012345678 (- 없이 입력)
            </p>
          </div>
          
          {verificationRequested && !verificationConfirmed && (
            <div>
              <label htmlFor="verificationCode" className="block text-sm font-medium text-secondary-700">
                인증번호
              </label>
              <div className="flex space-x-2">
                <input
                  id="verificationCode"
                  name="verificationCode"
                  type="text"
                  value={formData.verificationCode}
                  onChange={handleChange}
                  className="form-input flex-1 rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="인증번호 6자리"
                  required
                />
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={isLoading || !formData.verificationCode}
                  className="btn-secondary px-3"
                >
                  확인
                </button>
              </div>
              <p className="mt-1 text-xs text-secondary-500">
                SMS로 발송된 6자리 인증번호를 입력해주세요.
              </p>
            </div>
          )}
          
          {verificationConfirmed && (
            <div className="bg-green-50 border border-green-200 rounded-md p-2 text-sm text-green-700">
              핸드폰 번호가 인증되었습니다.
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-secondary-700">
              이메일 (선택)
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-secondary-700">
              비밀번호 <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700">
              비밀번호 확인 <span className="text-red-500">*</span>
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="form-input w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-secondary-700">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="form-input w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700">
              역할
            </label>
            <div className="mt-1 p-3 bg-secondary-50 rounded-md border border-secondary-200">
              <div className="flex items-center">
                <span className="text-secondary-700 font-medium">택배기사</span>
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  자동 설정
                </span>
              </div>
              <p className="mt-1 text-xs text-secondary-500">
                관리자 계정은 데이터베이스 관리자를 통해서만 생성 가능합니다.
              </p>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isLoading || !verificationConfirmed}
              className="btn-primary w-full flex items-center justify-center"
            >
              {isLoading ? '처리중...' : '회원가입'}
            </button>
          </div>
        </form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-secondary-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-secondary-500">또는</span>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSocialLogin('google')}
              className="flex justify-center items-center py-2 px-4 bg-white hover:bg-secondary-50 border border-secondary-300 rounded-md shadow-sm"
            >
              <FcGoogle className="text-xl mr-2" />
              <span>구글</span>
            </button>
            
            <button
              onClick={() => handleSocialLogin('kakao')}
              className="flex justify-center items-center py-2 px-4 bg-[#FEE500] hover:bg-[#FADA0A] border border-[#FEE500] rounded-md shadow-sm"
            >
              <RiKakaoTalkFill className="text-xl mr-2 text-[#3A1D1D]" />
              <span className="text-[#3A1D1D]">카카오</span>
            </button>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-secondary-600">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-500 font-medium">
              로그인
            </Link>
          </p>
        </div>
        
        {/* 디버깅용 오류 정보 (개발 환경에서만 표시) */}
        {process.env.NODE_ENV === 'development' && lastError && (
          <div className="mt-8 p-3 bg-red-50 border border-red-200 rounded text-xs overflow-auto max-h-60">
            <div className="font-bold mb-1 text-red-700">오류 상세 정보:</div>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(lastError, null, 2)}
            </pre>
            {lastError.message && (
              <div className="mt-2 text-red-700">
                <strong>메시지:</strong> {lastError.message}
              </div>
            )}
            {lastError.details && (
              <div className="mt-1 text-red-700">
                <strong>상세:</strong> {lastError.details}
              </div>
            )}
          </div>
        )}
        
        {/* 디버깅용 상태 정보 (개발 환경에서만 표시) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40 opacity-50 hover:opacity-100">
            <div className="font-bold mb-1">디버깅 정보</div>
            <div>전화번호: {formData.phone}</div>
            <div>인증 요청됨: {verificationRequested ? 'Yes' : 'No'}</div>
            <div>인증 완료됨: {verificationConfirmed ? 'Yes' : 'No'}</div>
          </div>
        )}
      </div>
    </div>
  );
}