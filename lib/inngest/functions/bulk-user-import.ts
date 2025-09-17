import { inngest } from '@/lib/inngest';
import { db } from '@/lib/db';
import { importJobs, user, userLoyaltyPoints, products, stockMovements } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

interface UserImportRow {
  name: string;
  email: string;
  phone: string;
  buyerNTNCNIC: string;
  buyerBusinessName: string;
  buyerProvince: string;
  buyerAddress: string;
  buyerRegistrationType: string;
}

interface ProductImportRow {
  sku: string;
  unitPrice: string;
  priceIncludingTax?: string;
  description?: string;
  gstAmount?: string;
  gstPercentage?: string;
  hsCode?: string;
  stockQuantity?: string;
  serialNumber?: string;
  listNumber?: string;
  bcNumber?: string;
  lotNumber?: string;
  expiryDate?: string;
  uom?: string;
}

interface ProcessingResult {
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    email?: string;
    identifier?: string; // Generic identifier (email for users, SKU for products)
    message: string;
  }>;
  successfulUsers?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  successfulProducts?: Array<{
    id: string;
    name: string;
    sku: string;
  }>;
}

// Test function to verify CSV parsing
function testCSVParsing() {
  const testCSV = `Name,Email,Phone,Buyer NTN Or CNIC,Buyer Business Name,Buyer Province,Buyer Address,Buyer Registration Type
"John Doe","john@test.com","+92300-1234567","1234567890123","Doe Industries","Punjab","123 Business Street, Lahore","Registered"
"Jane Smith","jane@test.com","+92321-9876543","9876543210987","Smith Trading Co","Sindh","456 Commerce Avenue, Karachi","Registered"
"Bob Wilson","bob@test.com","+92333-1122334","1122334455667","Wilson Corp","KPK","789 Market Road, Peshawar","Unregistered"`;
  
  console.log('🧪 Testing CSV parsing...');
  console.log('Raw CSV:', testCSV);
  
  try {
    const users = parseUserCSV(testCSV);
    console.log('✅ Parsed users:', users);
    return users;
  } catch (error) {
    console.error('❌ CSV parsing failed:', error);
    return [];
  }
}

// Utility function to parse CSV for users
function parseUserCSV(csvText: string): UserImportRow[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain header and at least one data row');
  }

  // Parse header
  const header = lines[0].split(',').map(h => h.replace(/['"]/g, '').trim());
  console.log('📋 User CSV Headers found:', header);
  
  // Expected columns (case-insensitive)
  const columnMap = {
    'name': ['name', 'full name', 'user name'],
    'email': ['email', 'email address'],
    'phone': ['phone', 'phone number', 'mobile', 'mobile number'],
    'buyerNTNCNIC': ['buyer ntn or cnic', 'ntn', 'cnic', 'buyer ntn/cnic'],
    'buyerBusinessName': ['buyer business name', 'business name'],
    'buyerProvince': ['buyer province', 'province'],
    'buyerAddress': ['buyer address', 'address'],
    'buyerRegistrationType': ['buyer registration type', 'registration type']
  };

  // Map header indices
  const headerMap: Record<string, number> = {};
  Object.entries(columnMap).forEach(([key, variants]) => {
    const index = header.findIndex(h => 
      variants.some(variant => h.toLowerCase() === variant.toLowerCase())
    );
    if (index !== -1) {
      headerMap[key] = index;
      console.log(`✅ User: Mapped column "${key}" to header "${header[index]}" at index ${index}`);
    } else {
      console.log(`❌ User: Could not map column "${key}". Available headers:`, header.map(h => `"${h.toLowerCase()}"`));
    }
  });
  console.log('📊 User CSV Final headerMap:', headerMap);

  // Validate required columns
  if (headerMap.name === undefined || headerMap.email === undefined) {
    throw new Error('Required columns missing: Name and Email are required');
  }

  // Parse data rows
  const users: UserImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (!row.trim()) continue;

    // Simple CSV parser (handles basic quoted values)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < row.length; j++) {
      const char = row[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^["']|["']$/g, ''));

    // Extract user data
    const userData: UserImportRow = {
      name: values[headerMap.name] || '',
      email: values[headerMap.email] || '',
      phone: values[headerMap.phone] || '',
      buyerNTNCNIC: values[headerMap.buyerNTNCNIC] || '',
      buyerBusinessName: values[headerMap.buyerBusinessName] || '',
      buyerProvince: values[headerMap.buyerProvince] || '',
      buyerAddress: values[headerMap.buyerAddress] || '',
      buyerRegistrationType: values[headerMap.buyerRegistrationType] || '',
    };

    // Debug logs (uncomment if needed)
    // console.log(`👤 User ${i}: Raw values:`, values);
    // console.log(`👤 User ${i}: Parsed data:`, userData);
    // console.log(`👤 User ${i}: HeaderMap:`, headerMap);
    users.push(userData);
  }

  return users;
}

// Utility function to parse CSV for products
function parseProductCSV(csvText: string): ProductImportRow[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain header and at least one data row');
  }

  // Parse header
  const header = lines[0].split(',').map(h => h.replace(/['"]/g, '').trim());
  console.log('📋 Product CSV Headers found:', header);
  console.log('📋 Expected template headers: SKU,Unit Price,Price Including Tax,Description,GST Amount,GST Percentage,HS Code,Stock Quantity,Serial Number,List Number,BC Number,Lot Number,Expiry Date,UOM');
  
  // Expected columns (case-insensitive)
  const columnMap = {
    'sku': ['sku', 'product sku', 'product_sku'],
    'unitPrice': ['unit price', 'price', 'product price'],
    'priceIncludingTax': ['price including tax', 'price_including_tax', 'inclusive price', 'price incl tax'],
    'description': ['description', 'product description', 'short description'],
    'gstAmount': ['gst amount', 'gst_amount', 'tax amount'],
    'gstPercentage': ['gst percentage', 'gst_percentage', 'tax percentage'],
    'hsCode': ['hs code', 'hs_code', 'hscode'],
    'stockQuantity': ['stock quantity', 'stock_quantity', 'quantity', 'qty'],
    'serialNumber': ['serial number', 'serial_number', 'serial no'],
    'listNumber': ['list number', 'list_number', 'list no'],
    'bcNumber': ['bc number', 'bc_number', 'bc no'],
    'lotNumber': ['lot number', 'lot_number', 'lot no'],
    'expiryDate': ['expiry date', 'expiry_date', 'expiration date'],
    'uom': ['uom', 'unit of measure', 'unit']
  };

  // Map header indices
  const headerMap: Record<string, number> = {};
  Object.entries(columnMap).forEach(([key, variants]) => {
    const index = header.findIndex(h => 
      variants.some(variant => h.toLowerCase() === variant.toLowerCase())
    );
    if (index !== -1) {
      headerMap[key] = index;
      console.log(`✅ Product: Mapped column "${key}" to header "${header[index]}" at index ${index}`);
    } else {
      console.log(`❌ Product: Could not map column "${key}". Available headers:`, header.map(h => `"${h.toLowerCase()}"`));
    }
  });
  console.log('📊 Product CSV Final headerMap:', headerMap);
  
  // Show which columns are missing
  const missingColumns = Object.keys(columnMap).filter(key => headerMap[key] === undefined);
  if (missingColumns.length > 0) {
    console.log('❌ Missing columns that could not be mapped:', missingColumns);
    console.log('💡 Make sure your CSV headers exactly match one of these variants for each field:');
    missingColumns.forEach(col => {
      console.log(`   ${col}: ${columnMap[col].join(', ')}`);
    });
  } else {
    console.log('✅ All expected columns were successfully mapped!');
  }

  // Validate required columns
  if (headerMap.sku === undefined || headerMap.unitPrice === undefined) {
    throw new Error('Required columns missing: SKU and Unit Price are required');
  }

  // Parse data rows
  const products: ProductImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (!row.trim()) continue;

    // Simple CSV parser (handles basic quoted values)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < row.length; j++) {
      const char = row[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^["']|["']$/g, ''));

    // Extract product data
    const productData: ProductImportRow = {
      sku: values[headerMap.sku] || '',
      unitPrice: values[headerMap.unitPrice] || '',
      priceIncludingTax: values[headerMap.priceIncludingTax] || '',
      description: values[headerMap.description] || '',
      gstAmount: values[headerMap.gstAmount] || '',
      gstPercentage: values[headerMap.gstPercentage] || '',
      hsCode: values[headerMap.hsCode] || '',
      stockQuantity: values[headerMap.stockQuantity] || '',
      serialNumber: values[headerMap.serialNumber] || '',
      listNumber: values[headerMap.listNumber] || '',
      bcNumber: values[headerMap.bcNumber] || '',
      lotNumber: values[headerMap.lotNumber] || '',
      expiryDate: values[headerMap.expiryDate] || '',
      uom: values[headerMap.uom] || '',
    };

    // Debug log for first few rows
    if (i <= 3) {
      console.log(`🔍 Product Row ${i} extracted data:`, productData);
      console.log(`🔍 Product Row ${i} raw values:`, values);
      console.log(`🔍 Product Row ${i} header mapping:`, {
        sku: headerMap.sku,
        unitPrice: headerMap.unitPrice,
        priceIncludingTax: headerMap.priceIncludingTax,
        description: headerMap.description,
        gstAmount: headerMap.gstAmount,
        gstPercentage: headerMap.gstPercentage,
        hsCode: headerMap.hsCode,
        serialNumber: headerMap.serialNumber,
        listNumber: headerMap.listNumber,
        bcNumber: headerMap.bcNumber,
        lotNumber: headerMap.lotNumber,
        expiryDate: headerMap.expiryDate,
        uom: headerMap.uom
      });
    }

    products.push(productData);
  }

  return products;
}


// Validate user data
function validateUser(userData: UserImportRow): string | null {
  if (!userData.name?.trim()) {
    return 'Name is required';
  }
  
  if (!userData.email?.trim()) {
    return 'Email is required';
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userData.email)) {
    return 'Invalid email format';
  }

  return null;
}

// Validate product data
function validateProduct(productData: ProductImportRow): string | null {
  if (!productData.sku?.trim()) {
    return 'SKU is required';
  }

  if (!productData.unitPrice?.trim()) {
    return 'Unit Price is required';
  }

  // Validate price is a valid number
  const price = parseFloat(productData.unitPrice);
  if (isNaN(price) || price < 0) {
    return 'Unit Price must be a valid positive number';
  }

  return null;
}

// Process users in chunks
async function processUserChunk(
  users: UserImportRow[], 
  tenantId: string, 
  startIndex: number
): Promise<ProcessingResult> {
  console.log(`👥 Processing ${users.length} users for tenant: ${tenantId}`);
  
  const result: ProcessingResult = {
    successful: 0,
    failed: 0,
    errors: [],
    successfulUsers: []
  };

  for (let i = 0; i < users.length; i++) {
    const userData = users[i];
    const globalRowIndex = startIndex + i + 1; // +1 for header row

    try {
      // Validate user data
      // console.log(`🔍 Validating user ${globalRowIndex}:`, userData);
      const validationError = validateUser(userData);
      if (validationError) {
        console.log(`❌ Validation failed for user ${globalRowIndex}: ${validationError}`);
        result.errors.push({
          row: globalRowIndex,
          email: userData.email || 'N/A',
          message: validationError
        });
        result.failed++;
        continue;
      }
      // console.log(`✅ Validation passed for user ${globalRowIndex}`);

      // Create new user ID
      const newUserId = uuidv4();
      
      // Create new user object with original email
      const newUser = {
        id: newUserId,
        tenantId,
        name: userData.name.trim(),
        email: userData.email.toLowerCase().trim(),
        phone: userData.phone?.trim() || null,
        userType: 'customer',
        buyerNTNCNIC: userData.buyerNTNCNIC?.trim() || null,
        buyerBusinessName: userData.buyerBusinessName?.trim() || null,
        buyerProvince: userData.buyerProvince?.trim() || null,
        buyerAddress: userData.buyerAddress?.trim() || null,
        buyerRegistrationType: userData.buyerRegistrationType?.trim() || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Try to insert new user first, handle duplicate email case
      try {
      await db.insert(user).values(newUser);
        console.log(`✅ New user inserted successfully: ${userData.email}`);

        // Initialize loyalty points for the new user
      await db.insert(userLoyaltyPoints).values({
        id: uuidv4(),
        userId: newUserId,
        totalPointsEarned: 0,
        totalPointsRedeemed: 0,
        availablePoints: 0,
        pendingPoints: 0,
        pointsExpiringSoon: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      result.successful++;
      result.successfulUsers!.push({
        id: newUserId,
        name: userData.name.trim(),
        email: userData.email.toLowerCase().trim()
      });
        
      } catch (insertError: any) {
        // Check if this is specifically our tenant-email unique constraint
        const isTenantEmailDuplicate = insertError.code === 'ER_DUP_ENTRY' && 
                                      insertError.message?.includes('user_email_tenant_unique');
        
        if (isTenantEmailDuplicate) {
          console.log(`🔄 User with email ${userData.email} already exists in this tenant, updating...`);
          
          // Update existing user with new data
          try {
            await db.update(user)
              .set({
                name: userData.name.trim(),
                phone: userData.phone?.trim() || null,
                buyerNTNCNIC: userData.buyerNTNCNIC?.trim() || null,
                buyerBusinessName: userData.buyerBusinessName?.trim() || null,
                buyerProvince: userData.buyerProvince?.trim() || null,
                buyerAddress: userData.buyerAddress?.trim() || null,
                buyerRegistrationType: userData.buyerRegistrationType?.trim() || null,
                updatedAt: new Date(),
              })
              .where(and(
                eq(user.email, userData.email.toLowerCase().trim()),
                eq(user.tenantId, tenantId)
              ));
            
            // Get the existing user ID for response
            const existingUser = await db.select({ id: user.id })
              .from(user)
              .where(and(
                eq(user.email, userData.email.toLowerCase().trim()),
                eq(user.tenantId, tenantId)
              ))
              .limit(1);
            
            console.log(`✅ User updated successfully: ${userData.email}`);
            
            result.successful++;
            result.successfulUsers!.push({
              id: existingUser[0]?.id || newUserId,
              name: userData.name.trim(),
              email: userData.email.toLowerCase().trim()
            });
            
          } catch (updateError: any) {
            console.error(`💥 Error updating existing user ${userData.email}:`, {
              message: updateError.message,
              code: updateError.code,
              sqlState: updateError.sqlState,
              errno: updateError.errno
            });
            
            result.errors.push({
              row: globalRowIndex,
              email: userData.email,
              message: `Failed to update existing user: ${updateError.message}`
            });
            result.failed++;
          }
        } else {
          console.error(`💥 Error inserting new user ${userData.email}:`, {
            message: insertError.message,
            code: insertError.code,
            sqlState: insertError.sqlState,
            errno: insertError.errno
          });
          
          result.errors.push({
            row: globalRowIndex,
            email: userData.email,
            message: `Database error: ${insertError.message}`
          });
          result.failed++;
        }
      }

    } catch (error: any) {
      result.errors.push({
        row: globalRowIndex,
        email: userData.email || 'N/A',
        message: error.message || 'Unknown error occurred'
      });
      result.failed++;
    }
  }

  return result;
}

// Process products in chunks
async function processProductChunk(
  productRows: ProductImportRow[], 
  tenantId: string, 
  startIndex: number
): Promise<ProcessingResult> {
  console.log(`🛒 Processing ${productRows.length} products for tenant: ${tenantId}`);
  
  const result: ProcessingResult = {
    successful: 0,
    failed: 0,
    errors: [],
    successfulProducts: []
  };

  for (let i = 0; i < productRows.length; i++) {
    const productData = productRows[i];
    const globalRowIndex = startIndex + i + 1; // +1 for header row

    // Special debug for first row
    if (globalRowIndex === 1) {
      console.log('🔍 FIRST ROW DEBUG:', {
        rowIndex: globalRowIndex,
        productData: JSON.stringify(productData, null, 2),
        sku: productData.sku,
        unitPrice: productData.unitPrice,
        description: productData.description
      });
    }

    try {
      // Validate product data
      const validationError = validateProduct(productData);
      if (validationError) {
        console.log(`❌ Validation failed for row ${globalRowIndex}:`, validationError);
        result.errors.push({
          row: globalRowIndex,
          identifier: productData.sku || 'N/A',
          message: validationError
        });
        result.failed++;
        continue;
      }

      // NOTE: Allow duplicate SKUs during import. We no longer skip rows if a
      // product with the same SKU exists. Slugs remain unique per record.

      // Create new product with only the 14 specified fields
      const newProductId = uuidv4();
      const price = parseFloat(productData.unitPrice);
      
      // Parse price fields for the new mapping requirements
      const priceExcludingTax = parseFloat(productData.unitPrice); // Unit Price -> price_excluding_tax
      const priceIncludingTax = productData.priceIncludingTax && productData.priceIncludingTax.trim() !== '' ? parseFloat(productData.priceIncludingTax) : null; // Price Including Tax -> price_including_tax
      
      // Parse GST fields
      const gstAmount = productData.gstAmount && productData.gstAmount.trim() !== '' ? parseFloat(productData.gstAmount) : null;
      const gstPercentage = productData.gstPercentage && productData.gstPercentage.trim() !== '' ? parseFloat(productData.gstPercentage) : null;
      
      // Parse stock quantity
      const stockQuantity = productData.stockQuantity ? parseInt(productData.stockQuantity) : 0;
      
      // Parse expiry date
      let expiryDate = null;
      if (productData.expiryDate) {
        try {
          const parsedDate = new Date(productData.expiryDate);
          if (!isNaN(parsedDate.getTime())) {
            // Format as YYYY-MM-DD for database
            expiryDate = parsedDate.toISOString().split('T')[0];
          }
        } catch {
          expiryDate = null;
        }
      }

      // Debug: Log the parsed values from CSV
      console.log(`🔍 DEBUG: Parsed CSV values for ${productData.sku}:`, {
        gstAmount: gstAmount,
        gstPercentage: gstPercentage,
        hsCode: productData.hsCode,
        serialNumber: productData.serialNumber,
        listNumber: productData.listNumber,
        bcNumber: productData.bcNumber,
        lotNumber: productData.lotNumber,
        expiryDate: expiryDate,
        uom: productData.uom,
        rawExpiryDate: productData.expiryDate
      });

        // DEBUG: Log parsed values for first few products
        if (globalRowIndex <= 3) {
          console.log(`🔍 Parsed values for row ${globalRowIndex}:`, {
            gstAmount, 
            gstPercentage,
            serialNumber: productData.serialNumber, 
            uom: productData.uom
          });
        }
      
      const newProduct = {
        id: newProductId,
        tenantId,
        name: productData.description?.trim() || productData.sku.trim(),
        slug: `${productData.sku.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${newProductId.substring(0, 8)}`,
        description: productData.description?.trim() || null,
        sku: productData.sku.trim(),
        price: price.toFixed(2),
        // GST fields from CSV mapped to correct database columns
        taxAmount: gstAmount !== null ? gstAmount.toFixed(2) : '0.00',  // GST Amount -> tax_amount (default to '0.00' not null)
        taxPercentage: gstPercentage !== null ? gstPercentage.toFixed(2) : '0.00',  // GST Percentage -> tax_percentage (default to '0.00' not null)
        // HS Code mapped to correct database column
        hsCode: productData.hsCode && productData.hsCode.trim() !== '' ? productData.hsCode.trim() : null,  // HS Code -> hs_code
        // Stock Quantity will be handled separately via stock movements
        // Inventory tracking fields mapped to correct database columns
        serialNumber: productData.serialNumber && productData.serialNumber.trim() !== '' ? productData.serialNumber.trim() : null,  // Serial Number -> serial_number
        listNumber: productData.listNumber && productData.listNumber.trim() !== '' ? productData.listNumber.trim() : null,  // List Number -> list_number
        bcNumber: productData.bcNumber && productData.bcNumber.trim() !== '' ? productData.bcNumber.trim() : null,  // BC Number -> bc_number
        lotNumber: productData.lotNumber && productData.lotNumber.trim() !== '' ? productData.lotNumber.trim() : null,  // Lot Number -> lot_number
        expiryDate: expiryDate,  // Expiry Date -> expiry_date (stored as YYYY-MM-DD string)
        // UOM mapped to correct database column
        uom: productData.uom && productData.uom.trim() !== '' ? productData.uom.trim() : null,  // UOM -> uom
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
        taxable: gstAmount || gstPercentage ? true : false,
        priceIncludingTax: priceIncludingTax !== null ? priceIncludingTax.toFixed(2) : '0.00',  // Price Including Tax -> price_including_tax
        priceExcludingTax: priceExcludingTax.toFixed(2),  // Unit Price -> price_excluding_tax
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
      };

       // Insert product with fallback for missing columns
      try {
        console.log(`🔄 Attempting to insert product: ${newProduct.name} (SKU: ${newProduct.sku})`);
         console.log('🔍 Product CSV data received:', {
           unitPrice: productData.unitPrice,
           priceIncludingTax: productData.priceIncludingTax,
           gstAmount: productData.gstAmount,
           gstPercentage: productData.gstPercentage,
           hsCode: productData.hsCode,
           serialNumber: productData.serialNumber,
           listNumber: productData.listNumber,
           bcNumber: productData.bcNumber,
           lotNumber: productData.lotNumber,
           expiryDate: productData.expiryDate,
           uom: productData.uom
         });
         console.log('🔍 Product database values being inserted:', {
           price: newProduct.price,
           priceIncludingTax: newProduct.priceIncludingTax,
           priceExcludingTax: newProduct.priceExcludingTax,
           taxAmount: newProduct.taxAmount,
           taxPercentage: newProduct.taxPercentage,
           hsCode: newProduct.hsCode,
           serialNumber: newProduct.serialNumber,
           listNumber: newProduct.listNumber,
           bcNumber: newProduct.bcNumber,
           lotNumber: newProduct.lotNumber,
           expiryDate: newProduct.expiryDate,
           uom: newProduct.uom,
           sku: newProduct.sku,
           name: newProduct.name
         });
         
         console.log('🔍 All product fields being inserted:', Object.keys(newProduct));

        // Debug: Log the exact values being inserted
        console.log(`🔍 DEBUG: Inserting product with values:`, {
          name: newProduct.name,
          sku: newProduct.sku,
          price: newProduct.price,
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

        // DEBUG: Log critical values for first few products
        if (globalRowIndex <= 3) {
          console.log(`🔥 About to insert product ${globalRowIndex}:`, {
            sku: productData.sku,
            taxAmount: newProduct.taxAmount,
            serialNumber: newProduct.serialNumber,
            hsCode: newProduct.hsCode,
            uom: newProduct.uom
          });
        }

        // Try to insert with all new fields first
        try {
        await db.insert(products).values(newProduct);
          console.log(`✅ Product inserted successfully with all fields: ${newProduct.name} (SKU: ${newProduct.sku})`);
         } catch (newFieldsError: any) {
           console.error(`❌ Product insertion with new fields failed:`, {
             message: newFieldsError.message,
             code: newFieldsError.code,
             errno: newFieldsError.errno,
             sqlState: newFieldsError.sqlState,
             sqlMessage: newFieldsError.sqlMessage
           });
           
           // Store the error in the result for debugging
           result.errors.push({
             row: globalRowIndex,
             identifier: productData.sku || 'N/A',
             message: `Database insertion failed: ${newFieldsError.message} (Code: ${newFieldsError.code}, Errno: ${newFieldsError.errno})`
           });
           
           // If new fields cause error (columns don't exist), try without them
           if (newFieldsError.code === 'ER_BAD_FIELD_ERROR' || newFieldsError.errno === 1054) {
             console.log(`⚠️ Column doesn't exist error detected, inserting with basic fields: ${newProduct.name} (SKU: ${newProduct.sku})`);
             
             // Create basic product without the new fields
             const basicProduct = {
               id: newProduct.id,
               tenantId: newProduct.tenantId,
               name: newProduct.name,
               slug: newProduct.slug,
               description: newProduct.description,
               sku: newProduct.sku,
               price: newProduct.price,
               isActive: newProduct.isActive,
               productType: newProduct.productType,
               stockManagementType: newProduct.stockManagementType,
               createdAt: newProduct.createdAt,
               updatedAt: newProduct.updatedAt,
               shortDescription: newProduct.shortDescription,
               comparePrice: newProduct.comparePrice,
               costPrice: newProduct.costPrice,
               images: newProduct.images,
               banner: newProduct.banner,
               categoryId: newProduct.categoryId,
               subcategoryId: newProduct.subcategoryId,
               supplierId: newProduct.supplierId,
               tags: newProduct.tags,
               weight: newProduct.weight,
               dimensions: newProduct.dimensions,
               isFeatured: newProduct.isFeatured,
               isDigital: newProduct.isDigital,
               requiresShipping: newProduct.requiresShipping,
               taxable: newProduct.taxable,
               priceIncludingTax: newProduct.priceIncludingTax,
               priceExcludingTax: newProduct.priceExcludingTax,
               extraTax: newProduct.extraTax,
               furtherTax: newProduct.furtherTax,
               fedPayableTax: newProduct.fedPayableTax,
               discount: newProduct.discount,
               metaTitle: newProduct.metaTitle,
               metaDescription: newProduct.metaDescription,
               variationAttributes: newProduct.variationAttributes,
               pricePerUnit: newProduct.pricePerUnit,
               baseWeightUnit: newProduct.baseWeightUnit,
               thc: newProduct.thc,
               cbd: newProduct.cbd,
               difficulty: newProduct.difficulty,
               floweringTime: newProduct.floweringTime,
               yieldAmount: newProduct.yieldAmount
             };

             await db.insert(products).values(basicProduct);
             console.log(`✅ Product inserted successfully with basic fields: ${newProduct.name} (SKU: ${newProduct.sku})`);
             console.log(`⚠️ Note: The following fields were not saved due to missing database columns: GST Amount, GST Percentage, HS Code, Serial Number, List Number, BC Number, Lot Number, Expiry Date, UOM`);
           } else {
             console.error(`❌ Product insertion failed with unexpected error:`, {
               message: newFieldsError.message,
               code: newFieldsError.code,
               errno: newFieldsError.errno
             });
             throw newFieldsError;
           }
         }
         
         // Create stock movement entry if stock quantity is provided
         if (stockQuantity > 0) {
           const stockMovementId = uuidv4();
           const inventoryId = uuidv4(); // Create inventory ID for this movement
           
           const stockMovementEntry = {
             id: stockMovementId,
             tenantId: tenantId,
             inventoryId: inventoryId,
             productId: newProductId,
             variantId: null, // No variant for simple products
             movementType: 'in', // Stock coming in
             quantity: stockQuantity,
             previousQuantity: 0, // Starting from 0
             newQuantity: stockQuantity, // New total quantity
             weightQuantity: '0.00',
             previousWeightQuantity: '0.00', 
             newWeightQuantity: '0.00',
             reason: 'Product Import - Initial Stock',
             notes: `Initial stock set during bulk product import from CSV`,
             processedBy: 'system', // Import system user
             createdAt: new Date(),
           };
           
           await db.insert(stockMovements).values(stockMovementEntry);
           console.log(`✅ Stock movement created: ${stockQuantity} units for ${newProduct.sku}`);
         }
         
      } catch (insertError: any) {
        console.error(`❌ Failed to insert product: ${newProduct.name} (SKU: ${newProduct.sku})`);
        console.error('Database error details:', {
          message: insertError.message,
          code: insertError.code,
           errno: insertError.errno
        });
         
        throw insertError;
      }

      result.successful++;
      result.successfulProducts!.push({
        id: newProductId,
        name: productData.description?.trim() || productData.sku.trim(), // Use description as name, fallback to SKU
        sku: productData.sku.trim()
      });

    } catch (error: any) {
      result.errors.push({
        row: globalRowIndex,
        identifier: productData.sku || 'N/A',
        message: error.message || 'Unknown error occurred'
      });
      result.failed++;
    }
  }

  return result;
}

// Main Inngest function
export const bulkUserImport = inngest.createFunction(
  { 
    id: 'user-bulk-import',
    name: 'User Bulk Import (Production)',
    concurrency: {
      limit: 10, // Allow up to 10 concurrent import jobs
    }
  },
  { event: 'user/bulk-import' },
  async ({ event, step }) => {
    const { jobId, blobUrl, tenantId, fileName, importType = 'users' } = event.data;
    
    // SUPER AGGRESSIVE DEBUG: Log function entry
    console.log('🚨 BULK IMPORT FUNCTION CALLED!', { jobId, importType, fileName });
    
    console.log('🎯 INNGEST FUNCTION TRIGGERED!');
    console.log(`🚀 Starting ${importType} import job:`, {
      jobId,
      tenantId,
      fileName,
      importType,
      blobUrl: blobUrl.substring(0, 50) + '...'
    });

    // Step 1: Update job status to processing
    await step.run('update-job-status-processing', async () => {
      console.log(`📝 Updating job ${jobId} status to processing...`);
      await db.update(importJobs)
        .set({ 
          status: 'processing',
          startedAt: new Date()
        })
        .where(eq(importJobs.id, jobId));
      console.log(`✅ Job ${jobId} status updated to processing`);
    });

    try {
      // Step 2: Download and parse file
      const parsedData = await step.run('parse-file', async () => {
        console.log(`📥 Downloading file for ${importType} import...`);
        const response = await fetch(blobUrl);
        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.statusText}`);
        }
        const csvText = await response.text();
        console.log(`📄 CSV file downloaded, size: ${csvText.length} characters`);
        
        if (importType === 'products') {
          console.log('🔍 Parsing as product CSV...');
          const data = parseProductCSV(csvText);
          console.log(`✅ Parsed ${data.length} products from CSV`);
          return { type: 'products', data };
        } else {
          console.log('🔍 Parsing as user CSV...');
          
          // Run test to debug CSV parsing
          console.log('🧪 Running CSV parsing test first...');
          testCSVParsing();
          
          console.log('🔍 Now parsing actual CSV...');
          console.log('CSV Content (first 500 chars):', csvText.substring(0, 500));
          
          const data = parseUserCSV(csvText);
          console.log(`✅ Parsed ${data.length} users from CSV`);
          console.log('First user data sample:', data[0]);
          return { type: 'users', data };
        }
      });

      // Step 3: Update total records count
      await step.run('update-total-records', async () => {
        await db.update(importJobs)
          .set({ totalRecords: parsedData.data.length })
          .where(eq(importJobs.id, jobId));
      });

      // Step 4: Process data in chunks of 50
      const CHUNK_SIZE = 50;
      const chunks: (UserImportRow[] | ProductImportRow[])[] = [];
      for (let i = 0; i < parsedData.data.length; i += CHUNK_SIZE) {
        chunks.push(parsedData.data.slice(i, i + CHUNK_SIZE));
      }

      let totalResults: ProcessingResult = {
        successful: 0,
        failed: 0,
        errors: [],
        successfulUsers: importType === 'users' ? [] : undefined,
        successfulProducts: importType === 'products' ? [] : undefined
      };

      // Process each chunk
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        const startIndex = chunkIndex * CHUNK_SIZE;

        const chunkResult = await step.run(`process-chunk-${chunkIndex}`, async () => {
          console.log(`🔄 Processing chunk ${chunkIndex + 1}/${chunks.length} for ${importType} (${chunk.length} items)`);
          console.log(`📊 Chunk data sample:`, chunk.slice(0, 2)); // Show first 2 items
          
          if (importType === 'products') {
            return processProductChunk(chunk as ProductImportRow[], tenantId, startIndex);
          } else {
            const result = processUserChunk(chunk as UserImportRow[], tenantId, startIndex);
            console.log(`🏁 Chunk ${chunkIndex + 1} processing completed`);
            return result;
          }
        });

        // Merge results
        totalResults.successful += chunkResult.successful;
        totalResults.failed += chunkResult.failed;
        totalResults.errors.push(...chunkResult.errors);
        
        console.log(`📈 Chunk ${chunkIndex + 1} results:`, {
          successful: chunkResult.successful,
          failed: chunkResult.failed,
          errors: chunkResult.errors.length
        });
        
        if (importType === 'users' && chunkResult.successfulUsers) {
          totalResults.successfulUsers!.push(...chunkResult.successfulUsers);
          console.log(`👥 Added ${chunkResult.successfulUsers.length} successful users to total`);
        } else if (importType === 'products' && chunkResult.successfulProducts) {
          totalResults.successfulProducts!.push(...chunkResult.successfulProducts);
        }
        
        console.log(`📊 Running totals: ${totalResults.successful} successful, ${totalResults.failed} failed`);

        // Update progress
        await step.run(`update-progress-${chunkIndex}`, async () => {
          await db.update(importJobs)
            .set({ 
              processedRecords: totalResults.successful + totalResults.failed,
              successfulRecords: totalResults.successful,
              failedRecords: totalResults.failed
            })
            .where(eq(importJobs.id, jobId));
        });
      }

      // Step 5: Mark job as completed
      await step.run('mark-job-completed', async () => {
        await db.update(importJobs)
          .set({ 
            status: 'completed',
            completedAt: new Date(),
            errors: totalResults.errors,
            results: {
              successful: totalResults.successful,
              failed: totalResults.failed,
              successfulUsers: totalResults.successfulUsers?.slice(0, 100), // Limit stored results
              successfulProducts: totalResults.successfulProducts?.slice(0, 100) // Limit stored results
            }
          })
          .where(eq(importJobs.id, jobId));
      });

      return { 
        success: true, 
        totalProcessed: totalResults.successful + totalResults.failed,
        successful: totalResults.successful,
        failed: totalResults.failed
      };

    } catch (error: any) {
      console.log('💥 INNGEST FUNCTION CAUGHT ERROR!');
      console.error('Full error details:', error);
      
      // Mark job as failed
      await step.run('mark-job-failed', async () => {
        const errorMessage = error.message || 'Unknown error occurred';
        console.error('❌ Import job failed:', {
          jobId,
          tenantId,
          importType,
          error: errorMessage,
          stack: error.stack
        });
        
        await db.update(importJobs)
          .set({ 
            status: 'failed',
            completedAt: new Date(),
            errors: [{ 
              row: 0, 
              identifier: 'SYSTEM_ERROR', 
              message: `Import failed: ${errorMessage}` 
            }]
          })
          .where(eq(importJobs.id, jobId));
      });

      throw error;
    }
  }
);
