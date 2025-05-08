"use client";

import React, { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { 
  getSettlementById, 
  getKurlySettlements, 
  getCoupangSettlements, 
  getGeneralSettlementColumns,
  updateSettlement,
  updateKurlySettlement,
  updateCoupangSettlement,
  updateGeneralSettlement
} from '@/lib/settlements';
import KurlySettlementForm from '@/components/settlements/KurlySettlementForm';
import CoupangSettlementForm from '@/components/settlements/CoupangSettlementForm';
import GeneralSettlementForm from '@/components/settlements/GeneralSettlementForm';
import Link from 'next/link';
import { 
  CreateKurlySettlementDTO, 
  CreateCoupangSettlementDTO, 
  CreateGeneralSettlementDTO,
  KurlySettlement,
  CoupangSettlement,
  Settlement
} from '@/lib/types/settlement';

export default function EditSettlementPage({
  params
}: {
  params: { id: string }
}) {
  const { id } = params;
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const settlementData = await getSettlementById(id);
        setSettlement(settlementData);
        
        const type = settlementData.settlement_type;
        
        if (type === 'kurly') {
          const kurlySettlements = await getKurlySettlements(id);
          if (kurlySettlements.length > 0) {
            setInitialData(kurlySettlements[0]);
          }
        } else if (type === 'coupang') {
          const coupangSettlements = await getCoupangSettlements(id);
          if (coupangSettlements.length > 0) {
            setInitialData(coupangSettlements[0]);
          }
        } else if (type === 'general') {
          const generalData = await getGeneralSettlementColumns(id);
          setInitialData(generalData);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to load settlement:', err);
        setError('정산 데이터를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    }
    
    loadData();
  }, [id]);
  
  const handleUpdateKurlySettlement = async (data: CreateKurlySettlementDTO) => {
    try {
      // Update the settlement date
      await updateSettlement(id, data.settlement_date);
      
      // Update the kurly settlement details
      if (initialData && initialData.id) {
        await updateKurlySettlement(initialData.id, data);
      }
      
      // Redirect to the settlements page
      redirect('/dashboard/settlements');
    } catch (error) {
      console.error('Failed to update Kurly settlement:', error);
      setError('정산 데이터 업데이트 중 오류가 발생했습니다.');
    }
  };
  
  const handleUpdateCoupangSettlement = async (data: CreateCoupangSettlementDTO) => {
    try {
      // Update the settlement date
      await updateSettlement(id, data.settlement_date);
      
      // Update the coupang settlement details
      if (initialData && initialData.id) {
        await updateCoupangSettlement(initialData.id, data);
      }
      
      // Redirect to the settlements page
      redirect('/dashboard/settlements');
    } catch (error) {
      console.error('Failed to update Coupang settlement:', error);
      setError('정산 데이터 업데이트 중 오류가 발생했습니다.');
    }
  };
  
  const handleUpdateGeneralSettlement = async (data: CreateGeneralSettlementDTO) => {
    try {
      // General settlements don't have a specific date, so we keep the existing one
      
      // Update the general settlement details
      await updateGeneralSettlement(id, data);
      
      // Redirect to the settlements page
      redirect('/dashboard/settlements');
    } catch (error) {
      console.error('Failed to update General settlement:', error);
      setError('정산 데이터 업데이트 중 오류가 발생했습니다.');
    }
  };

  const handleCancel = () => {
    redirect('/dashboard/settlements');
  };

  // Title based on settlement type
  const getTitle = () => {
    if (!settlement) return '정산 수정';
    
    switch (settlement.settlement_type) {
      case 'kurly':
        return '컬리 정산 수정';
      case 'coupang':
        return '쿠팡 정산 수정';
      case 'general':
        return '편집용 정산 수정';
      default:
        return '정산 수정';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-10">
          <p className="text-gray-600">정산 데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
        <div className="mt-4">
          <Link
            href="/dashboard/settlements"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{getTitle()}</h1>
        <div>
          <Link
            href="/dashboard/settlements"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        {settlement && settlement.settlement_type === 'kurly' && initialData && (
          <KurlySettlementForm 
            initialData={initialData}
            onSubmit={handleUpdateKurlySettlement} 
            onCancel={handleCancel} 
          />
        )}
        
        {settlement && settlement.settlement_type === 'coupang' && initialData && (
          <CoupangSettlementForm 
            initialData={initialData}
            onSubmit={handleUpdateCoupangSettlement} 
            onCancel={handleCancel} 
          />
        )}
        
        {settlement && settlement.settlement_type === 'general' && initialData && (
          <GeneralSettlementForm 
            initialData={initialData}
            onSubmit={handleUpdateGeneralSettlement} 
            onCancel={handleCancel} 
          />
        )}
        
        {(!settlement || !initialData) && (
          <div className="text-center p-6">
            <p className="text-red-500">정산 데이터를 불러올 수 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}