import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Transaction {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  status: 'success' | 'failure' | 'pending';
  statusCode?: number;
  duration?: number;
  error?: string;
  userId?: string;
  conversationId?: string;
  requestBody?: any;
  responseBody?: any;
}

export const Monitor: FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failure'>('all');
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();

    if (autoRefresh) {
      const interval = setInterval(loadTransactions, 2000); // Refresh every 2 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadTransactions = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/monitor/transactions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  };

  const retryTransaction = async (id: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/monitor/retry/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        loadTransactions();
      }
    } catch (err) {
      console.error('Failed to retry transaction:', err);
    }
  };

  const retryAll = async () => {
    const failedIds = transactions.filter(t => t.status === 'failure').map(t => t.id);
    for (const id of failedIds) {
      await retryTransaction(id);
    }
  };

  const clearAll = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/monitor/clear`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setTransactions([]);
    } catch (err) {
      console.error('Failed to clear transactions:', err);
    }
  };

  const filteredTransactions = transactions.filter(t =>
    filter === 'all' || t.status === filter
  );

  const stats = {
    total: transactions.length,
    success: transactions.filter(t => t.status === 'success').length,
    failure: transactions.filter(t => t.status === 'failure').length,
    pending: transactions.filter(t => t.status === 'pending').length,
  };

  return (
    <div className="min-h-screen bg-gradient-main">
      {/* Header */}
      <div className="bg-white border-b border-card-border p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <button
                onClick={() => navigate('/chat')}
                className="text-text-secondary hover:text-navy mb-2"
              >
                ← Back to Chat
              </button>
              <h1 className="text-2xl font-light text-navy tracking-wide">
                🔍 Server Monitor
              </h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-button text-sm ${
                  autoRefresh
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-700'
                }`}
              >
                {autoRefresh ? '🔄 Auto-refresh ON' : '⏸ Auto-refresh OFF'}
              </button>
              <button
                onClick={loadTransactions}
                className="px-4 py-2 bg-blue-500 text-white rounded-button text-sm hover:bg-blue-600"
              >
                🔃 Refresh Now
              </button>
              <button
                onClick={retryAll}
                className="px-4 py-2 bg-orange-500 text-white rounded-button text-sm hover:bg-orange-600"
                disabled={stats.failure === 0}
              >
                ⟲ Retry All ({stats.failure})
              </button>
              <button
                onClick={clearAll}
                className="px-4 py-2 bg-red-500 text-white rounded-button text-sm hover:bg-red-600"
              >
                🗑 Clear All
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-background p-4 rounded-card">
              <div className="text-xs uppercase tracking-widest text-text-secondary mb-1">
                Total
              </div>
              <div className="text-2xl font-light text-navy">{stats.total}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-card">
              <div className="text-xs uppercase tracking-widest text-green-700 mb-1">
                Success
              </div>
              <div className="text-2xl font-light text-green-600">{stats.success}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-card">
              <div className="text-xs uppercase tracking-widest text-red-700 mb-1">
                Failure
              </div>
              <div className="text-2xl font-light text-red-600">{stats.failure}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-card">
              <div className="text-xs uppercase tracking-widest text-yellow-700 mb-1">
                Pending
              </div>
              <div className="text-2xl font-light text-yellow-600">{stats.pending}</div>
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-button text-sm ${
                filter === 'all'
                  ? 'bg-gradient-navy text-white'
                  : 'bg-background text-navy'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-4 py-2 rounded-button text-sm ${
                filter === 'success'
                  ? 'bg-green-600 text-white'
                  : 'bg-background text-navy'
              }`}
            >
              Success Only
            </button>
            <button
              onClick={() => setFilter('failure')}
              className={`px-4 py-2 rounded-button text-sm ${
                filter === 'failure'
                  ? 'bg-red-600 text-white'
                  : 'bg-background text-navy'
              }`}
            >
              Failures Only
            </button>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="bg-white rounded-card p-8 text-center">
              <p className="text-text-muted">No transactions to display</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className={`bg-white rounded-card p-4 border-l-4 ${
                  tx.status === 'success'
                    ? 'border-green-500'
                    : tx.status === 'failure'
                    ? 'border-red-500'
                    : 'border-yellow-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          tx.status === 'success'
                            ? 'bg-green-100 text-green-700'
                            : tx.status === 'failure'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {tx.status.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono">
                        {tx.method}
                      </span>
                      <span className="text-sm font-mono text-navy">
                        {tx.endpoint}
                      </span>
                      {tx.statusCode && (
                        <span className="text-xs text-text-muted">
                          [{tx.statusCode}]
                        </span>
                      )}
                      {tx.duration && (
                        <span className="text-xs text-text-muted">
                          {tx.duration}ms
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-muted space-y-1">
                      <div>
                        🕐 {new Date(tx.timestamp).toLocaleString()}
                      </div>
                      {tx.userId && (
                        <div>
                          👤 User: {tx.userId.substring(0, 8)}...
                        </div>
                      )}
                      {tx.conversationId && (
                        <div>
                          💬 Conv: {tx.conversationId.substring(0, 8)}...
                        </div>
                      )}
                      {tx.error && (
                        <div className="text-red-600 font-mono text-xs mt-2">
                          ❌ {tx.error}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {(tx.requestBody || tx.responseBody) && (
                      <button
                        onClick={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)}
                        className="px-3 py-1 bg-blue-500 text-white rounded-button text-xs hover:bg-blue-600"
                      >
                        {expandedTx === tx.id ? '▼ Hide' : '▶ Show JSON'}
                      </button>
                    )}
                    {tx.status === 'failure' && (
                      <button
                        onClick={() => retryTransaction(tx.id)}
                        className="px-3 py-1 bg-orange-500 text-white rounded-button text-xs hover:bg-orange-600"
                      >
                        ⟲ Retry
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded JSON content */}
                {expandedTx === tx.id && (tx.requestBody || tx.responseBody) && (
                  <div className="mt-3 pt-3 border-t border-card-border space-y-3">
                    {tx.requestBody && (
                      <div>
                        <div className="text-xs font-medium text-navy mb-1">📤 Request Body:</div>
                        <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto font-mono">
                          {JSON.stringify(tx.requestBody, null, 2)}
                        </pre>
                      </div>
                    )}
                    {tx.responseBody && (
                      <div>
                        <div className="text-xs font-medium text-navy mb-1">📥 Response Body:</div>
                        <pre className="bg-gray-900 text-blue-400 p-3 rounded text-xs overflow-x-auto font-mono">
                          {JSON.stringify(tx.responseBody, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
