import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { withTenant, ErrorResponses } from '@/lib/api-helpers';

export const GET = withTenant(async (request: NextRequest, context) => {
  try {
    const allCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.tenantId, context.tenantId));
    return NextResponse.json(allCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return ErrorResponses.serverError('Failed to fetch categories');
  }
});

export const POST = withTenant(async (req: NextRequest, context) => {
  try {
    const { name, slug, description, image, icon, iconName, isFeatured, parentId, sortOrder, isActive } = await req.json();
    
    // Validate required fields
    if (!name) {
      return ErrorResponses.invalidInput('Name is required');
    }
    
    const newCategory = {
      id: uuidv4(),
      tenantId: context.tenantId, // Add tenant ID
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description: description || null,
      image: image || null,
      icon: icon || null,
      iconName: iconName || null,
      isFeatured: isFeatured !== undefined ? isFeatured : false,
      parentId: parentId || null,
      sortOrder: sortOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
    };
    
    await db.insert(categories).values(newCategory);
    
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return ErrorResponses.serverError('Failed to create category');
  }
}); 