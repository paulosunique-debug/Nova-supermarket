import React from 'react';
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePagination } from '../../hooks/usePagination';
import { useSortableTable } from '../../hooks/useSortableTable';
import { Checkbox } from './Checkbox';

export interface DataTableColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (row: T) => React.ReactNode;
  accessor?: (row: T) => string | number;
}

interface DataTableProps<T extends { id: string }> {
  columns: DataTableColumn<T>[];
  data: T[];
  pageSize?: number;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onRowClick?: (row: T) => void;
  bulkActions?: React.ReactNode;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  pageSize = 10,
  selectable,
  selectedIds,
  onSelectionChange,
  onRowClick,
  bulkActions,
  emptyMessage = 'No results found.'
}: DataTableProps<T>) {
  const { sorted, sortKey, direction, toggleSort } = useSortableTable(data);
  const { page, setPage, totalPages, paginated, total } = usePagination(sorted, pageSize);

  const allSelected = selectable && paginated.length > 0 && paginated.every((r) => selectedIds?.has(r.id));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (allSelected) {
      paginated.forEach((r) => next.delete(r.id));
    } else {
      paginated.forEach((r) => next.add(r.id));
    }
    onSelectionChange(next);
  };

  const toggleOne = (id: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  return (
    <div className="w-full">
      {selectable && selectedIds && selectedIds.size > 0 && bulkActions && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-market-200 bg-market-50 px-4 py-2 text-sm dark:border-market-800 dark:bg-market-900/30">
          <span className="font-medium text-market-700 dark:text-market-200">{selectedIds.size} selected</span>
          {bulkActions}
        </div>
      )}
      <div className="overflow-auto rounded-xl border border-slate2-100 dark:border-slate2-700">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate2-50 dark:bg-slate2-900">
            <tr>
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <Checkbox checked={!!allSelected} onChange={toggleAll} />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  style={{ width: col.width, resize: 'horizontal', overflow: 'hidden' }}
                  className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate2-400"
                >
                  {col.sortable ? (
                    <button
                      className="inline-flex items-center gap-1 hover:text-slate2-700 dark:hover:text-slate2-200"
                      onClick={() => toggleSort(col.key as keyof T)}
                    >
                      {col.header}
                      {sortKey === col.key &&
                        (direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate2-100 dark:divide-slate2-700">
            {paginated.length === 0 && (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-10 text-center text-slate2-400">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {paginated.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'transition-colors hover:bg-slate2-50 dark:hover:bg-slate2-700/40',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {selectable && (
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={!!selectedIds?.has(row.id)} onChange={() => toggleOne(row.id)} />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={String(col.key)} className="whitespace-nowrap px-4 py-3 text-slate2-700 dark:text-slate2-200">
                    {col.render ? col.render(row) : String((row as any)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm text-slate2-400">
          <span>
            Page {page} of {totalPages} · {total} results
          </span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate2-200 disabled:opacity-40 dark:border-slate2-600"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate2-200 disabled:opacity-40 dark:border-slate2-600"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
