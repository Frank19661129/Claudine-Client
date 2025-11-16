import type { FC, FormEvent } from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Message } from '../types';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { api } from '../services/api/client';
import { Header } from '../components/Header';

export const Chat: FC = () => {
  const navigate = useNavigate();
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
  const messageInputRef = useRef<HTMLInputElement>(null);

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

  // Auto-focus input field when conversation changes or after sending
  useEffect(() => {
    if (currentConversation && !isStreaming && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [currentConversation, isStreaming]);

  // Auto-generate title for chat conversations after first exchange
  useEffect(() => {
    const autoGenerateTitle = async () => {
      if (!currentConversation) return;

      // Only for chat mode
      if (currentConversation.mode !== 'chat') return;

      // Only if still has default title
      const hasDefaultTitle = currentConversation.title === 'New Conversation' ||
                             currentConversation.title === 'Nieuwe chat';
      if (!hasDefaultTitle) return;

      // Only if there are at least 2 messages (user + assistant)
      if (!currentConversation.messages || currentConversation.messages.length < 2) return;

      // Check if there's at least one assistant response
      const hasAssistantResponse = currentConversation.messages.some(
        msg => msg.role === 'assistant'
      );
      if (!hasAssistantResponse) return;

      // Generate title
      try {
        const result = await api.generateConversationTitle(currentConversation.id);
        if (result.success && result.title) {
          // Reload conversation to get updated title
          await loadConversation(currentConversation.id);
          // Also reload conversations list to show new title
          loadConversations();
        }
      } catch (err) {
        console.error('Failed to auto-generate title:', err);
      }
    };

    autoGenerateTitle();
  }, [currentConversation?.messages?.length, currentConversation?.id]);

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
    try {
      const conversation = await createConversation('chat', 'New Conversation');
      await loadConversation(conversation.id);
    } catch (err: any) {
      // Error is already shown in the UI via the store
      console.error('handleNewConversation error:', err);
    }
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

  const getConversationTitle = (conv: any) => {
    // Als er een custom title is die niet "New Conversation" is, gebruik die
    if (conv.title && conv.title !== 'New Conversation') {
      return conv.title;
    }

    // Anders bepaal op basis van mode in format "[Type]-chat"
    const modeMap: { [key: string]: string } = {
      'task': 'Taak-chat',
      'calendar': 'Afspraak-chat',
      'reminder': 'Herinnering-chat',
      'question': 'Vraag-chat',
      'note': 'Notitie-chat',
    };

    // Voor bekende types, gebruik de mapping
    if (conv.mode && modeMap[conv.mode]) {
      return modeMap[conv.mode];
    }

    // Voor "overige" (chat mode of onbekend), genereer een samenvatting
    // Als er messages zijn, gebruik de eerste user message als basis
    if (conv.latest_message?.content) {
      const content = conv.latest_message.content;
      // Maak een korte samenvatting (eerste 30 karakters)
      const summary = content.length > 30 ? content.substring(0, 30) + '...' : content;
      return summary;
    }

    return 'Nieuwe chat';
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
    <div className="h-screen bg-gradient-main flex flex-col">
      {/* Header */}
      <Header title="Chat" />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Conversation List */}
        <div className="w-80 bg-white border-r border-card-border flex flex-col">
          {/* Sidebar Header */}
          <div className="bg-white border-b border-card-border p-4">
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
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-navy truncate">
                        {getConversationTitle(conv)}
                      </h3>
                      <span className="text-xs text-text-muted ml-2 flex-shrink-0">
                        {new Date(conv.updated_at).toLocaleTimeString('nl-NL', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted truncate">
                      {conv.latest_message?.content || 'No messages yet'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    className="ml-2 text-text-muted hover:text-accent transition-colors flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
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
            <div
              className="flex-1 overflow-y-auto p-6 space-y-4 relative"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 200px,
                    rgba(26, 54, 93, 0.02) 200px,
                    rgba(26, 54, 93, 0.02) 400px
                  )
                `,
                backgroundSize: '400px 400px'
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Ctext x='60' y='90' font-family='Arial, sans-serif' font-size='32' fill='%231a365d' opacity='0.08' font-weight='300' letter-spacing='3'%3EGS.ai%3C/text%3E%3Ctext x='450' y='150' font-family='Arial, sans-serif' font-size='26' fill='%231a365d' opacity='0.08' font-weight='300' letter-spacing='2'%3EClaudine Assistent%3C/text%3E%3Ctext x='200' y='280' font-family='Arial, sans-serif' font-size='30' fill='%231a365d' opacity='0.07' font-weight='300' letter-spacing='3'%3EGS.ai%3C/text%3E%3Ctext x='520' y='400' font-family='Arial, sans-serif' font-size='28' fill='%231a365d' opacity='0.07' font-weight='300' letter-spacing='2'%3EClaudine Assistent%3C/text%3E%3Ctext x='100' y='500' font-family='Arial, sans-serif' font-size='32' fill='%231a365d' opacity='0.08' font-weight='300' letter-spacing='3'%3EGS.ai%3C/text%3E%3Ctext x='350' y='550' font-family='Arial, sans-serif' font-size='24' fill='%231a365d' opacity='0.07' font-weight='300' letter-spacing='2'%3EClaudine Assistent%3C/text%3E%3C/svg%3E")`,
                  backgroundRepeat: 'repeat',
                  backgroundSize: '800px 600px',
                  backgroundPosition: '0 0'
                }}
              />
              {allMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex relative z-10 ${
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
              <div ref={messagesEndRef} className="relative z-10" />
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
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs bg-white px-3 py-1 rounded-button text-navy">
                    #task - Create tasks
                  </span>
                  <span className="text-xs bg-white px-3 py-1 rounded-button text-navy">
                    #calendar - Manage calendar events
                  </span>
                  <span className="text-xs bg-white px-3 py-1 rounded-button text-navy">
                    #reminder - Set reminders
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
                  ref={messageInputRef}
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  disabled={isStreaming}
                  placeholder="Type a message... (try #task, #calendar, #reminder)"
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
          /* No Conversation Selected - VIKI Welcome Screen */
          <div
            className="flex-1 flex items-center justify-center relative overflow-hidden"
            style={{
              backgroundImage: 'url(/claudine-bg.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: '#1a365d', // Fallback if image not loaded
            }}
          >
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/70 to-navy/80"></div>

            {/* Content */}
            <div className="relative z-10 text-center max-w-2xl px-8">
              {/* CLAUDINE Title */}
              <h1 className="text-7xl font-light text-white tracking-widest mb-4 drop-shadow-lg">
                CLAUDINE
              </h1>

              {/* Payoff with real smiley */}
              <p className="text-2xl text-white/90 mb-12 font-light tracking-wide">
                Hier om jou te helpen ;-)
              </p>

              {/* Divider line */}
              <div className="w-32 h-px bg-white/30 mx-auto mb-12"></div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <button
                  onClick={handleNewConversation}
                  className="w-full px-8 py-4 bg-gradient-navy text-white rounded-button font-light tracking-wide hover:shadow-button transition-all border border-white/20 hover:border-white/40"
                >
                  Nieuwe chat starten
                </button>

                {conversations.length > 0 && (
                  <p className="text-white/70 text-sm">
                    Of selecteer een bestaande chat in de lijst hiernaast
                  </p>
                )}
              </div>

              {/* Subtle hint text */}
              <p className="mt-12 text-white/50 text-xs tracking-wider">
                VIRTUAL INTERACTIVE KINETIC INTELLIGENCE
              </p>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
