import { create } from 'zustand';
import { Conversation, ConversationDetail, Message } from '../types';
import { api } from '../services/api/client';
import { streamingService } from '../services/sse/streaming';

interface ChatState {
  conversations: Conversation[];
  currentConversation: ConversationDetail | null;
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;

  // Actions
  loadConversations: (mode?: string) => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  createConversation: (mode?: string, title?: string) => Promise<Conversation>;
  sendMessage: (conversationId: string, content: string, useStreaming?: boolean) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  clearError: () => void;
  setCurrentConversation: (conversation: ConversationDetail | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  isLoading: false,
  isStreaming: false,
  streamingContent: '',
  error: null,

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
      const conversation = await api.createConversation(mode, title);

      // Add to conversations list
      const { conversations } = get();
      set({
        conversations: [conversation, ...conversations],
        isLoading: false,
      });

      return conversation;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to create conversation';
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
          onComplete: (message: Message) => {
            const { currentConversation } = get();
            if (currentConversation) {
              set({
                currentConversation: {
                  ...currentConversation,
                  messages: [
                    ...currentConversation.messages.filter(m => m.id !== userMessage.id),
                    userMessage,
                    message,
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
}));
