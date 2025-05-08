// src/app/dashboard/settlements/reports/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getCouriers } from '@/lib/couriers';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiFileText, FiSearch, FiArrowLeft } from 'react-icons/fi';

export default function SettlementReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [couriers, setCouriers] = useState<any[]>([]);
  
  // Form state
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const [selectedCourier, setSelectedCourier] = useState('');
  const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(lastDayOfMonth.toISOString().split('T')[0]);

  useEffect(() => {
    async function loadData() {
      try {
        // Get current user
        const { user } = await getCurrentUser();
        if (!user) {
          toast.error('로그인이 필요합니다.');
          router.push('/login');
          return;
        }
        
        setUser(user);
        
        if (user.role === 'admin') {
          // Load all couriers for admin
          const couriersData = await getCouriers();
          setCouriers(couriersData);
        } else {
          // Set current user as the only courier
          setCouriers([user]);
          setSelectedCourier(user.id);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('데이터를 불러오는데 실패했습니다.');
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [router]);
  
  function handleGenerateReport() {
    if (!selectedCourier) {
      toast.error('기사를 선택해주세요.');
      return;
    }
    
    const params = new URLSearchParams({
      courier_id: selectedCourier,
      start_date: startDate,
      end_date: endDate
    });
    
    router.push(`/dashboard/settlements/report?${params.toString()}`);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  const isAdmin = user?.role === 'admin';
  
  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link href="/dashboard/settlements" className="mr-4 text-secondary-600 hover:text-secondary-800">
            <FiArrowLeft size={20} />
          </Link>
          <h2 className="text-2xl font-semibold text-secondary-800">정산서 생성</h2>
        </div>
      </div>
      
      <div className="card mb-6">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-secondary-800">정산 기간 및 기사 선택</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isAdmin && (
              <div>
                <label htmlFor="courier" className="form-label">기사</label>
                <select
                  id="courier"
                  className="form-select"
                  value={selectedCourier}
                  onChange={(e) => setSelectedCourier(e.target.value)}
                  required
                >
                  <option value="">기사 선택</option>
                  {couriers.map((courier) => (
                    <option key={courier.id} value={courier.id}>{courier.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label htmlFor="startDate" className="form-label">시작일</label>
              <input
                type="date"
                id="startDate"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="form-label">종료일</label>
              <input
                type="date"
                id="endDate"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="mt-4">
            <button
              type="button"
              className="btn-primary"
              onClick={handleGenerateReport}
            >
              <FiFileText className="mr-2" />
              정산서 생성
            </button>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-secondary-800">정산서 안내</h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-secondary-800">정산서 생성 방법</h4>
              <p className="text-secondary-600 mt-1">
                1. 정산 기간을 선택합니다. (기본: 현재 월)
                <br />
                2. {isAdmin ? '기사를 선택합니다.' : '선택된 기사: ' + user?.name}
                <br />
                3. '정산서 생성' 버튼을 클릭합니다.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-secondary-800">정산서 사용 방법</h4>
              <p className="text-secondary-600 mt-1">
                1. 생성된 정산서는 인쇄하거나 PDF로 다운로드할 수 있습니다.
                <br />
                2. 정산서에는 마켓컬리, 쿠팡 등 배송 업체별 정산 내역이 포함됩니다.
                <br />
                3. 수수료와 부가세가 자동으로 계산됩니다.
              </p>
            </div>
            
            <div className="p-3 bg-blue-50 text-blue-800 rounded-md">
              <h4 className="font-medium">참고사항</h4>
              <p className="text-sm mt-1">
                정산서는 선택한 기간 내의 입력된 정산 항목을 기준으로 생성됩니다. 정확한 정산서를 위해 배송 정산 항목이 모두 등록되었는지 확인해주세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}