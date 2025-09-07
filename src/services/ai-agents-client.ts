import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { Agent, AgentUpdateRequest, AgentActionRequest } from '../types/api';

export class AIAgentsClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.aiAgentsApiUrl,
      timeout: 10000,
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

  async getAgents(): Promise<Agent[]> {
    try {
      const response = await this.client.get('/monitor/agents');
      return response.data;
    } catch (error: any) {
      logger.error('Failed to fetch agents', { error: error.message });
      throw this.handleError(error);
    }
  }

  async getAgent(id: string): Promise<Agent> {
    try {
      const response = await this.client.get(`/monitor/agents/${id}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to fetch agent ${id}`, { error: error.message });
      throw this.handleError(error);
    }
  }

  async updateAgent(id: string, update: AgentUpdateRequest): Promise<Agent> {
    try {
      const response = await this.client.put(`/monitor/agents/${id}`, update);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to update agent ${id}`, { error: error.message, update });
      throw this.handleError(error);
    }
  }

  async performAgentAction(id: string, action: AgentActionRequest): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.client.post(`/monitor/agents/${id}/actions/${action.action}/execute`, action.parameters);
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
      const response = await this.client.get(`/monitor/agents/${id}/logs`, {
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
      const response = await this.client.get(`/monitor/agents/${id}/analytics`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to fetch analytics for agent ${id}`, { error: error.message });
      throw this.handleError(error);
    }
  }

  async getAgentActions(id: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/monitor/agents/${id}/actions`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to fetch actions for agent ${id}`, { error: error.message });
      throw this.handleError(error);
    }
  }

  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.client.get('/monitor/health');
      return response.data;
    } catch (error: any) {
      logger.error('AI Agents API health check failed', { error: error.message });
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