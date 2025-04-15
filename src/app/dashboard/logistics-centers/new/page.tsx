'use client';

import { useState, useEffect } from 'react';
import { createLogisticsCenter } from '@/lib/centers';
import { getCurrentUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function NewLogisticsCenterPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    map_url: '',
    manager_name: '',
    manager_contact: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    async function checkPermission() {
      try {
        const { user } = await getCurrentUser();
        
        if (!user || user.role !== 'admin') {
          toast.error('관리자만 접근할 수 있습니다.');
          router.push('/dashboard');
          return;
        }
        
        setUserId(user.id);
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking permissions:', error);
        toast.error('권한을 확인하는데 실패했습니다.');
        router.push('/dashboard');
      }
    }
    
    checkPermission();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await createLogisticsCenter({
        ...formData,
        created_by: userId,
      });
      
      toast.success('물류센터가 성공적으로 추가되었습니다.');
      router.push('/dashboard/logistics-centers');
    } catch (error) {
      console.error('Error creating logistics center:', error);
      toast.error('물류센터 추가에 실패했습니다.');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6 flex items-center">
        <Link
          href="/dashboard/logistics-centers"
          className="mr-4 p-2 rounded-md text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100"
        >
          <FiArrowLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-2xl font-semibold text-secondary-800">새 물류센터 추가</h2>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-secondary-700">
                물류센터 이름 *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-secondary-700">
                설명 *
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-secondary-700">
                주소 *
              </label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label htmlFor="map_url" className="block text-sm font-medium text-secondary-700">
                지도 링크
              </label>
              <input
                id="map_url"
                name="map_url"
                type="url"
                value={formData.map_url}
                onChange={handleChange}
                placeholder="https://map.naver.com/..."
                className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
              <p className="mt-1 text-xs text-secondary-500">
                네이버 또는 구글 지도 URL을 입력하세요.
              </p>
            </div>

            <div>
              <label htmlFor="manager_name" className="block text-sm font-medium text-secondary-700">
                관리자 이름
              </label>
              <input
                id="manager_name"
                name="manager_name"
                type="text"
                value={formData.manager_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="manager_contact" className="block text-sm font-medium text-secondary-700">
                관리자 연락처
              </label>
              <input
                id="manager_contact"
                name="manager_contact"
                type="text"
                value={formData.manager_contact}
                onChange={handleChange}
                placeholder="010-0000-0000"
                className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Link
                href="/dashboard/logistics-centers"
                className="btn-secondary"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary flex items-center"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                    저장 중...
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2 h-5 w-5" />
                    저장하기
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}