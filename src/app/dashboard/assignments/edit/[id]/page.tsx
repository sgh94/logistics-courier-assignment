'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { getLogisticsCenters } from '@/lib/centers';
import { getAssignmentById, updateAssignment } from '@/lib/assignments';
import { LogisticsCenter, User } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from 'react-hot-toast';
import { FiArrowLeft, FiSave } from 'react-icons/fi';

type Params = {
  params: {
    id: string;
  }
}

export default function EditAssignmentPage({ params }: Params) {
  const assignmentId = params.id;
  const [logisticsCenters, setLogisticsCenters] = useState<LogisticsCenter[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [adminId, setAdminId] = useState<string>('');
  const [courierName, setCourierName] = useState<string>('');
  const [courierId, setCourierId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const { user } = await getCurrentUser();

        if (!user || user.role !== 'admin') {
          toast.error('관리자만 접근할 수 있습니다.');
          router.push('/dashboard');
          return;
        }

        setAdminId(user.id);

        // 물류센터 목록 가져오기
        const centers = await getLogisticsCenters();
        setLogisticsCenters(centers);

        // 배치 정보 가져오기
        const assignment = await getAssignmentById(assignmentId);
        if (!assignment) {
          toast.error('배치 정보를 찾을 수 없습니다.');
          router.push('/dashboard/assignments');
          return;
        }

        // 배치 정보 설정
        setSelectedCenter(assignment.logistics_center_id);
        setSelectedDate(new Date(assignment.date));
        setStartTime(assignment.start_time || '');
        setEndTime(assignment.end_time || '');
        setNotes(assignment.notes || '');
        setCourierId(assignment.courier_id);
        
        // 기사 이름 설정 (from joining table)
        if (assignment.couriers) {
          setCourierName(assignment.couriers.name);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('데이터를 불러오는데 실패했습니다.');
        router.push('/dashboard/assignments');
      }
    }

    loadData();
  }, [assignmentId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCenter) {
      toast.error('물류센터를 선택해주세요.');
      return;
    }

    if (!selectedDate) {
      toast.error('날짜를 선택해주세요.');
      return;
    }

    setIsSaving(true);

    try {
      const dateString = selectedDate.toISOString().split('T')[0];

      // 배치 업데이트
      await updateAssignment(assignmentId, {
        logistics_center_id: selectedCenter,
        date: dateString,
        start_time: startTime || null,
        end_time: endTime || null,
        notes: notes || null
      });

      toast.success('배치가 성공적으로 수정되었습니다.');
      router.push('/dashboard/assignments');
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error('배치 수정에 실패했습니다.');
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
          href="/dashboard/assignments"
          className="mr-4 p-2 rounded-md text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100"
        >
          <FiArrowLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-2xl font-semibold text-secondary-800">배치 수정</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">배치 정보</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700">
                    배치된 기사
                  </label>
                  <div className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm bg-secondary-100 px-3 py-2">
                    {courierName || '알 수 없음'}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="logistics_center" className="block text-sm font-medium text-secondary-700">
                    물류센터 *
                  </label>
                  <select
                    id="logistics_center"
                    value={selectedCenter}
                    onChange={(e) => setSelectedCenter(e.target.value)}
                    className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  >
                    <option value="">물류센터 선택</option>
                    {logisticsCenters.map((center) => (
                      <option key={center.id} value={center.id}>
                        {center.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-secondary-700">
                    날짜 *
                  </label>
                  <DatePicker
                    id="date"
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    dateFormat="yyyy-MM-dd"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="start_time" className="block text-sm font-medium text-secondary-700">
                    시작 시간
                  </label>
                  <input
                    id="start_time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="end_time" className="block text-sm font-medium text-secondary-700">
                    종료 시간
                  </label>
                  <input
                    id="end_time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-secondary-700">
                    비고
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="추가 정보를 입력하세요"
                  />
                </div>

                <div className="pt-4 flex space-x-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary flex-1 flex items-center justify-center"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                        저장 중...
                      </>
                    ) : (
                      <>
                        <FiSave className="mr-2 h-5 w-5" />
                        변경사항 저장
                      </>
                    )}
                  </button>
                  <Link
                    href="/dashboard/assignments"
                    className="btn-secondary flex-1 flex items-center justify-center"
                  >
                    취소
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}