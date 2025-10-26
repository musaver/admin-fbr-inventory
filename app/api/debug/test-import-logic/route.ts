import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';

export async function POST() {
  try {
    // Simulate the exact same data structure as the import function
    const productData = {
      sku: 'TEST-IMPORT-LOGIC',
      unitPrice: '29.99',
      description: 'Test import logic',
      gstAmount: '2.50',
      gstPercentage: '8.50',
      hsCode: '1234567890',
      stockQuantity: '0',
      serialNumber: 'SN123456789',
      listNumber: 'LIST-001',
      bcNumber: 'BC123456',
      lotNumber: 'LOT-2024-001',
      expiryDate: '2024-12-31',
      uom: 'Pcs'
    };

    // Use the exact same parsing logic as the import function
    const newProductId = uuidv4();
    const tenantId = '018c08c2-ab55-45cf-b8fc-48bd335d9541';
    const price = parseFloat(productData.unitPrice);
    
    // Parse GST fields - EXACT same logic as import
    const gstAmount = productData.gstAmount && productData.gstAmount.trim() !== '' ? parseFloat(productData.gstAmount) : null;
    const gstPercentage = productData.gstPercentage && productData.gstPercentage.trim() !== '' ? parseFloat(productData.gstPercentage) : null;
    
    // Parse expiry date - EXACT same logic as import
    let expiryDate = null;
    if (productData.expiryDate) {
      try {
        const parsedDate = new Date(productData.expiryDate);
        if (!isNaN(parsedDate.getTime())) {
          expiryDate = parsedDate.toISOString().split('T')[0];
        }
      } catch {
        expiryDate = null;
      }
    }

    // Create newProduct object - EXACT same structure as import
    const newProduct = {
      id: newProductId,
      tenantId,
      name: productData.description?.trim() || productData.sku.trim(),
      slug: `${productData.sku.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${newProductId.substring(0, 8)}`,
      description: productData.description?.trim() || null,
      sku: productData.sku.trim(),
      price: price.toFixed(2),
      // GST fields from CSV mapped to correct database columns
      taxAmount: gstAmount !== null ? gstAmount.toFixed(2) : '0.00',
      taxPercentage: gstPercentage !== null ? gstPercentage.toFixed(2) : '0.00',
      // HS Code mapped to correct database column
      hsCode: productData.hsCode && productData.hsCode.trim() !== '' ? productData.hsCode.trim() : null,
      // Inventory tracking fields mapped to correct database columns
      serialNumber: productData.serialNumber && productData.serialNumber.trim() !== '' ? productData.serialNumber.trim() : null,
      listNumber: productData.listNumber && productData.listNumber.trim() !== '' ? productData.listNumber.trim() : null,
      bcNumber: productData.bcNumber && productData.bcNumber.trim() !== '' ? productData.bcNumber.trim() : null,
      lotNumber: productData.lotNumber && productData.lotNumber.trim() !== '' ? productData.lotNumber.trim() : null,
      expiryDate: expiryDate,
      // UOM mapped to correct database column
      uom: productData.uom && productData.uom.trim() !== '' ? productData.uom.trim() : null,
      // Default required fields
      isActive: true,
      productType: 'simple',
      stockManagementType: 'quantity',
      createdAt: new Date(),
      updatedAt: new Date(),
      // Set other fields to null/defaults
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

    console.log('🧪 Testing import logic with product:', {
      taxAmount: newProduct.taxAmount,
      taxPercentage: newProduct.taxPercentage,
      hsCode: newProduct.hsCode,
      serialNumber: newProduct.serialNumber,
      listNumber: newProduct.listNumber,
      bcNumber: newProduct.bcNumber,
      lotNumber: newProduct.lotNumber,
      expiryDate: newProduct.expiryDate,
      uom: newProduct.uom,
    });

    // Insert using the exact same logic as import
    await db.insert(products).values(newProduct);

    return NextResponse.json({
      success: true,
      message: 'Product created using import logic',
      productId: newProductId,
      createdFields: {
        taxAmount: newProduct.taxAmount,
        taxPercentage: newProduct.taxPercentage,
        hsCode: newProduct.hsCode,
        serialNumber: newProduct.serialNumber,
        listNumber: newProduct.listNumber,
        bcNumber: newProduct.bcNumber,
        lotNumber: newProduct.lotNumber,
        expiryDate: newProduct.expiryDate,
        uom: newProduct.uom,
      }
    });

  } catch (error: any) {
    console.error('❌ Import logic test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
