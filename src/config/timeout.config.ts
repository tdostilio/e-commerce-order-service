// Configuration object for all timeouts
export const TimeoutConfig = {
  isDevMode: process.env.NODE_ENV === 'development',
  rpc: process.env.NODE_ENV === 'development' ? 30000 : 5000, // Increased to 30s for dev
  rabbitmq: process.env.NODE_ENV === 'development' ? 60000 : 15000, // Increased to 60s for dev
} as const;
