import { inngest } from '@/lib/inngest';
import { db } from '@/lib/db';
import { importJobs, products } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

interface SimpleProductRow {
  name: string;
  unitPrice: string; // Changed from 'price' to 'unitPrice'
  description?: string;
  sku?: string;
}

// Simple CSV parser (same as user import)
function parseCSV(csvText: string): SimpleProductRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data: SimpleProductRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length === headers.length) {
      const row: any = {};
      headers.forEach((header, index) => {
        row[header.toLowerCase().replace(/\s+/g, '')] = values[index];
      });
      data.push(row);
    }
  }

  return data;
}

// Simple product processing function
async function processProducts(
  productData: SimpleProductRow[], 
  tenantId: string
): Promise<{ successful: number; failed: number; errors: string[] }> {
  let successful = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < productData.length; i++) {
    const product = productData[i];
    
    try {
      // Basic validation
      if (!product.name || !product.unitPrice) {
        errors.push(`Row ${i + 2}: Missing required fields (name, unit price)`);
        failed++;
        continue;
      }

      const price = parseFloat(product.unitPrice);
      if (isNaN(price) || price < 0) {
        errors.push(`Row ${i + 2}: Invalid unit price: ${product.unitPrice}`);
        failed++;
        continue;
      }

      // Create simple product record with proper field names (camelCase as per schema)
      const productRecord = {
        id: uuidv4(),
        tenantId: tenantId, // Correct camelCase field name
        name: product.description || product.name, // Use description as name, fallback to original name
        price: price.toString(),
        slug: `${product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`, // Make slug unique
        description: product.description || null,
        shortDescription: null,
        sku: product.sku || null,
        comparePrice: null, // Removed field but keeping null for schema compatibility
        costPrice: null, // Removed field but keeping null for schema compatibility
        images: null,
        banner: null,
        categoryId: null,
        subcategoryId: null,
        supplierId: null,
        tags: null,
        weight: null,
        dimensions: null,
        isFeatured: false,
        isActive: true, // Correct camelCase field name
        isDigital: false,
        requiresShipping: true,
        taxable: true,
        taxAmount: '0.00',
        taxPercentage: '0.00',
        priceIncludingTax: '0.00',
        priceExcludingTax: price.toString(),
        extraTax: '0.00',
        furtherTax: '0.00',
        fedPayableTax: '0.00',
        discount: '0.00',
        metaTitle: null, // Removed field but keeping null for schema compatibility
        metaDescription: null, // Removed field but keeping null for schema compatibility
        hsCode: null,
        productType: 'simple',
        variationAttributes: null,
        stockManagementType: 'quantity',
        pricePerUnit: null,
        baseWeightUnit: 'grams',
        thc: null,
        cbd: null,
        difficulty: null,
        floweringTime: null,
        yieldAmount: null,
        createdAt: new Date(), // Correct camelCase field name
        updatedAt: new Date(),
      };

      await db.insert(products).values(productRecord);
      successful++;
      
    } catch (error: any) {
      console.error(`Error processing product ${i + 1}:`, error);
      errors.push(`Row ${i + 2}: ${error.message}`);
      failed++;
    }
  }

  return { successful, failed, errors };
}

// Production-ready Inngest function (matches user import pattern)
export const simpleProductImport = inngest.createFunction(
  { 
    id: 'simple-product-import',
    name: 'Simple Product Import (Production)',
    concurrency: {
      limit: 10, // Match user import concurrency
    }
  },
  { event: 'product/simple-import' },
  async ({ event, step }) => {
    const { jobId, blobUrl, tenantId } = event.data;

    // Step 1: Update job status to processing
    await step.run('update-job-status-processing', async () => {
      await db.update(importJobs)
        .set({ 
          status: 'processing',
          startedAt: new Date()
        })
        .where(eq(importJobs.id, jobId));
    });

    try {
      // Step 2: Download and parse file
      const productData = await step.run('parse-file', async () => {
        const response = await fetch(blobUrl);
        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.statusText}`);
        }
        const csvText = await response.text();
        return parseCSV(csvText);
      });

      // Step 3: Update total records count
      await step.run('update-total-records', async () => {
        await db.update(importJobs)
          .set({ totalRecords: productData.length })
          .where(eq(importJobs.id, jobId));
      });

      // Step 4: Process products
      const result = await step.run('process-products', async () => {
        return await processProducts(productData, tenantId);
      });

      // Step 5: Mark job as completed (match user import format)
      await step.run('mark-job-completed', async () => {
        await db.update(importJobs)
          .set({
            status: 'completed',
            completedAt: new Date(),
            processedRecords: productData.length,
            successfulRecords: result.successful,
            failedRecords: result.failed,
            errors: result.errors.length > 0 ? result.errors : null,
            results: {
              successful: result.successful,
              failed: result.failed,
              successfulProducts: [] // Match user import structure
            }
          })
          .where(eq(importJobs.id, jobId));
      });

      return { 
        success: true, 
        totalProcessed: productData.length,
        successful: result.successful,
        failed: result.failed
      };

    } catch (error: any) {
      // Mark job as failed (match user import error handling)
      await step.run('mark-job-failed', async () => {
        await db.update(importJobs)
          .set({ 
            status: 'failed',
            completedAt: new Date(),
            errors: [{
              message: `Import failed: ${error.message}` 
            }]
          })
          .where(eq(importJobs.id, jobId));
      });

      throw error;
    }
  }
);
