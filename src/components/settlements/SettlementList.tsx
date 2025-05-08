"use client";

import React from 'react';
import { Settlement } from '@/lib/types/settlement';
import Link from 'next/link';

interface SettlementListProps {
  settlements: Settlement[];
  onDeleteSettlement: (id: string) => void;
}

const SettlementList: React.FC<SettlementListProps> = ({
  settlements,
  onDeleteSettlement,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getSettlementTypeName = (type: string) => {
    switch (type) {
      case 'kurly':
        return '컬리';
      case 'coupang':
        return '쿠팡';
      case 'general':
        return '정산서(편집용)';
      default:
        return type;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              날짜
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              유형
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              작성일
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              작업
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {settlements.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                정산 데이터가 없습니다.
              </td>
            </tr>
          ) : (
            settlements.map((settlement) => (
              <tr key={settlement.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatDate(settlement.settlement_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getSettlementTypeName(settlement.settlement_type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(settlement.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/dashboard/settlements/${settlement.id}`}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    보기
                  </Link>
                  <Link
                    href={`/dashboard/settlements/edit/${settlement.id}`}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    수정
                  </Link>
                  <button
                    onClick={() => onDeleteSettlement(settlement.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SettlementList;