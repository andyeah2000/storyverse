/**
 * Security utilities for production
 */

// Input sanitization - remove potential XSS vectors
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#96;');
};

// HTML entity decoder for display
export const decodeHtmlEntities = (text: string): string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password strength validation
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password)) {
    strength = 'medium';
  }
  if (password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
    strength = 'strong';
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
};

// Rate limiting for API calls
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

export const checkRateLimit = (
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; retryAfter?: number } => {
  const now = Date.now();
  const entry = rateLimitStore[key];
  
  if (!entry || now > entry.resetTime) {
    rateLimitStore[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return { allowed: true };
  }
  
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }
  
  entry.count++;
  return { allowed: true };
};

// CSRF Token generation and validation
const CSRF_TOKEN_KEY = 'storyverse_csrf_token';

export const generateCsrfToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  return token;
};

export const getCsrfToken = (): string => {
  let token = sessionStorage.getItem(CSRF_TOKEN_KEY);
  if (!token) {
    token = generateCsrfToken();
  }
  return token;
};

export const validateCsrfToken = (token: string): boolean => {
  const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
  return storedToken === token;
};

// Secure session management
export const createSecureSession = (userId: string): string => {
  const sessionId = crypto.randomUUID();
  const session = {
    id: sessionId,
    userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
  };
  localStorage.setItem('storyverse_session', JSON.stringify(session));
  return sessionId;
};

export const validateSession = (): boolean => {
  const sessionStr = localStorage.getItem('storyverse_session');
  if (!sessionStr) return false;
  
  try {
    const session = JSON.parse(sessionStr);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem('storyverse_session');
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

// Content Security Policy violation reporter
export const setupCspReporting = () => {
  document.addEventListener('securitypolicyviolation', (e) => {
    console.warn('CSP Violation:', {
      blockedURI: e.blockedURI,
      violatedDirective: e.violatedDirective,
      originalPolicy: e.originalPolicy,
    });
    
    // In production, send to your logging service
    // fetch('/api/csp-report', { method: 'POST', body: JSON.stringify({...}) });
  });
};

// Detect potential XSS in user content
export const detectXss = (content: string): boolean => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /expression\s*\(/gi,
    /vbscript:/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(content));
};

// Secure localStorage wrapper with encryption placeholder
export const secureStorage = {
  set: (key: string, value: unknown): void => {
    try {
      const serialized = JSON.stringify(value);
      // In production, you might want to encrypt sensitive data
      // const encrypted = await encrypt(serialized);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error('Failed to save to storage:', error);
    }
  },
  
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      // const decrypted = await decrypt(item);
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  },
  
  remove: (key: string): void => {
    localStorage.removeItem(key);
  },
};

