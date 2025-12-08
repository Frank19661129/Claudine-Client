import { create } from 'zustand';
import type { Conversation, ConversationDetail, Message } from '../types';
import { api } from '../services/api/client';
import { streamingService } from '../services/sse/streaming';
import type { ConfirmData } from '../services/sse/streaming';

interface PendingConfirmation extends ConfirmData {
  conversationId: string;
}

interface ChatState {
  conversations: Conversation[];
  currentConversation: ConversationDetail | null;
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;

  // Confirmation state for test_mode=2
  pendingConfirmation: PendingConfirmation | null;
  isConfirming: boolean;

  // Actions
  loadConversations: (mode?: string) => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  createConversation: (mode?: string, title?: string) => Promise<Conversation>;
  sendMessage: (conversationId: string, content: string, useStreaming?: boolean) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  clearError: () => void;
  setCurrentConversation: (conversation: ConversationDetail | null) => void;
  cleanupEmptyConversations: () => Promise<void>;

  // Confirmation actions
  confirmExecution: () => Promise<void>;
  cancelConfirmation: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  isLoading: false,
  isStreaming: false,
  streamingContent: '',
  error: null,
  pendingConfirmation: null,
  isConfirming: false,

  loadConversations: async (mode?: string) => {
    set({ isLoading: true, error: null });
    try {
      const conversations = await api.getConversations(mode);
      set({ conversations, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to load conversations';
      set({ error: errorMessage, isLoading: false });
    }
  },

  loadConversation: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const conversation = await api.getConversation(id);
      set({ currentConversation: conversation, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to load conversation';
      set({ error: errorMessage, isLoading: false });
    }
  },

  createConversation: async (mode: string = 'chat', title?: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Creating conversation with:', { mode, title });
      const conversation = await api.createConversation(mode, title);
      console.log('Created conversation:', conversation);

      // Add to conversations list
      const { conversations } = get();
      set({
        conversations: [conversation, ...conversations],
        isLoading: false,
      });

      return conversation;
    } catch (error: any) {
      console.error('Failed to create conversation:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to create conversation';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  sendMessage: async (conversationId: string, content: string, useStreaming: boolean = true) => {
    const { currentConversation } = get();

    if (!currentConversation || currentConversation.id !== conversationId) {
      set({ error: 'No conversation selected' });
      return;
    }

    // Add user message immediately to UI
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    set({
      currentConversation: {
        ...currentConversation,
        messages: [...currentConversation.messages, userMessage],
      },
    });

    if (useStreaming) {
      // Use SSE streaming
      set({ isStreaming: true, streamingContent: '', error: null });

      try {
        await streamingService.createStream(conversationId, content, {
          onMessage: (chunk: string) => {
            set((state) => ({
              streamingContent: state.streamingContent + chunk,
            }));
          },
          onConfirmRequired: (data: ConfirmData) => {
            // Test mode 2: show confirmation popup
            set({
              pendingConfirmation: {
                ...data,
                conversationId,
              },
              streamingContent: data.content, // Show the route trace in chat
              isStreaming: false,
            });
          },
          onComplete: (message: Message) => {
            const { currentConversation, streamingContent } = get();
            if (currentConversation) {
              // Create final assistant message with accumulated content
              const finalMessage: Message = {
                ...message,
                content: streamingContent || message.content,
                id: message.id || `msg-${Date.now()}`,
              };

              set({
                currentConversation: {
                  ...currentConversation,
                  messages: [
                    ...currentConversation.messages.filter(m => m.id !== userMessage.id),
                    userMessage,
                    finalMessage,
                  ],
                },
                isStreaming: false,
                streamingContent: '',
              });
            }
          },
          onError: (error: Error) => {
            set({
              error: error.message,
              isStreaming: false,
              streamingContent: '',
            });
          },
        });
      } catch (error: any) {
        set({
          error: error.message || 'Failed to send message',
          isStreaming: false,
          streamingContent: '',
        });
      }
    } else {
      // Use regular POST (non-streaming)
      try {
        const response = await api.sendMessage(conversationId, content);

        const { currentConversation } = get();
        if (currentConversation) {
          set({
            currentConversation: {
              ...currentConversation,
              messages: [
                ...currentConversation.messages.filter(m => m.id !== userMessage.id),
                response.user_message,
                response.assistant_message,
              ],
            },
          });
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.detail || 'Failed to send message';
        set({ error: errorMessage });
      }
    }
  },

  deleteConversation: async (id: string) => {
    try {
      await api.deleteConversation(id);

      const { conversations, currentConversation } = get();
      set({
        conversations: conversations.filter(c => c.id !== id),
        currentConversation: currentConversation?.id === id ? null : currentConversation,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to delete conversation';
      set({ error: errorMessage });
    }
  },

  clearError: () => set({ error: null }),

  setCurrentConversation: (conversation: ConversationDetail | null) => {
    set({ currentConversation: conversation });
  },

  // Clean up empty conversations (no messages)
  cleanupEmptyConversations: async () => {
    const { currentConversation } = get();

    // If current conversation is empty (no messages), delete it
    if (currentConversation && (!currentConversation.messages || currentConversation.messages.length === 0)) {
      try {
        await api.deleteConversation(currentConversation.id);
        set({ currentConversation: null });
      } catch (error) {
        console.error('Failed to cleanup empty conversation:', error);
      }
    }
  },

  // Confirm execution for test_mode=2
  confirmExecution: async () => {
    const { pendingConfirmation, currentConversation } = get();
    if (!pendingConfirmation) return;

    set({ isConfirming: true });

    try {
      // Call the MCP confirm endpoint
      const result = await api.confirmMCPExecution(
        pendingConfirmation.toolName,
        pendingConfirmation.toolParams,
        pendingConfirmation.provider || undefined
      );

      // Update chat with result
      if (currentConversation) {
        const resultMessage: Message = {
          id: `msg-${Date.now()}`,
          conversation_id: currentConversation.id,
          role: 'assistant',
          content: result.success
            ? `✅ Actie uitgevoerd!\n\n${JSON.stringify(result.data, null, 2)}`
            : `❌ Fout bij uitvoeren: ${result.error}`,
          created_at: new Date().toISOString(),
        };

        set({
          currentConversation: {
            ...currentConversation,
            messages: [...currentConversation.messages, resultMessage],
          },
          pendingConfirmation: null,
          isConfirming: false,
          streamingContent: '',
        });
      }
    } catch (error: any) {
      set({
        error: error.message || 'Failed to execute action',
        isConfirming: false,
      });
    }
  },

  // Cancel confirmation popup
  cancelConfirmation: () => {
    set({
      pendingConfirmation: null,
      streamingContent: '',
    });
  },
}));
