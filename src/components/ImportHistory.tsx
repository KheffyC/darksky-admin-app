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
        return 'text-green-400 bg-green-500/20 border-green-400/30';
      case 'partial':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30';
      case 'error':
        return 'text-red-400 bg-red-500/20 border-red-400/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
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
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-700">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Import History</h3>
        <button
          onClick={loadHistory}
          className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
        >
          Refresh
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No import history found
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(log.status)}`}>
                    {log.status}
                  </span>
                  <span className="text-white font-medium">
                    {log.source.charAt(0).toUpperCase() + log.source.slice(1)} Import
                  </span>
                </div>
                <span className="text-gray-400 text-sm">
                  {formatDate(log.startedAt)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex gap-4">
                  <span className="text-green-400">
                    ✓ {log.membersImported} imported
                  </span>
                  {log.errorsCount > 0 && (
                    <span className="text-red-400">
                      ✗ {log.errorsCount} errors
                    </span>
                  )}
                </div>
                <div className="flex gap-4 text-gray-400">
                  <span>Duration: {getDuration(log.startedAt, log.completedAt)}</span>
                  {log.triggeredBy && (
                    <span>By: {log.triggeredBy}</span>
                  )}
                </div>
              </div>

              {log.errorDetails && (
                <div className="mt-3 p-3 bg-red-900/20 rounded-lg border border-red-800/50">
                  <details>
                    <summary className="text-red-400 cursor-pointer font-medium">
                      View Error Details
                    </summary>
                    <div className="mt-2 text-sm text-red-300">
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
