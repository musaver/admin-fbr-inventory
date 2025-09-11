import { inngest } from '@/lib/inngest';
import { db } from '@/lib/db';
import { importJobs, products as productsTable, productInventory, stockMovements } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

interface ProductImportRow {
  name: string;
  unitPrice: string; // Changed from 'price' to 'unitPrice'
  slug?: string;
  description?: string; // Changed from 'shortDescription' to 'description'
  sku?: string;
  categoryId?: string;
  subcategoryId?: string;
  supplierId?: string;
  tags?: string;
  weight?: string;
  isFeatured?: string;
  isActive?: string;
  isDigital?: string;
  requiresShipping?: string;
  taxable?: string;
  
  // Tax and discount fields (renamed)
  gstAmount?: string; // Changed from 'taxAmount' to 'gstAmount'
  gstPercentage?: string; // Changed from 'taxPercentage' to 'gstPercentage'
  priceIncludingTax?: string;
  priceExcludingTax?: string;
  extraTax?: string;
  furtherTax?: string;
  fedPayableTax?: string;
  discount?: string;
  
  // Additional fields from add product form
  hsCode?: string;
  productType?: string;
  stockManagementType?: string;
  pricePerUnit?: string;
  baseWeightUnit?: string;
  
  // Cannabis-specific fields (optional)
  thc?: string;
  cbd?: string;
  difficulty?: string;
  floweringTime?: string;
  yieldAmount?: string;
  
  // Additional product identification fields
  serialNumber?: string;
  listNumber?: string;
  bcNumber?: string;
  lotNumber?: string;
  expiryDate?: string;
  
  // Additional tax fields
  fixedNotifiedValueOrRetailPrice?: string;
  saleType?: string;
  
  // Unit of measurement
  uom?: string;
  
  // Stock fields
  stockQuantity?: string;
  stockStatus?: string;
  location?: string;
}

interface ProcessingResult {
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    sku: string | null;
    message: string;
  }>;
  successfulProducts: Array<{
    id: string;
    name: string;
    sku: string | null;
    stockQuantity: number;
  }>;
}

// Utility function to parse CSV
function parseCSV(csvText: string): ProductImportRow[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain header and at least one data row');
  }

  // Parse header
  const header = lines[0].split(',').map(h => h.replace(/['"]/g, '').trim());
  
  // Expected columns (case-insensitive mapping) - matches add product form exactly
  const columnMap: { [key: string]: string[] } = {
    // Basic Information
    'name': ['name', 'product name', 'title'],
    'unitPrice': ['unit price', 'price', 'selling price'], // Changed mapping
    'slug': ['slug', 'url slug'],
    'description': ['description', 'long description', 'short description', 'summary'], // Combined description fields
    'sku': ['sku', 'product code', 'item code'],
    
    // Categories and Organization
    'categoryId': ['category id', 'category', 'category_id'],
    'subcategoryId': ['subcategory id', 'subcategory', 'subcategory_id'],
    'supplierId': ['supplier id', 'supplier', 'supplier_id'],
    'tags': ['tags', 'product tags'],
    'weight': ['weight', 'product weight'],
    
    // Product Settings
    'isFeatured': ['is featured', 'featured'],
    'isActive': ['is active', 'active'],
    'isDigital': ['is digital', 'digital'],
    'requiresShipping': ['requires shipping', 'shipping required'],
    'taxable': ['taxable', 'tax applicable'],
    
    // Tax and Discount Fields (matching add product form)
    'gstAmount': ['gst amount', 'tax amount'], // Changed from taxAmount
    'gstPercentage': ['gst percentage', 'tax percentage'], // Changed from taxPercentage
    'priceIncludingTax': ['price including tax'],
    'priceExcludingTax': ['price excluding tax'],
    'extraTax': ['extra tax'],
    'furtherTax': ['further tax'],
    'fedPayableTax': ['fed payable tax'],
    'discount': ['discount'],
    
    // Additional Product Fields
    'hsCode': ['hs code', 'harmonized system code'],
    'productType': ['product type', 'type'],
    'stockManagementType': ['stock management type', 'inventory type'],
    'pricePerUnit': ['price per unit', 'price per gram', 'price per kg'],
    'baseWeightUnit': ['base weight unit', 'weight unit'],
    
    // Cannabis-specific fields (optional)
    'thc': ['thc', 'thc percentage'],
    'cbd': ['cbd', 'cbd percentage'],
    'difficulty': ['difficulty', 'growing difficulty'],
    'floweringTime': ['flowering time'],
    'yieldAmount': ['yield amount', 'expected yield'],
    
    // Additional product identification fields
    'serialNumber': ['serial number', 'serial no', 'serial'],
    'listNumber': ['list number', 'list no'],
    'bcNumber': ['bc number', 'bc no'],
    'lotNumber': ['lot number', 'lot no', 'batch number'],
    'expiryDate': ['expiry date', 'expiry', 'expiration date', 'exp date'],
    
    // Additional tax fields
    'fixedNotifiedValueOrRetailPrice': ['fixed notified value/retail price', 'fixed notified value', 'retail price', 'notified value'],
    'saleType': ['sale type', 'type of sale'],
    
    // Unit of measurement
    'uom': ['uom', 'unit of measurement', 'unit', 'measurement unit'],
    
    // Stock fields
    'stockQuantity': ['stock quantity', 'quantity', 'initial stock', 'stock qty'],
    'stockStatus': ['status', 'stock status', 'reason'],
    'location': ['location', 'warehouse location', 'storage location'],
  };

  // Create reverse mapping
  const headerMapping: { [key: string]: string } = {};
  header.forEach(col => {
    const lowerCol = col.toLowerCase();
    for (const [key, variants] of Object.entries(columnMap)) {
      if (variants.includes(lowerCol)) {
        headerMapping[col] = key;
        break;
      }
    }
  });

  // Parse data rows
  const products: ProductImportRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (!row.trim()) continue;
    
    // Simple CSV parser - handles basic quoted fields
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < row.length; j++) {
      const char = row[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Add the last value

    // Map values to product object
    const product: ProductImportRow = {} as ProductImportRow;
    
    header.forEach((col, index) => {
      const mappedKey = headerMapping[col];
      if (mappedKey && values[index] !== undefined) {
        const value = values[index].replace(/^["']|["']$/g, '').trim();
        (product as any)[mappedKey] = value || undefined;
      }
    });

    products.push(product);
  }

  return products;
}

// Validate product data
function validateProduct(product: ProductImportRow, rowIndex: number): string[] {
  const errors: string[] = [];
  
  if (!product.name?.trim()) {
    errors.push('Product name is required');
  }
  
  if (!product.unitPrice?.trim()) {
    errors.push('Unit Price is required');
  } else {
    const price = parseFloat(product.unitPrice);
    if (isNaN(price) || price < 0) {
      errors.push('Unit Price must be a valid positive number');
    }
  }
  
  // Validate stock quantity if provided
  if (product.stockQuantity && product.stockQuantity.trim()) {
    const qty = parseInt(product.stockQuantity);
    if (isNaN(qty) || qty < 0) {
      errors.push('Stock quantity must be a valid non-negative number');
    }
  }
  
  return errors;
}

// Process a chunk of products
async function processProductChunk(
  products: ProductImportRow[], 
  tenantId: string, 
  startIndex: number
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    successful: 0,
    failed: 0,
    errors: [],
    successfulProducts: []
  };

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const rowIndex = startIndex + i + 1;
    
    try {
      // Validate product data
      const validationErrors = validateProduct(product, rowIndex);
      if (validationErrors.length > 0) {
        result.errors.push({
          row: rowIndex,
          sku: product.sku || null,
          message: validationErrors.join(', ')
        });
        result.failed++;
        continue;
      }

      // Generate product ID and slug
      const productId = uuidv4();
      const slug = product.slug || product.name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .substring(0, 100);

      // Parse tags
      let parsedTags = null;
      if (product.tags?.trim()) {
        const tagsArray = product.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        if (tagsArray.length > 0) {
          parsedTags = JSON.stringify(tagsArray);
        }
      }

      // Helper function to parse decimal values
      const parseDecimal = (value: string | undefined, defaultValue = '0.00'): string => {
        if (!value?.trim()) return defaultValue;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed.toFixed(2);
      };

      // Helper function to parse boolean values
      const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
        if (!value?.trim()) return defaultValue;
        return value.toLowerCase() === 'true';
      };

      // Create product record with all fields from add product form
      const newProduct = {
        id: productId,
        tenantId,
        name: product.description?.trim() || product.name.trim(), // Use description as name, fallback to original name
        slug: `${slug}-${Date.now()}`, // Add timestamp to ensure uniqueness
        description: product.description?.trim() || null,
        shortDescription: null, // Removed shortDescription field
        sku: product.sku?.trim() || null,
        price: parseDecimal(product.unitPrice), // Parse price as decimal
        comparePrice: null, // Removed comparePrice field
        costPrice: null, // Removed costPrice field
        images: null, // Images not supported in CSV
        banner: null, // Banner not supported in CSV
        categoryId: product.categoryId?.trim() || null,
        subcategoryId: product.subcategoryId?.trim() || null,
        supplierId: product.supplierId?.trim() || null,
        tags: parsedTags,
        weight: parseDecimal(product.weight, '0.00'),
        dimensions: null, // Dimensions not supported in CSV
        isFeatured: parseBoolean(product.isFeatured, false),
        isActive: parseBoolean(product.isActive, true),
        isDigital: parseBoolean(product.isDigital, false),
        requiresShipping: parseBoolean(product.requiresShipping, true),
        taxable: parseBoolean(product.taxable, true),
        
        // Tax and discount fields (from CSV or defaults)
        taxAmount: parseDecimal(product.gstAmount), // Changed from taxAmount to gstAmount
        taxPercentage: parseDecimal(product.gstPercentage), // Changed from taxPercentage to gstPercentage
        priceIncludingTax: parseDecimal(product.priceIncludingTax),
        priceExcludingTax: parseDecimal(product.priceExcludingTax),
        extraTax: parseDecimal(product.extraTax),
        furtherTax: parseDecimal(product.furtherTax),
        fedPayableTax: parseDecimal(product.fedPayableTax),
        discount: parseDecimal(product.discount),
        
        // SEO fields - removed metaTitle and metaDescription
        metaTitle: null,
        metaDescription: null,
        
        // Additional product fields
        hsCode: product.hsCode?.trim() || null,
        productType: product.productType?.trim() || 'simple',
        variationAttributes: null, // Variations not supported in bulk import
        stockManagementType: product.stockManagementType?.trim() || 'quantity',
        pricePerUnit: parseDecimal(product.pricePerUnit, '0.00'),
        baseWeightUnit: product.baseWeightUnit?.trim() || 'grams',
        
        // Cannabis-specific fields (optional)
        thc: parseDecimal(product.thc, '0.00'),
        cbd: parseDecimal(product.cbd, '0.00'),
        difficulty: product.difficulty?.trim() || null,
        floweringTime: product.floweringTime?.trim() || null,
        yieldAmount: product.yieldAmount?.trim() || null,
        
        // Additional product identification fields
        serialNumber: product.serialNumber?.trim() || null,
        listNumber: product.listNumber?.trim() || null,
        bcNumber: product.bcNumber?.trim() || null,
        lotNumber: product.lotNumber?.trim() || null,
        expiryDate: product.expiryDate?.trim() || null,
        
        // Additional tax fields
        fixedNotifiedValueOrRetailPrice: parseDecimal(product.fixedNotifiedValueOrRetailPrice, '0.00'),
        saleType: product.saleType?.trim() || null,
        
        // Unit of measurement
        uom: product.uom?.trim() || null,
        
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Insert product
      await db.insert(productsTable).values(newProduct);

      // Handle stock if provided
      const stockQuantity = product.stockQuantity ? parseInt(product.stockQuantity) : 0;
      
      if (stockQuantity > 0) {
        // Create inventory record
        const inventoryId = uuidv4();
        const inventoryRecord = {
          id: inventoryId,
          tenantId,
          productId,
          variantId: null,
          quantity: stockQuantity,
          reservedQuantity: 0,
          availableQuantity: stockQuantity,
          reorderPoint: 0,
          reorderQuantity: 0,
          weightQuantity: '0.00',
          reservedWeight: '0.00',
          availableWeight: '0.00',
          reorderWeightPoint: '0.00',
          reorderWeightQuantity: '0.00',
          location: product.location?.trim() || null,
          supplierId: product.supplierId?.trim() || null,
          supplier: null,
          lastRestockDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.insert(productInventory).values(inventoryRecord);

        // Validate stock status against predefined reasons (matching add stock movement page)
        const validInReasons = [
          'Purchase Order',
          'Stock Return', 
          'Initial Stock',
          'Transfer In',
          'Supplier Return',
          'Production Complete',
          'Other'
        ];
        
        const stockReason = product.stockStatus?.trim() || 'Initial Stock';
        const finalReason = validInReasons.includes(stockReason) ? stockReason : 'Initial Stock';

        // Create stock movement record (matching add stock movement form exactly)
        const stockMovementRecord = {
          id: uuidv4(),
          tenantId,
          inventoryId,
          productId,
          variantId: null,
          movementType: 'in' as const,
          quantity: stockQuantity,
          previousQuantity: 0,
          newQuantity: stockQuantity,
          weightQuantity: '0.00', // Weight-based not supported in bulk import yet
          previousWeightQuantity: '0.00',
          newWeightQuantity: '0.00',
          reason: finalReason,
          location: product.location?.trim() || null,
          reference: 'BULK-IMPORT',
          notes: `Created via bulk product import. Original product: ${product.name}`,
          costPrice: null, // Removed costPrice field
          supplierId: product.supplierId?.trim() || null,
          supplier: null, // Legacy field - keeping null
          processedBy: 'system-bulk-import',
          createdAt: new Date(),
        };

        await db.insert(stockMovements).values(stockMovementRecord);
      }

      result.successful++;
      result.successfulProducts.push({
        id: productId,
        name: product.name,
        sku: product.sku || null,
        stockQuantity
      });

    } catch (error: any) {
      console.error(`Error processing product at row ${rowIndex}:`, error);
      result.errors.push({
        row: rowIndex,
        sku: product.sku || null,
        message: error.message || 'Unknown error occurred'
      });
      result.failed++;
    }
  }

  return result;
}

// Main Inngest function
export const bulkProductImport = inngest.createFunction(
  { 
    id: 'product-bulk-import',
    name: 'Product Bulk Import',
    concurrency: {
      limit: 5, // Allow up to 5 concurrent product import jobs
    }
  },
  { event: 'product/bulk-import' },
  async ({ event, step }) => {
    const { jobId, blobUrl, tenantId, fileName } = event.data;

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
      const products = await step.run('parse-file', async () => {
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
          .set({ totalRecords: products.length })
          .where(eq(importJobs.id, jobId));
      });

      // Step 4: Process products in chunks of 25 (smaller than users due to more complex operations)
      const CHUNK_SIZE = 25;
      const chunks: ProductImportRow[][] = [];
      for (let i = 0; i < products.length; i += CHUNK_SIZE) {
        chunks.push(products.slice(i, i + CHUNK_SIZE));
      }

      let totalResults: ProcessingResult = {
        successful: 0,
        failed: 0,
        errors: [],
        successfulProducts: []
      };

      // Process each chunk
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        const startIndex = chunkIndex * CHUNK_SIZE;

        const chunkResults = await step.run(`process-chunk-${chunkIndex}`, async () => {
          return await processProductChunk(chunk, tenantId, startIndex);
        });

        // Merge results
        totalResults.successful += chunkResults.successful;
        totalResults.failed += chunkResults.failed;
        totalResults.errors.push(...chunkResults.errors);
        totalResults.successfulProducts.push(...chunkResults.successfulProducts);

        // Update progress
        await step.run(`update-progress-${chunkIndex}`, async () => {
          const processedRecords = (chunkIndex + 1) * CHUNK_SIZE;
          await db.update(importJobs)
            .set({ 
              processedRecords: Math.min(processedRecords, products.length),
              successfulRecords: totalResults.successful,
              failedRecords: totalResults.failed
            })
            .where(eq(importJobs.id, jobId));
        });
      }

      // Step 5: Mark job as completed
      await step.run('complete-job', async () => {
        await db.update(importJobs)
          .set({ 
            status: 'completed',
            completedAt: new Date(),
            results: {
              successful: totalResults.successful,
              failed: totalResults.failed,
              successfulProducts: totalResults.successfulProducts
            },
            errors: totalResults.errors
          })
          .where(eq(importJobs.id, jobId));
      });

      return { 
        message: 'Product import completed successfully',
        results: totalResults
      };

    } catch (error: any) {
      console.error('Product import failed:', error);
      
      // Mark job as failed
      await step.run('mark-job-failed', async () => {
        await db.update(importJobs)
          .set({ 
            status: 'failed',
            completedAt: new Date(),
            errors: [{ 
              row: 0, 
              sku: null, 
              message: `Import failed: ${error.message}` 
            }]
          })
          .where(eq(importJobs.id, jobId));
      });

      throw error;
    }
  }
);
