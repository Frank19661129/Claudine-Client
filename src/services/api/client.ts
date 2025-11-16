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
      // withCredentials not needed - we use JWT tokens in Authorization header
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
          console.warn('401 Unauthorized - Token expired, logging out...');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Force page reload to trigger auth redirect
          window.location.replace('/login');
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

  async uploadProfilePhoto(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('file', file);

    // Don't set Content-Type manually - let Axios set it with the correct boundary
    const { data } = await this.client.post<User>('/auth/upload-photo', formData, {
      headers: {
        'Content-Type': undefined, // Remove the default application/json header
      },
    });
    return data;
  }

  // Conversation endpoints
  async createConversation(mode: string = 'chat', title?: string) {
    const payload: any = { mode };
    if (title) {
      payload.title = title;
    }
    console.log('API: Creating conversation with payload:', payload);
    const { data } = await this.client.post('/conversations', payload);
    console.log('API: Received response:', data);
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

  async generateConversationTitle(id: string) {
    const { data } = await this.client.post(`/conversations/${id}/generate-title`);
    return data;
  }

  // SSE streaming - deprecated, use StreamingService instead
  createStreamingConnection(_conversationId: string, _content: string): EventSource {
    // EventSource doesn't support POST or custom headers, so we'll use fetch with SSE
    // Use the StreamingService from services/sse/streaming.ts instead
    throw new Error('Use SSE service for streaming');
  }

  // Calendar OAuth endpoints
  async startMicrosoftOAuth() {
    const { data } = await this.client.post('/calendar/oauth/microsoft/start');
    return data;
  }

  async pollMicrosoftOAuth(deviceCode: string) {
    const { data } = await this.client.post('/calendar/oauth/microsoft/poll', {
      device_code: deviceCode,
      set_as_primary: true,
    });
    return data;
  }

  async getConnectedCalendars() {
    const { data } = await this.client.get('/calendar/oauth/connected');
    return data;
  }

  async disconnectCalendar(provider: string) {
    const { data} = await this.client.delete(`/calendar/oauth/${provider}`);
    return data;
  }

  // Calendar event endpoints
  async createCalendarEvent(event: {
    title: string;
    start_time: string;
    end_time: string;
    description?: string;
    location?: string;
    attendees?: string[];
  }) {
    const { data } = await this.client.post('/calendar/events', event);
    return data;
  }

  async getCalendarEvents(startDate?: string, endDate?: string) {
    const { data } = await this.client.get('/calendar/events', {
      params: { start_date: startDate, end_date: endDate },
    });
    return data;
  }

  // Task endpoints
  async getOpenTasksCount() {
    const { data } = await this.client.get('/tasks', {
      params: { status: 'new,in_progress,overdue', limit: 1000 },
    });
    // Handle both array response and object with tasks property
    if (Array.isArray(data)) {
      return data.length;
    }
    return data.tasks?.length || 0;
  }

  // Note endpoints
  async getNotesCount() {
    const { data } = await this.client.get('/notes', {
      params: { limit: 1 }, // Just need total
    });
    return data.total || 0;
  }

  // Inbox endpoints
  async getInboxItems(filters?: {
    status?: string;
    type?: string;
    priority?: string;
    skip?: number;
    limit?: number;
  }) {
    const { data } = await this.client.get('/inbox', {
      params: {
        status_filter: filters?.status,
        type_filter: filters?.type,
        priority: filters?.priority,
        skip: filters?.skip || 0,
        limit: filters?.limit || 100,
      },
    });
    return data;
  }

  async getInboxItem(id: string) {
    const { data } = await this.client.get(`/inbox/${id}`);
    return data;
  }

  async createInboxItem(item: {
    type: string;
    source: string;
    subject?: string;
    content?: string;
    raw_data?: any;
    priority?: string;
  }) {
    const { data } = await this.client.post('/inbox', item);
    return data;
  }

  async requestAISuggestion(id: string) {
    const { data } = await this.client.post(`/inbox/${id}/suggest`);
    return data;
  }

  async acceptSuggestion(id: string) {
    const { data } = await this.client.post(`/inbox/${id}/accept`);
    return data;
  }

  async modifyAndAccept(id: string, modifications: {
    action: string;
    data: any;
  }) {
    const { data } = await this.client.post(`/inbox/${id}/modify`, modifications);
    return data;
  }

  async rejectInboxItem(id: string, reason?: string) {
    const { data } = await this.client.post(`/inbox/${id}/reject`, { reason });
    return data;
  }

  async archiveInboxItem(id: string) {
    const { data } = await this.client.post(`/inbox/${id}/archive`);
    return data;
  }

  async deleteInboxItem(id: string) {
    await this.client.delete(`/inbox/${id}`);
  }

  async getInboxCount() {
    const { data } = await this.client.get('/inbox/count');
    return data.count || 0;
  }
}

export const api = new ApiClient();
