'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUpWithPhone, requestPhoneVerification, verifyPhoneCode, signInWithSocial } from '@/lib/auth';
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
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRequestVerification = async () => {
    if (!formData.phone) {
      toast.error('핸드폰 번호를 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      const { success, error } = await requestPhoneVerification(formData.phone);
      
      if (!success) {
        toast.error('인증번호 발송에 실패했습니다. 다시 시도해주세요.');
        console.error('Verification request error:', error);
        return;
      }
      
      toast.success('인증번호가 발송되었습니다. SMS를 확인해주세요.');
      setVerificationRequested(true);
    } catch (error) {
      toast.error('인증번호 요청 중 오류가 발생했습니다.');
      console.error('Unexpected error during verification request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!formData.verificationCode) {
      toast.error('인증번호를 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      const { success, error } = await verifyPhoneCode(formData.phone, formData.verificationCode);
      
      if (!success) {
        toast.error('인증번호가 일치하지 않습니다. 다시 확인해주세요.');
        console.error('Verification error:', error);
        return;
      }
      
      toast.success('핸드폰 번호가 인증되었습니다.');
      setVerificationConfirmed(true);
    } catch (error) {
      toast.error('인증 중 오류가 발생했습니다.');
      console.error('Unexpected error during verification:', error);
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

    try {
      const { data, error } = await signUpWithPhone(
        formData.phone,
        formData.email || null,
        formData.password, 
        {
          name: formData.name,
          role: 'courier', // 항상 택배기사로만 가입 가능
        }
      );
      
      if (error) {
        toast.error('회원가입에 실패했습니다. 다시 시도해주세요.');
        console.error('Signup error:', error);
        return;
      }

      toast.success('회원가입이 완료되었습니다.');
      router.push('/login');
    } catch (error) {
      toast.error('회원가입 중 오류가 발생했습니다.');
      console.error('Unexpected error during signup:', error);
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
      toast.error('소셜 로그인 중 오류가 발생했습니다.');
      console.error('Unexpected error during social login:', error);
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
      </div>
    </div>
  );
}