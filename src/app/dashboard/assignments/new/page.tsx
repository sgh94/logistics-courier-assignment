'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { getLogisticsCenters } from '@/lib/centers';
import { getAvailableCouriers, getAssignedCouriers } from '@/lib/couriers';
import { createMultipleAssignments } from '@/lib/assignments';
import { sendAssignmentNotification } from '@/lib/notifications';
import { LogisticsCenter, User } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from 'react-hot-toast';
import { FiArrowLeft, FiSave, FiCheck, FiX } from 'react-icons/fi';

export default function NewAssignmentPage() {
  const [logisticsCenters, setLogisticsCenters] = useState<LogisticsCenter[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [availableCouriers, setAvailableCouriers] = useState<User[]>([]);
  const [assignedCourierIds, setAssignedCourierIds] = useState<string[]>([]);
  const [selectedCouriers, setSelectedCouriers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [adminId, setAdminId] = useState<string>('');
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
        
        setAdminId(user.id);
        
        // 물류센터 목록 가져오기
        const centers = await getLogisticsCenters();
        setLogisticsCenters(centers);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking permissions:', error);
        toast.error('권한을 확인하는데 실패했습니다.');
        router.push('/dashboard');
      }
    }
    
    checkPermission();
  }, [router]);

  // 날짜가 선택될 때 가능한 기사 목록 로드
  useEffect(() => {
    async function loadAvailableCouriers() {
      if (!selectedDate) return;
      
      try {
        const dateString = selectedDate.toISOString().split('T')[0];
        
        // 해당 날짜에 근무 가능한 기사 목록 가져오기
        const availableCouriersData = await getAvailableCouriers(dateString);
        setAvailableCouriers(availableCouriersData);
        
        // 이미 배치된 기사 ID 목록 가져오기
        const assignedIds = await getAssignedCouriers(dateString);
        setAssignedCourierIds(assignedIds);
      } catch (error) {
        console.error('Error loading available couriers:', error);
        toast.error('근무 가능한 기사 목록을 불러오는데 실패했습니다.');
      }
    }
    
    loadAvailableCouriers();
  }, [selectedDate]);

  const handleCourierToggle = (courierId: string) => {
    setSelectedCouriers(prev => 
      prev.includes(courierId)
        ? prev.filter(id => id !== courierId)
        : [...prev, courierId]
    );
  };

  const handleSelectAll = () => {
    const availableUnassignedIds = availableCouriers
      .filter(courier => !assignedCourierIds.includes(courier.id))
      .map(courier => courier.id);
    
    setSelectedCouriers(availableUnassignedIds);
  };

  const handleUnselectAll = () => {
    setSelectedCouriers([]);
  };

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
    
    if (selectedCouriers.length === 0) {
      toast.error('최소 한 명 이상의 기사를 선택해주세요.');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const centerData = logisticsCenters.find(c => c.id === selectedCenter);
      
      // 각 기사별로 배치 데이터 생성
      const assignmentsData = selectedCouriers.map(courierId => ({
        courier_id: courierId,
        logistics_center_id: selectedCenter,
        date: dateString,
        start_time: startTime || null,
        end_time: endTime || null,
        notes: notes || null,
        created_by: adminId
      }));
      
      // 배치 일괄 생성
      await createMultipleAssignments(assignmentsData);
      
      // 각 기사에게 알림 전송
      for (const courierId of selectedCouriers) {
        await sendAssignmentNotification(
          courierId,
          dateString,
          centerData?.name || '물류센터',
          startTime,
          endTime,
          notes
        );
      }
      
      toast.success('배치가 성공적으로 생성되었습니다.');
      router.push('/dashboard/assignments');
    } catch (error) {
      console.error('Error creating assignments:', error);
      toast.error('배치 생성에 실패했습니다.');
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

  const isAlreadyAssigned = (courierId: string) => assignedCourierIds.includes(courierId);

  return (
    <div className="py-6">
      <div className="mb-6 flex items-center">
        <Link
          href="/dashboard/assignments"
          className="mr-4 p-2 rounded-md text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100"
        >
          <FiArrowLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-2xl font-semibold text-secondary-800">새 배치 생성</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">배치 정보</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    minDate={new Date()}
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

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSaving || selectedCouriers.length === 0}
                    className="btn-primary w-full flex items-center justify-center"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                        저장 중...
                      </>
                    ) : (
                      <>
                        <FiSave className="mr-2 h-5 w-5" />
                        배치 생성하기
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h3 className="text-lg font-semibold">택배기사 선택</h3>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2 py-1 text-xs font-semibold rounded text-primary-700 bg-primary-100 hover:bg-primary-200"
                >
                  <FiCheck className="inline-block mr-1" />
                  전체 선택
                </button>
                <button
                  type="button"
                  onClick={handleUnselectAll}
                  className="px-2 py-1 text-xs font-semibold rounded text-red-700 bg-red-100 hover:bg-red-200"
                >
                  <FiX className="inline-block mr-1" />
                  전체 해제
                </button>
              </div>
            </div>
            <div className="card-body">
              {availableCouriers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-secondary-600 mb-4">해당 날짜에 근무 가능한 기사가 없습니다.</p>
                  <p className="text-secondary-500">기사들이 근무 가능 여부를 투표해야 합니다.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availableCouriers.map((courier) => {
                    const isAssigned = isAlreadyAssigned(courier.id);
                    const isSelected = selectedCouriers.includes(courier.id);
                    
                    return (
                      <div 
                        key={courier.id}
                        className={`p-4 rounded-lg border ${
                          isAssigned
                            ? 'border-yellow-200 bg-yellow-50'
                            : isSelected
                              ? 'border-primary-200 bg-primary-50'
                              : 'border-secondary-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-medium text-secondary-800">{courier.name}</h4>
                            <p className="text-sm text-secondary-600">{courier.email}</p>
                            {courier.phone && <p className="text-sm text-secondary-500">{courier.phone}</p>}
                          </div>
                          {isAssigned ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              이미 배치됨
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCourierToggle(courier.id)}
                              className={`w-6 h-6 rounded-full ${
                                isSelected
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-white border border-secondary-300'
                              } flex items-center justify-center focus:outline-none`}
                            >
                              {isSelected && <FiCheck className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}