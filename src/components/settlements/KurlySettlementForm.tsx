"use client";

import React, { useState, useEffect } from 'react';
import { KurlySettlement, CreateKurlySettlementDTO } from '@/lib/types/settlement';

interface KurlySettlementFormProps {
  initialData?: KurlySettlement;
  onSubmit: (data: CreateKurlySettlementDTO) => void;
  onCancel: () => void;
}

const KurlySettlementForm: React.FC<KurlySettlementFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CreateKurlySettlementDTO>({
    company_name: '',
    settlement_date: new Date().toISOString().split('T')[0],
    support_type: '',
    amount: 0,
    note: '',
    settlement_amount: 0,
    supply_price: 0,
    delivery_count: 0,
    unit_price: 0,
    center: '',
    region: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        company_name: initialData.company_name,
        settlement_date: initialData.settlement_date || new Date().toISOString().split('T')[0],
        support_type: initialData.support_type || '',
        amount: initialData.amount,
        note: initialData.note || '',
        settlement_amount: initialData.settlement_amount,
        supply_price: initialData.supply_price,
        delivery_count: initialData.delivery_count || 0,
        unit_price: initialData.unit_price || 0,
        center: initialData.center || '',
        region: initialData.region || '',
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (['amount', 'settlement_amount', 'supply_price', 'delivery_count', 'unit_price'].includes(name)) {
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
            업체명
          </label>
          <input
            type="text"
            id="company_name"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
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
          <label htmlFor="support_type" className="block text-sm font-medium text-gray-700">
            지원/대처
          </label>
          <input
            type="text"
            id="support_type"
            name="support_type"
            value={formData.support_type}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            금액(만원)
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div>
          <label htmlFor="settlement_amount" className="block text-sm font-medium text-gray-700">
            정산금액
          </label>
          <input
            type="number"
            id="settlement_amount"
            name="settlement_amount"
            value={formData.settlement_amount}
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
          <label htmlFor="delivery_count" className="block text-sm font-medium text-gray-700">
            딜리건수
          </label>
          <input
            type="number"
            id="delivery_count"
            name="delivery_count"
            value={formData.delivery_count}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div>
          <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700">
            단가
          </label>
          <input
            type="number"
            id="unit_price"
            name="unit_price"
            value={formData.unit_price}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div>
          <label htmlFor="center" className="block text-sm font-medium text-gray-700">
            센터
          </label>
          <input
            type="text"
            id="center"
            name="center"
            value={formData.center}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700">
            지역
          </label>
          <input
            type="text"
            id="region"
            name="region"
            value={formData.region}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div className="md:col-span-2">
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

export default KurlySettlementForm;