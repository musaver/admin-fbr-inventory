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

    const importJob = job[0];

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
