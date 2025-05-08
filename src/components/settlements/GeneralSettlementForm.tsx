"use client";

import React, { useState, useEffect } from 'react';
import { GeneralSettlementRow, CreateGeneralSettlementDTO } from '@/lib/types/settlement';
import EditableTable from './EditableTable';

interface GeneralSettlementFormProps {
  initialData?: { columns: string[]; rows: GeneralSettlementRow[] };
  onSubmit: (data: CreateGeneralSettlementDTO) => void;
  onCancel: () => void;
}

const GeneralSettlementForm: React.FC<GeneralSettlementFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [columns, setColumns] = useState<string[]>(
    initialData?.columns || ['날짜', '이름', '금액', '비고']
  );
  
  const [rows, setRows] = useState<GeneralSettlementRow[]>(
    initialData?.rows || [{ row_id: 0 }]
  );

  useEffect(() => {
    if (initialData) {
      setColumns(initialData.columns);
      setRows(initialData.rows);
    }
  }, [initialData]);

  const handleTableChange = (newColumns: string[], newRows: GeneralSettlementRow[]) => {
    setColumns(newColumns);
    setRows(newRows);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      columns,
      rows,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-4 rounded-md border">
        <h3 className="text-lg font-medium mb-4">정산서 데이터 편집</h3>
        <EditableTable 
          columns={columns}
          rows={rows}
          onChange={handleTableChange}
        />
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

export default GeneralSettlementForm;