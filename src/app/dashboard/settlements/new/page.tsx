"use client";

import React from 'react';
import { redirect } from 'next/navigation';
import { createSettlement, createKurlySettlement, createCoupangSettlement, createGeneralSettlement } from '@/lib/settlements';
import KurlySettlementForm from '@/components/settlements/KurlySettlementForm';
import CoupangSettlementForm from '@/components/settlements/CoupangSettlementForm';
import GeneralSettlementForm from '@/components/settlements/GeneralSettlementForm';
import Link from 'next/link';
import { CreateKurlySettlementDTO, CreateCoupangSettlementDTO, CreateGeneralSettlementDTO } from '@/lib/types/settlement';
import { useSearchParams } from 'next/navigation';

export default function NewSettlementPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'kurly';
  
  // 비동기 핸들러 함수들 - 클라이언트 컴포넌트에서는 'use server'를 사용하지 않습니다
  const handleCreateKurlySettlement = async (data: CreateKurlySettlementDTO) => {
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

  const handleCancel = () => {
    redirect('/dashboard/settlements');
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
            onCancel={handleCancel} 
          />
        )}
        
        {type === 'coupang' && (
          <CoupangSettlementForm 
            onSubmit={handleCreateCoupangSettlement} 
            onCancel={handleCancel} 
          />
        )}
        
        {type === 'general' && (
          <GeneralSettlementForm 
            onSubmit={handleCreateGeneralSettlement} 
            onCancel={handleCancel} 
          />
        )}
      </div>
    </div>
  );
}