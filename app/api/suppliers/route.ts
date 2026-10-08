import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { suppliers } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { withTenant, ErrorResponses } from '@/lib/api-helpers';

export const GET = withTenant(async (request: NextRequest, context) => {
  try {
    const allSuppliers = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.tenantId, context.tenantId))
      .orderBy(suppliers.name);
      
    return NextResponse.json(allSuppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return ErrorResponses.serverError('Failed to fetch suppliers');
  }
});

export const POST = withTenant(async (req: NextRequest, context) => {
  try {
    const { 
      name,
      companyName,
      email,
      phone,
      fax,
      website,
      taxId,
      primaryContactName,
      primaryContactEmail,
      primaryContactPhone,
      primaryContactMobile,
      secondaryContactName,
      secondaryContactEmail,
      secondaryContactPhone,
      secondaryContactMobile,
      address,
      city,
      state,
      postalCode,
      country,
      paymentTerms,
      currency,
      notes,
      sellerNTNCNIC,
      sellerBusinessName,
      sellerProvince,
      sellerAddress,
      isActive
    } = await req.json();
    
    // Validate required fields
    if (!name || !email) {
      return ErrorResponses.invalidInput('Name and email are required');
    }
    
    // Check if supplier with this email already exists within the tenant
    const existingSupplier = await db
      .select()
      .from(suppliers)
      .where(and(
        eq(suppliers.email, email),
        eq(suppliers.tenantId, context.tenantId)
      ))
      .limit(1);
    
    if (existingSupplier.length > 0) {
      return ErrorResponses.invalidInput('Supplier with this email already exists');
    }
    
    const newSupplier = {
      id: uuidv4(),
      tenantId: context.tenantId, // Add tenant ID
      name,
      companyName: companyName || null,
      email,
      phone: phone || null,
      fax: fax || null,
      website: website || null,
      taxId: taxId || null,
      primaryContactName: primaryContactName || null,
      primaryContactEmail: primaryContactEmail || null,
      primaryContactPhone: primaryContactPhone || null,
      primaryContactMobile: primaryContactMobile || null,
      secondaryContactName: secondaryContactName || null,
      secondaryContactEmail: secondaryContactEmail || null,
      secondaryContactPhone: secondaryContactPhone || null,
      secondaryContactMobile: secondaryContactMobile || null,
      address: address || null,
      city: city || null,
      state: state || null,
      postalCode: postalCode || null,
      country: country || null,
      paymentTerms: paymentTerms || null,
      currency: currency || 'PKR',
      notes: notes || null,
      sellerNTNCNIC: sellerNTNCNIC || null,
      sellerBusinessName: sellerBusinessName || null,
      sellerProvince: sellerProvince || null,
      sellerAddress: sellerAddress || null,
      isActive: isActive !== undefined ? isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.insert(suppliers).values(newSupplier);
    
    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return ErrorResponses.serverError('Failed to create supplier');
  }
});
