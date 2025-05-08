"use client";

import React, { useEffect, useState } from 'react';
import { getSettlements, deleteSettlement } from '@/lib/settlements';
import SettlementList from '@/components/settlements/SettlementList';
import Link from 'next/link';
import { Settlement } from '@/lib/types/settlement';

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettlements() {
      try {
        setLoading(true);
        const data = await getSettlements();
        setSettlements(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : '정산 데이터를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    }
    
    loadSettlements();
  }, []);

  const handleDeleteSettlement = async (id: string) => {
    if (window.confirm('정말 이 정산 데이터를 삭제하시겠습니까?')) {
      try {
        await deleteSettlement(id);
        // 삭제 후 목록 업데이트
        setSettlements(settlements.filter(item => item.id !== id));
      } catch (error) {
        console.error('Failed to delete settlement:', error);
        alert('정산 데이터 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-10">
          <p className="text-gray-600">정산 데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">정산 관리</h1>
        <div className="space-x-2">
          <Link
            href="/dashboard/settlements/new?type=kurly"
            className="inline-block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            컬리 정산 추가
          </Link>
          <Link
            href="/dashboard/settlements/new?type=coupang"
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            쿠팡 정산 추가
          </Link>
          <Link
            href="/dashboard/settlements/new?type=general"
            className="inline-block px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            편집용 정산 추가
          </Link>
        </div>
      </div>

      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg">
          <SettlementList
            settlements={settlements}
            onDeleteSettlement={handleDeleteSettlement}
          />
        </div>
      )}
    </div>
  );
}