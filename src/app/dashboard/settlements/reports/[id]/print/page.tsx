'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSettlementReportWithCouriers, getCourierReportDetails } from '@/lib/settlement-reports';
import { format } from 'date-fns';

interface PrintReportPageProps {
  params: {
    id: string;
  };
}

export default function PrintReportPage({ params }: PrintReportPageProps) {
  const router = useRouter();
  const [report, setReport] = useState<any | null>(null);
  const [courierReports, setCourierReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReportData() {
      try {
        setIsLoading(true);
        // 보고서 기본 정보 로드
        const reportData = await getSettlementReportWithCouriers(params.id);
        setReport(reportData);
        
        // 각 기사별 상세 정보 로드
        const courierDetailsPromises = reportData.couriers.map((courier: any) => 
          getCourierReportDetails(reportData.id, courier.courier_id)
        );
        
        const courierDetailsResults = await Promise.all(courierDetailsPromises);
        setCourierReports(courierDetailsResults);
        
        // 인쇄 다이얼로그 자동으로 열기 (데이터 로드 후)
        setTimeout(() => {
          window.print();
        }, 1000);
      } catch (err) {
        console.error('Error loading report data for printing:', err);
        setError('정산 보고서 데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    loadReportData();
  }, [params.id]);

  // 뒤로 가기 - 인쇄 다이얼로그 닫을 때 사용
  const handleBack = () => {
    router.push(`/dashboard/settlements/reports/${params.id}`);
  };

  const getDateRangeLabel = () => {
    if (!report) return '';
    return `${format(new Date(report.start_date), 'yyyy년 MM월 dd일')} ~ ${format(new Date(report.end_date), 'yyyy년 MM월 dd일')}`;
  };

  // 정산 항목 유형별 렌더링 함수
  const renderSettlementDetails = (item: any) => {
    if (!item || !item.details) return null;
    
    const { details } = item;
    
    switch (item.settlement_type) {
      case 'kurly':
        return (
          <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">업체명</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">센터</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">지원/대처</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">금액(만원)</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">정산금액</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {details.details.kurly_settlements.map((detail: any) => (
                  <tr key={detail.id}>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{detail.company_name}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{detail.center || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{detail.support_type || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{detail.amount?.toLocaleString() || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{detail.settlement_amount?.toLocaleString() || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'coupang':
        return (
          <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">건수</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">단가</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">부가세</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">합계</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {details.details.coupang_settlements.map((detail: any) => (
                  <tr key={detail.id}>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{detail.courier_name}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{detail.delivery_count?.toLocaleString() || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{detail.unit_price?.toLocaleString() || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{detail.vat?.toLocaleString() || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{detail.total_amount?.toLocaleString() || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'general':
        // General settlement has a different structure
        const generalDetails = details.details.general_settlements;
        
        if (!generalDetails || generalDetails.length === 0) {
          return <div className="mt-2">기타 정산 내역이 없습니다.</div>;
        }
        
        // Extract columns and rows
        const rowMap = new Map<number, any>();
        const columns = new Set<string>();
        
        generalDetails.forEach((detail: any) => {
          columns.add(detail.column_name);
          
          if (!rowMap.has(detail.row_order)) {
            rowMap.set(detail.row_order, {});
          }
          
          const row = rowMap.get(detail.row_order);
          if (row) {
            row[detail.column_name] = detail.column_value || '';
          }
        });
        
        const columnArray = Array.from(columns);
        const rows = Array.from(rowMap.values());
        
        return (
          <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columnArray.map((column, index) => (
                    <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columnArray.map((column, colIndex) => (
                      <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        {row[column] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      default:
        return <div className="mt-2">상세 정보를 찾을 수 없습니다.</div>;
    }
  };

  return (
    <div className="py-6 max-w-5xl mx-auto print:py-0 print:max-w-none print:mx-0">
      {/* 인쇄 시 숨김처리 되는 버튼 */}
      <div className="print:hidden mb-8 flex justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          뒤로 가기
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
          </svg>
          인쇄
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-10 print:hidden">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-500">정산 보고서를 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 print:hidden">
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
      ) : report ? (
        <div className="space-y-8">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h1 className="text-3xl font-bold text-center text-gray-900">{report.title}</h1>
            <p className="text-lg text-center text-gray-600 mt-2">{getDateRangeLabel()}</p>
          </div>

          <div className="space-y-2 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">생성일자:</span> {format(new Date(report.created_at), 'yyyy년 MM월 dd일')}
              </div>
              <div>
                <span className="font-medium">기사 수:</span> {report.couriers.length}명
              </div>
              <div>
                <span className="font-medium">전체 금액:</span> {report.couriers.reduce((sum: number, courier: any) => sum + parseFloat(courier.total_amount.toString()), 0).toLocaleString()}원
              </div>
            </div>
          </div>

          <div className="space-y-12">
            {courierReports.map((courierReport) => (
              <div key={courierReport.courier.id} className="break-inside-avoid mb-8">
                <div className="border-t border-gray-300 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{courierReport.courier.courier_name}</h2>
                    <p className="text-lg font-medium">총액: {parseFloat(courierReport.courier.total_amount.toString()).toLocaleString()}원</p>
                  </div>

                  {courierReport.items.length === 0 ? (
                    <p className="text-gray-500">해당 기간에 정산 내역이 없습니다.</p>
                  ) : (
                    <div className="space-y-6">
                      {courierReport.items.map((item: any) => (
                        <div key={item.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium">
                                {format(new Date(item.details.settlement.settlement_date), 'yyyy-MM-dd')}
                                <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  {item.settlement_type === 'kurly' ? '컬리' : 
                                  item.settlement_type === 'coupang' ? '쿠팡' : '기타'}
                                </span>
                              </p>
                            </div>
                            <p className="text-sm font-medium">{parseFloat(item.amount.toString()).toLocaleString()}원</p>
                          </div>

                          {renderSettlementDetails(item)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-300 pt-4 text-center text-sm text-gray-500 mb-8 print:mt-8">
            <p>이 정산 보고서는 시스템에서 자동으로 생성되었습니다.</p>
            <p>{format(new Date(), 'yyyy-MM-dd HH:mm')} 출력</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 print:hidden">
          <p className="text-gray-500">정산 보고서를 찾을 수 없습니다.</p>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              뒤로 가기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
