'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Control, useWatch } from 'react-hook-form';
import { 
  CreateKurlySettlementDTO, 
  CreateCoupangSettlementDTO,
  BatchKurlySettlementDTO,
  BatchCoupangSettlementDTO
} from '@/lib/types/settlement';
import { batchCreateKurlySettlements, batchCreateCoupangSettlements } from '@/lib/settlements';
import { format } from 'date-fns';

type SettlementType = 'kurly' | 'coupang';

interface BatchFormProps {
  type: SettlementType;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

function KurlyBatchForm({ onSubmit, onCancel }: BatchFormProps) {
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<BatchKurlySettlementDTO>({
    defaultValues: {
      settlement_date: format(new Date(), 'yyyy-MM-dd'),
      settlements: [
        {
          company_name: '',
          settlement_date: format(new Date(), 'yyyy-MM-dd'),
          amount: 0,
          settlement_amount: 0,
          supply_price: 0
        }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'settlements'
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">정산일자</label>
        <input
          type="date"
          {...register('settlement_date', { required: true })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
        {errors.settlement_date && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {fields.map((field, index) => (
            <li key={field.id} className="px-4 py-4 sm:px-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">업체명</label>
                  <input
                    type="text"
                    {...register(`settlements.${index}.company_name` as const, { required: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errors.settlements?.[index]?.company_name && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">센터</label>
                  <input
                    type="text"
                    {...register(`settlements.${index}.center` as const)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">지역</label>
                  <input
                    type="text"
                    {...register(`settlements.${index}.region` as const)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">지원/대처</label>
                  <input
                    type="text"
                    {...register(`settlements.${index}.support_type` as const)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">금액(만원)</label>
                  <input
                    type="number"
                    {...register(`settlements.${index}.amount` as const, { 
                      required: true,
                      valueAsNumber: true 
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errors.settlements?.[index]?.amount && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">딜리건수</label>
                  <input
                    type="number"
                    {...register(`settlements.${index}.delivery_count` as const, { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">단가</label>
                  <input
                    type="number"
                    {...register(`settlements.${index}.unit_price` as const, { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">정산금액</label>
                  <input
                    type="number"
                    {...register(`settlements.${index}.settlement_amount` as const, { 
                      required: true,
                      valueAsNumber: true 
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errors.settlements?.[index]?.settlement_amount && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">공급가</label>
                  <input
                    type="number"
                    {...register(`settlements.${index}.supply_price` as const, { 
                      required: true,
                      valueAsNumber: true 
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errors.settlements?.[index]?.supply_price && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-sm font-medium text-gray-700">비고</label>
                  <input
                    type="text"
                    {...register(`settlements.${index}.note` as const)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-1 flex items-end justify-end">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => append({
            company_name: '',
            settlement_date: format(new Date(), 'yyyy-MM-dd'),
            amount: 0,
            settlement_amount: 0,
            supply_price: 0
          })}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          항목 추가
        </button>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isSubmitting ? '처리 중...' : '저장'}
          </button>
        </div>
      </div>
    </form>
  );
}

function CoupangBatchForm({ onSubmit, onCancel }: BatchFormProps) {
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<BatchCoupangSettlementDTO>({
    defaultValues: {
      settlement_date: format(new Date(), 'yyyy-MM-dd'),
      settlements: [
        {
          settlement_date: format(new Date(), 'yyyy-MM-dd'),
          courier_name: '',
          delivery_count: 0,
          unit_price: 0,
          supply_price: 0,
          vat: 0,
          total_amount: 0,
          profit: 0
        }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'settlements'
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">정산일자</label>
        <input
          type="date"
          {...register('settlement_date', { required: true })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
        {errors.settlement_date && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {fields.map((field, index) => (
            <li key={field.id} className="px-4 py-4 sm:px-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">이름</label>
                  <input
                    type="text"
                    {...register(`settlements.${index}.courier_name` as const, { required: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errors.settlements?.[index]?.courier_name && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">주/야</label>
                  <select
                    {...register(`settlements.${index}.day_or_night` as const)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">선택</option>
                    <option value="day">주간</option>
                    <option value="night">야간</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">배송구역</label>
                  <input
                    type="text"
                    {...register(`settlements.${index}.delivery_area` as const)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">건수</label>
                  <input
                    type="number"
                    {...register(`settlements.${index}.delivery_count` as const, { 
                      required: true,
                      valueAsNumber: true 
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errors.settlements?.[index]?.delivery_count && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">단가(VAT별도)</label>
                  <input
                    type="number"
                    {...register(`settlements.${index}.unit_price` as const, { 
                      required: true,
                      valueAsNumber: true 
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errors.settlements?.[index]?.unit_price && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">공급가</label>
                  <input
                    type="number"
                    {...register(`settlements.${index}.supply_price` as const, { 
                      required: true,
                      valueAsNumber: true 
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errors.settlements?.[index]?.supply_price && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">부가세</label>
                  <input
                    type="number"
                    {...register(`settlements.${index}.vat` as const, { 
                      required: true,
                      valueAsNumber: true 
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errors.settlements?.[index]?.vat && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">합계</label>
                  <input
                    type="number"
                    {...register(`settlements.${index}.total_amount` as const, { 
                      required: true,
                      valueAsNumber: true 
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errors.settlements?.[index]?.total_amount && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">수익금</label>
                  <input
                    type="number"
                    {...register(`settlements.${index}.profit` as const, { 
                      required: true,
                      valueAsNumber: true 
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errors.settlements?.[index]?.profit && <span className="text-red-500 text-xs">필수 입력 항목입니다</span>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">거래처(입금처)</label>
                  <input
                    type="text"
                    {...register(`settlements.${index}.transaction_partner` as const)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">비고</label>
                  <input
                    type="text"
                    {...register(`settlements.${index}.note` as const)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-1 flex items-end justify-end">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => append({
            settlement_date: format(new Date(), 'yyyy-MM-dd'),
            courier_name: '',
            delivery_count: 0,
            unit_price: 0,
            supply_price: 0,
            vat: 0,
            total_amount: 0,
            profit: 0
          })}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          항목 추가
        </button>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isSubmitting ? '처리 중...' : '저장'}
          </button>
        </div>
      </div>
    </form>
  );
}

export default function BatchSettlementPage() {
  const router = useRouter();
  const [settlementType, setSettlementType] = useState<SettlementType>('kurly');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleKurlySubmit = async (data: BatchKurlySettlementDTO) => {
    try {
      setError('');
      setSuccessMessage('');
      
      await batchCreateKurlySettlements(data);
      setSuccessMessage(`${data.settlements.length}개의 컬리 정산 항목이 성공적으로 생성되었습니다.`);
      
      // 잠시 후 리스트 페이지로 이동
      setTimeout(() => {
        router.push('/dashboard/settlements');
      }, 2000);
    } catch (error) {
      console.error('Error creating kurly settlements:', error);
      setError('컬리 정산 항목 생성 중 오류가 발생했습니다.');
    }
  };

  const handleCoupangSubmit = async (data: BatchCoupangSettlementDTO) => {
    try {
      setError('');
      setSuccessMessage('');
      
      await batchCreateCoupangSettlements(data);
      setSuccessMessage(`${data.settlements.length}개의 쿠팡 정산 항목이 성공적으로 생성되었습니다.`);
      
      // 잠시 후 리스트 페이지로 이동
      setTimeout(() => {
        router.push('/dashboard/settlements');
      }, 2000);
    } catch (error) {
      console.error('Error creating coupang settlements:', error);
      setError('쿠팡 정산 항목 생성 중 오류가 발생했습니다.');
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/settlements');
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">배치 정산 입력</h1>
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
                </nav>
              </div>
            </div>
          </div>

          {settlementType === 'kurly' ? (
            <KurlyBatchForm type="kurly" onSubmit={handleKurlySubmit} onCancel={handleCancel} />
          ) : (
            <CoupangBatchForm type="coupang" onSubmit={handleCoupangSubmit} onCancel={handleCancel} />
          )}
        </div>
      </div>
    </div>
  );
}
