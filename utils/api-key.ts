import { randomBytes, createHash } from 'crypto';

/**
 * Generate a secure API key
 * Creates a random 32-byte hex string prefixed with 'pk_'
 */
export function generateApiKey(): string {
  const bytes = randomBytes(32);
  return `pk_${bytes.toString('hex')}`;
}

/**
 * Hash an API key for storage
 * Uses SHA-256 for secure one-way hashing
 */
export function hashApiKey(key: string): Promise<string> {
  return new Promise((resolve) => {
    const hash = createHash('sha256');
    hash.update(key);
    resolve(hash.digest('hex'));
  });
}

/**
 * Encrypt sensitive data
 * Uses environment variable for encryption key
 */
export async function encryptSecret(value: string): Promise<string> {
  // In a real app, use a proper encryption library and key management
  // This is a placeholder implementation
  const encoder = new TextEncoder();
  const data = encoder.encode(value);

  // Use Web Crypto API for encryption
  const key = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    data
  );

  // Combine IV and encrypted data
  const encryptedArray = new Uint8Array(encrypted);
  const result = new Uint8Array(iv.length + encryptedArray.length);
  result.set(iv);
  result.set(encryptedArray, iv.length);

  return Buffer.from(result).toString('base64');
}
