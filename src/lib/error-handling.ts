// Custom error classes
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, code: string, statusCode: number = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly fieldErrors: Record<string, string[]>;

  constructor(message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export class NetworkError extends AppError {
  public readonly originalError?: Error;
  public readonly isOffline: boolean;
  public readonly retryAfter?: number;

  constructor(message: string, originalError?: Error, isOffline: boolean = false, retryAfter?: number) {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
    this.originalError = originalError;
    this.isOffline = isOffline;
    this.retryAfter = retryAfter;
  }
}

export class TimeoutError extends AppError {
  public readonly timeout: number;

  constructor(timeout: number, operation: string = 'Operation') {
    super(`${operation} timed out after ${timeout}ms`, 'TIMEOUT_ERROR', 408);
    this.name = 'TimeoutError';
    this.timeout = timeout;
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(retryAfter: number = 60) {
    super(`Rate limit exceeded. Try again in ${retryAfter} seconds`, 'RATE_LIMIT_ERROR', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

// Error handler utilities
export class ErrorHandler {
  private static readonly NETWORK_ERROR_CODES = ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'ENETDOWN', 'ENETUNREACH'];
  private static readonly RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];

  static handle(error: unknown): AppError {
    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const zodError = error as any;
      const fieldErrors: Record<string, string[]> = {};

      zodError.errors.forEach((err: any) => {
        const field = err.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(err.message);
      });

      return new ValidationError('Validation failed', fieldErrors);
    }

    // Handle network errors
    if (this.isNetworkError(error)) {
      return this.handleNetworkError(error);
    }

    // Handle Supabase errors
    if (error && typeof error === 'object' && 'code' in error) {
      return this.handleSupabaseError(error as any);
    }

    // Handle timeout errors
    if (error && typeof error === 'object' && 'name' in error && 
        (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      return new TimeoutError(5000, 'Request');
    }

    // Handle rate limit errors
    if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
      const retryAfter = this.extractRetryAfter(error);
      return new RateLimitError(retryAfter);
    }

    // Handle generic errors
    if (error instanceof Error) {
      return new AppError(error.message, 'UNKNOWN_ERROR');
    }

    return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR');
  }

  private static isNetworkError(error: unknown): boolean {
    if (!navigator.onLine) return true;

    if (error && typeof error === 'object') {
      // Check for fetch network errors
      if ('message' in error && typeof error.message === 'string') {
        const message = error.message.toLowerCase();
        if (message.includes('fetch') || message.includes('network') || 
            message.includes('connection') || message.includes('timeout')) {
          return true;
        }
      }

      // Check for specific error codes
      if ('code' in error && typeof error.code === 'string') {
        return this.NETWORK_ERROR_CODES.includes(error.code);
      }

      // Check for HTTP status codes that indicate network issues
      if ('status' in error && typeof error.status === 'number') {
        return this.RETRY_STATUS_CODES.includes(error.status);
      }
    }

    return false;
  }

  private static handleNetworkError(error: unknown): NetworkError {
    const isOffline = !navigator.onLine;
    
    if (isOffline) {
      return new NetworkError(
        'No internet connection available. Please check your connection and try again.',
        error instanceof Error ? error : new Error('Network error'),
        true
      );
    }

    // Handle server errors with retry suggestions
    if (error && typeof error === 'object' && 'status' in error) {
      const status = error.status as number;
      const retryAfter = this.extractRetryAfter(error);

      if (status >= 500) {
        return new NetworkError(
          'Server is temporarily unavailable. Please try again in a few moments.',
          error instanceof Error ? error : new Error('Server error'),
          false,
          retryAfter
        );
      }

      if (status === 408) {
        return new NetworkError(
          'Request timed out. Please check your connection and try again.',
          error instanceof Error ? error : new Error('Timeout error'),
          false,
          retryAfter
        );
      }
    }

    return new NetworkError(
      'Network request failed. Please check your connection and try again.',
      error instanceof Error ? error : new Error('Network error'),
      false
    );
  }

  private static extractRetryAfter(error: unknown): number {
    if (error && typeof error === 'object' && 'headers' in error) {
      const headers = error.headers as any;
      const retryAfter = headers?.['retry-after'] || headers?.['Retry-After'];
      
      if (retryAfter) {
        const seconds = parseInt(retryAfter, 10);
        return isNaN(seconds) ? 60 : seconds;
      }
    }
    
    return 60; // Default to 60 seconds
  }

  private static handleSupabaseError(error: any): AppError {
    const code = error.code;
    const message = error.message || 'Database operation failed';

    switch (code) {
      case 'PGRST116':
        return new NotFoundError('Record');
      case '23505':
        return new ValidationError('A record with this information already exists');
      case '23503':
        return new ValidationError('Referenced record does not exist');
      case '42501':
        return new AuthorizationError('Permission denied');
      case 'PGRST301':
        return new AuthenticationError('Authentication required');
      default:
        return new AppError(message, 'DATABASE_ERROR');
    }
  }

  static isOperationalError(error: Error): boolean {
    return error instanceof AppError && error.isOperational;
  }

  static logError(error: Error, context?: Record<string, any>): void {
    const errorInfo = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // In development, log to console
    if (import.meta.env.DEV) {
      console.error('Application Error:', errorInfo);
    }

    // In production, send to error reporting service
    if (import.meta.env.PROD) {
      // TODO: Send to error reporting service (e.g., Sentry)
      console.error('Production Error:', errorInfo);
    }
  }
}

// Async error boundary hook
export const useAsyncError = () => {
  const [, setError] = React.useState();

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
};

// Network monitoring and offline state management
export class NetworkMonitor {
  private static instance: NetworkMonitor;
  private isOnline: boolean = navigator.onLine;
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  private pendingRequests: Map<string, any> = new Map();

  private constructor() {
    this.initializeListeners();
  }

  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  private initializeListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.processPendingRequests();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });

    // Periodic connectivity check
    setInterval(() => {
      this.checkConnectivity();
    }, 30000); // Check every 30 seconds
  }

  private async checkConnectivity(): Promise<void> {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      const wasOnline = this.isOnline;
      this.isOnline = response.ok;
      
      if (wasOnline !== this.isOnline) {
        this.notifyListeners();
        if (this.isOnline) {
          this.processPendingRequests();
        }
      }
    } catch {
      const wasOnline = this.isOnline;
      this.isOnline = false;
      
      if (wasOnline !== this.isOnline) {
        this.notifyListeners();
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.isOnline));
  }

  private async processPendingRequests(): Promise<void> {
    if (!this.isOnline) return;

    const requests = Array.from(this.pendingRequests.entries());
    this.pendingRequests.clear();

    for (const [id, request] of requests) {
      try {
        await request.retry();
      } catch (error) {
        console.warn(`Failed to retry request ${id}:`, error);
      }
    }
  }

  public getStatus(): boolean {
    return this.isOnline;
  }

  public addListener(callback: (isOnline: boolean) => void): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  public queueRequest(id: string, retryFn: () => Promise<any>): void {
    if (this.isOnline) {
      // If online, execute immediately
      retryFn().catch(console.warn);
    } else {
      // Queue for when connection is restored
      this.pendingRequests.set(id, { retry: retryFn });
    }
  }

  public removeQueuedRequest(id: string): void {
    this.pendingRequests.delete(id);
  }
}

// React hook for network status
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [wasOffline, setWasOffline] = React.useState(false);

  React.useEffect(() => {
    const monitor = NetworkMonitor.getInstance();
    setIsOnline(monitor.getStatus());

    const unsubscribe = monitor.addListener((online) => {
      if (!online && isOnline) {
        setWasOffline(true);
      }
      setIsOnline(online);
    });

    return unsubscribe;
  }, [isOnline]);

  const clearOfflineFlag = React.useCallback(() => {
    setWasOffline(false);
  }, []);

  return {
    isOnline,
    wasOffline,
    clearOfflineFlag
  };
};

// React import for the hook
import React from 'react';
