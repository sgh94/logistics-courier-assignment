'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { 
  CreateKurlySettlementDTO, 
  CreateCoupangSettlementDTO,
  CreateGeneralSettlementDTO 
} from '@/lib/types/settlement';
import { createSettlement, createKurlySettlement, createCoupangSettlement, createGeneralSettlement } from '@/lib/settlements';
import { format } from 'date-fns';
import { useUser } from '@/lib/auth';

type SettlementType = 'kurly' | 'coupang' | 'general';

export default function MyCourierSettlementPage() {
  const router = useRouter();
  const { user } = useUser();
  const [settlementType, setSettlementType] = useState<SettlementType>('kurly');
  const [generalColumns, setGeneralColumns] = useState<string[]>(['날짜', '항목', '금액', '비고']);
  const [generalRows, setGeneralRows] = useState<any[]>([{ '날짜': format(new Date(), 'yyyy-MM-dd'), '항목': '', '금액': '', '비고': '' }]);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Form for Kurly settlement
  const { 
    register: registerKurly, 
    handleSubmit: handleSubmitKurly, 
    formState: { errors: errorsKurly, isSubmitting: isSubmittingKurly } 
  } = useForm<CreateKurlySettlementDTO>({
    defaultValues: {
      company_name: '',
      settlement_date: format(new Date(), 'yyyy-MM-dd'),
      amount: 0,
      settlement_amount: 0,
      supply_price: 0
    }
  });

  // Form for Coupang settlement
  const { 
    register: registerCoupang, 
    handleSubmit: handleSubmitCoupang, 
    formState: { errors: errorsCoupang, isSubmitting: isSubmittingCoupang } 
  } = useForm<CreateCoupangSettlementDTO>({
    defaultValues: {
      settlement_date: format(new Date(), 'yyyy-MM-dd'),
      courier_name: user?.name || '',
      delivery_count: 0,
      unit_price: 0,
      supply_price: 0,
      vat: 0,
      total_amount: 0,
      profit: 0
    }
  });

  const handleKurlySubmit = async (data: CreateKurlySettlementDTO) => {
    try {
      setError('');
      setSuccessMessage('');
      
      // 기사 ID 추가
      const settlement = await createSettlement(
        data.settlement_date,
        'kurly',
        user?.id
      );
      
      await createKurlySettlement(settlement.id, data);
      setSuccessMessage('컬리 정산 항목이 성공적으로 생성되었습니다.');
      
      // 잠시 후 리스트 페이지로 이동
      setTimeout(() => {
        router.push('/dashboard/my-settlements');
      }, 2000);
    } catch (error) {
      console.error('Error creating kurly settlement:', error);
      setError('컬리 정산 항목 생성 중 오류가 발생했습니다.');
    }
  };

  const handleCoupangSubmit = async (data: CreateCoupangSettlementDTO) => {
    try {
      setError('');
      setSuccessMessage('');
      
      // 기사 ID 추가
      const settlement = await createSettlement(
        data.settlement_date,
        'coupang',
        user?.id
      );
      
      await createCoupangSettlement(settlement.id, data);
      setSuccessMessage('쿠팡 정산 항목이 성공적으로 생성되었습니다.');
      
      // 잠시 후 리스트 페이지로 이동
      setTimeout(() => {
        router.push('/dashboard/my-settlements');
      }, 2000);
    } catch (error) {
      console.error('Error creating coupang settlement:', error);
      setError('쿠팡 정산 항목 생성 중 오류가 발생했습니다.');
    }
  };

  const handleGeneralSubmit = async () => {
    try {
      setError('');
      setSuccessMessage('');
      
      // 첫 번째 행의 날짜 사용
      const settlementDate = generalRows[0]['날짜'] || format(new Date(), 'yyyy-MM-dd');
      
      // 기사 ID 추가
      const settlement = await createSettlement(
        settlementDate,
        'general',
        user?.id
      );
      
      const generalSettlementData: CreateGeneralSettlementDTO = {
        columns: generalColumns,
        rows: generalRows
      };
      
      await createGeneralSettlement(settlement.id, generalSettlementData);
      setSuccessMessage('정산 항목이 성공적으로 생성되었습니다.');
      
      // 잠시 후 리스트 페이지로 이동
      setTimeout(() => {
        router.push('/dashboard/my-settlements');
      }, 2000);
    } catch (error) {
      console.error('Error creating general settlement:', error);
      setError('정산 항목 생성 중 오류가 발생했습니다.');
    }
  };

  const handleAddGeneralRow = () => {
    setGeneralRows([...generalRows, { '날짜': format(new Date(), 'yyyy-MM-dd'), '항목': '', '금액': '', '비고': '' }]);
  };

  const handleRemoveGeneralRow = (index: number) => {
    const newRows = [...generalRows];
    newRows.splice(index, 1);
    setGeneralRows(newRows);
  };

  const handleGeneralChange = (index: number, column: string, value: string) => {
    const newRows = [...generalRows];
    newRows[index][column] = value;
    setGeneralRows(newRows);
  };

  const handleCancel = () => {
    router.push('/dashboard/my-settlements');
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">정산 항목 생성</h1>
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

          <div className="mb-5 mt-4 border-b border-gray-200">
            <div className="sm:items-baseline">
              <div className="mt-4 sm:mt-0">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setSettlementType('kurly')}
                    className={`${
                      settlementType === 'kurly'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    컬리 정산
                  </button>
                  <button
                    onClick={() => setSettlementType('coupang')}
                    className={`${
                      settlementType === 'coupang'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    쿠팡 정산
                  </button>
                  <button
                    onClick={() => setSettlementType('general')}
                    className={`${
                      settlementType === 'general'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    기타 정산
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* 컬리 정산 양식 */}
          {settlementType === 'kurly' && (
            <form onSubmit={handleSubmitKurly(handleKurlySubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">업체명</label>
                  <input
                    type="text"
                    {...registerKurly('company_name', { required: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errorsKurly.company_name && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">날짜</label>
                  <input
                    type="date"
                    {...registerKurly('settlement_date', { required: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errorsKurly.settlement_date && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">지원/대처</label>
                  <input
                    type="text"
                    {...registerKurly('support_type')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">금액(만원)</label>
                  <input
                    type="number"
                    {...registerKurly('amount', { required: true, valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errorsKurly.amount && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">센터</label>
                  <input
                    type="text"
                    {...registerKurly('center')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">지역</label>
                  <input
                    type="text"
                    {...registerKurly('region')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">딜리건수</label>
                  <input
                    type="number"
                    {...registerKurly('delivery_count', { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">단가</label>
                  <input
                    type="number"
                    {...registerKurly('unit_price', { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">정산금액</label>
                  <input
                    type="number"
                    {...registerKurly('settlement_amount', { required: true, valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errorsKurly.settlement_amount && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">공급가</label>
                  <input
                    type="number"
                    {...registerKurly('supply_price', { required: true, valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errorsKurly.supply_price && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-700">비고</label>
                  <input
                    type="text"
                    {...registerKurly('note')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingKurly}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isSubmittingKurly ? '처리 중...' : '저장'}
                </button>
              </div>
            </form>
          )}

          {/* 쿠팡 정산 양식 */}
          {settlementType === 'coupang' && (
            <form onSubmit={handleSubmitCoupang(handleCoupangSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">날짜</label>
                  <input
                    type="date"
                    {...registerCoupang('settlement_date', { required: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errorsCoupang.settlement_date && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">이름</label>
                  <input
                    type="text"
                    {...registerCoupang('courier_name', { required: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errorsCoupang.courier_name && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">주/야</label>
                  <select
                    {...registerCoupang('day_or_night')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">선택</option>
                    <option value="day">주간</option>
                    <option value="night">야간</option>
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-sm font-medium text-gray-700">배송구역</label>
                  <input
                    type="text"
                    {...registerCoupang('delivery_area')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">건수</label>
                  <input
                    type="number"
                    {...registerCoupang('delivery_count', { required: true, valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errorsCoupang.delivery_count && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">단가(VAT별도)</label>
                  <input
                    type="number"
                    {...registerCoupang('unit_price', { required: true, valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errorsCoupang.unit_price && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">공급가</label>
                  <input
                    type="number"
                    {...registerCoupang('supply_price', { required: true, valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errorsCoupang.supply_price && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">부가세</label>
                  <input
                    type="number"
                    {...registerCoupang('vat', { required: true, valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errorsCoupang.vat && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">합계</label>
                  <input
                    type="number"
                    {...registerCoupang('total_amount', { required: true, valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errorsCoupang.total_amount && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">수익금</label>
                  <input
                    type="number"
                    {...registerCoupang('profit', { required: true, valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errorsCoupang.profit && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">거래처(입금처)</label>
                  <input
                    type="text"
                    {...registerCoupang('transaction_partner')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">비고</label>
                  <input
                    type="text"
                    {...registerCoupang('note')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCoupang}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isSubmittingCoupang ? '처리 중...' : '저장'}
                </button>
              </div>
            </form>
          )}

          {/* 일반 정산 양식 */}
          {settlementType === 'general' && (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {generalColumns.map((column, index) => (
                        <th
                          key={index}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {column}
                        </th>
                      ))}
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {generalRows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {generalColumns.map((column, colIndex) => (
                          <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                            {column === '날짜' ? (
                              <input
                                type="date"
                                value={row[column] || ''}
                                onChange={(e) => handleGeneralChange(rowIndex, column, e.target.value)}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              />
                            ) : (
                              <input
                                type={column === '금액' ? 'number' : 'text'}
                                value={row[column] || ''}
                                onChange={(e) => handleGeneralChange(rowIndex, column, e.target.value)}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              />
                            )}
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleRemoveGeneralRow(rowIndex)}
                            className="text-red-600 hover:text-red-900"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handleAddGeneralRow}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  행 추가
                </button>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleGeneralSubmit}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    저장
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
