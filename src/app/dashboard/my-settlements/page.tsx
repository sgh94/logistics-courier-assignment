'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  getSettlements, 
  getSettlementWithDetails,
  deleteSettlement 
} from '@/lib/settlements';
import { Settlement, SettlementWithDetails } from '@/lib/types/settlement';
import { getCurrentUser } from '@/lib/auth';
import { format } from 'date-fns';

export default function MySettlementsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsVisible, setDetailsVisible] = useState<Record<string, boolean>>({});
  const [settlementDetails, setSettlementDetails] = useState<Record<string, SettlementWithDetails>>({});

  // 데이터 로드
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        
        // 현재 사용자 정보 가져오기
        const { user: currentUser } = await getCurrentUser();
        setUser(currentUser);
        
        if (!currentUser) {
          setError('로그인이 필요합니다.');
          setIsLoading(false);
          return;
        }
        
        const data = await getSettlements(currentUser.id);
        setSettlements(data);
      } catch (err) {
        console.error('Error loading settlements:', err);
        setError('정산 데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // 세부 정보 토글
  const toggleDetails = async (settlementId: string) => {
    // 이미 데이터가 있는지 확인
    if (!settlementDetails[settlementId]) {
      try {
        const details = await getSettlementWithDetails(settlementId);
        setSettlementDetails(prev => ({
          ...prev,
          [settlementId]: details
        }));
      } catch (err) {
        console.error('Error loading settlement details:', err);
        setError('정산 세부 정보를 불러오는데 실패했습니다.');
        return;
      }
    }

    // 상태 토글
    setDetailsVisible(prev => ({
      ...prev,
      [settlementId]: !prev[settlementId]
    }));
  };

  // 정산 삭제
  const handleDelete = async (settlementId: string) => {
    if (!confirm('정말로 이 정산 항목을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteSettlement(settlementId);
      
      // 삭제 후 목록에서 제거
      setSettlements(prev => prev.filter(s => s.id !== settlementId));
      
      // 세부 정보도 제거
      if (settlementDetails[settlementId]) {
        const { [settlementId]: _, ...rest } = settlementDetails;
        setSettlementDetails(rest);
      }
      
      if (detailsVisible[settlementId]) {
        const { [settlementId]: _, ...rest } = detailsVisible;
        setDetailsVisible(rest);
      }
    } catch (err) {
      console.error('Error deleting settlement:', err);
      setError('정산 항목 삭제에 실패했습니다.');
    }
  };

  // 정산 항목 타입 레이블
  const getSettlementTypeLabel = (type: string) => {
    switch (type) {
      case 'kurly': return '컬리';
      case 'coupang': return '쿠팡';
      case 'general': return '기타';
      default: return type;
    }
  };

  // 정산 항목 렌더링
  const renderSettlementDetails = (settlement: Settlement) => {
    if (!detailsVisible[settlement.id] || !settlementDetails[settlement.id]) {
      return null;
    }

    const details = settlementDetails[settlement.id];
    
    switch (settlement.settlement_type) {
      case 'kurly':
        return (
          <div className="mt-4 bg-gray-50 p-4 rounded-md">
            <h4 className="text-lg font-medium text-gray-900 mb-2">컬리 정산 세부 정보</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">업체명</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">센터</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">지역</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">지원/대처</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">금액(만원)</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">딜리건수</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">정산금액</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">공급가</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(details.details as any[]).map((item, index) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 whitespace-nowrap">{item.company_name}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{item.center || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{item.region || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{item.support_type || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{item.amount?.toLocaleString() || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{item.delivery_count?.toLocaleString() || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{item.settlement_amount?.toLocaleString() || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{item.supply_price?.toLocaleString() || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case 'coupang':
        return (
          <div className="mt-4 bg-gray-50 p-4 rounded-md">
            <h4 className="text-lg font-medium text-gray-900 mb-2">쿠팡 정산 세부 정보</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주/야</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">배송구역</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">건수</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">단가</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">공급가</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">부가세</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">합계</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수익금</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(details.details as any[]).map((item, index) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 whitespace-nowrap">{item.courier_name}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{item.day_or_night === 'day' ? '주간' : item.day_or_night === 'night' ? '야간' : '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{item.delivery_area || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{item.delivery_count?.toLocaleString() || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{item.unit_price?.toLocaleString() || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{item.supply_price?.toLocaleString() || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{item.vat?.toLocaleString() || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{item.total_amount?.toLocaleString() || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{item.profit?.toLocaleString() || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case 'general':
        const generalData = details.details as { columns: string[], rows: any[] };
        return (
          <div className="mt-4 bg-gray-50 p-4 rounded-md">
            <h4 className="text-lg font-medium text-gray-900 mb-2">기타 정산 세부 정보</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {generalData.columns.map((column, index) => (
                      <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {generalData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {generalData.columns.map((column, colIndex) => (
                        <td key={colIndex} className="px-4 py-2 whitespace-nowrap">
                          {row[column] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      default:
        return <div className="mt-4 p-4 bg-gray-50 rounded-md">상세 정보가 없습니다.</div>;
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">내 정산 내역</h1>
          <Link
            href="/dashboard/my-settlements/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            정산 입력하기
          </Link>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          {isLoading ? (
            <div className="text-center py-10">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-2 text-gray-500">정산 내역을 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : settlements.length === 0 ? (
            <div className="text-center py-20">
              <h3 className="mt-2 text-lg font-medium text-gray-900">등록된 정산 내역이 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">정산 항목을 입력해주세요.</p>
              <div className="mt-6">
                <Link
                  href="/dashboard/my-settlements/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  정산 입력하기
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {settlements.map((settlement) => (
                  <li key={settlement.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            {format(new Date(settlement.settlement_date), 'yyyy년 MM월 dd일')}
                          </p>
                          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            {getSettlementTypeLabel(settlement.settlement_type)}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleDetails(settlement.id)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            {detailsVisible[settlement.id] ? '상세 숨기기' : '상세 보기'}
                          </button>
                          <button
                            onClick={() => handleDelete(settlement.id)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            {format(new Date(settlement.created_at), 'yyyy-MM-dd HH:mm')} 등록
                          </p>
                        </div>
                      </div>
                      {renderSettlementDetails(settlement)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}