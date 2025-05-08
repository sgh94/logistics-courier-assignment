"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getCourierById } from '@/lib/couriers';
import { getSettlements, getKurlySettlements, getCoupangSettlements } from '@/lib/settlements';
import { Settlement, KurlySettlement, CoupangSettlement } from '@/lib/types/settlement';
import Link from 'next/link';

export default function SettlementReportPage() {
  const searchParams = useSearchParams();
  const courierId = searchParams.get('courier_id');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  
  const [courier, setCourier] = useState<any>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [kurlyData, setKurlyData] = useState<KurlySettlement[]>([]);
  const [coupangData, setCoupangData] = useState<CoupangSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 정산 계산 결과
  const [totalAmount, setTotalAmount] = useState(0);
  const [tax, setTax] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // 기사 정보 가져오기
        if (courierId) {
          const courierData = await getCourierById(courierId);
          setCourier(courierData);
        }
        
        // 모든 정산 가져오기
        const allSettlements = await getSettlements();
        
        // 날짜 범위와 기사로 필터링
        const filteredSettlements = allSettlements.filter((settlement) => {
          // 날짜 범위 적용
          const settlementDate = new Date(settlement.settlement_date);
          let matchesDate = true;
          
          if (startDate) {
            const startDateObj = new Date(startDate);
            matchesDate = matchesDate && settlementDate >= startDateObj;
          }
          
          if (endDate) {
            const endDateObj = new Date(endDate);
            matchesDate = matchesDate && settlementDate <= endDateObj;
          }
          
          return matchesDate;
        });
        
        setSettlements(filteredSettlements);
        
        // 각 정산 유형별 상세 데이터 조회
        const kurlyItems: KurlySettlement[] = [];
        const coupangItems: CoupangSettlement[] = [];
        
        for (const settlement of filteredSettlements) {
          if (settlement.settlement_type === 'kurly') {
            const kurlySettlements = await getKurlySettlements(settlement.id);
            kurlyItems.push(...kurlySettlements);
          } else if (settlement.settlement_type === 'coupang') {
            const coupangSettlements = await getCoupangSettlements(settlement.id);
            const filteredCoupangSettlements = courierId 
              ? coupangSettlements.filter(item => item.courier_name === courier?.name)
              : coupangSettlements;
            coupangItems.push(...filteredCoupangSettlements);
          }
        }
        
        setKurlyData(kurlyItems);
        setCoupangData(coupangItems);
        
        // 합계 계산
        let total = 0;
        
        // Kurly 정산 합계
        total += kurlyItems.reduce((sum, item) => sum + Number(item.amount), 0) * 10000;
        
        // Coupang 정산 합계
        total += coupangItems.reduce((sum, item) => sum + Number(item.profit), 0);
        
        setTotalAmount(total);
        
        // 공제액 계산 (8% 예시)
        const taxAmount = Math.round(total * 0.08);
        setTax(taxAmount);
        
        // 최종 정산액
        setFinalAmount(total - taxAmount);
        
        setLoading(false);
      } catch (err) {
        console.error('정산 데이터를 불러오는 중 오류가 발생했습니다:', err);
        setError('정산 데이터를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    }
    
    fetchData();
  }, [courierId, startDate, endDate]);

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
  
  // 현재 월 정보 가져오기
  const getReportMonth = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
        return `${start.getFullYear()}년 ${start.getMonth() + 1}월`;
      } else {
        return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ~ ${end.getFullYear()}년 ${end.getMonth() + 1}월`;
      }
    }
    return new Date().getFullYear() + "년 " + (new Date().getMonth() + 1) + "월";
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

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
        <div className="mt-4">
          <Link
            href="/dashboard/settlements"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            정산 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">정산서</h1>
        <div className="space-x-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 print:hidden"
          >
            인쇄하기
          </button>
          <Link
            href="/dashboard/settlements"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 print:hidden"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6 print:shadow-none print:border">
        {/* 정산서 헤더 */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <h2 className="text-xl font-bold">[ {getReportMonth()} ] 정산서</h2>
        </div>

        {/* 기사 정보 */}
        <div className="flex mb-6">
          <div className="flex border border-gray-300">
            <div className="bg-yellow-100 p-2 font-bold w-24 flex items-center justify-center border-r border-gray-300">
              이름 :
            </div>
            <div className="p-2 w-64 bg-yellow-100 font-bold">
              {courier?.name || '전체'}
            </div>
          </div>
        </div>

        {/* 정산 요약 */}
        <div className="mb-6">
          <div className="border border-gray-300 mb-4">
            <div className="bg-orange-100 p-2 text-center font-bold border-b border-gray-300">
              정산 상세
            </div>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="border-r border-b border-gray-300 p-2 w-1/2">구분</th>
                  <th className="border-b border-gray-300 p-2 w-1/2">금액</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-r border-t border-gray-300 p-2">컬리 외</td>
                  <td className="border-t border-gray-300 p-2 text-right">0</td>
                </tr>
                <tr>
                  <td className="border-r border-t border-gray-300 p-2">쿠팡 외</td>
                  <td className="border-t border-gray-300 p-2 text-right">{formatCurrency(totalAmount)}</td>
                </tr>
                <tr>
                  <td className="border-r border-t border-gray-300 p-2 bg-yellow-50">
                    수수료<br/>(부가세 별도)
                  </td>
                  <td className="border-t border-gray-300 p-2"></td>
                </tr>
                <tr>
                  <td className="border-r border-t border-gray-300 p-2">추가정산</td>
                  <td className="border-t border-gray-300 p-2 text-right">0</td>
                </tr>
                <tr className="bg-yellow-50">
                  <td className="border-r border-t border-gray-300 p-2 font-bold">합계 (A)</td>
                  <td className="border-t border-gray-300 p-2 text-right font-bold">{formatCurrency(totalAmount)}</td>
                </tr>
                <tr>
                  <td className="border-r border-t border-gray-300 p-2">공제액 (수수료 * 8%) (B)</td>
                  <td className="border-t border-gray-300 p-2 text-right">{formatCurrency(tax)}</td>
                </tr>
                <tr className="bg-yellow-50">
                  <td className="border-r border-t border-gray-300 p-2 font-bold">공급가 (A-B)</td>
                  <td className="border-t border-gray-300 p-2 text-right font-bold text-red-600">{formatCurrency(finalAmount)}</td>
                </tr>
                <tr>
                  <td className="border-r border-t border-gray-300 p-2">부가세</td>
                  <td className="border-t border-gray-300 p-2 text-right">{formatCurrency(Math.round(finalAmount * 0.1))}</td>
                </tr>
                <tr className="bg-yellow-50">
                  <td className="border-r border-t border-gray-300 p-2 font-bold">합계 (C)</td>
                  <td className="border-t border-gray-300 p-2 text-right font-bold">{formatCurrency(finalAmount + Math.round(finalAmount * 0.1))}</td>
                </tr>
                {/* 공제내역 */}
                <tr>
                  <td className="border-r border-t border-gray-300 p-2">사고금</td>
                  <td className="border-t border-gray-300 p-2 text-right">17,700</td>
                </tr>
                <tr>
                  <td className="border-r border-t border-gray-300 p-2">가불 외</td>
                  <td className="border-t border-gray-300 p-2 text-right">{formatCurrency(finalAmount + Math.round(finalAmount * 0.1) - 17700)}</td>
                </tr>
                <tr>
                  <td className="border-r border-t border-gray-300 p-2">3.3%공제</td>
                  <td className="border-t border-gray-300 p-2 text-right">0</td>
                </tr>
                <tr>
                  <td className="border-r border-t border-gray-300 p-2">산재보험</td>
                  <td className="border-t border-gray-300 p-2 text-right">37,490</td>
                </tr>
                <tr>
                  <td className="border-r border-t border-gray-300 p-2">기타</td>
                  <td className="border-t border-gray-300 p-2 text-right"></td>
                </tr>
                <tr className="bg-yellow-50">
                  <td className="border-r border-t border-gray-300 p-2 font-bold">합계 (D)</td>
                  <td className="border-t border-gray-300 p-2 text-right font-bold">{formatCurrency(finalAmount + Math.round(finalAmount * 0.1))}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* 실 지급액 */}
          <div className="bg-yellow-100 border border-gray-300 p-2 flex justify-between font-bold">
            <div>실 지급액 (C-D)</div>
            <div className="text-red-600">0</div>
          </div>
        </div>

        {/* 컬리 정산 내역 */}
        <div className="mb-6">
          <div className="bg-orange-100 text-center p-2 font-bold mb-2">
            [ 컬리 포함 세부내역 ]
          </div>
          <table className="w-full border border-gray-300">
            <thead>
              <tr className="bg-blue-50">
                <th className="border-r border-b border-gray-300 p-2">날짜</th>
                <th className="border-r border-b border-gray-300 p-2">조</th>
                <th className="border-r border-b border-gray-300 p-2">자수</th>
                <th className="border-b border-gray-300 p-2">금액</th>
              </tr>
            </thead>
            <tbody>
              {kurlyData.length > 0 ? (
                kurlyData.map((item, index) => (
                  <tr key={index}>
                    <td className="border-r border-b border-gray-300 p-2">{formatDate(item.settlement_date || '')}</td>
                    <td className="border-r border-b border-gray-300 p-2">{item.support_type || '-'}</td>
                    <td className="border-r border-b border-gray-300 p-2">{item.delivery_count || '-'}</td>
                    <td className="border-b border-gray-300 p-2 text-right">{formatCurrency(Number(item.settlement_amount))}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="border-b border-gray-300 p-2 text-center">
                    합계 - 0
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 쿠팡 정산 내역 */}
        <div>
          <div className="bg-orange-100 text-center p-2 font-bold mb-2">
            [ 쿠팡 포함 세부내역 ]
          </div>
          <table className="w-full border border-gray-300">
            <thead>
              <tr className="bg-blue-50">
                <th className="border-r border-b border-gray-300 p-2">날짜</th>
                <th className="border-r border-b border-gray-300 p-2">배송구역</th>
                <th className="border-r border-b border-gray-300 p-2">건수</th>
                <th className="border-r border-b border-gray-300 p-2">단가</th>
                <th className="border-b border-gray-300 p-2">금액</th>
              </tr>
            </thead>
            <tbody>
              {coupangData.length > 0 ? (
                <>
                  <tr>
                    <td colSpan={4} className="border-b border-gray-300 p-2 text-center font-bold">
                      합계
                    </td>
                    <td className="border-b border-gray-300 p-2 text-right font-bold">
                      {formatCurrency(coupangData.reduce((sum, item) => sum + Number(item.profit), 0))}
                    </td>
                  </tr>
                  {coupangData.map((item, index) => (
                    <tr key={index}>
                      <td className="border-r border-b border-gray-300 p-2">{formatDate(item.settlement_date)}</td>
                      <td className="border-r border-b border-gray-300 p-2">{item.delivery_area || '-'}</td>
                      <td className="border-r border-b border-gray-300 p-2">{item.delivery_count}</td>
                      <td className="border-r border-b border-gray-300 p-2">{formatCurrency(Number(item.unit_price))}</td>
                      <td className="border-b border-gray-300 p-2 text-right">{formatCurrency(Number(item.profit))}</td>
                    </tr>
                  ))}
                </>
              ) : (
                <tr>
                  <td colSpan={5} className="border-b border-gray-300 p-2 text-center">
                    합계 - 0
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 공지사항 */}
        <div className="mt-6 border-t border-gray-300 pt-4">
          <p className="text-center mb-2">※ 공지사항 ※</p>
          <p className="text-sm">- 공제내역(사고금, 산재보험 등)은 최종 확정금액이 아니며</p>
          <p className="text-sm">추후 최종 확정금액 반영후 재공지 예정</p>
        </div>
      </div>
    </div>
  );
}
