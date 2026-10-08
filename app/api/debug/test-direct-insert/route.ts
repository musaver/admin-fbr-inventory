import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    const newProductId = uuidv4();
    
    // Create a test product with the exact same structure as the import
    const testProduct = {
      id: newProductId,
      tenantId: '018c08c2-ab55-45cf-b8fc-48bd335d9541', // Use the same tenant ID from your import
      name: 'TEST IMPORT STRUCTURE',
      slug: `test-import-${newProductId.substring(0, 8)}`,
      description: 'Test product with import structure',
      sku: `TEST-IMPORT-${Date.now()}`,
      price: '29.99', // String like in import
      
      // Tax fields - exactly like in import
      taxAmount: '2.50', // String like in import
      taxPercentage: '8.50', // String like in import
      hsCode: '1234567890', // String like in import
      
      // Identification fields - exactly like in import
      serialNumber: 'SN123456789', // String like in import
      listNumber: 'LIST-001', // String like in import
      bcNumber: 'BC123456', // String like in import
      lotNumber: 'LOT-2024-001', // String like in import
      expiryDate: '2024-12-31', // String like in import
      uom: 'Pcs', // String like in import
      
      // Required fields - exactly like in import
      isActive: true,
      productType: 'simple',
      stockManagementType: 'quantity',
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Other fields set to defaults - exactly like in import
      shortDescription: null,
      comparePrice: null,
      costPrice: null,
      images: null,
      banner: null,
      categoryId: null,
      subcategoryId: null,
      supplierId: null,
      tags: null,
      weight: null,
      dimensions: null,
      isFeatured: false,
      isDigital: false,
      requiresShipping: true,
      taxable: true,
      priceIncludingTax: null,
      priceExcludingTax: null,
      extraTax: null,
      furtherTax: null,
      fedPayableTax: null,
      discount: null,
      metaTitle: null,
      metaDescription: null,
      variationAttributes: null,
      pricePerUnit: null,
      baseWeightUnit: 'grams',
      thc: null,
      cbd: null,
      difficulty: null,
      floweringTime: null,
      yieldAmount: null,
      fixedNotifiedValueOrRetailPrice: null,
      saleType: null
    };

    console.log('🧪 Attempting to insert test product with import structure...');
    console.log('Test product fields:', {
      taxAmount: testProduct.taxAmount,
      taxPercentage: testProduct.taxPercentage,
      hsCode: testProduct.hsCode,
      serialNumber: testProduct.serialNumber,
      listNumber: testProduct.listNumber,
      bcNumber: testProduct.bcNumber,
      lotNumber: testProduct.lotNumber,
      expiryDate: testProduct.expiryDate,
      uom: testProduct.uom,
    });

    // Try to insert the product
    await db.insert(products).values(testProduct);

    console.log('✅ Test product inserted successfully');

    // Now retrieve it to verify what was actually saved
    const retrievedProduct = await db
      .select()
      .from(products)
      .where(eq(products.id, newProductId))
      .limit(1);

    if (retrievedProduct.length === 0) {
      throw new Error('Product was not found after insertion');
    }

    const saved = retrievedProduct[0];

    return NextResponse.json({
      success: true,
      message: 'Test product created with import structure',
      productId: newProductId,
      insertedValues: {
        taxAmount: testProduct.taxAmount,
        taxPercentage: testProduct.taxPercentage,
        hsCode: testProduct.hsCode,
        serialNumber: testProduct.serialNumber,
        listNumber: testProduct.listNumber,
        bcNumber: testProduct.bcNumber,
        lotNumber: testProduct.lotNumber,
        expiryDate: testProduct.expiryDate,
        uom: testProduct.uom,
      },
      savedValues: {
        taxAmount: saved.taxAmount,
        taxPercentage: saved.taxPercentage,
        hsCode: saved.hsCode,
        serialNumber: saved.serialNumber,
        listNumber: saved.listNumber,
        bcNumber: saved.bcNumber,
        lotNumber: saved.lotNumber,
        expiryDate: saved.expiryDate,
        uom: saved.uom,
      },
      valuesMatch: {
        taxAmount: saved.taxAmount === testProduct.taxAmount ? '✅' : '❌',
        taxPercentage: saved.taxPercentage === testProduct.taxPercentage ? '✅' : '❌',
        hsCode: saved.hsCode === testProduct.hsCode ? '✅' : '❌',
        serialNumber: saved.serialNumber === testProduct.serialNumber ? '✅' : '❌',
        listNumber: saved.listNumber === testProduct.listNumber ? '✅' : '❌',
        bcNumber: saved.bcNumber === testProduct.bcNumber ? '✅' : '❌',
        lotNumber: saved.lotNumber === testProduct.lotNumber ? '✅' : '❌',
        expiryDate: saved.expiryDate === testProduct.expiryDate ? '✅' : '❌',
        uom: saved.uom === testProduct.uom ? '✅' : '❌',
      }
    });

  } catch (error: any) {
    console.error('❌ Test product insertion failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    }, { status: 500 });
  }
}
