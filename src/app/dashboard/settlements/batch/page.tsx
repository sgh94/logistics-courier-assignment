"use client";

import React, { useState } from 'react';
import { redirect } from 'next/navigation';
import { createSettlement, createKurlySettlement, createCoupangSettlement } from '@/lib/settlements';
import BatchSettlementForm from '@/components/settlements/BatchSettlementForm';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function BatchSettlementPage() {
  const searchParams = useSearchParams();
  const type = (searchParams.get('type') || 'coupang') as 'kurly' | 'coupang';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleBatchSettlement = async (rows: any[]) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // 타입에 따라 다른 처리
      if (type === 'coupang') {
        // 날짜별로 그룹화
        const dateGroups: { [key: string]: any[] } = {};
        
        rows.forEach(row => {
          const date = row.settlement_date;
          if (!dateGroups[date]) {
            dateGroups[date] = [];
          }
          dateGroups[date].push(row);
        });
        
        // 각 날짜별로 정산 생성
        for (const [date, dateRows] of Object.entries(dateGroups)) {
          // 먼저 정산 레코드 생성
          const settlement = await createSettlement(date, 'coupang');
          
          // 각 행에 대해 쿠팡 정산 상세 생성
          for (const row of dateRows) {
            await createCoupangSettlement(settlement.id, {
              settlement_date: date,
              courier_name: row.courier_name,
              day_or_night: row.day_or_night,
              delivery_area: row.delivery_area,
              delivery_count: row.delivery_count,
              unit_price: row.unit_price,
              supply_price: row.supply_price,
              vat: row.vat,
              total_amount: row.total_amount,
              profit: row.profit
            });
          }
        }
      } else if (type === 'kurly') {
        // 날짜별로 그룹화
        const dateGroups: { [key: string]: any[] } = {};
        
        rows.forEach(row => {
          const date = row.settlement_date;
          if (!dateGroups[date]) {
            dateGroups[date] = [];
          }
          dateGroups[date].push(row);
        });
        
        // 각 날짜별로 정산 생성
        for (const [date, dateRows] of Object.entries(dateGroups)) {
          // 먼저 정산 레코드 생성
          const settlement = await createSettlement(date, 'kurly');
          
          // 각 행에 대해 컬리 정산 상세 생성
          for (const row of dateRows) {
            await createKurlySettlement(settlement.id, {
              company_name: row.company_name,
              settlement_date: date,
              support_type: row.support_type,
              amount: row.amount,
              settlement_amount: row.settlement_amount,
              supply_price: row.supply_price
            });
          }
        }
      }
      
      setSuccess(`${rows.length}개의 정산 데이터가 성공적으로 추가되었습니다.`);
      setLoading(false);
      
      // 3초 후 리다이렉트
      setTimeout(() => {
        redirect('/dashboard/settlements');
      }, 3000);
    } catch (err) {
      console.error('일괄 정산 처리 중 오류가 발생했습니다:', err);
      setError('일괄 정산 처리 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    redirect('/dashboard/settlements');
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {type === 'coupang' ? '쿠팡 일괄 정산 추가' : '컬리 일괄 정산 추가'}
        </h1>
        <div className="space-x-2">
          {type === 'coupang' ? (
            <Link
              href="/dashboard/settlements/batch?type=kurly"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              컬리 일괄 정산으로 전환
            </Link>
          ) : (
            <Link
              href="/dashboard/settlements/batch?type=coupang"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              쿠팡 일괄 정산으로 전환
            </Link>
          )}
          <Link
            href="/dashboard/settlements"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          {success}
          <p className="text-sm mt-1">정산 목록 페이지로 이동합니다...</p>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          {type === 'coupang' ? '쿠팡 정산 일괄 입력' : '컬리 정산 일괄 입력'}
        </h2>
        
        <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <p className="text-sm">
            여러 건의 정산 데이터를 한 번에 입력할 수 있습니다. 각 행의 데이터를 모두 채운 후 일괄 저장 버튼을 클릭하세요.
          </p>
          <p className="text-sm mt-1">
            • 필수 입력 항목은 모두 채워야 합니다.
          </p>
          <p className="text-sm">
            • 금액은 자동으로 계산됩니다.
          </p>
        </div>
        
        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-600">정산 데이터를 저장하는 중입니다...</p>
          </div>
        ) : (
          <BatchSettlementForm
            type={type}
            onSubmit={handleBatchSettlement}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
}
