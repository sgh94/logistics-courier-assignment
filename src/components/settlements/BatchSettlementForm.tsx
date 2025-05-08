// src/components/settlements/BatchSettlementForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { getCouriers } from '@/lib/couriers';
import { createBatchKurlySettlements, createBatchCoupangSettlements } from '@/lib/settlements';
import { getCurrentUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FiPlus, FiX, FiSave } from 'react-icons/fi';

type BatchKurlyItem = {
  courier_id: string;
  delivery_date: string;
  shift: string;
  sequence: string;
  delivery_fee: number;
};

type BatchCoupangItem = {
  courier_id: string;
  delivery_date: string;
  delivery_code: string;
  delivery_count: number;
  unit_price: number;
  delivery_fee: number;
  weight?: number | null;
};

type BatchSettlementFormProps = {
  type: 'kurly' | 'coupang';
  onSuccess?: () => void;
};

export default function BatchSettlementForm({ type, onSuccess }: BatchSettlementFormProps) {
  const router = useRouter();
  const [couriers, setCouriers] = useState<any[]>([]);
  const [selectedCourier, setSelectedCourier] = useState('');
  const [batchDate, setBatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Kurly specific state
  const [kurlyItems, setKurlyItems] = useState<BatchKurlyItem[]>([]);
  
  // Coupang specific state
  const [coupangItems, setCoupangItems] = useState<BatchCoupangItem[]>([]);
  
  useEffect(() => {
    async function loadData() {
      try {
        // Check user permissions
        const { user } = await getCurrentUser();
        if (!user) {
          toast.error('로그인이 필요합니다.');
          router.push('/login');
          return;
        }
        
        setIsAdmin(user.role === 'admin');
        
        // Load couriers (admin only)
        if (user.role === 'admin') {
          const couriersData = await getCouriers();
          setCouriers(couriersData);
        } else {
          // Set current user as the courier
          setSelectedCourier(user.id);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('데이터를 불러오는데 실패했습니다.');
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [router]);
  
  function addKurlyItem() {
    if (!selectedCourier) {
      toast.error('기사를 선택해주세요.');
      return;
    }
    
    const newItem: BatchKurlyItem = {
      courier_id: selectedCourier,
      delivery_date: batchDate,
      shift: '',
      sequence: '',
      delivery_fee: 0
    };
    
    setKurlyItems(prev => [...prev, newItem]);
  }
  
  function updateKurlyItem(index: number, field: keyof BatchKurlyItem, value: any) {
    setKurlyItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }
  
  function removeKurlyItem(index: number) {
    setKurlyItems(prev => prev.filter((_, i) => i !== index));
  }
  
  function addCoupangItem() {
    if (!selectedCourier) {
      toast.error('기사를 선택해주세요.');
      return;
    }
    
    const newItem: BatchCoupangItem = {
      courier_id: selectedCourier,
      delivery_date: batchDate,
      delivery_code: '',
      delivery_count: 0,
      unit_price: 1200, // Default unit price
      delivery_fee: 0,
      weight: null
    };
    
    setCoupangItems(prev => [...prev, newItem]);
  }
  
  function updateCoupangItem(index: number, field: keyof BatchCoupangItem, value: any) {
    setCoupangItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Auto-calculate delivery fee based on delivery count and unit price
      if (field === 'delivery_count' || field === 'unit_price') {
        const count = field === 'delivery_count' ? value : updated[index].delivery_count;
        const price = field === 'unit_price' ? value : updated[index].unit_price;
        updated[index].delivery_fee = count * price;
      }
      
      return updated;
    });
  }
  
  function removeCoupangItem(index: number) {
    setCoupangItems(prev => prev.filter((_, i) => i !== index));
  }
  
  async function handleSubmitKurly() {
    if (kurlyItems.length === 0) {
      toast.error('추가할 항목이 없습니다.');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Validate items
      const hasInvalidItems = kurlyItems.some(item => !item.shift || !item.sequence || !item.delivery_fee);
      if (hasInvalidItems) {
        toast.error('모든 항목을 입력해주세요.');
        setIsSaving(false);
        return;
      }
      
      // Create items
      await createBatchKurlySettlements(kurlyItems);
      
      toast.success(`${kurlyItems.length}개의 정산 항목이 추가되었습니다.`);
      setKurlyItems([]);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving Kurly settlements:', error);
      toast.error('정산 항목 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  }
  
  async function handleSubmitCoupang() {
    if (coupangItems.length === 0) {
      toast.error('추가할 항목이 없습니다.');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Validate items
      const hasInvalidItems = coupangItems.some(item => !item.delivery_code || !item.delivery_count || !item.delivery_fee);
      if (hasInvalidItems) {
        toast.error('모든 항목을 입력해주세요.');
        setIsSaving(false);
        return;
      }
      
      // Create items
      await createBatchCoupangSettlements(coupangItems);
      
      toast.success(`${coupangItems.length}개의 정산 항목이 추가되었습니다.`);
      setCoupangItems([]);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving Coupang settlements:', error);
      toast.error('정산 항목 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          {isAdmin && (
            <div className="w-full sm:w-auto flex-1">
              <label htmlFor="courier" className="form-label">기사</label>
              <select
                id="courier"
                className="form-select"
                value={selectedCourier}
                onChange={(e) => setSelectedCourier(e.target.value)}
                required
              >
                <option value="">기사 선택</option>
                {couriers.map((courier) => (
                  <option key={courier.id} value={courier.id}>{courier.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="w-full sm:w-auto flex-1">
            <label htmlFor="date" className="form-label">배송일</label>
            <input
              type="date"
              id="date"
              className="form-input"
              value={batchDate}
              onChange={(e) => setBatchDate(e.target.value)}
              required
            />
          </div>
        </div>
        
        <button 
          type="button" 
          className="btn-secondary w-full"
          onClick={type === 'kurly' ? addKurlyItem : addCoupangItem}
        >
          <FiPlus className="mr-2" />
          {type === 'kurly' ? '마켓컬리 항목 추가' : '쿠팡 항목 추가'}
        </button>
      </div>
      
      {type === 'kurly' && (
        <div className="space-y-4">
          {kurlyItems.length > 0 ? (
            <>
              <div className="space-y-4">
                {kurlyItems.map((item, index) => (
                  <div key={index} className="border rounded p-3 relative">
                    <button
                      type="button"
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      onClick={() => removeKurlyItem(index)}
                    >
                      <FiX />
                    </button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-secondary-600">조</label>
                        <input
                          type="text"
                          className="form-input mt-1"
                          value={item.shift}
                          onChange={(e) => updateKurlyItem(index, 'shift', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-secondary-600">차수</label>
                        <input
                          type="text"
                          className="form-input mt-1"
                          value={item.sequence}
                          onChange={(e) => updateKurlyItem(index, 'sequence', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <label className="text-xs text-secondary-600">배송비</label>
                        <input
                          type="number"
                          className="form-input mt-1"
                          value={item.delivery_fee}
                          onChange={(e) => updateKurlyItem(index, 'delivery_fee', parseInt(e.target.value))}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                type="button" 
                className="btn-primary w-full"
                onClick={handleSubmitKurly}
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                    저장 중...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <FiSave className="mr-2" />
                    {kurlyItems.length}개 항목 저장
                  </span>
                )}
              </button>
            </>
          ) : (
            <div className="text-center text-secondary-500 py-6">
              마켓컬리 정산 항목을 추가해주세요.
            </div>
          )}
        </div>
      )}
      
      {type === 'coupang' && (
        <div className="space-y-4">
          {coupangItems.length > 0 ? (
            <>
              <div className="space-y-4">
                {coupangItems.map((item, index) => (
                  <div key={index} className="border rounded p-3 relative">
                    <button
                      type="button"
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      onClick={() => removeCoupangItem(index)}
                    >
                      <FiX />
                    </button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-secondary-600">배송 코드</label>
                        <input
                          type="text"
                          className="form-input mt-1"
                          value={item.delivery_code}
                          onChange={(e) => updateCoupangItem(index, 'delivery_code', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-secondary-600">중량 (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-input mt-1"
                          value={item.weight || ''}
                          onChange={(e) => updateCoupangItem(index, 'weight', e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-secondary-600">배송 건수</label>
                        <input
                          type="number"
                          className="form-input mt-1"
                          value={item.delivery_count}
                          onChange={(e) => updateCoupangItem(index, 'delivery_count', parseInt(e.target.value))}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-secondary-600">건당 단가</label>
                        <input
                          type="number"
                          className="form-input mt-1"
                          value={item.unit_price}
                          onChange={(e) => updateCoupangItem(index, 'unit_price', parseInt(e.target.value))}
                          required
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <label className="text-xs text-secondary-600">배송비 (자동 계산됨)</label>
                        <input
                          type="number"
                          className="form-input mt-1 bg-secondary-50"
                          value={item.delivery_fee}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                type="button" 
                className="btn-primary w-full"
                onClick={handleSubmitCoupang}
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                    저장 중...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <FiSave className="mr-2" />
                    {coupangItems.length}개 항목 저장
                  </span>
                )}
              </button>
            </>
          ) : (
            <div className="text-center text-secondary-500 py-6">
              쿠팡 정산 항목을 추가해주세요.
            </div>
          )}
        </div>
      )}
    </div>
  );
}