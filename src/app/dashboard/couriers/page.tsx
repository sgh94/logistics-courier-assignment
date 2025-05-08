"use client";

import { useState, useEffect } from "react";
import { getCurrentUser, User } from "@/lib/auth";
import { getAllCouriers } from "@/lib/couriers";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  FiMail,
  FiPhone,
  FiCalendar,
  FiPieChart,
  FiSettings,
} from "react-icons/fi";

export default function CouriersPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [couriers, setCouriers] = useState<User[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        // 사용자 권한 확인
        const { user } = await getCurrentUser();

        if (!user || user.role !== "admin") {
          setIsAdmin(false);
          router.push("/dashboard");
          return;
        }

        setIsAdmin(true);

        // 기사 목록 가져오기
        const couriersData = await getAllCouriers();
        setCouriers(couriersData);
      } catch (error) {
        console.error("Error loading couriers:", error);
        toast.error("기사 정보를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [router]);

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
        <h2 className="text-2xl font-semibold text-secondary-800">
          택배기사 관리
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {couriers.map((courier) => (
          <div key={courier.id} className="card overflow-hidden">
            <div className="card-header flex justify-between items-center">
              <h3 className="text-lg font-semibold text-secondary-800">
                {courier.name}
              </h3>
              <div className="flex space-x-2">
                <Link
                  href={`/dashboard/couriers/stats/${courier.id}`}
                  className="p-2 rounded-md text-secondary-500 hover:text-primary-600 hover:bg-secondary-100"
                  title="기사 통계 보기"
                >
                  <FiPieChart className="h-5 w-5" />
                </Link>
                <Link
                  href={`/dashboard/couriers/settings/${courier.id}`}
                  className="p-2 rounded-md text-secondary-500 hover:text-primary-600 hover:bg-secondary-100"
                  title="알림 설정"
                >
                  <FiSettings className="h-5 w-5" />
                </Link>
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-secondary-600">
                  <FiMail className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{courier.email}</span>
                </div>
                {courier.phone && (
                  <div className="flex items-center text-sm text-secondary-600">
                    <FiPhone className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{courier.phone}</span>
                  </div>
                )}
                <div className="flex items-center text-sm text-secondary-600">
                  <FiCalendar className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>
                    가입일:{" "}
                    {courier.created_at
                      ? new Date(courier.created_at).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <Link
                  href={`/dashboard/assignments?courier=${courier.id}`}
                  className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200"
                >
                  배치 내역
                </Link>
                <Link
                  href={`/dashboard/votes?courier=${courier.id}`}
                  className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 hover:bg-green-200"
                >
                  투표 내역
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {couriers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-secondary-600 mb-4">등록된 택배기사가 없습니다.</p>
          <p className="text-secondary-500">
            택배기사가 회원가입하면 이곳에 표시됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
