import React from 'react';
import { redirect } from 'next/navigation';
import { createSettlement, createKurlySettlement, createCoupangSettlement, createGeneralSettlement } from '@/lib/settlements';
import KurlySettlementForm from '@/components/settlements/KurlySettlementForm';
import CoupangSettlementForm from '@/components/settlements/CoupangSettlementForm';
import GeneralSettlementForm from '@/components/settlements/GeneralSettlementForm';
import Link from 'next/link';
import { CreateKurlySettlementDTO, CreateCoupangSettlementDTO, CreateGeneralSettlementDTO } from '@/lib/types/settlement';

export default function NewSettlementPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const type = searchParams.type as string || 'kurly';
  
  // Server actions for form submissions
  const handleCreateKurlySettlement = async (data: CreateKurlySettlementDTO) => {
    'use server';
    try {
      // First create the settlement record
      const settlement = await createSettlement(data.settlement_date, 'kurly');
      
      // Then create the kurly settlement details
      await createKurlySettlement(settlement.id, data);
      
      // Redirect to the settlements page
      redirect('/dashboard/settlements');
    } catch (error) {
      console.error('Failed to create Kurly settlement:', error);
      throw error;
    }
  };
  
  const handleCreateCoupangSettlement = async (data: CreateCoupangSettlementDTO) => {
    'use server';
    try {
      // First create the settlement record
      const settlement = await createSettlement(data.settlement_date, 'coupang');
      
      // Then create the coupang settlement details
      await createCoupangSettlement(settlement.id, data);
      
      // Redirect to the settlements page
      redirect('/dashboard/settlements');
    } catch (error) {
      console.error('Failed to create Coupang settlement:', error);
      throw error;
    }
  };
  
  const handleCreateGeneralSettlement = async (data: CreateGeneralSettlementDTO) => {
    'use server';
    try {
      // First create the settlement record
      const today = new Date().toISOString().split('T')[0];
      const settlement = await createSettlement(today, 'general');
      
      // Then create the general settlement details
      await createGeneralSettlement(settlement.id, data);
      
      // Redirect to the settlements page
      redirect('/dashboard/settlements');
    } catch (error) {
      console.error('Failed to create General settlement:', error);
      throw error;
    }
  };

  // Title based on settlement type
  const getTitle = () => {
    switch (type) {
      case 'kurly':
        return '컬리 정산 추가';
      case 'coupang':
        return '쿠팡 정산 추가';
      case 'general':
        return '편집용 정산 추가';
      default:
        return '정산 추가';
    }
  };

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
        {type === 'kurly' && (
          <KurlySettlementForm 
            onSubmit={handleCreateKurlySettlement} 
            onCancel={() => redirect('/dashboard/settlements')} 
          />
        )}
        
        {type === 'coupang' && (
          <CoupangSettlementForm 
            onSubmit={handleCreateCoupangSettlement} 
            onCancel={() => redirect('/dashboard/settlements')} 
          />
        )}
        
        {type === 'general' && (
          <GeneralSettlementForm 
            onSubmit={handleCreateGeneralSettlement} 
            onCancel={() => redirect('/dashboard/settlements')} 
          />
        )}
      </div>
    </div>
  );
}
