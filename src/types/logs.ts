// Types for User Activity Logging System

export enum ActionType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  EXPORT = 'export'
}

export interface ActivityLog {
  id: string;
  user_id: number;
  email: string;
  action_type: ActionType;
  action_description: string;
  module?: string;
  http_method?: string;
  endpoint_path?: string;
  request_payload?: Record<string, any>;
  response_status?: number;
  response_time_ms?: number;
  ip_address?: string;
  user_agent?: string;
  geo_city?: string;
  geo_country?: string;
  before_state?: Record<string, any>;
  after_state?: Record<string, any>;
  created_at: Date;
}

export interface CreateLogDto {
  user_id: number;
  email: string;
  action_type: ActionType | string;
  action_description: string;
  module?: string;
  http_method?: string;
  endpoint_path?: string;
  request_payload?: Record<string, any>;
  response_status?: number;
  response_time_ms?: number;
  ip_address?: string;
  user_agent?: string;
  geo_city?: string;
  geo_country?: string;
  before_state?: Record<string, any>;
  after_state?: Record<string, any>;
}

export interface LogFilter {
  userId?: number;
  email?: string;
  actionType?: ActionType | string;
  module?: string;
  status?: 'success' | 'failure';
  ipAddress?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedLogs {
  logs: ActivityLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
