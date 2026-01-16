
// Auth helpers
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
