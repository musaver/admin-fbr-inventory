import { inngest } from '@/lib/inngest';
import { db } from '@/lib/db';
import { importJobs, user, userLoyaltyPoints, products, stockMovements, orders, orderItems } from '@/lib/schema';
import { eq, and, sql, or, isNull } from 'drizzle-orm';
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

interface OrderImportRow {
  customerPhone: string;
  customerName?: string;
  customerEmail?: string;
  orderNumber?: string; // Custom order ID for grouping items
  productSku: string;
  productName?: string;
  quantity?: string; // Made optional
  unitPrice?: string; // Made optional - This will contain price excluding tax
  taxAmount?: string;
  taxPercentage?: string;
  priceIncludingTax?: string;
  hsCode?: string;
  uom?: string;
  serialNumber?: string;
  listNumber?: string;
  bcNumber?: string;
  lotNumber?: string;
  expiryDate?: string;
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
  successfulOrders?: Array<{
    id: string;
    orderNumber: string; // Auto-generated order number
    customOrderNumberImport: string | null; // Original order number from CSV
    customerEmail: string;
    itemCount: number;
    rowNumbers: number[]; // Array of CSV row numbers for this order
  }>;
  // Detailed row-by-row processing report
  detailedReport?: Array<{
    row: number;
    status: 'success' | 'failed';
    action: string; // 'created_order' | 'added_to_order' | 'created_user' | 'created_product' | 'validation_error' | 'processing_error'
    data: {
      customerEmail?: string;
      customOrderNumber?: string;
      productSku?: string;
      productName?: string;
      quantity?: number;
      unitPrice?: number;
      taxAmount?: number;
      taxPercentage?: number;
      priceIncludingTax?: number;
      priceExcludingTax?: number;
      orderNumber?: string; // Final order number assigned
      orderId?: string;
      errorMessage?: string;
    };
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
      console.log(`   ${col}: ${(columnMap as any)[col].join(', ')}`);
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

// Utility function to parse CSV for orders
function parseOrderCSV(csvText: string): OrderImportRow[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain header and at least one data row');
  }

  // Parse header
  const header = lines[0].split(',').map(h => h.replace(/['"]/g, '').trim());
  console.log('📋 Order CSV Headers found:', header);
  
  // Expected columns (case-insensitive)
  const columnMap = {
    'customerPhone': ['customer phone', 'phone', 'customer_phone'],
    'customerName': ['customer name', 'name', 'customer_name'],
    'customerEmail': ['customer email', 'email', 'customer_email'],
    'orderNumber': ['order number', 'order_number', 'order id', 'order_id'],
    'productSku': ['product sku', 'sku', 'product_sku'],
    'productName': ['product name', 'product_name'],
    'quantity': ['quantity', 'qty'],
    'unitPrice': ['unit price', 'price', 'unit_price'],
    'taxAmount': ['tax amount', 'tax_amount'],
    'taxPercentage': ['tax percentage', 'tax_percentage'],
    'priceIncludingTax': ['price including tax', 'price_including_tax', 'inclusive price', 'price incl tax'],
    'hsCode': ['hs code', 'hs_code', 'hscode'],
    'uom': ['uom', 'unit of measure', 'unit'],
    'serialNumber': ['serial number', 'serial_number', 'serial no'],
    'listNumber': ['list number', 'list_number', 'list no'],
    'bcNumber': ['bc number', 'bc_number', 'bc no'],
    'lotNumber': ['lot number', 'lot_number', 'lot no'],
    'expiryDate': ['expiry date', 'expiry_date', 'expiration date']
  };

  // Map header indices
  const headerMap: Record<string, number> = {};
  Object.entries(columnMap).forEach(([key, variants]) => {
    const index = header.findIndex(h => 
      variants.some(variant => h.toLowerCase() === variant.toLowerCase())
    );
    if (index !== -1) {
      headerMap[key] = index;
      console.log(`✅ Order: Mapped column "${key}" to header "${header[index]}" at index ${index}`);
    } else {
      console.log(`❌ Order: Could not map column "${key}". Available headers:`, header.map(h => `"${h.toLowerCase()}"`));
    }
  });
  console.log('📊 Order CSV Final headerMap:', headerMap);

  // Validate required columns
  if (headerMap.customerPhone === undefined || headerMap.productSku === undefined) {
    throw new Error('Required columns missing: Customer Phone and Product SKU are required');
  }

  // Parse data rows
  const orderRows: OrderImportRow[] = [];
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

    // Extract order data
    const orderData: OrderImportRow = {
      customerPhone: values[headerMap.customerPhone] || '',
      customerName: values[headerMap.customerName] || '',
      customerEmail: values[headerMap.customerEmail] || '',
      orderNumber: values[headerMap.orderNumber] || '',
      productSku: values[headerMap.productSku] || '',
      productName: values[headerMap.productName] || '',
      quantity: values[headerMap.quantity] || '',
      unitPrice: values[headerMap.unitPrice] || '',
      taxAmount: values[headerMap.taxAmount] || '',
      taxPercentage: values[headerMap.taxPercentage] || '',
      priceIncludingTax: values[headerMap.priceIncludingTax] || '',
      hsCode: values[headerMap.hsCode] || '',
      uom: values[headerMap.uom] || '',
      serialNumber: values[headerMap.serialNumber] || '',
      listNumber: values[headerMap.listNumber] || '',
      bcNumber: values[headerMap.bcNumber] || '',
      lotNumber: values[headerMap.lotNumber] || '',
      expiryDate: values[headerMap.expiryDate] || '',
    };

    // Debug log for first few rows
    if (i <= 3) {
      console.log(`🔍 Order Row ${i} extracted data:`, orderData);
    }

    orderRows.push(orderData);
  }

  return orderRows;
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

// Validate order data
function validateOrder(orderData: OrderImportRow): string | null {
  // Either Customer Phone OR Customer Name must be provided
  const hasPhone = orderData.customerPhone?.trim();
  const hasName = orderData.customerName?.trim();
  
  if (!hasPhone && !hasName) {
    return 'Either Customer Phone or Customer Name is required';
  }

  // If phone is provided, validate it
  if (hasPhone) {
    const phoneRegex = /\d{7,}/;
    if (!phoneRegex.test(orderData.customerPhone.replace(/[^\d]/g, ''))) {
      return 'Invalid phone format - must contain at least 7 digits';
    }
  }

  if (!orderData.productSku?.trim()) {
    return 'Product SKU is required';
  }

  // Quantity is now optional
  if (orderData.quantity?.trim()) {
    const quantity = parseInt(orderData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      return 'Quantity must be a valid positive number when provided';
    }
  }

  // Unit Price is now optional
  if (orderData.unitPrice?.trim()) {
    const price = parseFloat(orderData.unitPrice);
    if (isNaN(price) || price < 0) {
      return 'Unit Price must be a valid positive number when provided';
    }
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

// Process orders in chunks - creates orders with user/product matching logic
async function processOrderChunk(
  orderRows: OrderImportRow[], 
  tenantId: string, 
  startIndex: number
): Promise<ProcessingResult> {
  console.log(`📦 Processing ${orderRows.length} orders for tenant: ${tenantId}`);
  
  const result: ProcessingResult = {
    successful: 0,
    failed: 0,
    errors: [],
    successfulOrders: [],
    detailedReport: []
  };

  // Group orders by customer identifier + order number to create proper orders
  // Use phone if available, otherwise use customer name as identifier
  const ordersByKey = new Map<string, OrderImportRow[]>();
  orderRows.forEach((orderRow, index) => {
    const phone = orderRow.customerPhone?.trim() || '';
    const customerName = orderRow.customerName?.trim() || '';
    const orderNumber = orderRow.orderNumber?.trim();
    
    // Create customer identifier: prefer phone, fallback to customer name
    const customerIdentifier = phone || customerName || `unknown-${startIndex + index + 1}`;
    
    // Create unique key: if orderNumber exists, use identifier+orderNumber, otherwise use identifier+auto-increment
    let orderKey: string;
    if (orderNumber) {
      orderKey = `${customerIdentifier}|${orderNumber}`;
    } else {
      // If no order number provided, each row becomes a separate order (for backward compatibility)
      orderKey = `${customerIdentifier}|auto-${startIndex + index + 1}`;
    }
    
    console.log(`🔍 Order grouping: phone="${phone}", name="${customerName}", identifier="${customerIdentifier}", key="${orderKey}"`);
    
    if (!ordersByKey.has(orderKey)) {
      ordersByKey.set(orderKey, []);
    }
    ordersByKey.get(orderKey)!.push({ ...orderRow, globalRowIndex: startIndex + index + 1 } as any);
  });

  console.log(`📦 Grouped ${orderRows.length} rows into ${ordersByKey.size} orders`);

  for (const [orderKey, customerOrders] of ordersByKey) {
    const customerIdentifier = orderKey.split('|')[0]; // Extract customer identifier from key
    const firstOrder = customerOrders[0];
    const customerPhone = firstOrder.customerPhone?.trim() || '';
    const customerName = firstOrder.customerName?.trim() || '';
    
    console.log(`🔍 Processing order group: identifier="${customerIdentifier}", phone="${customerPhone}", name="${customerName}"`);
    
    try {
      // Find or create user
      let customerId: string;
      let existingUser: any[] = [];
      
      // First try to find by phone if phone is provided
      if (customerPhone) {
        console.log(`🔍 Searching for user by phone: "${customerPhone}"`);
        existingUser = await db.select({ id: user.id, email: user.email })
          .from(user)
          .where(and(
            eq(user.phone, customerPhone),
            eq(user.tenantId, tenantId)
          ))
          .limit(1);
          
        if (existingUser.length > 0) {
          console.log(`✅ Found existing user by phone: "${customerPhone}"`);
        }
      }

      // If no user found by phone, try to find by customer name (if provided)
      if (existingUser.length === 0 && customerName) {
        console.log(`🔍 Searching for user by name: "${customerName}" (phone search ${customerPhone ? 'failed' : 'skipped - no phone provided'})`);
        
        // First try exact match (case-sensitive)
        existingUser = await db.select({ id: user.id, email: user.email, name: user.name })
          .from(user)
          .where(and(
            eq(user.name, customerName),
            eq(user.tenantId, tenantId)
          ))
          .limit(1);
        
        if (existingUser.length > 0) {
          console.log(`✅ Found existing user by exact name match: "${customerName}" -> User: ${existingUser[0].name}`);
        } else {
          // Try case-insensitive search using SQL LOWER function
          console.log(`🔍 Exact name match failed, trying case-insensitive search for: "${customerName}"`);
          existingUser = await db.select({ id: user.id, email: user.email, name: user.name })
            .from(user)
            .where(and(
              sql`LOWER(${user.name}) = LOWER(${customerName})`,
              eq(user.tenantId, tenantId)
            ))
            .limit(1);
          
          if (existingUser.length > 0) {
            console.log(`✅ Found existing user by case-insensitive name match: "${customerName}" -> User: ${existingUser[0].name}`);
          } else {
            console.log(`❌ No user found by name: "${customerName}" in tenant: ${tenantId}`);
            
            // Debug: Show what users actually exist in this tenant
            const allUsers = await db.select({ id: user.id, name: user.name, phone: user.phone })
              .from(user)
              .where(eq(user.tenantId, tenantId))
              .limit(10);
            
            console.log(`🔍 Debug: First 10 users in tenant ${tenantId}:`, allUsers.map(u => ({ 
              name: u.name, 
              phone: u.phone 
            })));
          }
        }
      }

      if (existingUser.length > 0) {
        customerId = existingUser[0].id;
        console.log(`✅ Found existing user: identifier="${customerIdentifier}"`);
      } else {
        // Create new user from first order's customer data
        const firstOrder = customerOrders[0];
        customerId = uuidv4();
        
        // Use email if provided, otherwise generate one from phone or name
        let userEmail = firstOrder.customerEmail?.trim();
        if (!userEmail) {
          if (customerPhone) {
            userEmail = `user+${customerPhone.replace(/[^0-9]/g, '')}@phone.local`;
          } else if (customerName) {
            userEmail = `user+${customerName.toLowerCase().replace(/[^a-z0-9]/g, '')}@name.local`;
          } else {
            userEmail = `user+${Date.now()}@unknown.local`;
          }
        }
        
        const userName = customerName || `Customer ${customerPhone || 'Unknown'}`;
        console.log(`🆕 Creating new user: name="${userName}", email="${userEmail}", phone="${customerPhone || 'N/A'}"`);
        
        const newUser = {
          id: customerId,
          tenantId,
          name: userName,
          email: userEmail,
          phone: customerPhone || null,
          userType: 'customer',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.insert(user).values(newUser);
        console.log(`✅ Successfully created new user with name: "${userName}"`);
        
        // Initialize loyalty points
        await db.insert(userLoyaltyPoints).values({
          id: uuidv4(),
          userId: customerId,
          totalPointsEarned: 0,
          totalPointsRedeemed: 0,
          availablePoints: 0,
          pendingPoints: 0,
          pointsExpiringSoon: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log(`✅ Created new user: ${customerName || customerPhone || 'Unknown'}`);
      }

      // Create order
      const orderId = uuidv4();
      const firstOrder = customerOrders[0];
      
      // Always generate a unique order number for database
      const finalOrderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Store the original custom order number from CSV (can be duplicate)
      const customOrderNumberImport = firstOrder.orderNumber?.trim() || null;
      
      // Collect row numbers for this order
      const rowNumbers = customerOrders.map(order => (order as any).globalRowIndex);
      
      let subtotal = 0;
      const orderItemsToCreate: any[] = [];

      // Process each order item
      for (let i = 0; i < customerOrders.length; i++) {
        const orderData = customerOrders[i];
        const globalRowIndex = (orderData as any).globalRowIndex;

        try {
          // Validate order data
          const validationError = validateOrder(orderData);
          if (validationError) {
            const orderRef = orderData.orderNumber ? ` (Order: ${orderData.orderNumber})` : '';
            result.errors.push({
              row: globalRowIndex,
              identifier: `${customerIdentifier}${orderRef} - ${orderData.productSku}`,
              message: `${validationError}${orderRef}`
            });
            
            // Add to detailed report
            result.detailedReport!.push({
              row: globalRowIndex,
              status: 'failed',
              action: 'validation_error',
              data: {
                customerEmail: orderData.customerEmail || (customerPhone ? `user+${customerPhone.replace(/[^0-9]/g, '')}@phone.local` : `user+${(customerName || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '')}@name.local`),
                customOrderNumber: orderData.orderNumber,
                productSku: orderData.productSku,
                productName: orderData.productName,
                quantity: orderData.quantity?.trim() ? parseInt(orderData.quantity) : 1,
                errorMessage: validationError
              }
            });
            
            result.failed++;
            continue;
          }

          // Find or create product
          let productId: string;
          let existingProduct = await db.select({ id: products.id, price: products.price })
            .from(products)
            .where(and(
              eq(products.sku, orderData.productSku.trim()),
              eq(products.tenantId, tenantId)
            ))
            .limit(1);

          if (existingProduct.length > 0) {
            productId = existingProduct[0].id;
            console.log(`✅ Found existing product: ${orderData.productSku}`);
          } else {
            // Create new product
            productId = uuidv4();
            const unitPrice = parseFloat(orderData.unitPrice || '0');
            
            const newProduct = {
              id: productId,
              tenantId,
              name: orderData.productName?.trim() || orderData.productSku.trim(),
              slug: `${orderData.productSku.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${productId.substring(0, 8)}`,
              description: null, // Description is now part of product name
              sku: orderData.productSku.trim(),
              price: unitPrice.toFixed(2),
              hsCode: orderData.hsCode?.trim() || null,
              uom: orderData.uom?.trim() || null,
              serialNumber: orderData.serialNumber?.trim() || null,
              listNumber: orderData.listNumber?.trim() || null,
              bcNumber: orderData.bcNumber?.trim() || null,
              lotNumber: orderData.lotNumber?.trim() || null,
              expiryDate: orderData.expiryDate?.trim() || null,
              isActive: true,
              productType: 'simple',
              stockManagementType: 'quantity',
              taxAmount: '0.00',
              taxPercentage: '0.00',
              priceIncludingTax: unitPrice.toFixed(2),
              priceExcludingTax: unitPrice.toFixed(2),
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            await db.insert(products).values(newProduct);
            console.log(`✅ Created new product: ${orderData.productSku}`);
          }

          // Create order item with default values for optional fields
          const quantity = orderData.quantity?.trim() ? parseInt(orderData.quantity) : 1; // Default to 1 if not provided
          const unitPrice = orderData.unitPrice?.trim() ? parseFloat(orderData.unitPrice) : 0.00; // Default to 0 if not provided
          const totalPrice = quantity * unitPrice;
          
          // Parse tax fields - unitPrice now contains price excluding tax
          const taxAmount = orderData.taxAmount && orderData.taxAmount.trim() !== '' ? parseFloat(orderData.taxAmount) : 0;
          const taxPercentage = orderData.taxPercentage && orderData.taxPercentage.trim() !== '' ? parseFloat(orderData.taxPercentage) : 0;
          const priceIncludingTax = orderData.priceIncludingTax && orderData.priceIncludingTax.trim() !== '' ? parseFloat(orderData.priceIncludingTax) : unitPrice;
          const priceExcludingTax = unitPrice; // Unit price now contains price excluding tax
          
          subtotal += totalPrice;

          const orderItem = {
            id: uuidv4(),
            orderId: orderId,
            productId: productId,
            productName: orderData.productName?.trim() || orderData.productSku.trim(),
            productDescription: null, // Description is now part of product name
            sku: orderData.productSku.trim(),
            hsCode: orderData.hsCode?.trim() || null,
            uom: orderData.uom?.trim() || null,
            serialNumber: orderData.serialNumber?.trim() || null,
            listNumber: orderData.listNumber?.trim() || null,
            bcNumber: orderData.bcNumber?.trim() || null,
            lotNumber: orderData.lotNumber?.trim() || null,
            expiryDate: orderData.expiryDate?.trim() || null,
            quantity: quantity,
            price: unitPrice.toFixed(2),
            totalPrice: totalPrice.toFixed(2),
            taxAmount: taxAmount.toFixed(2),
            taxPercentage: taxPercentage.toFixed(2),
            priceIncludingTax: priceIncludingTax.toFixed(2),
            priceExcludingTax: priceExcludingTax.toFixed(2),
            itemSequence: i + 1, // Item order within the order (1, 2, 3, etc.)
          };

          orderItemsToCreate.push(orderItem);

          // Add to detailed report (success for this item)
          result.detailedReport!.push({
            row: globalRowIndex,
            status: 'success',
            action: i === 0 ? 'created_order' : 'added_to_order',
            data: {
              customerEmail: existingUser.length > 0 ? existingUser[0].email : (orderData.customerEmail?.trim() || (customerPhone ? `user+${customerPhone.replace(/[^0-9]/g, '')}@phone.local` : `user+${(customerName || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '')}@name.local`)),
              customOrderNumber: orderData.orderNumber,
              productSku: orderData.productSku,
              productName: orderData.productName,
              quantity: quantity,
              unitPrice: unitPrice,
              taxAmount: taxAmount,
              taxPercentage: taxPercentage,
              priceIncludingTax: priceIncludingTax,
              priceExcludingTax: priceExcludingTax,
              orderNumber: finalOrderNumber,
              orderId: orderId
            }
          });

        } catch (error: any) {
          const orderRef = orderData.orderNumber ? ` (Order: ${orderData.orderNumber})` : '';
          result.errors.push({
            row: globalRowIndex,
            identifier: `${customerIdentifier}${orderRef} - ${orderData.productSku}`,
            message: `${error.message || 'Unknown error occurred'}${orderRef}`
          });
          
          // Add to detailed report
          result.detailedReport!.push({
            row: globalRowIndex,
            status: 'failed',
            action: 'processing_error',
            data: {
              customerEmail: orderData.customerEmail || (customerPhone ? `user+${customerPhone.replace(/[^0-9]/g, '')}@phone.local` : `user+${(customerName || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '')}@name.local`),
              customOrderNumber: orderData.orderNumber,
              productSku: orderData.productSku,
              productName: orderData.productName,
              quantity: orderData.quantity?.trim() ? parseInt(orderData.quantity) : 1,
              errorMessage: error.message || 'Unknown error occurred'
            }
          });
          
          result.failed++;
        }
      }

      // Create the order if we have valid items
      if (orderItemsToCreate.length > 0) {
        // Parse addresses (simple parsing)
        const parseBillingAddress = (address: string) => {
          if (!address) return {};
          const parts = address.split(',').map(p => p.trim());
          return {
            billingAddress1: parts[0] || null,
            billingCity: parts[1] || null,
            billingState: parts[2] || null
          };
        };

        const parseShippingAddress = (address: string) => {
          if (!address) return {};
          const parts = address.split(',').map(p => p.trim());
          return {
            shippingAddress1: parts[0] || null,
            shippingCity: parts[1] || null,
            shippingState: parts[2] || null
          };
        };

        const billingAddr = parseBillingAddress(''); // Address fields removed from CSV
        const shippingAddr = parseShippingAddress(''); // Address fields removed from CSV

        const order = {
          id: orderId,
          tenantId,
          orderNumber: finalOrderNumber, // Auto-generated unique order number
          customOrderNumberImport: customOrderNumberImport, // Original order number from CSV
          userId: customerId,
          email: existingUser.length > 0 ? existingUser[0].email : (firstOrder.customerEmail?.trim() || (customerPhone ? `user+${customerPhone.replace(/[^0-9]/g, '')}@phone.local` : `user+${(customerName || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '')}@name.local`)),
          phone: customerPhone || null,
          status: 'pending', // Default status since removed from CSV
          paymentStatus: 'pending', // Default payment status since removed from CSV
          fulfillmentStatus: 'pending',
          subtotal: subtotal.toFixed(2),
          taxAmount: '0.00',
          shippingAmount: '0.00',
          discountAmount: '0.00',
          totalAmount: subtotal.toFixed(2),
          currency: 'PKR',
          serviceDate: null, // Service date removed from CSV
          serviceTime: null, // Service time removed from CSV  
          notes: null, // Notes removed from CSV
          ...billingAddr,
          ...shippingAddr,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.insert(orders).values(order);
        
        // Insert order items
        for (const orderItem of orderItemsToCreate) {
          await db.insert(orderItems).values(orderItem);
        }

        result.successful++;
        result.successfulOrders!.push({
          id: orderId,
          orderNumber: finalOrderNumber,
          customOrderNumberImport: customOrderNumberImport,
          customerEmail: existingUser.length > 0 ? existingUser[0].email : (firstOrder.customerEmail?.trim() || (customerPhone ? `user+${customerPhone.replace(/[^0-9]/g, '')}@phone.local` : `user+${(customerName || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '')}@name.local`)),
          itemCount: orderItemsToCreate.length,
          rowNumbers: rowNumbers
        });

        const customOrderRef = customOrderNumberImport ? ` (Original: ${customOrderNumberImport})` : '';
        console.log(`✅ Created order ${finalOrderNumber}${customOrderRef} with ${orderItemsToCreate.length} items for customer ${customerIdentifier} (Rows: ${rowNumbers.join(', ')})`);
      } else {
        console.log(`⚠️ No valid items found for order ${finalOrderNumber || 'auto-generated'} for customer ${customerIdentifier}`);
      }

    } catch (error: any) {
      // If order creation fails, mark all items for this customer as failed
      customerOrders.forEach((orderData) => {
        const globalRowIndex = (orderData as any).globalRowIndex;
        const orderRef = orderData.orderNumber ? ` (Order: ${orderData.orderNumber})` : '';
        result.errors.push({
          row: globalRowIndex,
          identifier: `${customerIdentifier}${orderRef} - Order Creation`,
          message: `Order creation failed: ${error.message || 'Unknown error occurred'}${orderRef}`
        });
        result.failed++;
      });
    }
  }

  // Log final summary
  const totalOrders = result.successfulOrders?.length || 0;
  const totalItems = orderRows.length;
  const failedItems = result.failed;
  const successfulItems = result.successful;

  console.log(`📊 Order Import Summary:
    - Total items processed: ${totalItems}
    - Orders created: ${totalOrders} 
    - Successful items: ${successfulItems}
    - Failed items: ${failedItems}
    - Average items per order: ${totalOrders > 0 ? (successfulItems / totalOrders).toFixed(1) : 0}`);

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
    const { jobId, blobUrl, tenantId, fileName, importType = 'users', removeExistingData = false } = event.data;
    
    // SUPER AGGRESSIVE DEBUG: Log function entry
    console.log('🚨 BULK IMPORT FUNCTION CALLED!', { jobId, importType, fileName, removeExistingData });
    
    console.log('🎯 INNGEST FUNCTION TRIGGERED!');
    console.log(`🚀 Starting ${importType} import job:`, {
      jobId,
      tenantId,
      fileName,
      importType,
      removeExistingData,
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

    // Step 1.5: Remove existing data if requested
    if (removeExistingData) {
      await step.run('remove-existing-data', async () => {
        console.log(`🗑️ Removing existing ${importType} for tenant: ${tenantId}`);
        
        if (importType === 'users') {
          // Delete users (this will cascade to related data due to foreign key constraints)
          const deletedUsers = await db.delete(user)
            .where(and(
              eq(user.tenantId, tenantId),
              // Don't delete admin users
              or(
                eq(user.userType, 'customer'),
                isNull(user.userType)
              )
            ));
          console.log(`✅ Removed existing users for tenant: ${tenantId}`);
        } else if (importType === 'products') {
          // Delete products (this will cascade to related data)
          const deletedProducts = await db.delete(products)
            .where(eq(products.tenantId, tenantId));
          console.log(`✅ Removed existing products for tenant: ${tenantId}`);
        }
      });
    }

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
        } else if (importType === 'orders') {
          console.log('🔍 Parsing as order CSV...');
          const data = parseOrderCSV(csvText);
          console.log(`✅ Parsed ${data.length} order rows from CSV`);
          return { type: 'orders', data };
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
      const chunks: (UserImportRow[] | ProductImportRow[] | OrderImportRow[])[] = [];
      for (let i = 0; i < parsedData.data.length; i += CHUNK_SIZE) {
        chunks.push(parsedData.data.slice(i, i + CHUNK_SIZE));
      }

      let totalResults: ProcessingResult = {
        successful: 0,
        failed: 0,
        errors: [],
        successfulUsers: importType === 'users' ? [] : undefined,
        successfulProducts: importType === 'products' ? [] : undefined,
        successfulOrders: importType === 'orders' ? [] : undefined,
        detailedReport: importType === 'orders' ? [] : undefined
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
          } else if (importType === 'orders') {
            return processOrderChunk(chunk as OrderImportRow[], tenantId, startIndex);
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
        } else if (importType === 'orders' && chunkResult.successfulOrders) {
          totalResults.successfulOrders!.push(...chunkResult.successfulOrders);
          console.log(`📦 Added ${chunkResult.successfulOrders.length} successful orders to total`);
          
          // Merge detailed reports
          if (chunkResult.detailedReport) {
            totalResults.detailedReport!.push(...chunkResult.detailedReport);
          }
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
              successfulProducts: totalResults.successfulProducts?.slice(0, 100), // Limit stored results
              successfulOrders: totalResults.successfulOrders?.slice(0, 100), // Limit stored results
              detailedReport: totalResults.detailedReport // Include full detailed report
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
