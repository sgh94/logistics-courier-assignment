'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { getAssignmentById, deleteAssignment } from '@/lib/assignments';
import { User } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiTrash2, FiAlertTriangle } from 'react-icons/fi';

type Params = {
  params: {
    id: string;
  }
}

export default function DeleteAssignmentPage({ params }: Params) {
  const assignmentId = params.id;
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [assignment, setAssignment] = useState<any>(null);
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

        // 배치 정보 가져오기
        const assignmentData = await getAssignmentById(assignmentId);
        if (!assignmentData) {
          toast.error('배치 정보를 찾을 수 없습니다.');
          router.push('/dashboard/assignments');
          return;
        }

        setAssignment(assignmentData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading assignment data:', error);
        toast.error('데이터를 불러오는데 실패했습니다.');
        router.push('/dashboard/assignments');
      }
    }

    loadData();
  }, [assignmentId, router]);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteAssignment(assignmentId);
      toast.success('배치가 성공적으로 삭제되었습니다.');
      router.push('/dashboard/assignments');
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('배치 삭제에 실패했습니다.');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const courierName = assignment.couriers?.name || '알 수 없음';
  const centerName = assignment.centers?.name || '알 수 없음';
  const timeInfo = assignment.start_time ? 
    `${assignment.start_time.substring(0, 5)} ~ ${assignment.end_time ? assignment.end_time.substring(0, 5) : '종일'}` : 
    '종일';

  return (
    <div className="py-6">
      <div className="mb-6 flex items-center">
        <Link
          href="/dashboard/assignments"
          className="mr-4 p-2 rounded-md text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100"
        >
          <FiArrowLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-2xl font-semibold text-secondary-800">배치 삭제</h2>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="card border-red-300">
          <div className="card-header bg-red-50 border-red-300">
            <div className="flex items-center">
              <FiAlertTriangle className="h-6 w-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-red-700">배치 삭제 확인</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="p-4 mb-4 bg-secondary-50 rounded border border-secondary-200">
              <h4 className="font-medium text-secondary-700 mb-2">삭제할 배치 정보</h4>
              <div className="space-y-2">
                <div className="flex">
                  <span className="font-medium w-24 text-secondary-600">날짜:</span>
                  <span>{assignment.date}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-24 text-secondary-600">물류센터:</span>
                  <span>{centerName}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-24 text-secondary-600">기사:</span>
                  <span>{courierName}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-24 text-secondary-600">시간:</span>
                  <span>{timeInfo}</span>
                </div>
                {assignment.notes && (
                  <div className="flex">
                    <span className="font-medium w-24 text-secondary-600">비고:</span>
                    <span>{assignment.notes}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 mb-4 bg-yellow-50 border rounded border-yellow-300">
              <div className="flex items-start">
                <FiAlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-yellow-700">
                  이 배치를 삭제하면 기사에게 할당된 물류센터 배치가 취소됩니다. 이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
            </div>

            <div className="pt-4 flex space-x-3">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn-danger flex-1 flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                    삭제 중...
                  </>
                ) : (
                  <>
                    <FiTrash2 className="mr-2 h-5 w-5" />
                    배치 삭제
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
          </div>
        </div>
      </div>
    </div>
  );
}