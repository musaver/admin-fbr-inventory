import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest';
import { bulkUserImport } from '@/lib/inngest/functions/bulk-user-import';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    bulkUserImport, // This function now handles both users and products
  ],
});
