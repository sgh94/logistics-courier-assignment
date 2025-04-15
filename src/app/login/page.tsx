'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmail, signInWithSocial } from '@/lib/auth';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { RiKakaoTalkFill } from 'react-icons/ri';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await signInWithEmail(email, password);
      
      if (error) {
        toast.error('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
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
        
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-secondary-700">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              required
            />
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