import { z } from 'zod';
import { NetworkMonitor, ErrorHandler, NetworkError } from './error-handling';

// =================== SANITIZATION UTILITIES ===================

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize user input for safe display (less aggressive than HTML sanitization)
 * Only removes dangerous script-injection characters while preserving readability
 */
export function sanitizeForDisplay(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .trim();
}

/**
 * Sanitize and normalize string inputs
 */
const sanitizedString = (minLength = 0, maxLength = 255) => 
  z.string()
    .transform(val => sanitizeHtml(val.trim()))
    .refine(val => val.length >= minLength, `Must be at least ${minLength} characters`)
    .refine(val => val.length <= maxLength, `Must be less than ${maxLength} characters`);

/**
 * Email validation with additional security checks
 */
const secureEmail = () =>
  z.string()
    .email('Invalid email address')
    .max(254, 'Email address is too long')
    .transform(email => email.toLowerCase().trim())
    .refine(email => !email.includes('script'), 'Invalid email format')
    .refine(email => !/[<>]/.test(email), 'Invalid email format');

// =================== VALIDATION SCHEMAS ===================

// Event validation schema with enhanced security
export const eventSchema = z.object({
  id: z.string().uuid().optional(),
  host_id: z.string().uuid('Invalid host ID'),
  name: sanitizedString(1, 100).refine(
    name => !/[<>{}]/g.test(name), 
    'Event name contains invalid characters'
  ),
  event_date: z.string()
    .refine((date) => {
      const parsed = new Date(date);
      const now = new Date();
      const maxFuture = new Date(now.getFullYear() + 10, now.getMonth(), now.getDate());
      return !isNaN(parsed.getTime()) && parsed > now && parsed < maxFuture;
    }, 'Event date must be in the future and within 10 years'),
  location: sanitizedString(1, 200).refine(
    location => !/[<>{}]/g.test(location),
    'Location contains invalid characters'
  ),
  spotify_playlist_url: z.string()
    .optional()
    .or(z.literal(''))
    .refine((url) => {
      if (!url) return true;
      try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname.includes('spotify.com') || parsedUrl.hostname.includes('spotify.link');
      } catch {
        return false;
      }
    }, 'Must be a valid Spotify URL'),
});

// Guest validation schema with enhanced security
export const guestSchema = z.object({
  id: z.string().uuid().optional(),
  event_id: z.string().uuid('Invalid event ID'),
  name: sanitizedString(1, 50)
    .refine(name => /^[a-zA-Z\s'-]+$/.test(name), 
      'Name can only contain letters, spaces, hyphens, and apostrophes')
    .refine(name => !/[<>{}]/g.test(name), 
      'Name contains invalid characters'),
  email: secureEmail(),
  is_checked_in: z.boolean().default(false),
});

// User validation schema with enhanced security
export const userSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
  email: secureEmail(),
  name: sanitizedString(0, 50)
    .refine(name => !name || /^[a-zA-Z\s'-]+$/.test(name), 
      'Name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),
  user_metadata: z.object({
    name: z.string().optional(),
  }).optional(),
});

// Auth validation schemas with enhanced security
export const signInSchema = z.object({
  email: secureEmail(),
  password: z.string()
    .min(6, 'Password must be at least 6 characters') // Relaxed for existing users
    .max(128, 'Password is too long')
    .refine(pwd => !/[<>{}]/g.test(pwd), 'Password contains invalid characters'),
});

export const signUpSchema = z.object({
  email: secureEmail(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'Password must contain at least one lowercase letter, one uppercase letter, and one number')
    .refine(pwd => !/[<>{}]/g.test(pwd), 'Password contains invalid characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// =================== RATE LIMITING ===================

class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 300000 // 5 minutes
  ) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
  
  getRemainingTime(key: string): number {
    const attempts = this.attempts.get(key) || [];
    if (attempts.length < this.maxAttempts) return 0;
    
    const oldestAttempt = Math.min(...attempts);
    const remainingTime = this.windowMs - (Date.now() - oldestAttempt);
    return Math.max(0, remainingTime);
  }
}

export const authRateLimiter = new RateLimiter(5, 300000); // 5 attempts per 5 minutes

// =================== VALIDATION HELPERS ===================
export const validateEvent = (data: unknown) => {
  try {
    return { success: true, data: eventSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
};

export const validateGuest = (data: unknown) => {
  try {
    return { success: true, data: guestSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
};

export const validateSignIn = (data: unknown) => {
  try {
    return { success: true, data: signInSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
};

export const validateSignUp = (data: unknown) => {
  try {
    return { success: true, data: signUpSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
};

// Type exports
export type EventInput = z.infer<typeof eventSchema>;
export type GuestInput = z.infer<typeof guestSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

// Schema aliases for consistency
export const EventSchema = eventSchema;
export const GuestSchema = guestSchema;
export const UserSchema = userSchema;

// =================== ADDITIONAL UTILITIES ===================

/**
 * Generic validation function
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  fieldErrors?: Record<string, string>;
} {
  try {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(error => {
        const path = error.path.join('.');
        fieldErrors[path] = error.message;
      });
      
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown validation error'
    };
  }
}

/**
 * Deep sanitize an object recursively with context-aware sanitization
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T, options: { 
  displayFields?: string[];
  useDisplaySanitization?: boolean;
} = {}): T {
  const { displayFields = [], useDisplaySanitization = false } = options;
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Use display sanitization for specified fields or when globally enabled
      const shouldUseDisplaySanitization = displayFields.includes(key) || useDisplaySanitization;
      sanitized[key as keyof T] = (shouldUseDisplaySanitization ? 
        sanitizeForDisplay(value) : 
        sanitizeHtml(value)
      ) as T[keyof T];
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key as keyof T] = sanitizeObject(value, options) as T[keyof T];
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map(item => 
        typeof item === 'string' ? 
          (useDisplaySanitization ? sanitizeForDisplay(item) : sanitizeHtml(item)) : 
        typeof item === 'object' && item !== null ? sanitizeObject(item, options) : item
      ) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value;
    }
  }
  
  return sanitized;
}

/**
 * Network request wrapper with timeout, retry, and offline handling
 */
export async function robustFetch(
  url: string, 
  options: RequestInit = {},
  retries: number = 3,
  timeoutMs: number = 30000
): Promise<Response> {
  const monitor = NetworkMonitor.getInstance();
  
  // Check if offline
  if (!monitor.getStatus()) {
    throw new NetworkError(
      'No internet connection available. Request will be retried when connection is restored.',
      undefined,
      true
    );
  }

  let lastError: Error;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        }
      });
      
      clearTimeout(timeoutId);
      
      // Handle different response statuses
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        throw ErrorHandler.handle({ 
          status: 429, 
          headers: { 'Retry-After': retryAfter.toString() } 
        });
      }
      
      if (!response.ok && response.status >= 500) {
        throw new NetworkError(
          `Server error: ${response.status} ${response.statusText}`,
          new Error(`HTTP ${response.status}`),
          false,
          Math.pow(2, attempt + 1) * 5 // Suggested retry delay
        );
      }
      
      if (!response.ok) {
        throw ErrorHandler.handle({ 
          status: response.status, 
          message: response.statusText,
          response 
        });
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Don't retry certain errors
      if (error instanceof NetworkError && error.isOffline) {
        throw error;
      }
      
      if (attempt === retries - 1) break;
      
      // Exponential backoff with jitter
      const baseDelay = 1000 * Math.pow(2, attempt);
      const jitter = Math.random() * 0.3 * baseDelay;
      const delay = Math.min(baseDelay + jitter, 10000);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}
