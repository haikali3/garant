
// Auth helpers

// Generate a random nonce using Web Crypto API
export const generateNonce = (length = 16): string =>{
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const nowMs = (): number =>{
  return Date.now();
}

// Calculate expiry time (ms) given current time and TTL (ms)
export const expiresAt = (now: number, ttlMs: number): number => {
  return now + ttlMs;
}

// Normalize an EVM address to lowercase
export const normalizeAddress =(address: string): string => {
  return address.toLowerCase();
}
