import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { addonGroups } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { desc, asc, eq } from 'drizzle-orm';
import { withTenant, ErrorResponses } from '@/lib/api-helpers';

export const GET = withTenant(async (request: NextRequest, context) => {
  try {
    const allGroups = await db
      .select()
      .from(addonGroups)
      .where(eq(addonGroups.tenantId, context.tenantId))
      .orderBy(asc(addonGroups.sortOrder), asc(addonGroups.title));
      
    return NextResponse.json(allGroups);
  } catch (error) {
    console.error('Error fetching addon groups:', error);
    return ErrorResponses.serverError('Failed to fetch addon groups');
  }
});

export const POST = withTenant(async (req: NextRequest, context) => {
  try {
    const { title, description, sortOrder, isActive } = await req.json();
    
    // Validate required fields
    if (!title) {
      return ErrorResponses.invalidInput('Title is required');
    }
    
    const newGroup = {
      id: uuidv4(),
      tenantId: context.tenantId, // Add tenant ID
      title,
      description: description || null,
      sortOrder: sortOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
    };
    
    await db.insert(addonGroups).values(newGroup);
    
    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error('Error creating addon group:', error);
    return ErrorResponses.serverError('Failed to create addon group');
  }
}); 