import React from 'react';
import { getSettlements, deleteSettlement } from '@/lib/settlements';
import SettlementList from '@/components/settlements/SettlementList';
import Link from 'next/link';
import { Settlement } from '@/lib/types/settlement';

export const dynamic = 'force-dynamic';

export default async function SettlementsPage() {
  let settlements: Settlement[] = [];
  let error = null;

  try {
    settlements = await getSettlements();
  } catch (err) {
    error = err instanceof Error ? err.message : '정산 데이터를 불러오는 중 오류가 발생했습니다.';
  }

  const handleDeleteSettlement = async (id: string) => {
    'use server';
    try {
      await deleteSettlement(id);
    } catch (error) {
      console.error('Failed to delete settlement:', error);
    }
  };

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