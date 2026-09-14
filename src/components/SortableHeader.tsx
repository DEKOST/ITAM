import React from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  column: string;
  direction: SortDirection;
}

interface SortableHeaderProps {
  column: string;
  label: string;
  currentSort: SortConfig | null;
  onSort: (column: string) => void;
  className?: string;
}

export default function SortableHeader({ 
  column, 
  label, 
  currentSort, 
  onSort, 
  className = '' 
}: SortableHeaderProps) {
  const isActive = currentSort?.column === column;
  const direction = isActive ? currentSort.direction : null;

  return (
    <th 
      className={`text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors select-none ${className}`}
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        <div className="flex flex-col">
          <svg 
            className={`w-3 h-3 ${direction === 'asc' ? 'text-blue-600' : 'text-gray-400'}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path d="M5 10l5-5 5 5H5z" />
          </svg>
          <svg 
            className={`w-3 h-3 ${direction === 'desc' ? 'text-blue-600' : 'text-gray-400'}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path d="M5 10l5 5 5-5H5z" />
          </svg>
        </div>
      </div>
    </th>
  );
}

// Утилита для сортировки данных
export function sortData<T>(
  data: T[],
  sortConfig: SortConfig | null,
  getValue: (item: T, column: string) => string | number
): T[] {
  if (!sortConfig || !sortConfig.direction) {
    return data;
  }

  return [...data].sort((a, b) => {
    const aVal = getValue(a, sortConfig.column);
    const bVal = getValue(b, sortConfig.column);

    let comparison = 0;
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal, 'ru');
    } else if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal;
    } else {
      comparison = String(aVal).localeCompare(String(bVal), 'ru');
    }

    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });
}
