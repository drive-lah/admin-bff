import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { Agent, AgentUpdateRequest, AgentActionRequest } from '../types/api';

export class AIAgentsClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.aiAgentsApiUrl,
      timeout: 15000, // was 10000
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
        // Add internal API key if needed
        ...(config.internalApiKey && {
          'X-Internal-API-Key': config.internalApiKey
        }),
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        logger.info('AI Agents API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
        });
        return config;
      },
      (error) => {
        logger.error('AI Agents API Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logger.info('AI Agents API Response', {
          status: response.status,
          url: response.config.url,
          method: response.config.method?.toUpperCase(),
        });
        return response;
      },
      (error) => {
        logger.error('AI Agents API Response Error', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
          response: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }

  private async getWithRetry<T>(path: string, attempts = 3): Promise<T> {
    let delay = 200;
    let lastErr: any;
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await this.client.get<T>(path);
        return res.data as any;
      } catch (err: any) {
        lastErr = err;
        // Retry only on timeouts/network
        const isTimeout = err.code === 'ECONNABORTED' || !!err.request;
        if (!isTimeout || i === attempts - 1) break;
        await new Promise(r => setTimeout(r, delay));
        delay = Math.min(delay * 2, 1000); // backoff
      }
    }
    throw this.handleError(lastErr);
  }

  async getAgents(): Promise<Agent[]> {
    return this.getWithRetry<Agent[]>('/api/monitor/agents');
  }

  async getAgent(id: string): Promise<Agent> {
    return this.getWithRetry<Agent>(`/api/monitor/agents/${id}`);
  }

  async updateAgent(id: string, update: AgentUpdateRequest): Promise<Agent> {
    try {
      const response = await this.client.put(`/api/monitor/agents/${id}`, update);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to update agent ${id}`, { error: error.message, update });
      throw this.handleError(error);
    }
  }

  async performAgentAction(id: string, action: AgentActionRequest): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.client.post(`/api/monitor/agents/${id}/actions/${action.action}/execute`, action.parameters);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to perform action on agent ${id}`, {
        error: error.message,
        action: action.action
      });
      throw this.handleError(error);
    }
  }

  async getAgentLogs(id: string, limit = 100): Promise<any[]> {
    try {
      const response = await this.client.get(`/api/monitor/agents/${id}/logs`, {
        params: { limit }
      });
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to fetch logs for agent ${id}`, { error: error.message });
      throw this.handleError(error);
    }
  }

  async getAgentAnalytics(id: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/monitor/agents/${id}/analytics`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to fetch analytics for agent ${id}`, { error: error.message });
      throw this.handleError(error);
    }
  }

  async getAgentActions(id: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/api/monitor/agents/${id}/actions`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to fetch actions for agent ${id}`, { error: error.message });
      throw this.handleError(error);
    }
  }

  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.client.get('/api/monitor/health');
      return response.data;
    } catch (error: any) {
      logger.error('AI Agents API health check failed', { error: error.message });
      throw this.handleError(error);
    }
  }

  // ========================================
  // Chat Agent Evaluation Methods
  // ========================================

  async getChatAgentEvaluationAnalytics(id: string, queryParams?: string): Promise<any> {
    try {
      const url = `/api/monitor/agents/${id}/evaluations/analytics${queryParams ? '?' + queryParams : ''}`;
      const response = await this.client.get(url);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to fetch Chat Agent evaluation analytics for ${id}`, { error: error.message });
      throw this.handleError(error);
    }
  }

  async getChatAgentConversations(id: string, queryParams?: string): Promise<any> {
    try {
      const url = `/api/monitor/agents/${id}/evaluations/conversations${queryParams ? '?' + queryParams : ''}`;
      const response = await this.client.get(url);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to fetch Chat Agent conversations for ${id}`, { error: error.message });
      throw this.handleError(error);
    }
  }

  async getChatAgentConversationDetail(id: string, conversationId: string): Promise<any> {
    try {
      const url = `/api/monitor/agents/${id}/evaluations/conversations/${conversationId}`;
      const response = await this.client.get(url);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to fetch Chat Agent conversation detail for ${conversationId}`, { error: error.message });
      throw this.handleError(error);
    }
  }

  async submitChatAgentRating(id: string, conversationId: string, data: { rating: number; comment?: string; reviewer_id?: string }): Promise<any> {
    try {
      const url = `/api/monitor/agents/${id}/evaluations/conversations/${conversationId}/rating`;
      const response = await this.client.post(url, data);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to submit Chat Agent rating for ${conversationId}`, { error: error.message });
      throw this.handleError(error);
    }
  }

  async getWeeklyMetrics(id: string, queryParams?: string): Promise<any> {
    try {
      const url = `/api/monitor/agents/${id}/evaluations/weekly-metrics${queryParams ? '?' + queryParams : ''}`;
      const response = await this.client.get(url);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to fetch weekly metrics for agent ${id}`, { error: error.message });
      throw this.handleError(error);
    }
  }

  async getGapAnalysis(id: string, queryParams?: string): Promise<any> {
    try {
      const url = `/api/monitor/agents/${id}/evaluations/gap-analysis${queryParams ? '?' + queryParams : ''}`;
      const response = await this.client.get(url);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to fetch gap analysis for agent ${id}`, { error: error.message });
      throw this.handleError(error);
    }
  }

  async getSentimentAnalysis(id: string, queryParams?: string): Promise<any> {
    try {
      const url = `/api/monitor/agents/${id}/evaluations/sentiment-analysis${queryParams ? '?' + queryParams : ''}`;
      const response = await this.client.get(url);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to fetch sentiment analysis for agent ${id}`, { error: error.message });
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.response.statusText || 'API Error';
      const customError = new Error(message);
      (customError as any).statusCode = error.response.status;
      (customError as any).isOperational = true;
      return customError;
    } else if (error.request) {
      // Request timeout or network error
      const customError = new Error('AI Agents API is unavailable');
      (customError as any).statusCode = 503;
      (customError as any).isOperational = true;
      return customError;
    } else {
      // Other errors
      return error;
    }
  }
}

// Singleton instance
export const aiAgentsClient = new AIAgentsClient();