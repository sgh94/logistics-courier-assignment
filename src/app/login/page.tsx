'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithPhone, requestPhoneVerification, verifyPhoneCode, signInWithSocial } from '@/lib/auth';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { RiKakaoTalkFill } from 'react-icons/ri';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useOtp, setUseOtp] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationRequested, setVerificationRequested] = useState(false);
  const router = useRouter();

  const formatPhoneNumber = (phone: string) => {
    // 전화번호 형식을 Supabase가 요구하는 국제 표준 형식으로 변환 (+8210XXXXXXXX)
    if (phone.startsWith('0')) {
      return '+82' + phone.substring(1).replace(/-/g, '');
    }
    if (phone.startsWith('+')) {
      return phone.replace(/-/g, '');
    }
    return '+82' + phone.replace(/-/g, '');
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phone);
      const { data, error } = await signInWithPhone(formattedPhone, password);
      
      if (error) {
        // 에러 코드에 따른 메시지 처리
        if (error.message.includes('Invalid phone')) {
          toast.error('등록되지 않은 핸드폰 번호입니다.');
        } else if (error.message.includes('Invalid login credentials')) {
          toast.error('핸드폰 번호 또는 비밀번호가 올바르지 않습니다.');
        } else {
          toast.error('로그인에 실패했습니다. 다시 시도해주세요.');
        }
        console.error('Login error:', error);
        setIsLoading(false);
        return;
      }

      // 프로필 정보를 확인하여 로그인 완료 처리
      if (data && data.profile) {
        toast.success(`안녕하세요, ${data.profile.name}님!`);
        
        // 역할에 따라 다른 페이지로 리다이렉트
        if (data.profile.role === 'admin') {
          router.push('/dashboard/statistics');
        } else {
          router.push('/dashboard/assignments');
        }
      } else {
        // 사용자 정보는 있지만 프로필이 없는 경우
        toast.error('사용자 프로필을 찾을 수 없습니다. 관리자에게 문의하세요.');
        console.error('User has auth but no profile');
      }
    } catch (error) {
      toast.error('로그인 중 오류가 발생했습니다.');
      console.error('Unexpected error during login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!phone) {
      toast.error('핸드폰 번호를 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      const formattedPhone = formatPhoneNumber(phone);
      setPhone(formattedPhone);

      const { success, error } = await requestPhoneVerification(formattedPhone);
      
      if (!success) {
        toast.error('인증번호 발송에 실패했습니다. 다시 시도해주세요.');
        console.error('OTP request error:', error);
        return;
      }
      
      toast.success('인증번호가 발송되었습니다. SMS를 확인해주세요.');
      setVerificationRequested(true);
    } catch (error) {
      toast.error('인증번호 요청 중 오류가 발생했습니다.');
      console.error('Unexpected error during OTP request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!verificationCode) {
      toast.error('인증번호를 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      const { success, data, error } = await verifyPhoneCode(phone, verificationCode);
      
      if (!success) {
        toast.error('인증번호가 일치하지 않습니다. 다시 확인해주세요.');
        console.error('OTP verification error:', error);
        return;
      }
      
      if (data && data.session) {
        toast.success('로그인되었습니다.');
        
        // 사용자 프로필 정보에 따라 리다이렉트
        if (data.existingUser) {
          // 사용자 역할에 따라 다른 페이지로 이동
          if (data.existingUser.role === 'admin') {
            router.push('/dashboard/statistics');
          } else {
            router.push('/dashboard/assignments');
          }
        } else {
          // 가입된 사용자가 아닌 경우 회원가입 페이지로
          router.push('/signup?phone=' + encodeURIComponent(phone));
        }
      } else {
        toast.error('로그인에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      toast.error('인증 중 오류가 발생했습니다.');
      console.error('Unexpected error during OTP verification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'kakao') => {
    try {
      const { error } = await signInWithSocial(provider);
      
      if (error) {
        toast.error(`${provider === 'google' ? '구글' : '카카오'} 로그인에 실패했습니다.`);
        console.error('Social login error:', error);
      }
    } catch (error) {
      toast.error('로그인 중 오류가 발생했습니다.');
      console.error('Unexpected error during social login:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6">로그인</h2>
        
        <div className="mb-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setUseOtp(false)}
              className={`flex-1 py-2 px-4 text-center rounded-md transition-colors ${
                !useOtp 
                  ? 'bg-primary-100 text-primary-800 font-medium' 
                  : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
              }`}
            >
              비밀번호 로그인
            </button>
            <button
              onClick={() => setUseOtp(true)}
              className={`flex-1 py-2 px-4 text-center rounded-md transition-colors ${
                useOtp 
                  ? 'bg-primary-100 text-primary-800 font-medium' 
                  : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
              }`}
            >
              인증번호 로그인
            </button>
          </div>
        </div>
        
        {!useOtp ? (
          <form onSubmit={handlePhoneLogin} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-secondary-700">
                핸드폰 번호
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-input w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="01012345678"
                required
              />
              <p className="mt-1 text-xs text-secondary-500">
                예시: 01012345678 (- 없이 입력)
              </p>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary-700">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center"
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="phone-otp" className="block text-sm font-medium text-secondary-700">
                핸드폰 번호
              </label>
              <div className="flex space-x-2">
                <input
                  id="phone-otp"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input flex-1 rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="01012345678"
                  required
                  disabled={verificationRequested}
                />
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={isLoading || !phone}
                  className="btn-secondary px-3"
                >
                  {verificationRequested ? '재발송' : '인증요청'}
                </button>
              </div>
              <p className="mt-1 text-xs text-secondary-500">
                예시: 01012345678 (- 없이 입력)
              </p>
            </div>
            
            {verificationRequested && (
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-secondary-700">
                  인증번호
                </label>
                <div className="flex space-x-2">
                  <input
                    id="otp"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="form-input flex-1 rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="인증번호 6자리"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={isLoading || !verificationCode}
                    className="btn-primary px-3"
                  >
                    로그인
                  </button>
                </div>
                <p className="mt-1 text-xs text-secondary-500">
                  SMS로 발송된 6자리 인증번호를 입력해주세요.
                </p>
              </div>
            )}
          </div>
        )}
        
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
            계정이 없으신가요?{' '}
            <Link href="/signup" className="text-primary-600 hover:text-primary-500 font-medium">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}