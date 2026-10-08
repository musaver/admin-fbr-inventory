import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { withTenant } from '@/lib/api-helpers';

export const POST = withTenant(async (request: NextRequest, context) => {
  try {
    const newProductId = uuidv4();
    
    // Create a test product with all the fields we're trying to save
    const testProduct = {
      id: newProductId,
      tenantId: context.tenantId,
      name: 'TEST PRODUCT - All Fields',
      slug: `test-all-fields-${newProductId.substring(0, 8)}`,
      description: 'Test product to verify all fields are working',
      sku: `TEST-ALL-${Date.now()}`,
      price: '99.99',
      
      // Tax fields
      taxAmount: '8.50',
      taxPercentage: '8.50',
      hsCode: '1234567890',
      
      // Identification fields
      serialNumber: 'SN-TEST-123',
      listNumber: 'LIST-TEST-456',
      bcNumber: 'BC-TEST-789',
      lotNumber: 'LOT-TEST-ABC',
      expiryDate: '2024-12-31',
      uom: 'Pcs',
      
      // Required fields
      isActive: true,
      productType: 'simple',
      stockManagementType: 'quantity',
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Other fields set to defaults
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
      yieldAmount: null
    };

    console.log('🧪 Attempting to insert test product with all fields...');
    console.log('Test product data:', JSON.stringify(testProduct, null, 2));

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
      message: 'Test product created and verified successfully',
      productId: newProductId,
      fieldsVerification: {
        // Basic fields
        name: saved.name === testProduct.name ? '✅' : '❌',
        sku: saved.sku === testProduct.sku ? '✅' : '❌',
        price: saved.price === testProduct.price ? '✅' : '❌',
        
        // Tax fields
        taxAmount: saved.taxAmount === testProduct.taxAmount ? '✅' : '❌',
        taxPercentage: saved.taxPercentage === testProduct.taxPercentage ? '✅' : '❌',
        hsCode: saved.hsCode === testProduct.hsCode ? '✅' : '❌',
        
        // Identification fields
        serialNumber: saved.serialNumber === testProduct.serialNumber ? '✅' : '❌',
        listNumber: saved.listNumber === testProduct.listNumber ? '✅' : '❌',
        bcNumber: saved.bcNumber === testProduct.bcNumber ? '✅' : '❌',
        lotNumber: saved.lotNumber === testProduct.lotNumber ? '✅' : '❌',
        expiryDate: saved.expiryDate === testProduct.expiryDate ? '✅' : '❌',
        uom: saved.uom === testProduct.uom ? '✅' : '❌',
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
      expectedValues: {
        taxAmount: testProduct.taxAmount,
        taxPercentage: testProduct.taxPercentage,
        hsCode: testProduct.hsCode,
        serialNumber: testProduct.serialNumber,
        listNumber: testProduct.listNumber,
        bcNumber: testProduct.bcNumber,
        lotNumber: testProduct.lotNumber,
        expiryDate: testProduct.expiryDate,
        uom: testProduct.uom,
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
      sqlMessage: error.sqlMessage
    }, { status: 500 });
  }
});
