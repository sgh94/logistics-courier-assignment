"use client";

import React, { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getMyCoupangSettlements, deleteMyCoupangSettlement } from '@/lib/courier-settlements';
import { getCurrentUser } from '@/lib/auth';
import toast from 'react-hot-toast';

export default function MyCoupangSettlementsPage() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const { user } = await getCurrentUser();
        
        if (!user) {
          toast.error('로그인이 필요합니다.');
          redirect('/login');
          return;
        }
        
        setUser(user);
        
        if (user.role !== 'courier') {
          toast.error('기사만 이 페이지에 접근할 수 있습니다.');
          redirect('/dashboard');
          return;
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
        toast.error('사용자 정보를 불러오는데 실패했습니다.');
        redirect('/login');
      }
    }
    
    loadUser();
  }, []);

  useEffect(() => {
    async function loadSettlements() {
      try {
        setLoading(true);
        const data = await getMyCoupangSettlements();
        setSettlements(data);
        setLoading(false);
      } catch (err) {
        console.error('정산 데이터를 불러오는 중 오류가 발생했습니다:', err);
        setError('정산 데이터를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    }
    
    if (user && user.role === 'courier') {
      loadSettlements();
    }
  }, [user]);

  const handleDeleteSettlement = async (id: string) => {
    if (window.confirm('정말 이 정산 데이터를 삭제하시겠습니까?')) {
      try {
        await deleteMyCoupangSettlement(id);
        // 목록 다시 불러오기
        const data = await getMyCoupangSettlements();
        setSettlements(data);
        toast.success('정산 데이터가 삭제되었습니다.');
      } catch (err) {
        console.error('정산 데이터 삭제 중 오류가 발생했습니다:', err);
        toast.error('정산 데이터 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(amount);
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
        <h1 className="text-2xl font-bold">내 정산 내역</h1>
        <div>
          <Link
            href="/dashboard/my-settlements/add"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            정산 내역 추가
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">내 쿠팡 정산 목록</h2>
        
        {settlements.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-600">아직 등록된 정산 내역이 없습니다.</p>
            <p className="text-gray-600 mt-2">
              <Link
                href="/dashboard/my-settlements/add"
                className="text-blue-500 hover:text-blue-700"
              >
                여기를 클릭해서 정산 내역을 추가해보세요.
              </Link>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    날짜
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    배송구역
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    건수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    단가
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    수익금
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {settlements.flatMap(settlement => 
                  settlement.details.map((detail: any, index: number) => (
                    <tr key={detail.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDate(detail.settlement_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {detail.delivery_area || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {detail.delivery_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(detail.unit_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(detail.profit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/dashboard/my-settlements/edit/${detail.id}`}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          수정
                        </Link>
                        <button
                          onClick={() => handleDeleteSettlement(detail.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="mt-8 bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">월별 정산 합계</h2>
        
        {settlements.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-600">아직 정산 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 정산 합계 카드 */}
            {(() => {
              // 월별로 그룹화
              const monthlyData: { [key: string]: number } = {};
              
              settlements.forEach(settlement => {
                settlement.details.forEach((detail: any) => {
                  const date = new Date(detail.settlement_date);
                  const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
                  
                  if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = 0;
                  }
                  
                  monthlyData[monthKey] += Number(detail.profit);
                });
              });
              
              // 월별 카드 렌더링
              return Object.entries(monthlyData).map(([month, total]) => {
                const [year, monthNum] = month.split('-');
                
                return (
                  <div key={month} className="bg-blue-50 rounded-lg p-4 shadow">
                    <h3 className="text-lg font-medium text-blue-700">
                      {year}년 {monthNum}월
                    </h3>
                    <p className="text-2xl font-bold mt-2">
                      {formatCurrency(total)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      수익금 합계
                    </p>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
