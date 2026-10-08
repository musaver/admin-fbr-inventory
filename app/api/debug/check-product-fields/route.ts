import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/lib/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    // Get the most recent product to check what fields are actually stored
    const recentProducts = await db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt))
      .limit(3);

    if (recentProducts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No products found in database'
      });
    }

    // Check what fields exist on the first product
    const sampleProduct = recentProducts[0];
    const fieldCheck = {
      // Basic fields
      id: sampleProduct.id || 'MISSING',
      name: sampleProduct.name || 'MISSING',
      sku: sampleProduct.sku || 'MISSING',
      price: sampleProduct.price || 'MISSING',
      
      // Tax fields we're trying to save
      taxAmount: sampleProduct.taxAmount || 'MISSING',
      taxPercentage: sampleProduct.taxPercentage || 'MISSING',
      hsCode: sampleProduct.hsCode || 'MISSING',
      
      // Identification fields we're trying to save
      serialNumber: sampleProduct.serialNumber || 'MISSING',
      listNumber: sampleProduct.listNumber || 'MISSING',
      bcNumber: sampleProduct.bcNumber || 'MISSING',
      lotNumber: sampleProduct.lotNumber || 'MISSING',
      expiryDate: sampleProduct.expiryDate || 'MISSING',
      uom: sampleProduct.uom || 'MISSING',
    };

    return NextResponse.json({
      success: true,
      totalProducts: recentProducts.length,
      sampleProduct: fieldCheck,
      allFieldsOnSample: Object.keys(sampleProduct),
      recentProducts: recentProducts.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        taxAmount: p.taxAmount,
        serialNumber: p.serialNumber,
        createdAt: p.createdAt
      }))
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
