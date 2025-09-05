// Shared types between frontend and BFF

export interface Agent {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  type: string;
  description: string;
  lastHeartbeat?: string;
  metrics?: {
    uptime: string;
    requests: number;
    errors: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  domain: string;
  permissions: {
    modules: string[];
    role: 'admin' | 'manager' | 'viewer';
  };
}

export interface APIResponse<T = any> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface APIError {
  error: {
    message: string;
    statusCode: number;
    timestamp: string;
    path: string;
    method: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
  timestamp: string;
}

// AI Agents specific types
export interface AgentUpdateRequest {
  name?: string;
  status?: 'online' | 'offline' | 'maintenance';
  description?: string;
  config?: Record<string, any>;
}

export interface AgentActionRequest {
  action: 'start' | 'stop' | 'restart' | 'configure';
  parameters?: Record<string, any>;
}

// Health check types
export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    [serviceName: string]: {
      status: 'up' | 'down';
      responseTime?: number;
      lastChecked: string;
      error?: string;
    };
  };
}