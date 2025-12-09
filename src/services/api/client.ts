import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { AuthResponse, User } from '../../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8003/api/v1';

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      // withCredentials not needed - we use JWT tokens in Authorization header
    });

    // Request interceptor: add auth token and test mode header
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add test mode header from URL query param
      const params = new URLSearchParams(window.location.search);
      const testFlag = params.get('testflag');
      if (testFlag === '1' || testFlag === '2') {
        config.headers['X-Test-Mode'] = testFlag;
      }

      return config;
    });

    // Response interceptor: handle 401 with token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Only attempt refresh for 401 errors, if we have a refresh token, and haven't already retried
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          localStorage.getItem('refresh_token')
        ) {
          // Skip refresh for auth endpoints to prevent loops
          if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login')) {
            return Promise.reject(error);
          }

          if (this.isRefreshing) {
            // Queue this request while another refresh is in progress
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshToken();

            // Process queued requests
            this.failedQueue.forEach(({ resolve }) => resolve(newToken));
            this.failedQueue = [];

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, reject all queued requests
            this.failedQueue.forEach(({ reject }) => reject(refreshError as Error));
            this.failedQueue = [];

            // Clear tokens and redirect to login
            console.warn('Token refresh failed, logging out...');
            this.clearTokensAndRedirect();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // For non-401 errors or when no refresh token, just reject
        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    console.log('Attempting to refresh access token...');
    const { data } = await axios.post<RefreshResponse>(
      `${API_URL}/auth/refresh`,
      { refresh_token: refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    );

    // Store new tokens
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    console.log('Token refreshed successfully');

    return data.access_token;
  }

  private clearTokensAndRedirect(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.replace('/login');
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

  // Calendar OAuth endpoints - via API layer
  async startMicrosoftOAuth() {
    const { data } = await this.client.post('/calendar/oauth/microsoft/start');
    console.log('Microsoft OAuth response:', data);
    return data;
  }

  async pollMicrosoftOAuth(deviceCode: string) {
    const { data } = await this.client.post('/calendar/oauth/microsoft/poll', {
      device_code: deviceCode
    });
    return data;
  }

  async startGoogleOAuth() {
    const { data } = await this.client.post('/calendar/oauth/google/start');
    return data;
  }

  async pollGoogleOAuth(deviceCode: string) {
    const { data } = await this.client.post('/calendar/oauth/google/poll', {
      device_code: deviceCode
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

  async setPrimaryCalendar(provider: string) {
    const { data } = await this.client.post(`/calendar/oauth/${provider}/primary`);
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

  // ==================== MCP Endpoints ====================

  /**
   * Execute an MCP tool with test mode support.
   *
   * @param toolName - Name of the tool (e.g., "create_calendar_event")
   * @param toolParams - Parameters for the tool
   * @param options - Additional options
   * @returns MCP execution result with optional route trace
   */
  async executeMCPTool(
    toolName: string,
    toolParams: Record<string, unknown>,
    options: {
      provider?: string;
      inputSource?: 'command' | 'chat' | 'voice' | 'api';
      originalInput?: string;
      testMode?: 0 | 1 | 2;
    } = {}
  ) {
    const { data } = await this.client.post('/mcp/execute', {
      tool_name: toolName,
      tool_params: toolParams,
      provider: options.provider,
      input_source: options.inputSource || 'api',
      original_input: options.originalInput,
      test_mode: options.testMode || 0,
    });
    return data;
  }

  /**
   * Confirm a pending MCP execution (for test_mode=2).
   */
  async confirmMCPExecution(
    toolName: string,
    toolParams: Record<string, unknown>,
    provider?: string
  ) {
    const { data } = await this.client.post('/mcp/confirm', {
      tool_name: toolName,
      tool_params: toolParams,
      provider,
    });
    return data;
  }

  /**
   * Detect intent from user input.
   */
  async detectIntent(userInput: string) {
    const { data } = await this.client.post('/mcp/detect-intent', {
      user_input: userInput,
    });
    return data;
  }

  /**
   * Get available MCP tools.
   */
  async getMCPTools(provider?: string) {
    const { data } = await this.client.get('/mcp/tools', {
      params: { provider },
    });
    return data;
  }

  /**
   * Check MCP server health.
   */
  async getMCPHealth() {
    const { data } = await this.client.get('/mcp/health');
    return data;
  }

  /**
   * Sync OAuth tokens to token-service.
   * This is a one-time sync for tokens stored before token-service integration.
   */
  async syncOAuthTokens() {
    const { data } = await this.client.post('/calendar/oauth/sync-tokens');
    return data;
  }
}

export const api = new ApiClient();
