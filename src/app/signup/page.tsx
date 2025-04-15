'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUpWithEmail, signInWithSocial } from '@/lib/auth';
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
    role: 'courier' as 'admin' | 'courier',
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await signUpWithEmail(
        formData.email, 
        formData.password, 
        {
          name: formData.name,
          role: formData.role,
          phone: formData.phone
        }
      );
      
      if (error) {
        toast.error('회원가입에 실패했습니다. 다시 시도해주세요.');
        console.error('Signup error:', error);
        return;
      }

      toast.success('회원가입이 완료되었습니다. 이메일을 확인해주세요.');
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
            <label htmlFor="email" className="block text-sm font-medium text-secondary-700">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
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
              비밀번호 확인
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
              이름
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
            <label htmlFor="phone" className="block text-sm font-medium text-secondary-700">
              전화번호
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className="form-input w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="010-0000-0000"
            />
          </div>
          
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-secondary-700">
              역할
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-input w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="courier">택배기사</option>
              <option value="admin">관리자</option>
            </select>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
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