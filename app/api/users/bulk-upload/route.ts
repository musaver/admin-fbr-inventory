import { NextRequest, NextResponse, after } from 'next/server';
import { put } from '@vercel/blob';
import { db } from '@/lib/db';
import { importJobs } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { withTenant, ErrorResponses } from '@/lib/api-helpers';
import { processImportJob } from '@/lib/imports/process-import-job';

// Import processing runs in this invocation (via after()), so it needs the
// extended duration — the api-wide default is 30s (see vercel.json)
export const maxDuration = 300;

export const POST = withTenant(async (request: NextRequest, context) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadedBy = formData.get('uploadedBy') as string;
    const importType = (formData.get('type') as string) || 'users'; // Default to users for backward compatibility
    const removeExistingData = formData.get('removeExistingData') === 'true';
    
    // DEBUG: Log what we received
    console.log('🚨 BULK UPLOAD API CALLED:', { 
      fileName: file?.name, 
      importType, 
      uploadedBy,
      removeExistingData,
      formDataKeys: Array.from(formData.keys())
    });
    
    if (!file) {
      return ErrorResponses.invalidInput('No file provided');
    }

    // Validate import type
    if (!['users', 'products', 'orders'].includes(importType)) {
      return ErrorResponses.invalidInput('Invalid import type. Must be "users", "products", or "orders"');
    }

    // Validate file type (CSV only for now)
    if (!file.name.endsWith('.csv')) {
      return ErrorResponses.invalidInput('Please upload a CSV file');
    }

    // Validate file size (100MB limit for bulk imports)
    const maxSize = 100 * 1024 * 1024; // 100MB
    const itemType = importType === 'users' ? 'users' : importType === 'products' ? 'products' : 'orders';
    const estimatePerItem = importType === 'users' ? 500 : importType === 'products' ? 300 : 2000; // Rough estimates
    const maxItems = importType === 'users' ? '~200,000 users' : importType === 'products' ? '~300,000 products' : '~50,000 orders';
    
    if (file.size > maxSize) {
      return ErrorResponses.invalidInput(`File too large. Maximum size is 100MB (${maxItems}).`);
    }

    // Generate unique job ID
    const jobId = uuidv4();

    // Read the CSV content now so the background closure captures a plain
    // string rather than the request-scoped File object
    const csvText = await file.text();

    // Upload file to Vercel Blob with public access
    const timestamp = Date.now();
    const fileName = `${importType}-imports/${context.tenantId}/${timestamp}-${file.name}`;
    
    const blob = await put(fileName, file, {
      access: 'public', // Public access required for Vercel Blob
      addRandomSuffix: true,
    });

    // Create import job record
    const importJob = {
      id: jobId,
      tenantId: context.tenantId,
      type: importType,
      fileName: file.name,
      blobUrl: blob.url,
      status: 'pending',
      createdBy: uploadedBy || 'unknown',
      createdAt: new Date(),
    };

    await db.insert(importJobs).values(importJob);

    // Process the import after the response is sent; the client polls
    // /api/users/import-status/[jobId] for progress, same as before
    after(async () => {
      try {
        await processImportJob({
          jobId,
          tenantId: context.tenantId,
          fileName: file.name,
          importType: importType as 'users' | 'products' | 'orders',
          removeExistingData,
          csvText,
        });
      } catch (err) {
        // processImportJob handles its own errors; this is a last-resort guard
        console.error('❌ Unhandled bulk import failure:', { jobId }, err);
      }
    });

    const responseMessage = importType === 'users' 
      ? 'User import job started. You will receive progress updates.'
      : importType === 'products'
        ? 'Product import job started. You will receive progress updates.'
        : 'Order import job started. You will receive progress updates.';
    
    const estimatedItems = Math.floor(file.size / estimatePerItem);
    const itemField = importType === 'users' ? 'estimatedUsers' : importType === 'products' ? 'estimatedProducts' : 'estimatedOrders';

    return NextResponse.json({ 
      jobId,
      message: responseMessage,
      fileName: file.name,
      fileSize: file.size,
      [itemField]: estimatedItems,
      importType,
    });

  } catch (error: any) {
    console.error(`Error starting bulk user import:`, error);
    return ErrorResponses.serverError(`Failed to start import: ${error.message}`);
  }
});
