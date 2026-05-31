'use client';
import React from 'react';
import { useCSVExport } from '@/hooks/useCSVExport';

interface CSVExportButtonProps {
  data: any[];
  filename?: string;
  className?: string;
  children?: React.ReactNode;
  onExportStart?: () => void;
  onExportComplete?: (success: boolean) => void;
  disabled?: boolean;
}

export function CSVExportButton({
  data,
  filename = 'export',
  className = '',
  children,
  onExportStart,
  onExportComplete,
  disabled = false
}: CSVExportButtonProps) {
  const { exportToCSV, exporting } = useCSVExport();

  const handleExport = async () => {
    onExportStart?.();
    
    const success = await exportToCSV(data, { 
      filename,
      includeTimestamp: true 
    });
    
    onExportComplete?.(success);
  };

  const defaultClassName = "rounded-xl border border-emerald-400 bg-emerald-100 px-6 py-3 font-semibold text-emerald-900 transition-all duration-200 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:border-[#d6dde5] disabled:bg-[#eef3f8] disabled:text-[#788896]";

  return (
    <button
      onClick={handleExport}
      disabled={disabled || exporting}
      className={className || defaultClassName}
    >
      {exporting ? (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-900 border-t-transparent"></div>
          Exporting...
        </div>
      ) : (
        children || 'Export CSV'
      )}
    </button>
  );
}
