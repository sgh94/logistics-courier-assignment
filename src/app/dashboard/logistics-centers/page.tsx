'use client';

import { useState, useEffect } from 'react';
import { getLogisticsCenters, deleteLogisticsCenter } from '@/lib/centers';
import { LogisticsCenter } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiEdit2, FiTrash2, FiPlus, FiMapPin, FiPhone, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function LogisticsCentersPage() {
  const [centers, setCenters] = useState<LogisticsCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        // 사용자 권한 확인
        const { user } = await getCurrentUser();
        if (!user || user.role !== 'admin') {
          setIsAdmin(false);
          router.push('/dashboard');
          return;
        }
        
        setIsAdmin(true);
        
        // 물류센터 목록 가져오기
        const centersData = await getLogisticsCenters();
        setCenters(centersData);
      } catch (error) {
        console.error('Error loading logistics centers:', error);
        toast.error('물류센터 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [router]);

  const handleDelete = async (id: string) => {
    if (window.confirm('정말로 이 물류센터를 삭제하시겠습니까?')) {
      try {
        await deleteLogisticsCenter(id);
        setCenters(centers.filter(center => center.id !== id));
        toast.success('물류센터가 삭제되었습니다.');
      } catch (error) {
        console.error('Error deleting logistics center:', error);
        toast.error('물류센터 삭제에 실패했습니다.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // 이미 router.push로 리다이렉트 되어 있음
  }

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-secondary-800">물류센터 관리</h2>
        <Link
          href="/dashboard/logistics-centers/new"
          className="btn-primary flex items-center"
        >
          <FiPlus className="h-5 w-5 mr-2" />
          새 물류센터
        </Link>
      </div>

      {centers.length === 0 ? (
        <div className="card p-8 text-center">
          <FiMapPin className="h-12 w-12 mx-auto text-secondary-400 mb-4" />
          <h3 className="text-xl font-medium text-secondary-600 mb-2">등록된 물류센터가 없습니다</h3>
          <p className="text-secondary-500 mb-6">새로운 물류센터를 추가해보세요.</p>
          <Link href="/dashboard/logistics-centers/new" className="btn-primary inline-flex items-center">
            <FiPlus className="h-5 w-5 mr-2" />
            물류센터 추가하기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {centers.map((center) => (
            <div key={center.id} className="card overflow-hidden">
              <div className="card-header flex justify-between items-center">
                <h3 className="text-lg font-semibold text-secondary-800">{center.name}</h3>
                <div className="flex space-x-2">
                  <Link
                    href={`/dashboard/logistics-centers/edit/${center.id}`}
                    className="p-1 rounded-md text-secondary-500 hover:text-primary-600 hover:bg-secondary-100"
                  >
                    <FiEdit2 className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(center.id)}
                    className="p-1 rounded-md text-secondary-500 hover:text-red-600 hover:bg-secondary-100"
                  >
                    <FiTrash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="card-body">
                <p className="text-secondary-600 mb-4">{center.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-secondary-600">
                    <FiMapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{center.address}</span>
                  </div>
                  {center.manager_name && (
                    <div className="flex items-center text-sm text-secondary-600">
                      <FiUser className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{center.manager_name}</span>
                    </div>
                  )}
                  {center.manager_contact && (
                    <div className="flex items-center text-sm text-secondary-600">
                      <FiPhone className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{center.manager_contact}</span>
                    </div>
                  )}
                </div>
                {center.map_url && (
                  <div className="mt-4">
                    <a
                      href={center.map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                    >
                      <FiMapPin className="h-4 w-4 mr-1" />
                      지도에서 보기
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}