import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { api } from '../services/api/client';

interface InboxItem {
  id: string;
  type: string;
  source: string;
  status: string;
  priority: string;
  subject?: string;
  content?: string;
  ai_suggestion?: {
    action: string;
    confidence: number;
    reasoning: string;
    suggested_data: any;
  };
  created_at: string;
}

export const Inbox: FC = () => {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingItemId, setProcessingItemId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('unprocessed,pending_review');

  useEffect(() => {
    loadItems();
  }, [filterStatus]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await api.getInboxItems({
        status: filterStatus,
        limit: 100,
      });
      setItems(data.items || []);
    } catch (err) {
      console.error('Failed to load inbox items:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTestItem = async () => {
    try {
      await api.createInboxItem({
        type: 'manual',
        source: 'web',
        subject: 'Test inbox item',
        content: 'Dit is een test inbox item om de functionaliteit te testen.',
        priority: 'medium',
      });
      await loadItems();
    } catch (err) {
      console.error('Failed to create test item:', err);
    }
  };

  const requestSuggestion = async (itemId: string) => {
    try {
      setProcessingItemId(itemId);
      await api.requestAISuggestion(itemId);
      await loadItems();
    } catch (err) {
      console.error('Failed to request AI suggestion:', err);
      alert('Fout bij ophalen AI suggestie');
    } finally {
      setProcessingItemId(null);
    }
  };

  const acceptSuggestion = async (itemId: string) => {
    try {
      setProcessingItemId(itemId);
      const result = await api.acceptSuggestion(itemId);

      // Show success message
      if (result.created_item) {
        const itemType = result.created_item.type === 'task' ? 'taak' : 'notitie';
        alert(`✅ ${itemType.charAt(0).toUpperCase() + itemType.slice(1)} aangemaakt!`);
      } else {
        alert('✅ Item verwerkt!');
      }

      await loadItems();
    } catch (err) {
      console.error('Failed to accept suggestion:', err);
      alert('Fout bij accepteren suggestie');
    } finally {
      setProcessingItemId(null);
    }
  };

  const rejectItem = async (itemId: string) => {
    try {
      setProcessingItemId(itemId);
      await api.rejectInboxItem(itemId, 'Afgewezen door gebruiker');
      await loadItems();
    } catch (err) {
      console.error('Failed to reject item:', err);
      alert('Fout bij afwijzen item');
    } finally {
      setProcessingItemId(null);
    }
  };

  const archiveItem = async (itemId: string) => {
    try {
      setProcessingItemId(itemId);
      await api.archiveInboxItem(itemId);
      await loadItems();
    } catch (err) {
      console.error('Failed to archive item:', err);
      alert('Fout bij archiveren item');
    } finally {
      setProcessingItemId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unprocessed':
        return 'bg-gray-100 text-gray-700';
      case 'pending_review':
        return 'bg-blue-100 text-blue-700';
      case 'accepted':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'archived':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-orange-600';
      case 'urgent':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="h-screen bg-gradient-main flex flex-col">
      <Header title="Inbox" />

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
          {/* Actions Bar */}
          <div className="mb-6 flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('unprocessed,pending_review')}
                className={`px-4 py-2 rounded-button transition-colors ${
                  filterStatus === 'unprocessed,pending_review'
                    ? 'bg-navy text-white'
                    : 'bg-white text-navy hover:bg-navy/10'
                }`}
              >
                Te verwerken
              </button>
              <button
                onClick={() => setFilterStatus('accepted,rejected,archived')}
                className={`px-4 py-2 rounded-button transition-colors ${
                  filterStatus === 'accepted,rejected,archived'
                    ? 'bg-navy text-white'
                    : 'bg-white text-navy hover:bg-navy/10'
                }`}
              >
                Verwerkt
              </button>
              <button
                onClick={() => setFilterStatus('')}
                className={`px-4 py-2 rounded-button transition-colors ${
                  filterStatus === ''
                    ? 'bg-navy text-white'
                    : 'bg-white text-navy hover:bg-navy/10'
                }`}
              >
                Alles
              </button>
            </div>

            <button
              onClick={createTestItem}
              className="px-4 py-2 bg-accent text-white rounded-button hover:bg-accent/90 transition-colors"
            >
              + Test Item
            </button>
          </div>

          {/* Items List */}
          {loading ? (
            <div className="text-center py-12 text-text-secondary">
              Laden...
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <p className="text-lg">📭 Je inbox is leeg</p>
              <p className="text-sm mt-2">Geen items om te verwerken</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-card p-6 shadow-sm border border-card-border"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(item.status)}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                        <span className={`text-xs font-medium ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                        <span className="text-xs text-text-muted">
                          {item.type} • {item.source}
                        </span>
                      </div>
                      {item.subject && (
                        <h3 className="text-lg font-medium text-navy mb-2">
                          {item.subject}
                        </h3>
                      )}
                      {item.content && (
                        <p className="text-text-secondary text-sm">
                          {item.content}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* AI Suggestion */}
                  {item.ai_suggestion && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-2xl">🤖</span>
                        <div className="flex-1">
                          <p className="font-medium text-navy mb-1">
                            AI Suggestie: {item.ai_suggestion.action.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-text-secondary mb-2">
                            {item.ai_suggestion.reasoning}
                          </p>
                          <div className="text-xs text-text-muted">
                            Zekerheid: {Math.round(item.ai_suggestion.confidence * 100)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-card-border">
                    {item.status === 'unprocessed' && (
                      <button
                        onClick={() => requestSuggestion(item.id)}
                        disabled={processingItemId === item.id}
                        className="px-4 py-2 bg-navy text-white rounded-button hover:bg-navy/90 transition-colors disabled:opacity-50"
                      >
                        {processingItemId === item.id ? '⏳ Bezig...' : '🤖 AI Suggestie'}
                      </button>
                    )}

                    {item.status === 'pending_review' && item.ai_suggestion && (
                      <>
                        <button
                          onClick={() => acceptSuggestion(item.id)}
                          disabled={processingItemId === item.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-button hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          ✓ Accepteren
                        </button>
                        <button
                          onClick={() => rejectItem(item.id)}
                          disabled={processingItemId === item.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-button hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          ✗ Afwijzen
                        </button>
                      </>
                    )}

                    {(item.status === 'unprocessed' || item.status === 'pending_review') && (
                      <button
                        onClick={() => archiveItem(item.id)}
                        disabled={processingItemId === item.id}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-button hover:bg-gray-300 transition-colors disabled:opacity-50 ml-auto"
                      >
                        📦 Archiveren
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
