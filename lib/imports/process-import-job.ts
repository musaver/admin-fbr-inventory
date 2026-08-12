import { db } from '@/lib/db';
import { importJobs, user, products } from '@/lib/schema';
import { eq, and, or, isNull } from 'drizzle-orm';
import {
  parseUserCSV,
  parseProductCSV,
  parseOrderCSV,
  processUserChunk,
  processProductChunk,
  processOrderChunk,
  type UserImportRow,
  type ProductImportRow,
  type OrderImportRow,
  type ProcessingResult,
} from './bulk-import-core';

export interface ProcessImportJobParams {
  jobId: string;
  tenantId: string;
  fileName: string;
  importType: 'users' | 'products' | 'orders';
  removeExistingData: boolean;
  csvText: string;
}

/**
 * Runs a bulk import job directly (no background queue).
 * Invoked via Next.js after() from the upload route, so it executes after
 * the response is sent while the import_jobs row feeds the UI's polling.
 * Never throws — all failures are recorded on the job row.
 */
export async function processImportJob(params: ProcessImportJobParams): Promise<void> {
  const { jobId, tenantId, fileName, importType, removeExistingData, csvText } = params;

  console.log(`🚀 Starting ${importType} import job:`, {
    jobId,
    tenantId,
    fileName,
    importType,
    removeExistingData,
    csvSize: csvText.length,
  });

  try {
    // Step 1: Update job status to processing
    await db.update(importJobs)
      .set({
        status: 'processing',
        startedAt: new Date()
      })
      .where(eq(importJobs.id, jobId));

    // Step 1.5: Remove existing data if requested
    if (removeExistingData) {
      console.log(`🗑️ Removing existing ${importType} for tenant: ${tenantId}`);

      if (importType === 'users') {
        // Delete users (this will cascade to related data due to foreign key constraints)
        await db.delete(user)
          .where(and(
            eq(user.tenantId, tenantId),
            // Don't delete admin users
            or(
              eq(user.userType, 'customer'),
              isNull(user.userType)
            )
          ));
        console.log(`✅ Removed existing users for tenant: ${tenantId}`);
      } else if (importType === 'products') {
        // Delete products (this will cascade to related data)
        await db.delete(products)
          .where(eq(products.tenantId, tenantId));
        console.log(`✅ Removed existing products for tenant: ${tenantId}`);
      }
    }

    // Step 2: Parse the CSV (content is passed in directly from the upload request)
    let parsedData: { type: string; data: UserImportRow[] | ProductImportRow[] | OrderImportRow[] };
    if (importType === 'products') {
      const data = parseProductCSV(csvText);
      console.log(`✅ Parsed ${data.length} products from CSV`);
      parsedData = { type: 'products', data };
    } else if (importType === 'orders') {
      const data = parseOrderCSV(csvText);
      console.log(`✅ Parsed ${data.length} order rows from CSV`);
      parsedData = { type: 'orders', data };
    } else {
      const data = parseUserCSV(csvText);
      console.log(`✅ Parsed ${data.length} users from CSV`);
      parsedData = { type: 'users', data };
    }

    // Step 3: Update total records count
    await db.update(importJobs)
      .set({ totalRecords: parsedData.data.length })
      .where(eq(importJobs.id, jobId));

    // Step 4: Process data in chunks of 50
    const CHUNK_SIZE = 50;
    const chunks: (UserImportRow[] | ProductImportRow[] | OrderImportRow[])[] = [];
    for (let i = 0; i < parsedData.data.length; i += CHUNK_SIZE) {
      chunks.push(parsedData.data.slice(i, i + CHUNK_SIZE));
    }

    const totalResults: ProcessingResult = {
      successful: 0,
      failed: 0,
      errors: [],
      successfulUsers: importType === 'users' ? [] : undefined,
      successfulProducts: importType === 'products' ? [] : undefined,
      successfulOrders: importType === 'orders' ? [] : undefined,
      detailedReport: importType === 'orders' ? [] : undefined
    };

    // Process each chunk
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      const startIndex = chunkIndex * CHUNK_SIZE;

      console.log(`🔄 Processing chunk ${chunkIndex + 1}/${chunks.length} for ${importType} (${chunk.length} items)`);

      let chunkResult: ProcessingResult;
      if (importType === 'products') {
        chunkResult = await processProductChunk(chunk as ProductImportRow[], tenantId, startIndex);
      } else if (importType === 'orders') {
        chunkResult = await processOrderChunk(chunk as OrderImportRow[], tenantId, startIndex);
      } else {
        chunkResult = await processUserChunk(chunk as UserImportRow[], tenantId, startIndex);
      }

      // Merge results
      totalResults.successful += chunkResult.successful;
      totalResults.failed += chunkResult.failed;
      totalResults.errors.push(...chunkResult.errors);

      if (importType === 'users' && chunkResult.successfulUsers) {
        totalResults.successfulUsers!.push(...chunkResult.successfulUsers);
      } else if (importType === 'products' && chunkResult.successfulProducts) {
        totalResults.successfulProducts!.push(...chunkResult.successfulProducts);
      } else if (importType === 'orders' && chunkResult.successfulOrders) {
        totalResults.successfulOrders!.push(...chunkResult.successfulOrders);

        // Merge detailed reports
        if (chunkResult.detailedReport) {
          totalResults.detailedReport!.push(...chunkResult.detailedReport);
        }
      }

      console.log(`📊 Running totals: ${totalResults.successful} successful, ${totalResults.failed} failed`);

      // Update progress (feeds the UI's 2s polling)
      await db.update(importJobs)
        .set({
          processedRecords: totalResults.successful + totalResults.failed,
          successfulRecords: totalResults.successful,
          failedRecords: totalResults.failed
        })
        .where(eq(importJobs.id, jobId));
    }

    // Step 5: Mark job as completed
    await db.update(importJobs)
      .set({
        status: 'completed',
        completedAt: new Date(),
        errors: totalResults.errors,
        results: {
          successful: totalResults.successful,
          failed: totalResults.failed,
          successfulUsers: totalResults.successfulUsers?.slice(0, 100), // Limit stored results
          successfulProducts: totalResults.successfulProducts?.slice(0, 100), // Limit stored results
          successfulOrders: totalResults.successfulOrders?.slice(0, 100), // Limit stored results
          detailedReport: totalResults.detailedReport // Include full detailed report
        }
      })
      .where(eq(importJobs.id, jobId));

    console.log(`✅ Import job ${jobId} completed: ${totalResults.successful} successful, ${totalResults.failed} failed`);

  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error occurred';
    console.error('❌ Import job failed:', {
      jobId,
      tenantId,
      importType,
      error: errorMessage,
      stack: error?.stack
    });

    // Best-effort failure marking — never let this throw out of after()
    try {
      await db.update(importJobs)
        .set({
          status: 'failed',
          completedAt: new Date(),
          errors: [{
            row: 0,
            identifier: 'SYSTEM_ERROR',
            message: `Import failed: ${errorMessage}`
          }]
        })
        .where(eq(importJobs.id, jobId));
    } catch (markError) {
      console.error('❌ Failed to mark import job as failed:', jobId, markError);
    }
  }
}
