import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { importJobs } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { withTenant, ErrorResponses } from '@/lib/api-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    // Get tenant context from headers
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return ErrorResponses.invalidInput('Tenant context not found');
    }

    const { jobId } = await params;

    if (!jobId) {
      return ErrorResponses.invalidInput('Job ID is required');
    }

    // Get job details with tenant filtering (support both users and products)
    const job = await db
      .select()
      .from(importJobs)
      .where(and(
        eq(importJobs.id, jobId),
        eq(importJobs.tenantId, tenantId)
        // Remove type filter to support both users and products
      ))
      .limit(1);

    if (job.length === 0) {
      return ErrorResponses.invalidInput('Import job not found');
    }

    let importJob = job[0];

    // Stale-job guard: processing runs inside a single invocation capped at
    // 300s (maxDuration on the bulk-upload route). If a job is still
    // pending/processing long past that, the invocation was killed or crashed
    // — mark it failed so the UI stops polling instead of spinning forever.
    const STALE_MS = 10 * 60 * 1000; // 10 min, comfortably above the 300s cap
    const staleAnchor = importJob.startedAt || importJob.createdAt;
    if (
      (importJob.status === 'processing' || importJob.status === 'pending') &&
      staleAnchor &&
      Date.now() - new Date(staleAnchor).getTime() > STALE_MS
    ) {
      await db.update(importJobs)
        .set({
          status: 'failed',
          completedAt: new Date(),
          errors: [{
            row: 0,
            identifier: 'SYSTEM_ERROR',
            message: 'Import timed out or was interrupted (no completion within 10 minutes). Partial data may have been imported; please review and re-upload if needed.'
          }]
        })
        .where(eq(importJobs.id, importJob.id));

      const refreshed = await db
        .select()
        .from(importJobs)
        .where(eq(importJobs.id, importJob.id))
        .limit(1);
      if (refreshed.length > 0) {
        importJob = refreshed[0];
      }
    }

    // Calculate progress percentage
    const progressPercent = importJob.totalRecords > 0 
      ? Math.round((importJob.processedRecords / importJob.totalRecords) * 100) 
      : 0;

    // Estimate time remaining (very rough estimate)
    let estimatedTimeRemaining = null;
    if (importJob.status === 'processing' && importJob.processedRecords > 0 && importJob.startedAt) {
      const elapsed = Date.now() - new Date(importJob.startedAt).getTime();
      const rate = importJob.processedRecords / (elapsed / 1000); // records per second
      const remaining = importJob.totalRecords - importJob.processedRecords;
      estimatedTimeRemaining = remaining > 0 ? Math.ceil(remaining / rate) : 0;
    }

    const response = {
      id: importJob.id,
      fileName: importJob.fileName,
      status: importJob.status,
      type: importJob.type, // Include type in response
      totalRecords: importJob.totalRecords || 0,
      processedRecords: importJob.processedRecords || 0,
      successfulRecords: importJob.successfulRecords || 0,
      failedRecords: importJob.failedRecords || 0,
      progressPercent,
      estimatedTimeRemaining,
      createdAt: importJob.createdAt?.toISOString(),
      startedAt: importJob.startedAt?.toISOString() || null,
      completedAt: importJob.completedAt?.toISOString() || null,
      errors: importJob.errors || [],
      results: importJob.results || null,
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error fetching import status:', error);
    return ErrorResponses.serverError(`Failed to fetch import status: ${error.message}`);
  }
}
