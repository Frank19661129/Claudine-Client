// API Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  provider: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  mode: 'chat' | 'voice' | 'note' | 'scan';
  created_at: string;
  updated_at: string;
  message_count: number;
  latest_message?: Message;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

// Request Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface MessageSendRequest {
  content: string;
  stream?: boolean;
}
