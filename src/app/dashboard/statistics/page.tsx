'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { getAllCouriers, getCourierStats } from '@/lib/couriers';
import { getLogisticsCenters } from '@/lib/centers';
import { getAllAssignments } from '@/lib/assignments';
import { User, LogisticsCenter } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from 'react-hot-toast';
import { 
  FiCalendar, 
  FiUser, 
  FiMapPin, 
  FiBarChart2, 
  FiPieChart 
} from 'react-icons/fi';

export default function StatisticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [couriers, setCouriers] = useState<User[]>([]);
  const [centers, setCenters] = useState<LogisticsCenter[]>([]);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    new Date(new Date().getFullYear(), new Date().getMonth(), 1), // 이번 달 1일
    new Date()
  ]);
  const [totalAssignments, setTotalAssignments] = useState(0);
  const [topCouriers, setTopCouriers] = useState<{id: string, name: string, count: number}[]>([]);
  const [topCenters, setTopCenters] = useState<{id: string, name: string, count: number}[]>([]);
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
        
        // 기사 및 물류센터 목록 가져오기
        const [couriersData, centersData] = await Promise.all([
          getAllCouriers(),
          getLogisticsCenters()
        ]);
        
        setCouriers(couriersData);
        setCenters(centersData);
        
        // 통계 데이터 로드
        loadStatistics();
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [router]);

  const loadStatistics = async () => {
    if (!dateRange[0] || !dateRange[1]) return;
    
    try {
      setIsLoading(true);
      
      const startDate = dateRange[0].toISOString().split('T')[0];
      const endDate = dateRange[1].toISOString().split('T')[0];
      
      // 전체 배치 데이터 가져오기
      const assignments = await getAllAssignments(startDate, endDate);
      setTotalAssignments(assignments.length);
      
      // 기사별 배치 수 집계
      const courierCounts: Record<string, {id: string, name: string, count: number}> = {};
      
      // 물류센터별 배치 수 집계
      const centerCounts: Record<string, {id: string, name: string, count: number}> = {};
      
      // 배치 데이터 집계
      assignments.forEach(assignment => {
        // 기사 집계
        const courierId = assignment.courier_id;
        const courierName = assignment.couriers?.name || '알 수 없음';
        
        if (!courierCounts[courierId]) {
          courierCounts[courierId] = {
            id: courierId,
            name: courierName,
            count: 0
          };
        }
        courierCounts[courierId].count++;
        
        // 물류센터 집계
        const centerId = assignment.logistics_center_id;
        const centerName = assignment.centers?.name || '알 수 없음';
        
        if (!centerCounts[centerId]) {
          centerCounts[centerId] = {
            id: centerId,
            name: centerName,
            count: 0
          };
        }
        centerCounts[centerId].count++;
      });
      
      // 상위 기사 및 물류센터 정렬
      const topCouriersData = Object.values(courierCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      const topCentersData = Object.values(centerCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      setTopCouriers(topCouriersData);
      setTopCenters(topCentersData);
    } catch (error) {
      console.error('Error loading statistics:', error);
      toast.error('통계 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (update: [Date | null, Date | null]) => {
    setDateRange(update);
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
        <h2 className="text-2xl font-semibold text-secondary-800">통계</h2>
      </div>

      <div className="card mb-6">
        <div className="card-header">
          <h3 className="text-lg font-semibold">기간 선택</h3>
        </div>
        <div className="card-body">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-start md:items-end">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">조회 기간</label>
              <DatePicker
                selectsRange={true}
                startDate={dateRange[0]}
                endDate={dateRange[1]}
                onChange={handleDateRangeChange}
                className="form-input w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                dateFormat="yyyy-MM-dd"
              />
            </div>
            <button 
              onClick={loadStatistics} 
              className="btn-primary"
            >
              통계 조회
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card p-6 flex items-center">
          <div className="p-3 bg-blue-100 rounded-full mr-4">
            <FiCalendar className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary-800">총 배치 수</h3>
            <p className="text-2xl font-bold text-primary-600">{totalAssignments}건</p>
          </div>
        </div>

        <div className="card p-6 flex items-center">
          <div className="p-3 bg-indigo-100 rounded-full mr-4">
            <FiUser className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary-800">총 기사 수</h3>
            <p className="text-2xl font-bold text-primary-600">{couriers.length}명</p>
          </div>
        </div>

        <div className="card p-6 flex items-center">
          <div className="p-3 bg-purple-100 rounded-full mr-4">
            <FiMapPin className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary-800">총 물류센터 수</h3>
            <p className="text-2xl font-bold text-primary-600">{centers.length}개</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header flex items-center">
            <FiBarChart2 className="h-5 w-5 mr-2 text-primary-500" />
            <h3 className="text-lg font-semibold">상위 기사</h3>
          </div>
          <div className="card-body">
            {topCouriers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-secondary-600">배치 데이터가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topCouriers.map((courier, index) => (
                  <div key={courier.id} className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center font-semibold mr-3">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-secondary-900 font-medium">{courier.name}</span>
                        <span className="text-primary-600 font-semibold">{courier.count}건</span>
                      </div>
                      <div className="w-full bg-secondary-100 rounded-full h-2.5">
                        <div 
                          className="bg-primary-600 h-2.5 rounded-full" 
                          style={{ width: `${(courier.count / (topCouriers[0]?.count || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center">
            <FiPieChart className="h-5 w-5 mr-2 text-primary-500" />
            <h3 className="text-lg font-semibold">상위 물류센터</h3>
          </div>
          <div className="card-body">
            {topCenters.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-secondary-600">배치 데이터가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topCenters.map((center, index) => (
                  <div key={center.id} className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-semibold mr-3">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-secondary-900 font-medium">{center.name}</span>
                        <span className="text-purple-600 font-semibold">{center.count}건</span>
                      </div>
                      <div className="w-full bg-secondary-100 rounded-full h-2.5">
                        <div 
                          className="bg-purple-600 h-2.5 rounded-full" 
                          style={{ width: `${(center.count / (topCenters[0]?.count || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}