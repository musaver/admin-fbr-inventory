import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, categories, subcategories, productVariants, productAddons, productTags, tags, suppliers, productInventory, stockMovements } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, sql, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withTenant, ErrorResponses } from '@/lib/api-helpers';

export const GET = withTenant(async (request: NextRequest, context) => {
  try {
    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    
    // Check if this is a paginated request (has page or limit params)
    const isPaginatedRequest = page !== null || limit !== null;
    
    if (isPaginatedRequest) {
      // Handle paginated request (for orders listing page)
      const pageNum = parseInt(page || '1');
      const limitNum = parseInt(limit || '10');
      const offset = (pageNum - 1) * limitNum;
      
      // Get total count for pagination
      const totalCountResult = await db
        .select({ count: sql`COUNT(*)` })
        .from(products)
        .where(eq(products.tenantId, context.tenantId));
      const totalCount = Number(totalCountResult[0]?.count || 0);
      
      const allProducts = await db
        .select({
          product: products,
          category: {
            id: categories.id,
            name: categories.name
          },
          subcategory: {
            id: subcategories.id,
            name: subcategories.name
          },
          supplier: {
            id: suppliers.id,
            name: suppliers.name,
            companyName: suppliers.companyName
          }
        })
        .from(products)
        .leftJoin(categories, and(
          eq(products.categoryId, categories.id),
          eq(categories.tenantId, context.tenantId)
        ))
        .leftJoin(subcategories, and(
          eq(products.subcategoryId, subcategories.id),
          eq(subcategories.tenantId, context.tenantId)
        ))
        .leftJoin(suppliers, and(
          eq(products.supplierId, suppliers.id),
          eq(suppliers.tenantId, context.tenantId)
        ))
        .where(eq(products.tenantId, context.tenantId))
        .orderBy(desc(products.createdAt))
        .limit(limitNum)
        .offset(offset);
        
      return NextResponse.json({
        data: allProducts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
          hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
          hasPrevPage: pageNum > 1
        }
      });
    } else {
      // Handle non-paginated request (for add order page - backward compatibility)
      const allProducts = await db
        .select({
          product: products,
          category: {
            id: categories.id,
            name: categories.name
          },
          subcategory: {
            id: subcategories.id,
            name: subcategories.name
          },
          supplier: {
            id: suppliers.id,
            name: suppliers.name,
            companyName: suppliers.companyName
          }
        })
        .from(products)
        .leftJoin(categories, and(
          eq(products.categoryId, categories.id),
          eq(categories.tenantId, context.tenantId)
        ))
        .leftJoin(subcategories, and(
          eq(products.subcategoryId, subcategories.id),
          eq(subcategories.tenantId, context.tenantId)
        ))
        .leftJoin(suppliers, and(
          eq(products.supplierId, suppliers.id),
          eq(suppliers.tenantId, context.tenantId)
        ))
        .where(eq(products.tenantId, context.tenantId))
        .orderBy(desc(products.createdAt));
        
      // Return original format for backward compatibility
      return NextResponse.json(allProducts);
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    return ErrorResponses.serverError('Failed to fetch products');
  }
});

export const POST = withTenant(async (req: NextRequest, context) => {
  try {
    const { 
      name, 
      slug, 
      description, 
      shortDescription, 
      sku, 
      price, 
      comparePrice, 
      costPrice, 
      images, 
      banner,
      categoryId, 
      subcategoryId, 
      supplierId,
      tags, 
      selectedTags, // New tag system
      weight, 
      dimensions, 
      isFeatured, 
      isActive, 
      isDigital, 
      requiresShipping, 
      taxable, 
      metaTitle, 
      metaDescription,
      productType,
      variationAttributes,
      variationMatrix,
      variants,
      addons,
      // Weight-based stock management fields
      stockManagementType,
      pricePerUnit,
      baseWeightUnit,
      // Initial stock quantity
      initialStock,
      // Cannabis-specific fields
      thc,
      cbd,
      difficulty,
      floweringTime,
      yieldAmount,
      // Additional product identification fields
      serialNumber,
      listNumber,
      bcNumber,
      lotNumber,
      expiryDate,
      // Additional tax fields
      fixedNotifiedValueOrRetailPrice,
      saleType,
      // Unit of measurement
      uom,
      // Tax and discount fields
      taxAmount,
      taxPercentage,
      priceIncludingTax,
      priceExcludingTax,
      extraTax,
      furtherTax,
      fedPayableTax,
      discount
    } = await req.json();
    
    // Debug logging for variable products
    if (productType === 'variable') {
      console.log('Variable product creation data:');
      console.log('variants:', variants);
      console.log('variationMatrix:', variationMatrix);
      console.log('variationMatrix?.variants:', variationMatrix?.variants);
    }
    
    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    // Price validation - required for quantity-based products (except group), weight-based products need pricePerUnit
    if (productType !== 'group') {
      if (stockManagementType === 'weight') {
        if (pricePerUnit === undefined || pricePerUnit === null) {
          return NextResponse.json({ error: 'Price per unit is required for weight-based products' }, { status: 400 });
        }
      } else {
        if (price === undefined || price === null) {
          return NextResponse.json({ error: 'Price is required for quantity-based products' }, { status: 400 });
        }
      }
    }
    
    // For group products with zero price, ensure they have addons
    if (productType === 'group' && (!price || price === 0) && (!addons || addons.length === 0)) {
      return NextResponse.json({ error: 'Group products with zero price must have at least one addon' }, { status: 400 });
    }
    
    const newProduct = {
      id: uuidv4(),
      tenantId: context.tenantId, // Add tenant ID
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description: description || null,
      shortDescription: shortDescription || null,
      sku: sku || null,
      price: (price || 0).toString(),
      comparePrice: comparePrice ? comparePrice.toString() : null,
      costPrice: costPrice ? costPrice.toString() : null,
      images: images ? JSON.stringify(images) : null,
      banner: banner || null,
      categoryId: categoryId || null,
      subcategoryId: subcategoryId || null,
      supplierId: supplierId || null,
      tags: tags ? JSON.stringify(tags) : null,
      weight: weight ? weight.toString() : null,
      dimensions: dimensions ? JSON.stringify(dimensions) : null,
      isFeatured: isFeatured || false,
      isActive: isActive !== undefined ? isActive : true,
      isDigital: isDigital || false,
      requiresShipping: requiresShipping !== undefined ? requiresShipping : true,
      taxable: taxable !== undefined ? taxable : true,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      productType: productType || 'simple',
      variationAttributes: (variationMatrix?.attributes || variationAttributes) ? JSON.stringify(variationMatrix?.attributes || variationAttributes) : null,
      // Weight-based stock management fields
      stockManagementType: stockManagementType || 'quantity',
      pricePerUnit: pricePerUnit ? pricePerUnit.toString() : null,
      baseWeightUnit: baseWeightUnit || 'grams',
      // Cannabis-specific fields
      thc: thc ? thc.toString() : null,
      cbd: cbd ? cbd.toString() : null,
      difficulty: difficulty || null,
      floweringTime: floweringTime || null,
      yieldAmount: yieldAmount || null,
      // Additional product identification fields
      serialNumber: serialNumber || null,
      listNumber: listNumber || null,
      bcNumber: bcNumber || null,
      lotNumber: lotNumber || null,
      expiryDate: expiryDate || null,
      // Additional tax fields
      fixedNotifiedValueOrRetailPrice: fixedNotifiedValueOrRetailPrice ? fixedNotifiedValueOrRetailPrice.toString() : null,
      saleType: saleType || null,
      // Unit of measurement
      uom: uom || null,
      // Tax and discount fields
      taxAmount: taxAmount ? taxAmount.toString() : null,
      taxPercentage: taxPercentage ? taxPercentage.toString() : null,
      priceIncludingTax: priceIncludingTax ? priceIncludingTax.toString() : null,
      priceExcludingTax: priceExcludingTax ? priceExcludingTax.toString() : null,
      extraTax: extraTax ? extraTax.toString() : null,
      furtherTax: furtherTax ? furtherTax.toString() : null,
      fedPayableTax: fedPayableTax ? fedPayableTax.toString() : null,
      discount: discount ? discount.toString() : null,
    };
    
    // Start transaction for product and variants
    await db.insert(products).values(newProduct);
    
    // If it's a variable product, create variants
    // Handle both old format (variants) and new format (variationMatrix.variants)
    const variantsToCreate = variationMatrix?.variants || variants;
    if (productType === 'variable' && variantsToCreate && variantsToCreate.length > 0) {
      const variantData = variantsToCreate.map((variant: any) => ({
        id: uuidv4(),
        tenantId: context.tenantId,
        productId: newProduct.id,
        title: variant.title,
        sku: variant.sku || null,
        price: variant.price ? variant.price.toString() : newProduct.price,
        comparePrice: variant.comparePrice ? variant.comparePrice.toString() : null,
        costPrice: variant.costPrice ? variant.costPrice.toString() : null,
        weight: variant.weight ? variant.weight.toString() : null,
        image: variant.image || null,
        inventoryQuantity: variant.inventoryQuantity || 0,
        inventoryManagement: true,
        allowBackorder: false,
        isActive: variant.isActive !== undefined ? variant.isActive : true,
        position: 0,
        variantOptions: variant.attributes ? JSON.stringify(variant.attributes) : null,
      }));
      
      await db.insert(productVariants).values(variantData);
    }
    
    // Create product addons for any product type that has addons
    if (addons && addons.length > 0) {
      const addonData = addons.map((addon: any) => ({
        id: uuidv4(),
        productId: newProduct.id,
        addonId: addon.addonId,
        price: addon.price ? addon.price.toString() : '0',
        isRequired: addon.isRequired || false,
        sortOrder: addon.sortOrder || 0,
        isActive: addon.isActive !== undefined ? addon.isActive : true,
      }));
      
      await db.insert(productAddons).values(addonData);
    }
    
    // Handle product tags (new tag system)
    if (selectedTags && selectedTags.length > 0) {
      const tagAssignments = [];
      
      for (let i = 0; i < selectedTags.length; i++) {
        const selectedTag = selectedTags[i];
        let tagId = selectedTag.tagId;
        
        // If this is a custom tag (has customValue and temporary ID), create the tag first
        if (selectedTag.customValue && selectedTag.tagId.startsWith('custom_')) {
          // Check if a tag with this custom value already exists in the group
          const existingTag = await db.query.tags.findFirst({
            where: (tags, { and, eq }) => and(
              eq(tags.groupId, selectedTag.groupId),
              eq(tags.name, selectedTag.customValue)
            ),
          });
          
          if (existingTag) {
            tagId = existingTag.id;
          } else {
            // Create new custom tag
            const newTagId = nanoid();
            const slug = selectedTag.customValue.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim('-');
            
            await db.insert(tags).values({
              id: newTagId,
              name: selectedTag.customValue,
              slug: slug,
              groupId: selectedTag.groupId,
              isCustom: true,
              customValue: selectedTag.customValue,
              isActive: true,
              sortOrder: 0,
            });
            
            tagId = newTagId;
          }
        }
        
        // Create product tag assignment
        tagAssignments.push({
          id: nanoid(),
          productId: newProduct.id,
          tagId: tagId,
          customValue: selectedTag.customValue || null,
          sortOrder: i,
        });
      }
      
      if (tagAssignments.length > 0) {
        await db.insert(productTags).values(tagAssignments);
      }
    }
    
    // Handle initial stock if provided
    if (initialStock !== undefined && initialStock !== null && initialStock > 0) {
      const inventoryId = uuidv4();
      const stockMovementId = uuidv4();
      
      // Create inventory record
      await db.insert(productInventory).values({
        id: inventoryId,
        tenantId: context.tenantId,
        productId: newProduct.id,
        variantId: null, // For simple products, no variant
        quantity: parseInt(initialStock.toString()),
        reservedQuantity: 0,
        availableQuantity: parseInt(initialStock.toString()),
        reorderPoint: 0,
        reorderQuantity: 0,
        weightQuantity: '0.00',
        reservedWeight: '0.00',
        availableWeight: '0.00',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Create stock movement record
      await db.insert(stockMovements).values({
        id: stockMovementId,
        tenantId: context.tenantId,
        inventoryId: inventoryId,
        productId: newProduct.id,
        variantId: null,
        movementType: 'in',
        quantity: parseInt(initialStock.toString()),
        previousQuantity: 0,
        newQuantity: parseInt(initialStock.toString()),
        weightQuantity: '0.00',
        previousWeightQuantity: '0.00',
        newWeightQuantity: '0.00',
        reason: 'Initial stock',
        notes: 'Initial stock added when creating product',
        supplierId: supplierId || null,
        processedBy: null, // Could be populated with current admin user if available
      });
    }
    
    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return ErrorResponses.serverError('Failed to create product');
  }
}); 