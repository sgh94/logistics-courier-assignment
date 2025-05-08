import React, { useState, useEffect } from 'react';
import { CoupangSettlement, CreateCoupangSettlementDTO } from '@/lib/types/settlement';

interface CoupangSettlementFormProps {
  initialData?: CoupangSettlement;
  onSubmit: (data: CreateCoupangSettlementDTO) => void;
  onCancel: () => void;
}

const CoupangSettlementForm: React.FC<CoupangSettlementFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CreateCoupangSettlementDTO>({
    settlement_date: new Date().toISOString().split('T')[0],
    day_or_night: 'day',
    delivery_area: '',
    courier_name: '',
    delivery_count: 0,
    unit_price: 0,
    supply_price: 0,
    vat: 0,
    total_amount: 0,
    profit: 0,
    invoice_status: '',
    payment_type: '',
    note: '',
    transaction_partner: '',
    return_count: 0,
    camp: '',
    route_id: '',
    pdd: '',
  });

  // Auto-calculate values when dependencies change
  useEffect(() => {
    if (formData.unit_price && formData.delivery_count) {
      const supply = formData.unit_price * formData.delivery_count;
      const vat = Math.round(supply * 0.1);
      
      setFormData(prev => ({
        ...prev,
        supply_price: supply,
        vat: vat,
        total_amount: supply + vat
      }));
    }
  }, [formData.unit_price, formData.delivery_count]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        settlement_date: initialData.settlement_date,
        day_or_night: initialData.day_or_night || 'day',
        delivery_area: initialData.delivery_area || '',
        courier_name: initialData.courier_name,
        delivery_count: initialData.delivery_count,
        unit_price: initialData.unit_price,
        supply_price: initialData.supply_price,
        vat: initialData.vat,
        total_amount: initialData.total_amount,
        profit: initialData.profit,
        invoice_status: initialData.invoice_status || '',
        payment_type: initialData.payment_type || '',
        note: initialData.note || '',
        transaction_partner: initialData.transaction_partner || '',
        return_count: initialData.return_count || 0,
        camp: initialData.camp || '',
        route_id: initialData.route_id || '',
        pdd: initialData.pdd || '',
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if ([
      'delivery_count', 
      'unit_price', 
      'supply_price', 
      'vat', 
      'total_amount', 
      'profit',
      'return_count'
    ].includes(name)) {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label htmlFor="settlement_date" className="block text-sm font-medium text-gray-700">
            날짜
          </label>
          <input
            type="date"
            id="settlement_date"
            name="settlement_date"
            value={formData.settlement_date}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div>
          <label htmlFor="day_or_night" className="block text-sm font-medium text-gray-700">
            주/야
          </label>
          <select
            id="day_or_night"
            name="day_or_night"
            value={formData.day_or_night}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="day">주간</option>
            <option value="night">야간</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="delivery_area" className="block text-sm font-medium text-gray-700">
            배송구역
          </label>
          <input
            type="text"
            id="delivery_area"
            name="delivery_area"
            value={formData.delivery_area}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div>
          <label htmlFor="courier_name" className="block text-sm font-medium text-gray-700">
            이름
          </label>
          <input
            type="text"
            id="courier_name"
            name="courier_name"
            value={formData.courier_name}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div>
          <label htmlFor="delivery_count" className="block text-sm font-medium text-gray-700">
            건수
          </label>
          <input
            type="number"
            id="delivery_count"
            name="delivery_count"
            value={formData.delivery_count}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div>
          <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700">
            단가(VAT별도)
          </label>
          <input
            type="number"
            id="unit_price"
            name="unit_price"
            value={formData.unit_price}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div>
          <label htmlFor="supply_price" className="block text-sm font-medium text-gray-700">
            공급가
          </label>
          <input
            type="number"
            id="supply_price"
            name="supply_price"
            value={formData.supply_price}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div>
          <label htmlFor="vat" className="block text-sm font-medium text-gray-700">
            부가세
          </label>
          <input
            type="number"
            id="vat"
            name="vat"
            value={formData.vat}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div>
          <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700">
            합계
          </label>
          <input
            type="number"
            id="total_amount"
            name="total_amount"
            value={formData.total_amount}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div>
          <label htmlFor="profit" className="block text-sm font-medium text-gray-700">
            수익금
          </label>
          <input
            type="number"
            id="profit"
            name="profit"
            value={formData.profit}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div>
          <label htmlFor="invoice_status" className="block text-sm font-medium text-gray-700">
            계산서
          </label>
          <input
            type="text"
            id="invoice_status"
            name="invoice_status"
            value={formData.invoice_status}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div>
          <label htmlFor="payment_type" className="block text-sm font-medium text-gray-700">
            입금형태
          </label>
          <input
            type="text"
            id="payment_type"
            name="payment_type"
            value={formData.payment_type}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div>
          <label htmlFor="transaction_partner" className="block text-sm font-medium text-gray-700">
            거래처(입금처)
          </label>
          <input
            type="text"
            id="transaction_partner"
            name="transaction_partner"
            value={formData.transaction_partner}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div>
          <label htmlFor="return_count" className="block text-sm font-medium text-gray-700">
            반품건수
          </label>
          <input
            type="number"
            id="return_count"
            name="return_count"
            value={formData.return_count}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div>
          <label htmlFor="camp" className="block text-sm font-medium text-gray-700">
            캠프
          </label>
          <input
            type="text"
            id="camp"
            name="camp"
            value={formData.camp}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div>
          <label htmlFor="route_id" className="block text-sm font-medium text-gray-700">
            라우트
          </label>
          <input
            type="text"
            id="route_id"
            name="route_id"
            value={formData.route_id}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div>
          <label htmlFor="pdd" className="block text-sm font-medium text-gray-700">
            PDD
          </label>
          <input
            type="text"
            id="pdd"
            name="pdd"
            value={formData.pdd}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div className="md:col-span-2 lg:col-span-3">
          <label htmlFor="note" className="block text-sm font-medium text-gray-700">
            비고
          </label>
          <input
            type="text"
            id="note"
            name="note"
            value={formData.note}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
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
          저장
        </button>
      </div>
    </form>
  );
};

export default CoupangSettlementForm;
