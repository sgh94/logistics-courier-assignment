'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { getCourierAssignments, getAllAssignments } from '@/lib/assignments';
import { User } from '@/lib/supabase';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import toast from 'react-hot-toast';
import { FiPlus, FiCalendar, FiMapPin, FiClock, FiUser, FiInfo } from 'react-icons/fi';

export default function AssignmentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    new Date(), 
    new Date(new Date().setDate(new Date().getDate() + 14))
  ]);

  useEffect(() => {
    async function loadData() {
      try {
        const { user } = await getCurrentUser();
        
        if (!user) {
          toast.error('로그인이 필요합니다.');
          return;
        }
        
        setUser(user);
        setIsAdmin(user.role === 'admin');
        
        await loadAssignments(user);
      } catch (error) {
        console.error('Error loading assignments:', error);
        toast.error('배치 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  const loadAssignments = async (user: User) => {
    try {
      if (!dateRange[0] || !dateRange[1]) return;
      
      const startDate = dateRange[0].toISOString().split('T')[0];
      const endDate = dateRange[1].toISOString().split('T')[0];
      
      let assignmentsData;
      if (user.role === 'admin') {
        assignmentsData = await getAllAssignments(startDate, endDate);
      } else {
        assignmentsData = await getCourierAssignments(user.id, startDate, endDate);
      }
      
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error('배치 정보를 불러오는데 실패했습니다.');
    }
  };

  const handleDateRangeChange = (update: [Date | null, Date | null]) => {
    setDateRange(update);
  };

  const handleSearch = () => {
    if (user) {
      loadAssignments(user);
    }
  };

  const formatTime = (time?: string) => {
    if (!time) return '종일';
    return time.substring(0, 5); // HH:MM 형식으로 변환
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-secondary-800">배치 현황</h2>
        {isAdmin && (
          <Link
            href="/dashboard/assignments/new"
            className="btn-primary w-full sm:w-auto"
          >
            <FiPlus className="h-5 w-5 mr-2" />
            새 배치 생성
          </Link>
        )}
      </div>

      <div className="card mb-6">
        <div className="card-header">
          <h3 className="text-lg font-semibold">기간 선택</h3>
        </div>
        <div className="card-body">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-start md:items-end">
            <div className="w-full md:w-auto">
              <label className="block text-sm font-medium text-secondary-700 mb-1">배치 기간</label>
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
              onClick={handleSearch} 
              className="btn-primary w-full md:w-auto"
            >
              조회하기
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">배치 목록</h3>
        </div>
        <div className="card-body">
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <FiInfo className="h-12 w-12 mx-auto text-secondary-400 mb-4" />
              <p className="text-secondary-600 mb-4">조회된 배치가 없습니다.</p>
              {isAdmin ? (
                <Link href="/dashboard/assignments/new" className="btn-primary inline-flex">
                  <FiPlus className="h-5 w-5 mr-2" />
                  배치 생성하기
                </Link>
              ) : (
                <p className="text-secondary-500">선택한 기간에 배치된 물류센터가 없습니다.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      날짜
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      물류센터
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      시간
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        기사
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      비고
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 relative">
                        <span className="sr-only">Actions</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {assignments.map((assignment: any) => (
                    <tr key={assignment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        <div className="flex items-center">
                          <FiCalendar className="h-4 w-4 mr-2 text-secondary-500" />
                          {assignment.date}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        <div className="flex items-center">
                          <FiMapPin className="h-4 w-4 mr-2 text-secondary-500" />
                          {assignment.centers?.name || '알 수 없음'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        <div className="flex items-center">
                          <FiClock className="h-4 w-4 mr-2 text-secondary-500" />
                          {formatTime(assignment.start_time)} ~ {formatTime(assignment.end_time)}
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                          <div className="flex items-center">
                            <FiUser className="h-4 w-4 mr-2 text-secondary-500" />
                            {assignment.couriers?.name || '알 수 없음'}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                        {assignment.notes || '-'}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Link
                              href={`/dashboard/assignments/edit/${assignment.id}`}
                              className="btn-link text-primary-600 hover:text-primary-900 min-h-[36px] py-1"
                            >
                              수정
                            </Link>
                            <Link
                              href={`/dashboard/assignments/delete/${assignment.id}`}
                              className="btn-link text-red-600 hover:text-red-900 min-h-[36px] py-1"
                            >
                              삭제
                            </Link>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}