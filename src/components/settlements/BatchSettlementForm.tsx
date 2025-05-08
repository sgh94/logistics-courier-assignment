"use client";

import React, { useState, useEffect } from 'react';
import { CreateCoupangSettlementDTO } from '@/lib/types/settlement';
import { User } from '@/lib/auth';
import { getCouriers } from '@/lib/couriers';

interface BatchSettlementFormProps {
  type: 'kurly' | 'coupang';
  onSubmit: (data: any[]) => void;
  onCancel: () => void;
}

const BatchSettlementForm: React.FC<BatchSettlementFormProps> = ({ type, onSubmit, onCancel }) => {
  const [couriers, setCouriers] = useState<User[]>([]);
  const [dateValue, setDateValue] = useState(new Date().toISOString().split('T')[0]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCouriers() {
      try {
        const couriersList = await getCouriers();
        setCouriers(couriersList);
        
        // 기본 행 생성
        if (type === 'coupang') {
          const defaultRows = couriersList.map(courier => ({
            courier_id: courier.id,
            courier_name: courier.name,
            settlement_date: dateValue,
            day_or_night: 'day',
            delivery_area: '',
            delivery_count: 0,
            unit_price: 1200, // 기본 단가
            supply_price: 0,
            vat: 0,
            total_amount: 0,
            profit: 0
          }));
          setRows(defaultRows);
        } else {
          // Kurly 기본 행 설정
          setRows([{
            company_name: '',
            settlement_date: dateValue,
            support_type: '',
            amount: 0,
            settlement_amount: 0,
            supply_price: 0
          }]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('기사 목록을 불러오는 중 오류가 발생했습니다:', err);
        setError('기사 목록을 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    }
    
    loadCouriers();
  }, [dateValue, type]);

  const updateRowValue = (index: number, field: string, value: any) => {
    const updatedRows = [...rows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    
    // 쿠팡 정산의 경우 자동 계산
    if (type === 'coupang') {
      if (field === 'delivery_count' || field === 'unit_price') {
        const count = field === 'delivery_count' ? Number(value) : Number(updatedRows[index].delivery_count);
        const price = field === 'unit_price' ? Number(value) : Number(updatedRows[index].unit_price);
        
        const supply = count * price;
        const vat = Math.round(supply * 0.1);
        
        updatedRows[index].supply_price = supply;
        updatedRows[index].vat = vat;
        updatedRows[index].total_amount = supply + vat;
        
        // 수익금은 커스텀 계산 로직이 필요할 수 있음
        // 여기서는 예시로 총액의 80%로 설정
        updatedRows[index].profit = Math.round(supply * 0.8);
      }
    }
    
    setRows(updatedRows);
  };

  const addRow = () => {
    if (type === 'coupang') {
      setRows([...rows, {
        courier_id: '',
        courier_name: '',
        settlement_date: dateValue,
        day_or_night: 'day',
        delivery_area: '',
        delivery_count: 0,
        unit_price: 1200,
        supply_price: 0,
        vat: 0,
        total_amount: 0,
        profit: 0
      }]);
    } else {
      setRows([...rows, {
        company_name: '',
        settlement_date: dateValue,
        support_type: '',
        amount: 0,
        settlement_amount: 0,
        supply_price: 0
      }]);
    }
  };

  const removeRow = (index: number) => {
    const updatedRows = [...rows];
    updatedRows.splice(index, 1);
    setRows(updatedRows);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDateValue(newDate);
    
    // 모든 행에 새 날짜 적용
    const updatedRows = rows.map(row => ({
      ...row,
      settlement_date: newDate
    }));
    
    setRows(updatedRows);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 빈 행 필터링
    const validRows = rows.filter(row => {
      if (type === 'coupang') {
        return row.courier_name && row.delivery_count > 0;
      } else {
        return row.company_name && row.amount > 0;
      }
    });
    
    if (validRows.length === 0) {
      alert('유효한 정산 데이터가 없습니다.');
      return;
    }
    
    onSubmit(validRows);
  };

  if (loading) {
    return <div className="text-center py-4">데이터를 불러오는 중입니다...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-center">
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-gray-700">정산 날짜</label>
          <input
            type="date"
            value={dateValue}
            onChange={handleDateChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div className="w-full md:w-auto">
          <button
            type="button"
            onClick={addRow}
            className="mt-6 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            행 추가
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">순서</th>
              {type === 'coupang' ? (
                <>
                  <th className="border p-2">기사</th>
                  <th className="border p-2">배송구역</th>
                  <th className="border p-2">주/야</th>
                  <th className="border p-2">건수</th>
                  <th className="border p-2">단가</th>
                  <th className="border p-2">공급가</th>
                  <th className="border p-2">VAT</th>
                  <th className="border p-2">합계</th>
                  <th className="border p-2">수익금</th>
                </>
              ) : (
                <>
                  <th className="border p-2">업체명</th>
                  <th className="border p-2">지원/대처</th>
                  <th className="border p-2">금액(만원)</th>
                  <th className="border p-2">정산금액</th>
                  <th className="border p-2">공급가</th>
                </>
              )}
              <th className="border p-2">작업</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border p-2 text-center">{index + 1}</td>
                
                {type === 'coupang' ? (
                  <>
                    <td className="border p-2">
                      <select
                        value={row.courier_id || ''}
                        onChange={(e) => {
                          const selectedCourierId = e.target.value;
                          const selectedCourier = couriers.find(c => c.id === selectedCourierId);
                          updateRowValue(index, 'courier_id', selectedCourierId);
                          updateRowValue(index, 'courier_name', selectedCourier?.name || '');
                        }}
                        className="w-full p-1 border-gray-300"
                      >
                        <option value="">선택하세요</option>
                        {couriers.map((courier) => (
                          <option key={courier.id} value={courier.id}>
                            {courier.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        value={row.delivery_area || ''}
                        onChange={(e) => updateRowValue(index, 'delivery_area', e.target.value)}
                        className="w-full p-1 border-gray-300"
                      />
                    </td>
                    <td className="border p-2">
                      <select
                        value={row.day_or_night}
                        onChange={(e) => updateRowValue(index, 'day_or_night', e.target.value)}
                        className="w-full p-1 border-gray-300"
                      >
                        <option value="day">주간</option>
                        <option value="night">야간</option>
                      </select>
                    </td>
                    <td className="border p-2">
                      <input
                        type="number"
                        value={row.delivery_count}
                        onChange={(e) => updateRowValue(index, 'delivery_count', parseInt(e.target.value) || 0)}
                        className="w-full p-1 border-gray-300"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="number"
                        value={row.unit_price}
                        onChange={(e) => updateRowValue(index, 'unit_price', parseInt(e.target.value) || 0)}
                        className="w-full p-1 border-gray-300"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="number"
                        value={row.supply_price}
                        readOnly
                        className="w-full p-1 border-gray-300 bg-gray-100"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="number"
                        value={row.vat}
                        readOnly
                        className="w-full p-1 border-gray-300 bg-gray-100"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="number"
                        value={row.total_amount}
                        readOnly
                        className="w-full p-1 border-gray-300 bg-gray-100"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="number"
                        value={row.profit}
                        onChange={(e) => updateRowValue(index, 'profit', parseInt(e.target.value) || 0)}
                        className="w-full p-1 border-gray-300"
                      />
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border p-2">
                      <input
                        type="text"
                        value={row.company_name || ''}
                        onChange={(e) => updateRowValue(index, 'company_name', e.target.value)}
                        className="w-full p-1 border-gray-300"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        value={row.support_type || ''}
                        onChange={(e) => updateRowValue(index, 'support_type', e.target.value)}
                        className="w-full p-1 border-gray-300"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="number"
                        value={row.amount || 0}
                        onChange={(e) => {
                          const amount = parseInt(e.target.value) || 0;
                          updateRowValue(index, 'amount', amount);
                          updateRowValue(index, 'settlement_amount', amount * 10000);
                          updateRowValue(index, 'supply_price', Math.round(amount * 10000 / 1.1));
                        }}
                        className="w-full p-1 border-gray-300"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="number"
                        value={row.settlement_amount || 0}
                        onChange={(e) => updateRowValue(index, 'settlement_amount', parseInt(e.target.value) || 0)}
                        className="w-full p-1 border-gray-300"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="number"
                        value={row.supply_price || 0}
                        onChange={(e) => updateRowValue(index, 'supply_price', parseInt(e.target.value) || 0)}
                        className="w-full p-1 border-gray-300"
                      />
                    </td>
                  </>
                )}
                
                <td className="border p-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
        >
          취소
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          일괄 저장
        </button>
      </div>
    </form>
  );
};

export default BatchSettlementForm;