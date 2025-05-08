'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { 
  createSettlementReport, 
  addCourierToReport, 
  addSettlementItemToReport, 
  getAvailableSettlementsForReport 
} from '@/lib/settlement-reports';
import { getSettlementWithDetails } from '@/lib/settlements';
import { CreateSettlementReportDTO } from '@/lib/types/settlement-report';
import { SettlementWithDetails } from '@/lib/types/settlement';
import { getCouriers } from '@/lib/couriers';

interface FormData extends CreateSettlementReportDTO {
  selectedCouriers: string[];
}

interface Courier {
  id: string;
  name: string;
  phone: string;
}

export default function CreateSettlementReportPage() {
  const router = useRouter();
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [availableSettlements, setAvailableSettlements] = useState<any[]>([]);
  const [selectedCouriersData, setSelectedCouriersData] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      title: `${format(new Date(), 'yyyy년 MM월')} 정산 보고서`,
      start_date: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      end_date: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
      selectedCouriers: []
    }
  });

  const selectedCouriers = watch('selectedCouriers', []);
  const startDate = watch('start_date');
  const endDate = watch('end_date');

  // 기사 목록 로드
  useEffect(() => {
    async function loadCouriers() {
      try {
        const data = await getCouriers();
        setCouriers(data);
      } catch (err) {
        console.error('Error loading couriers:', err);
        setError('기사 목록을 불러오는데 실패했습니다.');
      }
    }

    loadCouriers();
  }, []);

  // 선택된 기사들의 정산 내역 로드
  useEffect(() => {
    if (step !== 2 || !startDate || !endDate || selectedCouriers.length === 0) return;

    async function loadSettlements() {
      setIsLoading(true);
      try {
        const data = await getAvailableSettlementsForReport(startDate, endDate);
        
        // Filter settlements by selected couriers
        const filteredSettlements = data.filter((settlement: any) => 
          selectedCouriers.includes(settlement.courier_id)
        );
        
        setAvailableSettlements(filteredSettlements);
        
        // Group settlements by courier
        const courierSettlements: Record<string, any[]> = {};
        
        for (const settlement of filteredSettlements) {
          if (!courierSettlements[settlement.courier_id]) {
            courierSettlements[settlement.courier_id] = [];
          }
          
          // Get settlement details
          const details = await getSettlementWithDetails(settlement.id);
          courierSettlements[settlement.courier_id].push(details);
        }
        
        setSelectedCouriersData(courierSettlements);
      } catch (err) {
        console.error('Error loading settlements:', err);
        setError('정산 내역을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    loadSettlements();
  }, [step, selectedCouriers, startDate, endDate]);

  // 보고서 기본 정보 저장
  const handleStepOneSubmit = (data: FormData) => {
    if (data.selectedCouriers.length === 0) {
      setError('최소 한 명 이상의 기사를 선택해야 합니다.');
      return;
    }
    
    setError(null);
    setStep(2);
  };

  // 최종 보고서 생성
  const handleStepTwoSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 1. 보고서 생성
      const report = await createSettlementReport({
        title: data.title,
        start_date: data.start_date,
        end_date: data.end_date
      });
      
      // 2. 선택된 기사들 추가
      const courierReports: Record<string, string> = {};
      
      for (const courierId of data.selectedCouriers) {
        const courierReport = await addCourierToReport({
          report_id: report.id,
          courier_id: courierId
        });
        
        courierReports[courierId] = courierReport.id;
      }
      
      // 3. 각 기사별 정산 항목 추가
      for (const courierId in selectedCouriersData) {
        const settlements = selectedCouriersData[courierId];
        const courierReportId = courierReports[courierId];
        
        if (!courierReportId) continue;
        
        for (const settlement of settlements) {
          // 정산 항목 유형에 따라 각각 처리
          let amount = 0;
          
          switch (settlement.settlement.settlement_type) {
            case 'kurly':
              {
                const kurlyDetails = settlement.details as any[];
                amount = kurlyDetails.reduce((sum, item) => sum + (item.settlement_amount || 0), 0);
              }
              break;
              
            case 'coupang':
              {
                const coupangDetails = settlement.details as any[];
                amount = coupangDetails.reduce((sum, item) => sum + (item.total_amount || 0), 0);
              }
              break;
              
            case 'general':
              {
                const generalDetails = settlement.details as { columns: string[], rows: any[] };
                const amountIndex = generalDetails.columns.findIndex(col => col === '금액');
                
                if (amountIndex >= 0) {
                  amount = generalDetails.rows.reduce((sum, row) => {
                    const amountValue = row[generalDetails.columns[amountIndex]];
                    return sum + (parseFloat(amountValue) || 0);
                  }, 0);
                }
              }
              break;
          }
          
          // 세부 항목 ID (첫 번째 항목 사용)
          let itemId = '';
          if (Array.isArray(settlement.details)) {
            itemId = settlement.details.length > 0 ? settlement.details[0].id : '';
          } else if (settlement.details.rows && settlement.details.rows.length > 0) {
            itemId = 'general-row-0'; // General settlement uses row index
          }
          
          await addSettlementItemToReport({
            courier_settlement_report_id: courierReportId,
            settlement_id: settlement.settlement.id,
            settlement_type: settlement.settlement.settlement_type,
            item_id: itemId,
            amount
          });
        }
      }
      
      setSuccessMessage('정산 보고서가 성공적으로 생성되었습니다.');
      
      // 잠시 후 보고서 목록 페이지로 이동
      setTimeout(() => {
        router.push('/dashboard/settlements/reports');
      }, 2000);
    } catch (err) {
      console.error('Error creating settlement report:', err);
      setError('정산 보고서 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleCancel = () => {
    router.push('/dashboard/settlements/reports');
  };

  // 선택한 모든 기사
  const handleSelectAllCouriers = () => {
    setValue('selectedCouriers', couriers.map(courier => courier.id));
  };

  // 기사 선택 해제
  const handleDeselectAllCouriers = () => {
    setValue('selectedCouriers', []);
  };

  // 총액 계산
  const calculateTotalAmount = (courierId: string) => {
    const settlements = selectedCouriersData[courierId] || [];
    let total = 0;
    
    for (const settlement of settlements) {
      switch (settlement.settlement.settlement_type) {
        case 'kurly':
          {
            const kurlyDetails = settlement.details as any[];
            total += kurlyDetails.reduce((sum, item) => sum + (item.settlement_amount || 0), 0);
          }
          break;
          
        case 'coupang':
          {
            const coupangDetails = settlement.details as any[];
            total += coupangDetails.reduce((sum, item) => sum + (item.total_amount || 0), 0);
          }
          break;
          
        case 'general':
          {
            const generalDetails = settlement.details as { columns: string[], rows: any[] };
            const amountIndex = generalDetails.columns.findIndex(col => col === '금액');
            
            if (amountIndex >= 0) {
              total += generalDetails.rows.reduce((sum, row) => {
                const amountValue = row[generalDetails.columns[amountIndex]];
                return sum + (parseFloat(amountValue) || 0);
              }, 0);
            }
          }
          break;
      }
    }
    
    return total;
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">정산 보고서 생성</h1>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          {successMessage && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
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
          )}

          <div className="mb-8">
            <nav className="flex items-center justify-center" aria-label="Progress">
              <ol className="space-y-6 md:flex md:space-y-0">
                <li className="md:flex-1">
                  <div className={`group pl-4 py-2 flex flex-col border-l-4 ${step >= 1 ? 'border-blue-600' : 'border-gray-200'} md:pl-0 md:pt-4 md:pb-0 md:border-l-0 md:border-t-4`}>
                    <span className={`text-xs font-semibold tracking-wide uppercase ${step >= 1 ? 'text-blue-600' : 'text-gray-500'}`}>
                      1단계
                    </span>
                    <span className="text-sm font-medium">기본 정보 입력</span>
                  </div>
                </li>

                <li className="md:flex-1">
                  <div className={`group pl-4 py-2 flex flex-col border-l-4 ${step >= 2 ? 'border-blue-600' : 'border-gray-200'} md:pl-0 md:pt-4 md:pb-0 md:border-l-0 md:border-t-4`}>
                    <span className={`text-xs font-semibold tracking-wide uppercase ${step >= 2 ? 'text-blue-600' : 'text-gray-500'}`}>
                      2단계
                    </span>
                    <span className="text-sm font-medium">정산 내역 확인</span>
                  </div>
                </li>
              </ol>
            </nav>
          </div>

          {step === 1 && (
            <form onSubmit={handleSubmit(handleStepOneSubmit)} className="space-y-8">
              <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                <div className="md:grid md:grid-cols-3 md:gap-6">
                  <div className="md:col-span-1">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">보고서 정보</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      보고서 제목과 기간을 설정하세요.
                    </p>
                  </div>
                  <div className="mt-5 md:mt-0 md:col-span-2">
                    <div className="grid grid-cols-6 gap-6">
                      <div className="col-span-6">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                          보고서 제목
                        </label>
                        <input
                          type="text"
                          id="title"
                          {...register('title', { required: '제목을 입력해주세요' })}
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                        {errors.title && (
                          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                        )}
                      </div>

                      <div className="col-span-3">
                        <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                          시작일
                        </label>
                        <input
                          type="date"
                          id="start_date"
                          {...register('start_date', { required: '시작일을 선택해주세요' })}
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                        {errors.start_date && (
                          <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
                        )}
                      </div>

                      <div className="col-span-3">
                        <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                          종료일
                        </label>
                        <input
                          type="date"
                          id="end_date"
                          {...register('end_date', { required: '종료일을 선택해주세요' })}
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                        {errors.end_date && (
                          <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                <div className="md:grid md:grid-cols-3 md:gap-6">
                  <div className="md:col-span-1">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">기사 선택</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      정산 보고서에 포함할 기사를 선택하세요.
                    </p>
                    <div className="mt-4 space-y-2">
                      <button
                        type="button"
                        onClick={handleSelectAllCouriers}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        전체 선택
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAllCouriers}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        전체 해제
                      </button>
                    </div>
                  </div>
                  <div className="mt-5 md:mt-0 md:col-span-2">
                    <fieldset>
                      <legend className="sr-only">기사 선택</legend>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {couriers.map((courier) => (
                          <div key={courier.id} className="relative flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id={`courier-${courier.id}`}
                                type="checkbox"
                                value={courier.id}
                                {...register('selectedCouriers')}
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor={`courier-${courier.id}`} className="font-medium text-gray-700">
                                {courier.name}
                              </label>
                              <p className="text-gray-500">{courier.phone}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </fieldset>
                    {selectedCouriers.length === 0 && (
                      <p className="mt-2 text-sm text-red-600">최소 한 명 이상의 기사를 선택해야 합니다.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  다음
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">정산 내역 확인</h3>
                
                {isLoading ? (
                  <div className="py-10 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                    <p className="mt-2 text-gray-500">정산 내역을 불러오는 중...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {selectedCouriers.map((courierId) => {
                      const courier = couriers.find(c => c.id === courierId);
                      const settlements = selectedCouriersData[courierId] || [];
                      const totalAmount = calculateTotalAmount(courierId);
                      
                      if (!courier) return null;
                      
                      return (
                        <div key={courierId} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-medium text-gray-900">{courier.name}</h4>
                            <span className="text-lg font-medium text-blue-600">
                              총액: {totalAmount.toLocaleString()}원
                            </span>
                          </div>
                          
                          {settlements.length === 0 ? (
                            <p className="text-gray-500">해당 기간에 정산 내역이 없습니다.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      날짜
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      유형
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      세부 항목 수
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      금액
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {settlements.map((settlement) => {
                                    const { settlement: settlementData, details } = settlement;
                                    let itemCount = 0;
                                    let amount = 0;
                                    
                                    if (Array.isArray(details)) {
                                      itemCount = details.length;
                                      
                                      if (settlementData.settlement_type === 'kurly') {
                                        amount = details.reduce((sum, item: any) => sum + (item.settlement_amount || 0), 0);
                                      } else if (settlementData.settlement_type === 'coupang') {
                                        amount = details.reduce((sum, item: any) => sum + (item.total_amount || 0), 0);
                                      }
                                    } else if (details.rows) {
                                      itemCount = details.rows.length;
                                      
                                      const amountIndex = details.columns.findIndex(col => col === '금액');
                                      if (amountIndex >= 0) {
                                        amount = details.rows.reduce((sum, row) => {
                                          const amountValue = row[details.columns[amountIndex]];
                                          return sum + (parseFloat(amountValue) || 0);
                                        }, 0);
                                      }
                                    }
                                    
                                    return (
                                      <tr key={settlementData.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                          {format(new Date(settlementData.settlement_date), 'yyyy-MM-dd')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                          {settlementData.settlement_type === 'kurly' ? '컬리' : 
                                          settlementData.settlement_type === 'coupang' ? '쿠팡' : '기타'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                          {itemCount}개
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                          {amount.toLocaleString()}원
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {Object.keys(selectedCouriersData).length === 0 && (
                      <div className="text-center py-10">
                        <p className="text-gray-500">선택된 기간 내에 정산 내역이 없습니다.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-between space-x-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  이전
                </button>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit(handleStepTwoSubmit)}
                    disabled={isSubmitting || isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {isSubmitting ? '처리 중...' : '보고서 생성'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
