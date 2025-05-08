import React from 'react';
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
  CreateGeneralSettlementDTO 
} from '@/lib/types/settlement';

export const dynamic = 'force-dynamic';

export default async function EditSettlementPage({
  params
}: {
  params: { id: string }
}) {
  const { id } = params;
  
  try {
    const settlement = await getSettlementById(id);
    const type = settlement.settlement_type;
    
    // Prepare data based on settlement type
    let initialData: any = null;
    
    if (type === 'kurly') {
      const kurlySettlements = await getKurlySettlements(id);
      if (kurlySettlements.length > 0) {
        initialData = kurlySettlements[0];
      }
    } else if (type === 'coupang') {
      const coupangSettlements = await getCoupangSettlements(id);
      if (coupangSettlements.length > 0) {
        initialData = coupangSettlements[0];
      }
    } else if (type === 'general') {
      initialData = await getGeneralSettlementColumns(id);
    }
    
    // Server actions for form submissions
    const handleUpdateKurlySettlement = async (data: CreateKurlySettlementDTO) => {
      'use server';
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
        throw error;
      }
    };
    
    const handleUpdateCoupangSettlement = async (data: CreateCoupangSettlementDTO) => {
      'use server';
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
        throw error;
      }
    };
    
    const handleUpdateGeneralSettlement = async (data: CreateGeneralSettlementDTO) => {
      'use server';
      try {
        // General settlements don't have a specific date, so we keep the existing one
        
        // Update the general settlement details
        await updateGeneralSettlement(id, data);
        
        // Redirect to the settlements page
        redirect('/dashboard/settlements');
      } catch (error) {
        console.error('Failed to update General settlement:', error);
        throw error;
      }
    };

    // Title based on settlement type
    const getTitle = () => {
      switch (type) {
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
          {type === 'kurly' && initialData && (
            <KurlySettlementForm 
              initialData={initialData}
              onSubmit={handleUpdateKurlySettlement} 
              onCancel={() => redirect('/dashboard/settlements')} 
            />
          )}
          
          {type === 'coupang' && initialData && (
            <CoupangSettlementForm 
              initialData={initialData}
              onSubmit={handleUpdateCoupangSettlement} 
              onCancel={() => redirect('/dashboard/settlements')} 
            />
          )}
          
          {type === 'general' && initialData && (
            <GeneralSettlementForm 
              initialData={initialData}
              onSubmit={handleUpdateGeneralSettlement} 
              onCancel={() => redirect('/dashboard/settlements')} 
            />
          )}
          
          {!initialData && (
            <div className="text-center p-6">
              <p className="text-red-500">정산 데이터를 불러올 수 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Failed to load settlement:', error);
    redirect('/dashboard/settlements');
  }
}
