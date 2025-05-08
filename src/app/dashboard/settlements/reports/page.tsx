'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  getSettlementReportsList, 
  deleteSettlementReport 
} from '@/lib/settlement-reports';
import { SettlementReportListItem } from '@/lib/types/settlement-report';
import { format } from 'date-fns';

export default function SettlementReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<SettlementReportListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReports() {
      try {
        setIsLoading(true);
        const data = await getSettlementReportsList();
        setReports(data);
      } catch (err) {
        console.error('Error loading settlement reports:', err);
        setError('정산 보고서를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    loadReports();
  }, []);

  const handleDelete = async (reportId: string) => {
    if (!confirm('정말로 이 정산 보고서를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteSettlementReport(reportId);
      
      // 삭제 후 목록에서 제거
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      console.error('Error deleting settlement report:', err);
      setError('정산 보고서 삭제에 실패했습니다.');
    }
  };

  const getDateRangeLabel = (report: SettlementReportListItem) => {
    return `${format(new Date(report.start_date), 'yyyy-MM-dd')} ~ ${format(new Date(report.end_date), 'yyyy-MM-dd')}`;
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">정산 보고서</h1>
          <Link
            href="/dashboard/settlements/reports/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            보고서 생성
          </Link>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          {isLoading ? (
            <div className="text-center py-10">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-2 text-gray-500">정산 보고서를 불러오는 중...</p>
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
          ) : reports.length === 0 ? (
            <div className="text-center py-20">
              <h3 className="mt-2 text-lg font-medium text-gray-900">등록된 정산 보고서가 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">새 정산 보고서를 생성해주세요.</p>
              <div className="mt-6">
                <Link
                  href="/dashboard/settlements/reports/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  보고서 생성
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden bg-white shadow sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <li key={report.id}>
                    <div className="block hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <p className="truncate text-sm font-medium text-blue-600">{report.title}</p>
                            <p className="truncate text-sm text-gray-500">
                              {getDateRangeLabel(report)}
                            </p>
                          </div>
                          <div className="flex flex-shrink-0 space-x-2">
                            <Link
                              href={`/dashboard/settlements/reports/${report.id}`}
                              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              상세 보기
                            </Link>
                            <button
                              onClick={() => handleDelete(report.id)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex sm:space-x-4">
                            <div className="flex items-center text-sm text-gray-500">
                              <svg className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.25 13c.35 0 .683.064.983.18A3.726 3.726 0 0113.25 13c.376 0 .74.057 1.086.17.29-.098.63-.17.989-.17.39 0 .753.078 1.086.17A3.726 3.726 0 0118.25 13c.35 0 .683.064.983.18A3.13 3.13 0 0019.75 13v-2.614c0-.568-.244-1.083-.65-1.414a3.645 3.645 0 01-1.015-.933 4.748 4.748 0 01-1.25-3.174 4.748 4.748 0 011.25-3.174 3.645 3.645 0 011.015-.933.75.75 0 00.4-.657v-.328a.75.75 0 00-.75-.75H5a.75.75 0 00-.75.75v.328a.75.75 0 00.4.657c.392.183.745.533 1.015.933a4.748 4.748 0 011.25 3.174 4.748 4.748 0 01-1.25 3.174 3.646 3.646 0 01-1.015.933.75.75 0 00-.4.657v2.614c0 .568.244 1.083.65 1.414.399.313.764.645 1.015.933a4.748 4.748 0 011.25 3.174 4.748 4.748 0 01-1.25 3.174 3.646 3.646 0 01-1.015.933.75.75 0 00-.4.657v.328a.75.75 0 00.75.75h14.5a.75.75 0 00.75-.75v-.328a.75.75 0 00-.4-.657 3.646 3.646 0 01-1.015-.933 4.747 4.747 0 01-1.25-3.174 4.747 4.747 0 011.25-3.174 3.646 3.646 0 011.015-.933.75.75 0 00.4-.657zM9.75 10.818c0 1.392.572 2.74 1.59 3.714.51.49 1.01.991 1.58 1.481.348-.308.698-.617 1.059-.929a5.735 5.735 0 001.59-3.714 5.736 5.736 0 00-1.59-3.714 11.94 11.94 0 01-1.06-.928c-.572.49-1.07.99-1.58 1.48a5.736 5.736 0 00-1.59 3.714z" />
                              </svg>
                              기사 {report.courier_count}명
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <svg className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                              </svg>
                              총액: {report.total_amount.toLocaleString()}원
                            </div>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <svg className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                            </svg>
                            {format(new Date(report.created_at), 'yyyy-MM-dd HH:mm')} 생성
                          </div>
                        </div>
                      </div>
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
