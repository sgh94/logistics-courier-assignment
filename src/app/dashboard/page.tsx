'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { User } from '@/lib/supabase';
import Link from 'next/link';
import { 
  FiUsers, 
  FiMapPin, 
  FiCalendar, 
  FiPieChart,
  FiBarChart2,
  FiCheckSquare
} from 'react-icons/fi';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [todayAssignments, setTodayAssignments] = useState(0);
  const [pendingVotes, setPendingVotes] = useState(0);

  useEffect(() => {
    async function loadUserData() {
      try {
        const { user } = await getCurrentUser();
        setUser(user);
        
        // 여기서 오늘의 배치 현황, 투표 현황 등을 가져옵니다
        // 실제 구현에서는 Supabase에서 데이터를 가져와야 합니다
        setTodayAssignments(3); // 예시 데이터
        setPendingVotes(2); // 예시 데이터

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setIsLoading(false);
      }
    }

    loadUserData();
  }, []);

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
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-secondary-800">안녕하세요, {user?.name}님!</h2>
        <p className="text-secondary-600 mt-1">오늘도 좋은 하루 되세요.</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 flex items-center">
          <div className="p-3 bg-blue-100 rounded-full mr-4">
            <FiCalendar className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary-800">오늘의 배치</h3>
            <p className="text-2xl font-bold text-primary-600">{todayAssignments}개</p>
          </div>
        </div>

        <div className="card p-6 flex items-center">
          <div className="p-3 bg-green-100 rounded-full mr-4">
            <FiCheckSquare className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary-800">대기 중인 투표</h3>
            <p className="text-2xl font-bold text-primary-600">{pendingVotes}개</p>
          </div>
        </div>

        <div className="card p-6 flex items-center">
          <div className="p-3 bg-yellow-100 rounded-full mr-4">
            <FiBarChart2 className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary-800">이번 달 배치</h3>
            <p className="text-2xl font-bold text-primary-600">15개</p>
          </div>
        </div>
      </div>

      {/* 메인 액션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-secondary-800">빠른 액세스</h3>
          </div>
          <div className="card-body grid grid-cols-2 gap-4">
            <Link href="/dashboard/assignments" className="flex flex-col items-center justify-center p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition">
              <FiCalendar className="h-8 w-8 text-primary-500 mb-2" />
              <span className="text-sm font-medium text-secondary-700">배치 현황</span>
            </Link>
            
            <Link href="/dashboard/votes" className="flex flex-col items-center justify-center p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition">
              <FiCheckSquare className="h-8 w-8 text-primary-500 mb-2" />
              <span className="text-sm font-medium text-secondary-700">근무 투표</span>
            </Link>
            
            {isAdmin && (
              <>
                <Link href="/dashboard/couriers" className="flex flex-col items-center justify-center p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition">
                  <FiUsers className="h-8 w-8 text-primary-500 mb-2" />
                  <span className="text-sm font-medium text-secondary-700">기사 관리</span>
                </Link>
                
                <Link href="/dashboard/logistics-centers" className="flex flex-col items-center justify-center p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition">
                  <FiMapPin className="h-8 w-8 text-primary-500 mb-2" />
                  <span className="text-sm font-medium text-secondary-700">물류센터</span>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-secondary-800">최근 활동</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 p-2 bg-blue-100 rounded-full">
                  <FiCalendar className="h-4 w-4 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-secondary-700">
                    <span className="font-medium">물류센터 배치</span> - 서울센터에 4월 20일 배치되었습니다.
                  </p>
                  <p className="text-xs text-secondary-500 mt-1">2시간 전</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 p-2 bg-green-100 rounded-full">
                  <FiCheckSquare className="h-4 w-4 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-secondary-700">
                    <span className="font-medium">근무 투표</span> - 4월 25일 근무 가능으로 투표했습니다.
                  </p>
                  <p className="text-xs text-secondary-500 mt-1">어제</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 p-2 bg-yellow-100 rounded-full">
                  <FiMapPin className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-secondary-700">
                    <span className="font-medium">물류센터 정보</span> - 인천센터 정보가 업데이트되었습니다.
                  </p>
                  <p className="text-xs text-secondary-500 mt-1">2일 전</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}