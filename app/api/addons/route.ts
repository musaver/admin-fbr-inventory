import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { addons, addonGroups } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, asc, and } from 'drizzle-orm';
import { withTenant, ErrorResponses } from '@/lib/api-helpers';

export const GET = withTenant(async (request: NextRequest, context) => {
  try {
    // Fetch addons with their group information
    const allAddons = await db
      .select({
        id: addons.id,
        title: addons.title,
        price: addons.price,
        description: addons.description,
        image: addons.image,
        groupId: addons.groupId,
        isActive: addons.isActive,
        sortOrder: addons.sortOrder,
        createdAt: addons.createdAt,
        updatedAt: addons.updatedAt,
        groupTitle: addonGroups.title,
        groupSortOrder: addonGroups.sortOrder,
      })
      .from(addons)
      .leftJoin(addonGroups, and(
        eq(addons.groupId, addonGroups.id),
        eq(addonGroups.tenantId, context.tenantId)
      ))
      .where(eq(addons.tenantId, context.tenantId))
      .orderBy(
        asc(addonGroups.sortOrder), 
        asc(addons.sortOrder), 
        asc(addons.title)
      );
      
    return NextResponse.json(allAddons);
  } catch (error) {
    console.error('Error fetching addons:', error);
    return ErrorResponses.serverError('Failed to fetch addons');
  }
});

export const POST = withTenant(async (req: NextRequest, context) => {
  try {
    const { 
      title, 
      price, 
      description,
      image,
      groupId,
      sortOrder, 
      isActive 
    } = await req.json();
    
    // Validate required fields
    if (!title || price === undefined || price === null) {
      return ErrorResponses.invalidInput('Title and price are required');
    }
    
    const newAddon = {
      id: uuidv4(),
      tenantId: context.tenantId, // Add tenant ID
      title,
      price: price.toString(),
      description: description || null,
      image: image || null,
      groupId: groupId || null,
      sortOrder: sortOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
    };
    
    await db.insert(addons).values(newAddon);
    
    return NextResponse.json(newAddon, { status: 201 });
  } catch (error) {
    console.error('Error creating addon:', error);
    return ErrorResponses.serverError('Failed to create addon');
  }
}); 