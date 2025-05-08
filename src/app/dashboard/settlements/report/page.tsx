// src/app/dashboard/settlements/report/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getCourierById } from '@/lib/couriers';
import { getSettlements, getKurlySettlements, getCoupangSettlements } from '@/lib/settlements';
import { Settlement, KurlySettlement, CoupangSettlement } from '@/lib/types/settlement';
import Link from 'next/link';
import { FiArrowLeft, FiPrinter, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function SettlementReportPage() {
  const searchParams = useSearchParams();
  const courierId = searchParams.get('courier_id');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  
  const [isLoading, setIsLoading] = useState(true);
  const [courier, setCourier] = useState<any>(null);
  const [kurlySettlements, setKurlySettlements] = useState<KurlySettlement[]>([]);
  const [coupangSettlements, setCoupangSettlements] = useState<CoupangSettlement[]>([]);
  
  const [commissionRate, setCommissionRate] = useState(8);
  
  useEffect(() => {
    async function loadData() {
      if (!courierId || !startDate || !endDate) {
        toast.error('필수 파라미터가 누락되었습니다.');
        return;
      }
      
      try {
        // Load courier data
        const courierData = await getCourierById(courierId);
        setCourier(courierData);
        
        // Load settlements
        const [kurlyData, coupangData] = await Promise.all([
          getKurlySettlements(courierId, startDate, endDate),
          getCoupangSettlements(courierId, startDate, endDate)
        ]);
        
        setKurlySettlements(kurlyData);
        setCoupangSettlements(coupangData);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading report data:', error);
        toast.error('데이터를 불러오는데 실패했습니다.');
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [courierId, startDate, endDate]);
  
  function handlePrint() {
    window.print();
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (!courier) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-medium text-secondary-800 mb-2">기사 정보를 찾을 수 없습니다.</h3>
          <p className="text-secondary-600 mb-4">요청하신 기사 정보가 존재하지 않습니다.</p>
          <Link href="/dashboard/settlements/reports" className="btn-secondary">
            돌아가기
          </Link>
        </div>
      </div>
    );
  }
  
  // Calculate totals
  const kurlyTotal = kurlySettlements.reduce((sum, item) => sum + item.delivery_fee, 0);
  const coupangTotal = coupangSettlements.reduce((sum, item) => sum + item.delivery_fee, 0);
  const totalAmount = kurlyTotal + coupangTotal;
  
  // Calculate commissions and final amounts
  const commissionAmount = Math.round(totalAmount * (commissionRate / 100));
  const vatAmount = Math.round((totalAmount - commissionAmount) * 0.1);
  const finalAmount = totalAmount - commissionAmount + vatAmount;
  
  return (
    <div className="py-6">
      <div className="print:hidden flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link href="/dashboard/settlements/reports" className="mr-4 text-secondary-600 hover:text-secondary-800">
            <FiArrowLeft size={20} />
          </Link>
          <h2 className="text-2xl font-semibold text-secondary-800">정산서</h2>
        </div>
        <div className="flex space-x-2">
          <button onClick={handlePrint} className="btn-secondary">
            <FiPrinter className="mr-2" />
            인쇄
          </button>
          <button className="btn-primary">
            <FiDownload className="mr-2" />
            PDF 다운로드
          </button>
        </div>
      </div>
      
      <div className="card print:shadow-none print:border-none print:m-0 print:p-0">
        <div className="p-8 print:p-0">
          {/* 정산서 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold mb-1">[ {new Date(endDate || '').getFullYear()}년 {new Date(endDate || '').getMonth() + 1}월 ] 정산서</h1>
            <div className="border-t-2 border-b-2 border-black py-2 my-4">
              <div className="flex">
                <div className="w-24 text-right pr-2 font-semibold">이름 :</div>
                <div className="w-48 bg-yellow-100 px-2">{courier?.name || '알 수 없음'}</div>
              </div>
            </div>
          </div>
          
          {/* 정산 요약 */}
          <div className="mb-8">
            <div className="border border-gray-300">
              <div className="font-semibold bg-orange-100 p-2 border-b border-gray-300">정산 상세</div>
              <div className="divide-y divide-gray-300">
                <div className="flex">
                  <div className="w-1/4 text-center py-2 px-3 font-semibold border-r border-gray-300">구분</div>
                  <div className="w-3/4 text-right py-2 px-3 font-semibold">금액</div>
                </div>
                <div className="flex">
                  <div className="w-1/4 py-2 px-3 border-r border-gray-300">컨리 외</div>
                  <div className="w-3/4 text-right py-2 px-3">{kurlyTotal.toLocaleString()}</div>
                </div>
                <div className="flex">
                  <div className="w-1/4 py-2 px-3 border-r border-gray-300">쿠팡 외</div>
                  <div className="w-3/4 text-right py-2 px-3 bg-yellow-100">{coupangTotal.toLocaleString()}</div>
                </div>
                <div className="flex">
                  <div className="w-1/4 py-2 px-3 border-r border-gray-300 font-semibold">수수료<br/>(부가세 별도)</div>
                  <div className="w-3/4 text-right py-2 px-3">0</div>
                </div>
                <div className="flex">
                  <div className="w-1/4 py-2 px-3 border-r border-gray-300">추가정산</div>
                  <div className="w-3/4 text-right py-2 px-3">0</div>
                </div>
                <div className="flex">
                  <div className="w-1/4 py-2 px-3 text-center border-r border-gray-300 font-semibold">합계 (A)</div>
                  <div className="w-3/4 text-right py-2 px-3 font-semibold">{totalAmount.toLocaleString()}</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex">
                <div className="w-1/2 border border-gray-300">
                  <div className="flex">
                    <div className="w-1/2 py-2 px-3 text-center font-semibold border-r border-gray-300">공제액 (수수료 * 8%) (B)</div>
                    <div className="w-1/2 text-right py-2 px-3 font-semibold">{commissionAmount.toLocaleString()}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex mt-2">
                <div className="w-1/2 border border-gray-300 bg-yellow-100">
                  <div className="flex">
                    <div className="w-1/2 py-2 px-3 text-center font-semibold border-r border-gray-300">실급정산서<br/>발행금액</div>
                    <div className="w-1/2 text-right py-2 px-3 font-semibold">{(totalAmount - commissionAmount).toLocaleString()}</div>
                  </div>
                  <div className="flex border-t border-gray-300">
                    <div className="w-1/2 py-2 px-3 text-center border-r border-gray-300">부가세</div>
                    <div className="w-1/2 text-right py-2 px-3">{vatAmount.toLocaleString()}</div>
                  </div>
                  <div className="flex border-t border-gray-300">
                    <div className="w-1/2 py-2 px-3 text-center font-semibold border-r border-gray-300">합계 (C)</div>
                    <div className="w-1/2 text-right py-2 px-3 font-semibold">{finalAmount.toLocaleString()}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex mt-4">
                <div className="w-full border border-gray-300">
                  <div className="flex">
                    <div className="w-1/2 py-2 px-3 font-semibold border-r border-gray-300">실 지급액 (C-D)</div>
                    <div className="w-1/2 text-right py-2 px-3 font-semibold bg-yellow-100">{finalAmount.toLocaleString()}</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 border border-gray-300">
                <div className="font-semibold bg-gray-100 p-2 border-b border-gray-300">공제내역</div>
                <div className="divide-y divide-gray-300">
                  <div className="flex">
                    <div className="w-1/4 py-2 px-3 border-r border-gray-300">사고금</div>
                    <div className="w-3/4 text-right py-2 px-3">0</div>
                  </div>
                  <div className="flex">
                    <div className="w-1/4 py-2 px-3 border-r border-gray-300">기름 외</div>
                    <div className="w-3/4 text-right py-2 px-3">0</div>
                  </div>
                  <div className="flex">
                    <div className="w-1/4 py-2 px-3 border-r border-gray-300">3.3%공제</div>
                    <div className="w-3/4 text-right py-2 px-3">0</div>
                  </div>
                  <div className="flex">
                    <div className="w-1/4 py-2 px-3 border-r border-gray-300">산재보험</div>
                    <div className="w-3/4 text-right py-2 px-3">0</div>
                  </div>
                  <div className="flex">
                    <div className="w-1/4 py-2 px-3 border-r border-gray-300">기타</div>
                    <div className="w-3/4 text-right py-2 px-3">0</div>
                  </div>
                  <div className="flex">
                    <div className="w-1/4 py-2 px-3 text-center font-semibold border-r border-gray-300">합계 (D)</div>
                    <div className="w-3/4 text-right py-2 px-3 font-semibold">0</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 정산 항목 상세 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 마켓컬리 포함 세부내역 */}
            <div className="border border-gray-300">
              <div className="text-center bg-orange-200 p-2 font-semibold border-b border-gray-300">[ 컨리 포함 세부내역 ]</div>
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-50 border-b border-gray-300">
                    <th className="py-1 px-2 text-center border-r border-gray-300">날짜</th>
                    <th className="py-1 px-2 text-center border-r border-gray-300">조</th>
                    <th className="py-1 px-2 text-center border-r border-gray-300">차수</th>
                    <th className="py-1 px-2 text-center">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {kurlySettlements.length > 0 ? (
                    kurlySettlements.map((settlement) => (
                      <tr key={settlement.id} className="border-t border-gray-300">
                        <td className="py-1 px-2 text-center border-r border-gray-300">
                          {new Date(settlement.delivery_date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                        </td>
                        <td className="py-1 px-2 text-center border-r border-gray-300">
                          {settlement.shift || '-'}
                        </td>
                        <td className="py-1 px-2 text-center border-r border-gray-300">
                          {settlement.sequence || '-'}
                        </td>
                        <td className="py-1 px-2 text-right">
                          {settlement.delivery_fee.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-1 px-2 text-center border-t border-gray-300">
                        - 0
                      </td>
                    </tr>
                  )}
                  
                  {kurlySettlements.length > 0 && (
                    <tr className="bg-blue-50 border-t border-gray-300">
                      <td colSpan={3} className="py-1 px-2 text-center font-semibold border-r border-gray-300">
                        합계
                      </td>
                      <td className="py-1 px-2 text-right font-semibold">
                        {kurlyTotal.toLocaleString()}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* 쿠팡 포함 세부내역 */}
            <div className="border border-gray-300">
              <div className="text-center bg-orange-200 p-2 font-semibold border-b border-gray-300">[ 쿠팡 포함 세부내역 ]</div>
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-50 border-b border-gray-300">
                    <th className="py-1 px-2 text-center border-r border-gray-300">날짜</th>
                    <th className="py-1 px-2 text-center border-r border-gray-300">배송구역</th>
                    <th className="py-1 px-2 text-center border-r border-gray-300">건수</th>
                    <th className="py-1 px-2 text-center border-r border-gray-300">단가</th>
                    <th className="py-1 px-2 text-center">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {coupangSettlements.length > 0 ? (
                    coupangSettlements.map((settlement) => (
                      <tr key={settlement.id} className="border-t border-gray-300">
                        <td className="py-1 px-2 text-center border-r border-gray-300">
                          {new Date(settlement.delivery_date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                        </td>
                        <td className="py-1 px-2 text-center border-r border-gray-300">
                          {settlement.delivery_code || '-'}
                        </td>
                        <td className="py-1 px-2 text-center border-r border-gray-300">
                          {settlement.delivery_count || settlement.weight || '-'}
                        </td>
                        <td className="py-1 px-2 text-center border-r border-gray-300">
                          {settlement.unit_price ? settlement.unit_price.toLocaleString() : '-'}
                        </td>
                        <td className="py-1 px-2 text-right">
                          {settlement.delivery_fee.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-1 px-2 text-center border-t border-gray-300">
                        정산 항목이 없습니다.
                      </td>
                    </tr>
                  )}
                  
                  {coupangSettlements.length > 0 && (
                    <tr className="bg-blue-50 border-t border-gray-300">
                      <td colSpan={4} className="py-1 px-2 text-center font-semibold border-r border-gray-300">
                        합계
                      </td>
                      <td className="py-1 px-2 text-right font-semibold">
                        {coupangTotal.toLocaleString()}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* 주의사항 */}
          <div className="mt-8">
            <div className="text-sm">
              <div className="font-semibold">※ 공지사항 ※</div>
              <div>- 공제내역(사고건, 산재보험 등)은 정산금액에서 자동공제됩니다.</div>
              <div>- 주차 최종 정산금액 변경은 제공후 재공지 예정</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}