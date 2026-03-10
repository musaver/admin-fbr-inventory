import { Inngest } from 'inngest';

// Create the Inngest client
export const inngest = new Inngest({
  id: 'fbr-inventory-admin',
  name: 'FBR Inventory Admin System',
  env: process.env.INNGEST_ENV || process.env.NODE_ENV || 'development',
  // Event API configuration for production
  ...(process.env.INNGEST_BASE_URL && {
    eventAPI: {
      baseURL: process.env.INNGEST_BASE_URL,
    },
  }),
});
