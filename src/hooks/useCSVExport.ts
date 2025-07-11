import { useState } from 'react';
import { useToastNotifications } from './useToastNotifications';

interface CSVExportOptions {
  filename?: string;
  includeTimestamp?: boolean;
}

export function useCSVExport() {
  const [exporting, setExporting] = useState(false);
  const toast = useToastNotifications();

  const convertToCSV = (data: any[]): string => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => {
        // Handle values that might contain commas or quotes
        const stringValue = String(value ?? '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportToCSV = async (
    data: any[], 
    options: CSVExportOptions = {}
  ): Promise<boolean> => {
    try {
      setExporting(true);
      
      if (!data || data.length === 0) {
        toast.csvExportError('No data available to export');
        return false;
      }

      const timestamp = options.includeTimestamp !== false 
        ? new Date().toISOString().split('T')[0] 
        : '';
      
      const filename = options.filename 
        ? `${options.filename}${timestamp ? `-${timestamp}` : ''}.csv`
        : `export-${timestamp}.csv`;

      const csvContent = convertToCSV(data);
      downloadCSV(csvContent, filename);
      
      toast.csvExportSuccess(filename);
      return true;
    } catch (error) {
      console.error('CSV Export Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.csvExportError(errorMessage);
      return false;
    } finally {
      setExporting(false);
    }
  };

  return {
    exportToCSV,
    exporting
  };
}
