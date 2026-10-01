'use client';
import React, { useState, useEffect } from 'react';

interface ImportLog {
  id: string;
  source: string;
  status: string;
  membersImported: number;
  errorsCount: number;
  errorDetails?: string;
  startedAt: string;
  completedAt?: string;
  triggeredBy?: string;
}

export function ImportHistory() {
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/integrations/history');
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Failed to load import history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-paid-line bg-paid-soft text-paid';
      case 'partial':
        return 'border-flag-line bg-flag-soft text-flag';
      case 'error':
        return 'border-behind-line bg-behind-soft text-behind';
      default:
        return 'border-neutral-300 bg-neutral-100 text-neutral-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDuration = (startedAt: string, completedAt?: string) => {
    if (!completedAt) return 'Running...';
    
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const duration = Math.round((end.getTime() - start.getTime()) / 1000);
    
    return `${duration}s`;
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-line bg-white p-6">
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold tracking-[-0.03em] text-black">Import History</h3>
        <button
          onClick={loadHistory}
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-semibold text-black transition-colors duration-200 hover:bg-wash"
        >
          Refresh
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="py-8 text-center text-muted">
          No import history found
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="rounded-lg border border-line bg-wash p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold uppercase tracking-[0.2em] ${getStatusColor(log.status)}`}>
                    {log.status}
                  </span>
                  <span className="font-medium text-black">
                    {log.source.charAt(0).toUpperCase() + log.source.slice(1)} Import
                  </span>
                </div>
                <span className="text-sm text-muted">
                  {formatDate(log.startedAt)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex gap-4">
                  <span className="font-semibold text-ink">
                    ✓ {log.membersImported} imported
                  </span>
                  {log.errorsCount > 0 && (
                    <span className="font-semibold text-behind">
                      ✗ {log.errorsCount} errors
                    </span>
                  )}
                </div>
                <div className="flex gap-4 text-muted">
                  <span>Duration: {getDuration(log.startedAt, log.completedAt)}</span>
                  {log.triggeredBy && (
                    <span>By: {log.triggeredBy}</span>
                  )}
                </div>
              </div>

              {log.errorDetails && (
                <div className="mt-3 rounded-lg border border-behind-line bg-behind-soft p-3">
                  <details>
                    <summary className="cursor-pointer font-semibold text-behind">
                      View Error Details
                    </summary>
                    <div className="mt-2 text-sm text-behind">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(JSON.parse(log.errorDetails), null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImportHistory;
