'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithPhone } from '@/lib/auth';
import { formatPhoneNumber, isValidPhoneNumber } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!phone) {
      toast.error('핸드폰 번호를 입력해주세요.');
      setIsLoading(false);
      return;
    }

    if (!isValidPhoneNumber(phone)) {
      toast.error('유효하지 않은 핸드폰 번호 형식입니다.');
      setIsLoading(false);
      return;
    }

    try {
      const formattedPhone = formatPhoneNumber(phone);
      const { data, error } = await signInWithPhone(formattedPhone, password);
      
      if (error) {
        // 에러 코드에 따른 메시지 처리
        if (error.message && error.message.includes('Invalid phone')) {
          toast.error('등록되지 않은 핸드폰 번호입니다.');
        } else if (error.message && error.message.includes('Invalid login credentials')) {
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6">로그인</h2>
        
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