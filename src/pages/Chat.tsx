import type { FC, FormEvent } from 'react';
import { useEffect, useState, useRef } from 'react';
import type { Message } from '../types';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';

export const Chat: FC = () => {
  const { user, logout } = useAuthStore();
  const {
    conversations,
    currentConversation,
    isLoading,
    isStreaming,
    streamingContent,
    error,
    loadConversations,
    loadConversation,
    createConversation,
    sendMessage,
    deleteConversation,
    clearError,
  } = useChatStore();

  const [messageInput, setMessageInput] = useState('');
  const [showCommandHints, setShowCommandHints] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages, streamingContent]);

  // Show command hints when user types #
  useEffect(() => {
    setShowCommandHints(messageInput.startsWith('#'));
  }, [messageInput]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !currentConversation) {
      return;
    }

    const content = messageInput.trim();
    setMessageInput('');

    await sendMessage(currentConversation.id, content);
  };

  const handleNewConversation = async () => {
    const conversation = await createConversation('chat', 'New Conversation');
    await loadConversation(conversation.id);
  };

  const handleSelectConversation = async (id: string) => {
    await loadConversation(id);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      await deleteConversation(id);
    }
  };

  const allMessages: Message[] = [
    ...(currentConversation?.messages || []),
  ];

  // If streaming, add temporary assistant message
  if (isStreaming && streamingContent) {
    allMessages.push({
      id: 'streaming',
      conversation_id: currentConversation?.id || '',
      role: 'assistant',
      content: streamingContent,
      created_at: new Date().toISOString(),
    });
  }

  return (
    <div className="h-screen bg-gradient-main flex">
      {/* Sidebar - Conversation List */}
      <div className="w-80 bg-white border-r border-card-border flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-card-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-light text-navy tracking-wide">
              CLAUDINE
            </h1>
            <button
              onClick={logout}
              className="text-xs text-text-secondary hover:text-accent transition-colors uppercase tracking-widest"
            >
              Logout
            </button>
          </div>
          <p className="text-sm text-text-secondary">
            {user?.full_name || user?.email}
          </p>
        </div>

        {/* New Conversation Button */}
        <div className="p-4">
          <button
            onClick={handleNewConversation}
            className="w-full bg-gradient-navy text-white py-3 rounded-button font-light tracking-wide hover:shadow-button transition-all"
          >
            + New Conversation
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {isLoading && conversations.length === 0 ? (
            <div className="p-4 text-center text-text-muted">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-text-muted">
              No conversations yet
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`p-4 border-b border-card-border cursor-pointer hover:bg-background transition-colors ${
                  currentConversation?.id === conv.id ? 'bg-background' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-navy truncate">
                      {conv.title || 'Untitled'}
                    </h3>
                    <p className="text-xs text-text-muted truncate mt-1">
                      {conv.latest_message?.content || 'No messages'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    className="ml-2 text-text-muted hover:text-accent transition-colors"
                  >
                    ×
                  </button>
                </div>
                <p className="text-xs text-text-muted mt-2">
                  {new Date(conv.updated_at).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-card-border p-6">
              <h2 className="text-lg font-light text-navy tracking-wide">
                {currentConversation.title || 'Conversation'}
              </h2>
              <p className="text-xs text-text-muted uppercase tracking-widest mt-1">
                {currentConversation.mode} mode
              </p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {allMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-2xl rounded-card p-4 ${
                      message.role === 'user'
                        ? 'bg-gradient-navy text-white'
                        : 'bg-white shadow-card border border-card-border text-navy'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                      {message.id === 'streaming' && (
                        <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
                      )}
                    </p>
                    <p
                      className={`text-xs mt-2 ${
                        message.role === 'user'
                          ? 'text-white/70'
                          : 'text-text-muted'
                      }`}
                    >
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Error Display */}
            {error && (
              <div className="px-6 py-3 bg-red-50 border-t border-red-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-red-600">{error}</p>
                  <button
                    onClick={clearError}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Command Hints */}
            {showCommandHints && (
              <div className="px-6 py-3 bg-accent/10 border-t border-accent/20">
                <p className="text-xs text-accent uppercase tracking-widest mb-2">
                  Available Commands:
                </p>
                <div className="flex gap-2">
                  <span className="text-xs bg-white px-3 py-1 rounded-button text-navy">
                    #calendar - Manage calendar events
                  </span>
                  <span className="text-xs bg-white px-3 py-1 rounded-button text-navy">
                    #note - Take notes
                  </span>
                  <span className="text-xs bg-white px-3 py-1 rounded-button text-navy">
                    #scan - Scan documents
                  </span>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="bg-white border-t border-card-border p-6">
              <form onSubmit={handleSendMessage} className="flex gap-4">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  disabled={isStreaming}
                  placeholder="Type a message... (try #calendar, #note, #scan)"
                  className="flex-1 px-4 py-3 bg-background border border-card-border rounded-input text-navy focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isStreaming || !messageInput.trim()}
                  className="px-8 py-3 bg-gradient-navy text-white rounded-button font-light tracking-wide hover:shadow-button transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStreaming ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-light text-navy tracking-wide mb-4">
                Welcome to Claudine
              </h2>
              <p className="text-text-secondary mb-8">
                Select a conversation or create a new one to get started
              </p>
              <button
                onClick={handleNewConversation}
                className="px-8 py-3 bg-gradient-navy text-white rounded-button font-light tracking-wide hover:shadow-button transition-all"
              >
                Start New Conversation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
