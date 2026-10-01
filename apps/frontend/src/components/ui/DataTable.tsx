import type { ReactNode } from 'react';

interface Column<T> {
  header: string;
  accessor: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({ columns, data, emptyMessage = 'Không có dữ liệu.', className = '' }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div
        style={{
          padding: 'var(--spacing-8)',
          textAlign: 'center',
          color: 'var(--color-slate-500)',
          border: '1px solid var(--color-slate-200)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'white',
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`table-container ${className}`.trim()}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={col.className}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {columns.map((col, colIdx) => (
                <td key={colIdx} className={col.className}>
                  {col.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
