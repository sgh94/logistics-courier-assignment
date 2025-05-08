import React from 'react';
import { redirect } from 'next/navigation';
import { 
  getSettlementById, 
  getKurlySettlements, 
  getCoupangSettlements, 
  getGeneralSettlementColumns
} from '@/lib/settlements';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default async function ViewSettlementPage({
  params
}: {
  params: { id: string }
}) {
  const { id } = params;
  
  try {
    const settlement = await getSettlementById(id);
    const type = settlement.settlement_type;
    
    let content = null;
    
    if (type === 'kurly') {
      const kurlySettlements = await getKurlySettlements(id);
      
      if (kurlySettlements.length > 0) {
        const data = kurlySettlements[0];
        
        content = (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-b p-3">
              <span className="font-bold">업체명:</span> {data.company_name}
            </div>
            <div className="border-b p-3">
              <span className="font-bold">날짜:</span> {formatDate(settlement.settlement_date)}
            </div>
            <div className="border-b p-3">
              <span className="font-bold">지원/대처:</span> {data.support_type || '-'}
            </div>
            <div className="border-b p-3">
              <span className="font-bold">금액(만원):</span> {data.amount ? formatCurrency(data.amount * 10000) : '-'}
            </div>
            <div className="border-b p-3">
              <span className="font-bold">정산금액:</span> {formatCurrency(data.settlement_amount)}
            </div>
            <div className="border-b p-3">
              <span className="font-bold">공급가:</span> {formatCurrency(data.supply_price)}
            </div>
            <div className="border-b p-3">
              <span className="font-bold">딜리건수:</span> {data.delivery_count || '-'}
            </div>
            <div className="border-b p-3">
              <span className="font-bold">단가:</span> {data.unit_price ? formatCurrency(data.unit_price) : '-'}
            </div>
            <div className="border-b p-3">
              <span className="font-bold">센터:</span> {data.center || '-'}
            </div>
            <div className="border-b p-3">
              <span className="font-bold">지역:</span> {data.region || '-'}
            </div>
            <div className="col-span-2 border-b p-3">
              <span className="font-bold">비고:</span> {data.note || '-'}
            </div>
          </div>
        );
      }
    } else if (type === 'coupang') {
      const coupangSettlements = await getCoupangSettlements(id);
      
      if (coupangSettlements.length > 0) {
        const data = coupangSettlements[0];
        
        content = (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-b p-3">
              <span className="font-bold">날짜:</span> {formatDate(data.settlement_date)}
            </div>
            <div className="border-b p-3">
              <span className="font-bold">주/야:</span> {data.day_or_night === 'day' ? '주간' : '야간'}
            </div>
            <div className="border-b p-3">
              <span className="font-bold">배송구역:</span> {data.delivery_area || '-'}
            </div>
            <div className="border-b p-3">
              <span className="font-bold">이름:</span> {data.courier_name}
            </div>
            <div className="border-b p-3">
              <span className="font-bold">건수:</span> {data.delivery_count}
            </div>
            <div className="border-b p-3">
              <span className="font-bold">단가(VAT별도):</span> {formatCurrency(data.unit_price)}
            </div>
            <div className="border-b p-3">
              <span className="font-bold">공급가:</span> {formatCurrency(data.supply_price)}
            </div>
            <div className="border-b p-3">
              <span className="font-bold">부가세:</span> {formatCurrency(data.vat)}
            </div>
            <div className="border-b p-3">
              <span className="font-bold">합계:</span> {formatCurrency(data.total_amount)}
            </div>
            <div className="border-b p-3">
              <span className="font-bold">수익금:</span> {formatCurrency(data.profit)}
            </div>
            <div className="border-b p-3">
              <span className="font-bold">계산서:</span> {data.invoice_status || '-'}
            </div>
            <div className="border-b p-3">
              <span className="font-bold">입금형태:</span> {data.payment_type || '-'}
            </div>
            <div className="border-b p-3">
              <span className="font-bold">거래처(입금처):</span> {data.transaction_partner || '-'}
            </div>
            <div className="border-b p-3">
              <span className="font-bold">반품건수:</span> {data.return_count || '0'}
            </div>
            <div className="border-b p-3">
              <span className="font-bold">캠프:</span> {data.camp || '-'}
            </div>
            <div className="border-b p-3">
              <span className="font-bold">라우트:</span> {data.route_id || '-'}
            </div>
            <div className="border-b p-3">
              <span className="font-bold">PDD:</span> {data.pdd || '-'}
            </div>
            <div className="col-span-3 border-b p-3">
              <span className="font-bold">비고:</span> {data.note || '-'}
            </div>
          </div>
        );
      }
    } else if (type === 'general') {
      const { columns, rows } = await getGeneralSettlementColumns(id);
      
      if (columns.length > 0 && rows.length > 0) {
        content = (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  {columns.map((column, index) => (
                    <th key={index} className="border p-2 text-left">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {columns.map((column, colIndex) => (
                      <td key={colIndex} className="border p-2">
                        {row[column]?.toString() || ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }

    // Title based on settlement type
    const getTitle = () => {
      switch (type) {
        case 'kurly':
          return '컬리 정산 상세';
        case 'coupang':
          return '쿠팡 정산 상세';
        case 'general':
          return '편집용 정산 상세';
        default:
          return '정산 상세';
      }
    };

    return (
      <div className="container mx-auto p-4">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{getTitle()}</h1>
          <div className="space-x-2">
            <Link
              href={`/dashboard/settlements/edit/${id}`}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              수정
            </Link>
            <Link
              href="/dashboard/settlements"
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              목록으로 돌아가기
            </Link>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          {content ? (
            content
          ) : (
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
