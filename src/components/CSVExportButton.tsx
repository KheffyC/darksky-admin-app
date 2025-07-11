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

  const defaultClassName = "bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <button
      onClick={handleExport}
      disabled={disabled || exporting}
      className={className || defaultClassName}
    >
      {exporting ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Exporting...
        </div>
      ) : (
        children || 'Export CSV'
      )}
    </button>
  );
}
