import { Message } from '../../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8003/api/v1';

export interface StreamCallbacks {
  onMessage: (content: string) => void;
  onComplete: (message: Message) => void;
  onError: (error: Error) => void;
}

export class StreamingService {
  private eventSource: EventSource | null = null;

  /**
   * Create a streaming connection for AI responses
   * Uses Server-Sent Events (SSE) for real-time streaming
   */
  async createStream(
    conversationId: string,
    content: string,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const token = localStorage.getItem('token');

    if (!token) {
      callbacks.onError(new Error('No authentication token found'));
      return;
    }

    // First, send the message via POST
    try {
      const response = await fetch(
        `${API_URL}/conversations/${conversationId}/messages/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Read the SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              // Stream complete
              continue;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'content') {
                callbacks.onMessage(parsed.content);
              } else if (parsed.type === 'done') {
                callbacks.onComplete(parsed.message);
              } else if (parsed.type === 'error') {
                callbacks.onError(new Error(parsed.error));
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      callbacks.onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Cancel the current stream
   */
  cancelStream(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

export const streamingService = new StreamingService();
