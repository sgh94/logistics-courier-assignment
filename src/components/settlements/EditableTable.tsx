import React, { useState, useEffect } from 'react';
import { GeneralSettlementRow } from '@/lib/types/settlement';

interface EditableTableProps {
  columns: string[];
  rows: GeneralSettlementRow[];
  onChange: (columns: string[], rows: GeneralSettlementRow[]) => void;
}

const EditableTable: React.FC<EditableTableProps> = ({
  columns: initialColumns,
  rows: initialRows,
  onChange,
}) => {
  const [columns, setColumns] = useState<string[]>(initialColumns);
  const [rows, setRows] = useState<GeneralSettlementRow[]>(initialRows);
  const [newColumnName, setNewColumnName] = useState<string>('');

  useEffect(() => {
    // Update parent component when table data changes
    onChange(columns, rows);
  }, [columns, rows, onChange]);

  const handleCellChange = (rowIndex: number, columnName: string, value: string) => {
    const newRows = [...rows];
    newRows[rowIndex] = {
      ...newRows[rowIndex],
      [columnName]: value,
    };
    setRows(newRows);
  };

  const addRow = () => {
    const newRow: GeneralSettlementRow = { row_id: rows.length };
    columns.forEach((col) => {
      newRow[col] = '';
    });
    setRows([...rows, newRow]);
  };

  const removeRow = (rowIndex: number) => {
    const newRows = [...rows];
    newRows.splice(rowIndex, 1);
    setRows(newRows);
  };

  const addColumn = () => {
    if (!newColumnName.trim()) return;
    
    if (columns.includes(newColumnName)) {
      alert('Column already exists');
      return;
    }
    
    setColumns([...columns, newColumnName]);
    
    // Add the new column to all existing rows
    const newRows = rows.map((row) => ({
      ...row,
      [newColumnName]: '',
    }));
    
    setRows(newRows);
    setNewColumnName('');
  };

  const removeColumn = (columnName: string) => {
    const newColumns = columns.filter((col) => col !== columnName);
    setColumns(newColumns);
    
    // Remove the column from all rows
    const newRows = rows.map((row) => {
      const newRow = { ...row };
      delete newRow[columnName];
      return newRow;
    });
    
    setRows(newRows);
  };

  return (
    <div className="overflow-x-auto">
      <div className="mb-4 flex space-x-2">
        <input
          type="text"
          value={newColumnName}
          onChange={(e) => setNewColumnName(e.target.value)}
          placeholder="New column name"
          className="border p-2 rounded"
        />
        <button
          onClick={addColumn}
          className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600"
        >
          Add Column
        </button>
        <button
          onClick={addRow}
          className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
        >
          Add Row
        </button>
      </div>
      
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-center">Actions</th>
            {columns.map((column, colIdx) => (
              <th key={colIdx} className="border p-2">
                <div className="flex items-center justify-between">
                  <span>{column}</span>
                  <button
                    onClick={() => removeColumn(column)}
                    className="text-red-500 ml-2 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border p-2 text-center">
                <button
                  onClick={() => removeRow(rowIdx)}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </td>
              {columns.map((column, colIdx) => (
                <td key={colIdx} className="border p-2">
                  <input
                    type="text"
                    value={row[column]?.toString() || ''}
                    onChange={(e) => handleCellChange(rowIdx, column, e.target.value)}
                    className="w-full p-1 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EditableTable;
