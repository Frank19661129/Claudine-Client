import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { AuthResponse, User } from '../../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8003/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor: add auth token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor: handle 401
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(email: string, password: string, full_name: string): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>('/auth/register', {
      email,
      password,
      full_name,
    });
    return data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return data;
  }

  async getCurrentUser(): Promise<User> {
    const { data } = await this.client.get<User>('/auth/me');
    return data;
  }

  // Conversation endpoints
  async createConversation(mode: string = 'chat', title?: string) {
    const { data } = await this.client.post('/conversations', { mode, title });
    return data;
  }

  async getConversations(mode?: string) {
    const { data } = await this.client.get('/conversations', {
      params: { mode },
    });
    return data;
  }

  async getConversation(id: string) {
    const { data } = await this.client.get(`/conversations/${id}`);
    return data;
  }

  async sendMessage(conversationId: string, content: string) {
    const { data } = await this.client.post(
      `/conversations/${conversationId}/messages`,
      { content }
    );
    return data;
  }

  async deleteConversation(id: string) {
    const { data } = await this.client.delete(`/conversations/${id}`);
    return data;
  }

  // SSE streaming - deprecated, use StreamingService instead
  createStreamingConnection(_conversationId: string, _content: string): EventSource {
    // EventSource doesn't support POST or custom headers, so we'll use fetch with SSE
    // Use the StreamingService from services/sse/streaming.ts instead
    throw new Error('Use SSE service for streaming');
  }
}

export const api = new ApiClient();
