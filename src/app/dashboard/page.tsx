'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, User } from '@/lib/auth';
import { getCourierAssignments, getAllAssignments } from '@/lib/assignments';
import { getUserVotes, getAllVotes } from '@/lib/votes';
import Link from 'next/link';
import toast from 'react-hot-toast';
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
  const [monthlyAssignments, setMonthlyAssignments] = useState(0);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    async function loadUserData() {
      try {
        const { user } = await getCurrentUser();
        if (!user) {
          toast.error('로그인이 필요합니다.');
          return;
        }
        
        setUser(user);
        
        // 오늘 날짜와 이번달 시작일/종료일 계산
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthStartStr = monthStart.toISOString().split('T')[0];
        const monthEndStr = today.toISOString().split('T')[0];
        
        // 실제 데이터 로드
        if (user.role === 'admin') {
          // 관리자: 모든 배치 및 투표 데이터
          const [assignmentsToday, assignmentsMonth, votesData] = await Promise.all([
            getAllAssignments(todayStr, todayStr),
            getAllAssignments(monthStartStr, monthEndStr),
            getAllVotes(monthStartStr, monthEndStr)
          ]);
          
          setTodayAssignments(assignmentsToday.length);
          setMonthlyAssignments(assignmentsMonth.length);
          
          // 투표 중 오늘 이후의 날짜에 대한 것만 필터링
          const pendingVotesCount = votesData.filter(vote => {
            const voteDate = new Date(vote.date);
            return voteDate >= today;
          }).length;
          
          setPendingVotes(pendingVotesCount);
          
          // 최근 활동 (최신 배치와 투표 정보 합치기)
          const recentAssignments = assignmentsMonth
            .slice(0, 10)
            .map(item => ({
              type: 'assignment',
              date: item.date,
              centerName: item.centers?.name || '알 수 없음',
              courierName: item.couriers?.name || '알 수 없음',
              created_at: item.created_at
            }));
            
          const recentVotes = votesData
            .slice(0, 10)
            .map(item => ({
              type: 'vote',
              date: item.date,
              is_available: item.is_available,
              courierName: item.users?.name || '알 수 없음',
              created_at: item.created_at
            }));
            
          const combined = [...recentAssignments, ...recentVotes]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 3);
            
          setRecentActivities(combined);
        } else {
          // 기사: 자신의 배치 및 투표만
          const [courierAssignments, courierVotes] = await Promise.all([
            getCourierAssignments(user.id, monthStartStr, monthEndStr),
            getUserVotes(user.id, monthStartStr, monthEndStr)
          ]);
          
          const todayAssignmentsCount = courierAssignments.filter(
            assignment => assignment.date === todayStr
          ).length;
          
          setTodayAssignments(todayAssignmentsCount);
          setMonthlyAssignments(courierAssignments.length);
          
          // 투표 중 오늘 이후의 날짜에 대한 것만 필터링
          const pendingVotesCount = courierVotes.filter(vote => {
            const voteDate = new Date(vote.date);
            return voteDate >= today;
          }).length;
          
          setPendingVotes(pendingVotesCount);
          
          // 최근 활동 (본인의 최신 배치와 투표)
          const recentAssignments = courierAssignments
            .slice(0, 5)
            .map(item => ({
              type: 'assignment',
              date: item.date,
              centerName: item.centers?.name || '알 수 없음',
              created_at: item.created_at
            }));
            
          const recentVotes = courierVotes
            .slice(0, 5)
            .map(item => ({
              type: 'vote',
              date: item.date,
              is_available: item.is_available,
              created_at: item.created_at
            }));
            
          const combined = [...recentAssignments, ...recentVotes]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 3);
            
          setRecentActivities(combined);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error('데이터를 불러오는데 실패했습니다.');
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
            <h3 className="text-lg font-semibold text-secondary-800">투표 현황</h3>
            <p className="text-2xl font-bold text-primary-600">{pendingVotes}개</p>
          </div>
        </div>

        <div className="card p-6 flex items-center">
          <div className="p-3 bg-yellow-100 rounded-full mr-4">
            <FiBarChart2 className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary-800">이번 달 배치</h3>
            <p className="text-2xl font-bold text-primary-600">{monthlyAssignments}개</p>
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
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start">
                    <div className={`flex-shrink-0 p-2 rounded-full ${
                      activity.type === 'assignment' 
                        ? 'bg-blue-100' 
                        : activity.is_available 
                          ? 'bg-green-100' 
                          : 'bg-red-100'
                    }`}>
                      {activity.type === 'assignment' ? (
                        <FiCalendar className={`h-4 w-4 ${
                          activity.type === 'assignment' ? 'text-blue-600' : ''
                        }`} />
                      ) : (
                        <FiCheckSquare className={`h-4 w-4 ${
                          activity.is_available ? 'text-green-600' : 'text-red-600'
                        }`} />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-secondary-700">
                        {activity.type === 'assignment' ? (
                          <span className="font-medium">
                            {isAdmin 
                              ? `${activity.courierName}님이 ${activity.date}에 ${activity.centerName}에 배치됨` 
                              : `${activity.date}에 ${activity.centerName}에 배치됨`
                            }
                          </span>
                        ) : (
                          <span className="font-medium">
                            {isAdmin 
                              ? `${activity.courierName}님이 ${activity.date}에 ${activity.is_available ? '근무 가능' : '근무 불가능'}으로 투표함` 
                              : `${activity.date}에 ${activity.is_available ? '근무 가능' : '근무 불가능'}으로 투표함`
                            }
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-secondary-500 mt-1">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-secondary-500 py-4">최근 활동이 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}