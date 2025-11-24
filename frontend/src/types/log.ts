export enum LogLevel {
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export interface Log {
  id: number;
  userId?: number;
  user?: {
    id: number;
    username: string;
    fullName?: string;
    email: string;
  };
  action: string;
  module: string;
  endpoint: string;
  method: string;
  statusCode: number;
  ipAddress?: string;
  userAgent?: string;
  message: string;
  level: LogLevel;
  metadata?: any;
  createdAt: string;
}

export interface LogFilters {
  userId?: number;
  action?: string;
  level?: LogLevel;
  module?: string;
  endpoint?: string;
  statusCode?: number;
  ipAddress?: string;
  searchText?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface LogStats {
  logsByLevel: Array<{ level: LogLevel; count: number }>;
  logsByModule: Array<{ module: string; count: number }>;
  logsByDay: Array<{ date: string; count: number }>;
  topActions: Array<{ action: string; count: number }>;
  errorRate: number;
  totalLogs24h: number;
  errorLogs24h: number;
}

