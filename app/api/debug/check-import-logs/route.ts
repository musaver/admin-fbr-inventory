import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { importJobs } from '@/lib/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    // Get recent import jobs
    const recentJobs = await db
      .select()
      .from(importJobs)
      .orderBy(desc(importJobs.createdAt))
      .limit(5);

    return NextResponse.json({
      success: true,
      recentJobs: recentJobs.map(job => ({
        id: job.id,
        status: job.status,
        fileName: job.fileName,
        totalRows: job.totalRows,
        processedRows: job.processedRows,
        successfulRows: job.successfulRows,
        errorRows: job.errorRows,
        errors: job.errors || null,
        createdAt: job.createdAt,
        completedAt: job.completedAt
      }))
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
