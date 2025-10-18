// Payload sanitization utility for activity logging

const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'apikey',
  'api_key',
  'credential',
  'credentials',
  'authorization',
  'auth',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'privatekey',
  'private_key',
];

/**
 * Recursively redacts sensitive fields from objects and arrays
 * @param data The data to sanitize
 * @returns Sanitized data with sensitive fields replaced with '[REDACTED]'
 */
export function sanitizePayload(data: any): any {
  // Handle null/undefined
  if (data === null || data === undefined) {
    return data;
  }

  // Handle primitives
  if (typeof data !== 'object') {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizePayload(item));
  }

  // Handle objects
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    const keyLower = key.toLowerCase().replace(/[_-]/g, '');

    // Check if this key matches any sensitive field
    const isSensitive = SENSITIVE_FIELDS.some(field =>
      keyLower.includes(field) || field.includes(keyLower)
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      // Recursively sanitize nested objects/arrays
      sanitized[key] = sanitizePayload(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Safely stringify and parse JSON, handling circular references
 * @param data The data to process
 * @returns Processed data without circular references
 */
export function removeCircularReferences(data: any): any {
  const seen = new WeakSet();

  function detect(obj: any): any {
    if (obj !== null && typeof obj === 'object') {
      if (seen.has(obj)) {
        return '[Circular Reference]';
      }
      seen.add(obj);

      if (Array.isArray(obj)) {
        return obj.map(item => detect(item));
      }

      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = detect(value);
      }
      return result;
    }
    return obj;
  }

  return detect(data);
}
