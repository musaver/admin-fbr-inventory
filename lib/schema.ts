import { relations, sql } from 'drizzle-orm';
import {
  mysqlTable,
  varchar,
  datetime,
  text,
  primaryKey,
  boolean,
  int,
  decimal,
  json,
  unique,
  index,
} from 'drizzle-orm/mysql-core';

// ✅ Tenants table - Core table for multi-tenancy
export const tenants = mysqlTable('tenants', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(), // for subdomain
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  
  // Subscription & billing
  plan: varchar('plan', { length: 50 }).default('basic'), // basic, premium, enterprise
  status: varchar('status', { length: 20 }).default('active'), // active, suspended, canceled, trial
  trialEndsAt: datetime('trial_ends_at'),
  subscriptionId: varchar('subscription_id', { length: 255 }), // Stripe/payment processor ID
  
  // Customization
  logo: varchar('logo', { length: 500 }),
  primaryColor: varchar('primary_color', { length: 7 }).default('#3b82f6'),
  settings: json('settings'), // JSON object for tenant-specific settings
  
  // Limits (based on plan)
  maxUsers: int('max_users').default(5),
  maxProducts: int('max_products').default(1000),
  maxOrders: int('max_orders').default(10000),
  
  // Address information
  address: varchar('address', { length: 500 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  country: varchar('country', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// ✅ User table (customers)
export const user = mysqlTable('user', {
  id: varchar('id', { length: 255 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 255 }).notNull(), // Multi-tenant support
  name: varchar('name', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull(),
  emailVerified: datetime('emailVerified'),
  image: text('image'),
  profilePicture: varchar("profile_picture", { length: 255 }),
  username: varchar("username", { length: 100 }),
  displayName: varchar("display_name", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 }),
  address: varchar("address", { length: 255 }),
  state: varchar("state", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  userType: varchar("user_type", { length: 20 }).default("customer"), // customer, driver, admin
  newsletter: boolean("newsletter").default(false),
  dateOfBirth: datetime("date_of_birth"),
  otp: varchar("otp", { length: 6 }),
  otpExpiry: datetime("otp_expiry"),
  
  // Buyer-specific fields
  buyerNTNCNIC: varchar("buyer_ntn_cnic", { length: 100 }),
  buyerBusinessName: varchar("buyer_business_name", { length: 255 }),
  buyerProvince: varchar("buyer_province", { length: 100 }),
  buyerAddress: varchar("buyer_address", { length: 500 }),
  buyerRegistrationType: varchar("buyer_registration_type", { length: 50 }),
  
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  // Ensure email is unique only within each tenant
  emailTenantUnique: unique("user_email_tenant_unique").on(table.email, table.tenantId),
}));

// ✅ Accounts table (OAuth support: Google, Facebook)
export const account = mysqlTable(
  'account',
  {
    userId: varchar('userId', { length: 255 }).notNull(),
    type: varchar('type', { length: 255 }).notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('providerAccountId', { length: 255 }).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: datetime('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: text('id_token'),
    session_state: varchar('session_state', { length: 255 }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.provider, table.providerAccountId] }),
  })
);

// ✅ Sessions table
export const sessions = mysqlTable('sessions', {
  sessionToken: varchar('sessionToken', { length: 255 }).primaryKey(),
  userId: varchar('userId', { length: 255 }).notNull(),
  expires: datetime('expires').notNull(),
});

// ✅ Verification tokens
export const verification_tokens = mysqlTable(
  'verification_tokens',
  {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull(),
    otp: varchar('otp', { length: 255 }).notNull(),
    expires: datetime('expires').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.identifier, table.token, table.otp] }),
  })
);

// Product Categories
export const categories = mysqlTable("categories", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull(), // Multi-tenant support
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  image: varchar("image", { length: 500 }),
  icon: varchar("icon", { length: 500 }), // For uploaded category icon files
  iconName: varchar("icon_name", { length: 100 }), // For category icons (e.g., FontAwesome icon names)
  isFeatured: boolean("is_featured").default(false), // For featured categories
  parentId: varchar("parent_id", { length: 255 }), // For hierarchical categories
  sortOrder: int("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Product Subcategories
export const subcategories = mysqlTable("subcategories", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull(), // Multi-tenant support
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  image: varchar("image", { length: 500 }),
  categoryId: varchar("category_id", { length: 255 }).notNull(),
  sortOrder: int("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Products
export const products = mysqlTable("products", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull(), // Multi-tenant support
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  description: text("description"),
  shortDescription: text("short_description"),
  sku: varchar("sku", { length: 100 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  comparePrice: decimal("compare_price", { precision: 10, scale: 2 }),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  images: json("images"), // Array of image URLs
  banner: varchar("banner", { length: 500 }), // Banner image URL
  categoryId: varchar("category_id", { length: 255 }),
  subcategoryId: varchar("subcategory_id", { length: 255 }),
  supplierId: varchar("supplier_id", { length: 255 }), // Reference to preferred supplier
  tags: json("tags"), // Array of tags
  weight: decimal("weight", { precision: 8, scale: 2 }),
  dimensions: json("dimensions"), // {length, width, height}
  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true),
  isDigital: boolean("is_digital").default(false),
  requiresShipping: boolean("requires_shipping").default(true),
  taxable: boolean("taxable").default(true),
  
  // Tax and discount fields
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default('0.00'),
  taxPercentage: decimal("tax_percentage", { precision: 5, scale: 2 }).default('0.00'),
  priceIncludingTax: decimal("price_including_tax", { precision: 10, scale: 2 }).default('0.00'),
  priceExcludingTax: decimal("price_excluding_tax", { precision: 10, scale: 2 }).default('0.00'),
  extraTax: decimal("extra_tax", { precision: 10, scale: 2 }).default('0.00'),
  furtherTax: decimal("further_tax", { precision: 10, scale: 2 }).default('0.00'),
  fedPayableTax: decimal("fed_payable_tax", { precision: 10, scale: 2 }).default('0.00'),
  discount: decimal("discount", { precision: 10, scale: 2 }).default('0.00'),
  
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),
  
  // HS Code for customs and tax purposes
  hsCode: varchar("hs_code", { length: 20 }), // Harmonized System Code
  
  // Variable Product Fields
  productType: varchar("product_type", { length: 50 }).default("simple"), // 'simple' or 'variable'
  variationAttributes: json("variation_attributes"), // Array of {name: string, values: string[]}
  
  // Stock Management Fields
  stockManagementType: varchar("stock_management_type", { length: 20 }).default("quantity"), // 'quantity' or 'weight'
  pricePerUnit: decimal("price_per_unit", { precision: 10, scale: 2 }), // Price per gram for weight-based products
  baseWeightUnit: varchar("base_weight_unit", { length: 10 }).default("grams"), // 'grams' or 'kg'
  
  // Cannabis-specific fields
  thc: decimal("thc", { precision: 5, scale: 2 }), // THC percentage (0.00 - 100.00)
  cbd: decimal("cbd", { precision: 5, scale: 2 }), // CBD percentage (0.00 - 100.00)
  difficulty: varchar("difficulty", { length: 50 }), // Growing difficulty level
  floweringTime: varchar("flowering_time", { length: 100 }), // Time to flower
  yieldAmount: varchar("yield_amount", { length: 100 }), // Expected yield
  
  // Product identification fields
  serialNumber: varchar("serial_number", { length: 100 }), // Product serial number
  listNumber: varchar("list_number", { length: 100 }), // List reference number
  bcNumber: varchar("bc_number", { length: 100 }), // BC identification number
  lotNumber: varchar("lot_number", { length: 100 }), // Batch/lot number
  expiryDate: varchar("expiry_date", { length: 20 }), // Expiry date (YYYY-MM-DD)
  
  // Additional tax fields
  fixedNotifiedValueOrRetailPrice: decimal("fixed_notified_value_or_retail_price", { precision: 10, scale: 2 }).default('0.00'),
  saleType: varchar("sale_type", { length: 100 }).default("Goods at standard rate"),
  
  // Unit of measurement
  uom: varchar("uom", { length: 50 }), // Unit of Measurement
  
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Product Variants (Size, Color, etc.)
export const productVariants = mysqlTable("product_variants", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull(), // Multi-tenant support
  productId: varchar("product_id", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }).unique(),
  title: varchar("title", { length: 255 }).notNull(), // e.g., "Red / Large"
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  comparePrice: decimal("compare_price", { precision: 10, scale: 2 }),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  weight: decimal("weight", { precision: 8, scale: 2 }),
  image: varchar("image", { length: 500 }),
  position: int("position").default(0),
  inventoryQuantity: int("inventory_quantity").default(0),
  inventoryManagement: boolean("inventory_management").default(true),
  allowBackorder: boolean("allow_backorder").default(false),
  variantOptions: json("variant_options"), // {color: "Red", size: "Large"}
  isActive: boolean("is_active").default(true),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Variation Attributes (Color, Size, Material, etc.)
export const variationAttributes = mysqlTable("variation_attributes", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull(), // Multi-tenant support
  name: varchar("name", { length: 255 }).notNull(), // Color, Size, Material (removed unique constraint for multi-tenant)
  slug: varchar("slug", { length: 255 }).notNull().unique(), // color, size, material
  description: text("description"),
  type: varchar("type", { length: 50 }).default("select"), // select, color, image, button
  isActive: boolean("is_active").default(true),
  sortOrder: int("sort_order").default(0),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Variation Attribute Values (Red, Blue, Green for Color; S, M, L for Size)
export const variationAttributeValues = mysqlTable("variation_attribute_values", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull(), // Multi-tenant support
  attributeId: varchar("attribute_id", { length: 255 }).notNull(),
  value: varchar("value", { length: 255 }).notNull(), // Red, Blue, Small, Large
  slug: varchar("slug", { length: 255 }).notNull(), // red, blue, small, large
  colorCode: varchar("color_code", { length: 7 }), // #FF0000 for color attributes
  image: varchar("image", { length: 500 }), // Optional image for the value
  description: text("description"),
  isActive: boolean("is_active").default(true),
  sortOrder: int("sort_order").default(0),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Addon Groups (for organizing addons)
export const addonGroups = mysqlTable("addon_groups", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull(), // Multi-tenant support
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  sortOrder: int("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Addons (for group products)
export const addons = mysqlTable("addons", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull(), // Multi-tenant support
  title: varchar("title", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  image: varchar("image", { length: 500 }),
  groupId: varchar("group_id", { length: 255 }), // Reference to addon_groups
  isActive: boolean("is_active").default(true),
  sortOrder: int("sort_order").default(0),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Product Addons (junction table for group products)
export const productAddons = mysqlTable("product_addons", {
  id: varchar("id", { length: 255 }).primaryKey(),
  productId: varchar("product_id", { length: 255 }).notNull(),
  addonId: varchar("addon_id", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Override price for this product
  isRequired: boolean("is_required").default(false),
  sortOrder: int("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Product Inventory
export const productInventory = mysqlTable("product_inventory", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull(), // Multi-tenant support
  productId: varchar("product_id", { length: 255 }),
  variantId: varchar("variant_id", { length: 255 }),
  
  // Quantity-based inventory fields
  quantity: int("quantity").notNull().default(0),
  reservedQuantity: int("reserved_quantity").default(0),
  availableQuantity: int("available_quantity").default(0),
  reorderPoint: int("reorder_point").default(0),
  reorderQuantity: int("reorder_quantity").default(0),
  
  // Weight-based inventory fields (stored in grams for consistency)
  weightQuantity: decimal("weight_quantity", { precision: 12, scale: 2 }).default('0.00'), // Total weight in grams
  reservedWeight: decimal("reserved_weight", { precision: 12, scale: 2 }).default('0.00'), // Reserved weight in grams
  availableWeight: decimal("available_weight", { precision: 12, scale: 2 }).default('0.00'), // Available weight in grams
  reorderWeightPoint: decimal("reorder_weight_point", { precision: 12, scale: 2 }).default('0.00'), // Reorder point in grams
  reorderWeightQuantity: decimal("reorder_weight_quantity", { precision: 12, scale: 2 }).default('0.00'), // Reorder quantity in grams
  
  location: varchar("location", { length: 255 }),
  supplierId: varchar("supplier_id", { length: 255 }), // Reference to suppliers table
  supplier: varchar("supplier", { length: 255 }), // Legacy field - keeping for backward compatibility
  lastRestockDate: datetime("last_restock_date"),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Stock Movements (Audit trail for all inventory changes)
export const stockMovements = mysqlTable("stock_movements", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull(), // Multi-tenant support
  inventoryId: varchar("inventory_id", { length: 255 }).notNull(),
  productId: varchar("product_id", { length: 255 }).notNull(),
  variantId: varchar("variant_id", { length: 255 }),
  movementType: varchar("movement_type", { length: 50 }).notNull(), // 'in', 'out', 'adjustment'
  
  // Quantity-based movement fields
  quantity: int("quantity").notNull().default(0),
  previousQuantity: int("previous_quantity").notNull().default(0),
  newQuantity: int("new_quantity").notNull().default(0),
  
  // Weight-based movement fields (stored in grams)
  weightQuantity: decimal("weight_quantity", { precision: 12, scale: 2 }).default('0.00'), // Weight moved in grams
  previousWeightQuantity: decimal("previous_weight_quantity", { precision: 12, scale: 2 }).default('0.00'), // Previous weight in grams
  newWeightQuantity: decimal("new_weight_quantity", { precision: 12, scale: 2 }).default('0.00'), // New weight in grams
  
  reason: varchar("reason", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  reference: varchar("reference", { length: 255 }), // PO number, invoice, etc.
  notes: text("notes"),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  supplierId: varchar("supplier_id", { length: 255 }), // Reference to suppliers table
  supplier: varchar("supplier", { length: 255 }), // Legacy field - keeping for backward compatibility
  processedBy: varchar("processed_by", { length: 255 }), // Admin user who made the change
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Orders
export const orders = mysqlTable("orders", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull(), // Multi-tenant support
  orderNumber: varchar("order_number", { length: 100 }).notNull().unique(),
  userId: varchar("user_id", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, confirmed, processing, shipped, delivered, cancelled
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending"), // pending, paid, failed, refunded
  fulfillmentStatus: varchar("fulfillment_status", { length: 50 }).default("pending"), // pending, fulfilled, partially_fulfilled
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default('0.00'),
  shippingAmount: decimal("shipping_amount", { precision: 10, scale: 2 }).default('0.00'),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default('0.00'),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("PKR"),
  
  deliveryTime: varchar("delivery_time", { length: 255 }),
  // Billing Address
  billingFirstName: varchar("billing_first_name", { length: 100 }),
  billingLastName: varchar("billing_last_name", { length: 100 }),
  billingAddress1: varchar("billing_address1", { length: 255 }),
  billingAddress2: varchar("billing_address2", { length: 255 }),
  billingCity: varchar("billing_city", { length: 100 }),
  billingState: varchar("billing_state", { length: 100 }),
  billingPostalCode: varchar("billing_postal_code", { length: 20 }),
  billingCountry: varchar("billing_country", { length: 100 }),
  
  // Shipping Address
  shippingFirstName: varchar("shipping_first_name", { length: 100 }),
  shippingLastName: varchar("shipping_last_name", { length: 100 }),
  shippingAddress1: varchar("shipping_address1", { length: 255 }),
  shippingAddress2: varchar("shipping_address2", { length: 255 }),
  shippingCity: varchar("shipping_city", { length: 100 }),
  shippingState: varchar("shipping_state", { length: 100 }),
  shippingPostalCode: varchar("shipping_postal_code", { length: 20 }),
  shippingCountry: varchar("shipping_country", { length: 100 }),
  
  shippingMethod: varchar("shipping_method", { length: 100 }),
  trackingNumber: varchar("tracking_number", { length: 255 }),
  notes: text("notes"),
  cancelReason: text("cancel_reason"),
  
  // Service scheduling fields
  serviceDate: varchar("service_date", { length: 10 }), // YYYY-MM-DD format
  serviceTime: varchar("service_time", { length: 8 }), // HH:MM format
  
  // Driver assignment fields
  assignedDriverId: varchar("assigned_driver_id", { length: 255 }), // Current assigned driver
  deliveryStatus: varchar("delivery_status", { length: 30 }).default("pending"), // pending, assigned, picked_up, out_for_delivery, delivered, failed
  
  // Loyalty points fields
  pointsToRedeem: int("points_to_redeem").default(0), // Points redeemed for this order
  pointsDiscountAmount: decimal("points_discount_amount", { precision: 10, scale: 2 }).default('0.00'), // Discount amount from points
  
  // Purchase Order fields (for supplier orders)
  orderType: varchar("order_type", { length: 20 }).default("customer"), // customer, purchase_order
  supplierId: varchar("supplier_id", { length: 255 }), // Reference to suppliers table for purchase orders
  purchaseOrderNumber: varchar("purchase_order_number", { length: 100 }), // PO number for supplier orders
  expectedDeliveryDate: datetime("expected_delivery_date"), // Expected delivery from supplier
  
  // Invoice and validation fields
  invoiceType: varchar("invoice_type", { length: 100 }),
  invoiceRefNo: varchar("invoice_ref_no", { length: 255 }),
  scenarioId: varchar("scenario_id", { length: 255 }),
  invoiceNumber: varchar("invoice_number", { length: 255 }),
  invoiceDate: datetime("invoice_date"),
  validationResponse: text("validation_response"),
  fbrEnvironment: varchar("fbr_environment", { length: 20 }).default("sandbox"), // 'sandbox' or 'production' env
  
  // Buyer Information (from selected user/customer)
  buyerNTNCNIC: varchar("buyer_ntn_cnic", { length: 100 }),
  buyerBusinessName: varchar("buyer_business_name", { length: 255 }),
  buyerProvince: varchar("buyer_province", { length: 100 }),
  buyerAddress: varchar("buyer_address", { length: 500 }),
  buyerRegistrationType: varchar("buyer_registration_type", { length: 50 }),
  
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Order Items
export const orderItems = mysqlTable("order_items", {
  id: varchar("id", { length: 255 }).primaryKey(),
  orderId: varchar("order_id", { length: 255 }).notNull(),
  productId: varchar("product_id", { length: 255 }).notNull(),
  variantId: varchar("variant_id", { length: 255 }),
  productName: varchar("product_name", { length: 255 }).notNull(),
  productDescription: text("product_description"), // Product description
  variantTitle: varchar("variant_title", { length: 255 }),
  sku: varchar("sku", { length: 100 }),
  hsCode: varchar("hs_code", { length: 20 }), // Harmonized System Code
  uom: varchar("uom", { length: 50 }), // Unit of Measurement for non-weight based products
  itemSerialNumber: varchar("item_serial_number", { length: 100 }), // Item serial number
  sroScheduleNumber: varchar("sro_schedule_number", { length: 100 }), // SRO / Schedule Number
  
  // Product identification fields (from product)
  serialNumber: varchar("serial_number", { length: 100 }), // Product serial number
  listNumber: varchar("list_number", { length: 100 }), // List reference number
  bcNumber: varchar("bc_number", { length: 100 }), // BC identification number
  lotNumber: varchar("lot_number", { length: 100 }), // Batch/lot number
  expiryDate: varchar("expiry_date", { length: 20 }), // Expiry date (YYYY-MM-DD)
  
  // Quantity-based order fields
  quantity: int("quantity").notNull().default(0),
  
  // Weight-based order fields (stored in grams)
  weightQuantity: decimal("weight_quantity", { precision: 12, scale: 2 }).default('0.00'), // Ordered weight in grams
  weightUnit: varchar("weight_unit", { length: 10 }), // Display unit (grams, kg)
  
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }), // Cost price at time of sale
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }), // Total cost (costPrice * quantity/weight)
  
  // Tax and discount fields for each item
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default('0.00'),
  taxPercentage: decimal("tax_percentage", { precision: 5, scale: 2 }).default('0.00'),
  priceIncludingTax: decimal("price_including_tax", { precision: 10, scale: 2 }).default('0.00'),
  priceExcludingTax: decimal("price_excluding_tax", { precision: 10, scale: 2 }).default('0.00'),
  extraTax: decimal("extra_tax", { precision: 10, scale: 2 }).default('0.00'),
  furtherTax: decimal("further_tax", { precision: 10, scale: 2 }).default('0.00'),
  fedPayableTax: decimal("fed_payable_tax", { precision: 10, scale: 2 }).default('0.00'),
  discount: decimal("discount", { precision: 10, scale: 2 }).default('0.00'),
  // Additional tax fields
  fixedNotifiedValueOrRetailPrice: decimal("fixed_notified_value_or_retail_price", { precision: 10, scale: 2 }).default('0.00'),
  saleType: varchar("sale_type", { length: 100 }).default('Goods at standard rate'),
  
  productImage: varchar("product_image", { length: 500 }),
  addons: json("addons"), // Store selected addons as JSON
  groupTitle: varchar("group_title", { length: 255 }), // Add group title for addon groups
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Returns
export const returns = mysqlTable("returns", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull(), // Multi-tenant support
  returnNumber: varchar("return_number", { length: 100 }).notNull().unique(),
  orderId: varchar("order_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  status: varchar("status", { length: 50 }).default("pending"), // pending, approved, rejected, completed
  reason: varchar("reason", { length: 255 }).notNull(),
  description: text("description"),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  restockFee: decimal("restock_fee", { precision: 10, scale: 2 }).default('0.00'),
  adminNotes: text("admin_notes"),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Return Items
export const returnItems = mysqlTable("return_items", {
  id: varchar("id", { length: 255 }).primaryKey(),
  returnId: varchar("return_id", { length: 255 }).notNull(),
  orderItemId: varchar("order_item_id", { length: 255 }).notNull(),
  productId: varchar("product_id", { length: 255 }).notNull(),
  variantId: varchar("variant_id", { length: 255 }),
  quantity: int("quantity").notNull(),
  condition: varchar("condition", { length: 50 }), // new, used, damaged
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Refunds
export const refunds = mysqlTable("refunds", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull(), // Multi-tenant support
  orderId: varchar("order_id", { length: 255 }).notNull(),
  returnId: varchar("return_id", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: varchar("reason", { length: 255 }),
  method: varchar("method", { length: 50 }), // original_payment, store_credit, manual
  transactionId: varchar("transaction_id", { length: 255 }),
  status: varchar("status", { length: 50 }).default("pending"), // pending, completed, failed
  processedBy: varchar("processed_by", { length: 255 }),
  notes: text("notes"),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Shipping Labels
export const shippingLabels = mysqlTable("shipping_labels", {
  id: varchar("id", { length: 255 }).primaryKey(),
  orderId: varchar("order_id", { length: 255 }).notNull(),
  carrier: varchar("carrier", { length: 100 }).notNull(), // ups, fedex, usps, dhl
  service: varchar("service", { length: 100 }), // ground, express, overnight
  trackingNumber: varchar("tracking_number", { length: 255 }).notNull(),
  labelUrl: varchar("label_url", { length: 500 }),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  weight: decimal("weight", { precision: 8, scale: 2 }),
  dimensions: json("dimensions"), // {length, width, height}
  status: varchar("status", { length: 50 }).default("created"), // created, printed, shipped, delivered
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Admin users
export const adminUsers = mysqlTable("admin_users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull(), // Multi-tenant support
  email: varchar("email", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  type: varchar("type", { length: 50 }).notNull().default("admin"), // 'super-admin' or 'admin'
  roleId: varchar("roleId", { length: 255 }).notNull(),
  role: varchar('role', { length: 255 }).notNull(),
  createdAt: datetime("createdAt").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updatedAt").default(sql`CURRENT_TIMESTAMP`),
});
// Admin roles
export const adminRoles = mysqlTable("admin_roles", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull(), // Multi-tenant support
  name: varchar("name", { length: 255 }).notNull(),
  permissions: text("permissions").notNull(),
  description: text("description"), // Role description
  isActive: boolean("is_active").default(true), // Active/inactive roles
  createdAt: datetime("createdAt").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updatedAt").default(sql`CURRENT_TIMESTAMP`),
});

// Admin logs
export const adminLogs = mysqlTable("admin_logs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  adminId: varchar("adminId", { length: 255 }).notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  details: text("details"),
  createdAt: datetime("createdAt").default(sql`CURRENT_TIMESTAMP`),
});

// Drivers (extends users with driver-specific fields)
export const drivers = mysqlTable("drivers", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull(), // Multi-tenant support
  userId: varchar("user_id", { length: 255 }).notNull().unique(), // Reference to user table
  licenseNumber: varchar("license_number", { length: 100 }).unique(),
  vehicleType: varchar("vehicle_type", { length: 100 }), // car, motorcycle, truck, van
  vehicleMake: varchar("vehicle_make", { length: 100 }),
  vehicleModel: varchar("vehicle_model", { length: 100 }),
  vehicleYear: int("vehicle_year"),
  vehiclePlateNumber: varchar("vehicle_plate_number", { length: 50 }),
  vehicleColor: varchar("vehicle_color", { length: 50 }),
  
  // Location fields
  baseLocation: varchar("base_location", { length: 255 }), // Fixed base location address
  baseLatitude: decimal("base_latitude", { precision: 10, scale: 8 }), // GPS coordinates
  baseLongitude: decimal("base_longitude", { precision: 11, scale: 8 }),
  currentLatitude: decimal("current_latitude", { precision: 10, scale: 8 }), // Current location
  currentLongitude: decimal("current_longitude", { precision: 11, scale: 8 }),
  
  // Status and availability
  status: varchar("status", { length: 20 }).default("offline"), // available, busy, offline
  isActive: boolean("is_active").default(true),
  maxDeliveryRadius: int("max_delivery_radius").default(50), // in kilometers
  
  // Additional info
  emergencyContact: varchar("emergency_contact", { length: 20 }),
  emergencyContactName: varchar("emergency_contact_name", { length: 255 }),
  dateOfJoining: datetime("date_of_joining").default(sql`CURRENT_TIMESTAMP`),
  
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Driver Assignments (tracks which driver is assigned to which order)
export const driverAssignments = mysqlTable("driver_assignments", {
  id: varchar("id", { length: 255 }).primaryKey(),
  orderId: varchar("order_id", { length: 255 }).notNull(),
  driverId: varchar("driver_id", { length: 255 }).notNull(),
  assignedBy: varchar("assigned_by", { length: 255 }).notNull(), // Admin user who assigned
  assignedAt: datetime("assigned_at").default(sql`CURRENT_TIMESTAMP`),
  
  // Assignment details
  assignmentType: varchar("assignment_type", { length: 20 }).default("manual"), // manual, automatic
  estimatedDistance: decimal("estimated_distance", { precision: 8, scale: 2 }), // in kilometers
  estimatedDuration: int("estimated_duration"), // in minutes
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
  
  // Delivery status tracking
  deliveryStatus: varchar("delivery_status", { length: 30 }).default("assigned"), // assigned, picked_up, out_for_delivery, delivered, failed
  pickedUpAt: datetime("picked_up_at"),
  outForDeliveryAt: datetime("out_for_delivery_at"),
  deliveredAt: datetime("delivered_at"),
  failedAt: datetime("failed_at"),
  
  // Delivery details
  deliveryNotes: text("delivery_notes"),
  deliveryProof: varchar("delivery_proof", { length: 500 }), // Image URL for delivery proof
  customerSignature: varchar("customer_signature", { length: 500 }), // Signature image URL
  failureReason: text("failure_reason"),
  
  isActive: boolean("is_active").default(true), // For tracking reassignments
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Driver Assignment History (audit trail for all assignment changes)
export const driverAssignmentHistory = mysqlTable("driver_assignment_history", {
  id: varchar("id", { length: 255 }).primaryKey(),
  orderId: varchar("order_id", { length: 255 }).notNull(),
  assignmentId: varchar("assignment_id", { length: 255 }), // Reference to current assignment
  
  // Previous assignment details
  previousDriverId: varchar("previous_driver_id", { length: 255 }),
  newDriverId: varchar("new_driver_id", { length: 255 }),
  
  // Change details
  changeType: varchar("change_type", { length: 30 }).notNull(), // assigned, reassigned, unassigned
  changeReason: text("change_reason"),
  changedBy: varchar("changed_by", { length: 255 }).notNull(), // Admin user who made the change
  
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Suppliers
export const suppliers = mysqlTable("suppliers", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull(), // Multi-tenant support
  name: varchar("name", { length: 255 }).notNull(),
  companyName: varchar("company_name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  fax: varchar("fax", { length: 20 }),
  website: varchar("website", { length: 500 }),
  taxId: varchar("tax_id", { length: 100 }), // Business registration/tax ID
  
  // Primary Contact
  primaryContactName: varchar("primary_contact_name", { length: 255 }),
  primaryContactEmail: varchar("primary_contact_email", { length: 255 }),
  primaryContactPhone: varchar("primary_contact_phone", { length: 20 }),
  primaryContactMobile: varchar("primary_contact_mobile", { length: 20 }),
  
  // Secondary Contact
  secondaryContactName: varchar("secondary_contact_name", { length: 255 }),
  secondaryContactEmail: varchar("secondary_contact_email", { length: 255 }),
  secondaryContactPhone: varchar("secondary_contact_phone", { length: 20 }),
  secondaryContactMobile: varchar("secondary_contact_mobile", { length: 20 }),
  
  // Address Information
  address: varchar("address", { length: 500 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  country: varchar("country", { length: 100 }),
  
  // Business Information
  paymentTerms: varchar("payment_terms", { length: 100 }), // Net 30, Net 60, etc.
  currency: varchar("currency", { length: 3 }).default("PKR"),
  notes: text("notes"),
  
  // Seller Information
  sellerNTNCNIC: varchar("seller_ntn_cnic", { length: 100 }),
  sellerBusinessName: varchar("seller_business_name", { length: 255 }),
  sellerProvince: varchar("seller_province", { length: 100 }),
  sellerAddress: varchar("seller_address", { length: 500 }),
  
  isActive: boolean("is_active").default(true),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Application Settings
export const settings = mysqlTable("settings", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }), // Multi-tenant support - null for global settings
  key: varchar("key", { length: 255 }).notNull(), // e.g., 'stock_management_enabled'
  value: text("value").notNull(), // JSON string for complex values
  type: varchar("type", { length: 50 }).default("string"), // string, boolean, number, json
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  // Composite unique constraint to allow same key for different tenants
  tenantKeyUnique: unique("settings_tenant_key_unique").on(table.tenantId, table.key),
  tenantIdIdx: index("idx_settings_tenant_id").on(table.tenantId),
}));

// ✅ User Loyalty Points
export const userLoyaltyPoints = mysqlTable("user_loyalty_points", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  totalPointsEarned: int("total_points_earned").default(0),
  totalPointsRedeemed: int("total_points_redeemed").default(0),
  availablePoints: int("available_points").default(0), // points that can be redeemed
  pendingPoints: int("pending_points").default(0), // points waiting for order delivery
  pointsExpiringSoon: int("points_expiring_soon").default(0), // points expiring in next 30 days
  lastEarnedAt: datetime("last_earned_at"),
  lastRedeemedAt: datetime("last_redeemed_at"),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// ✅ Loyalty Points History
export const loyaltyPointsHistory = mysqlTable("loyalty_points_history", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  orderId: varchar("order_id", { length: 255 }), // reference to order when earned/redeemed
  transactionType: varchar("transaction_type", { length: 20 }).notNull(), // earned, redeemed, expired, manual_adjustment
  status: varchar("status", { length: 20 }).default("available"), // pending, available, expired, cancelled
  points: int("points").notNull(), // positive for earned, negative for redeemed/expired
  pointsBalance: int("points_balance").notNull(), // user's total available points after this transaction
  description: text("description"), // e.g., "Earned from order #ORD-123", "Redeemed at checkout"
  orderAmount: decimal("order_amount", { precision: 10, scale: 2 }), // order amount when points were earned
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }), // discount amount when redeemed
  expiresAt: datetime("expires_at"), // when these points expire (only for earned points)
  isExpired: boolean("is_expired").default(false),
  processedBy: varchar("processed_by", { length: 255 }), // admin user ID for manual adjustments
  metadata: json("metadata"), // additional data like conversion rates, settings used
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Relations
export const usersRelations = relations(user, ({ many, one }) => ({
  orders: many(orders),
  returns: many(returns),
  loyaltyPoints: one(userLoyaltyPoints),
  loyaltyHistory: many(loyaltyPointsHistory),
}));

export const userLoyaltyPointsRelations = relations(userLoyaltyPoints, ({ one, many }) => ({
  user: one(user, {
    fields: [userLoyaltyPoints.userId],
    references: [user.id],
  }),
  history: many(loyaltyPointsHistory),
}));

export const loyaltyPointsHistoryRelations = relations(loyaltyPointsHistory, ({ one }) => ({
  user: one(user, {
    fields: [loyaltyPointsHistory.userId],
    references: [user.id],
  }),
  order: one(orders, {
    fields: [loyaltyPointsHistory.orderId],
    references: [orders.id],
  }),
  userLoyaltyPoints: one(userLoyaltyPoints, {
    fields: [loyaltyPointsHistory.userId],
    references: [userLoyaltyPoints.userId],
  }),
}));

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  tenant: one(tenants, {
    fields: [categories.tenantId],
    references: [tenants.id],
  }),
  subcategories: many(subcategories),
  products: many(products),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
}));

export const subcategoriesRelations = relations(subcategories, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [subcategories.tenantId],
    references: [tenants.id],
  }),
  category: one(categories, {
    fields: [subcategories.categoryId],
    references: [categories.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  subcategory: one(subcategories, {
    fields: [products.subcategoryId],
    references: [subcategories.id],
  }),
  variants: many(productVariants),
  inventory: many(productInventory),
  orderItems: many(orderItems),
  productAddons: many(productAddons),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  inventory: many(productInventory),
  orderItems: many(orderItems),
}));

export const productInventoryRelations = relations(productInventory, ({ one, many }) => ({
  product: one(products, {
    fields: [productInventory.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [productInventory.variantId],
    references: [productVariants.id],
  }),
  supplier: one(suppliers, {
    fields: [productInventory.supplierId],
    references: [suppliers.id],
  }),
  stockMovements: many(stockMovements),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  inventory: one(productInventory, {
    fields: [stockMovements.inventoryId],
    references: [productInventory.id],
  }),
  product: one(products, {
    fields: [stockMovements.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [stockMovements.variantId],
    references: [productVariants.id],
  }),
  supplier: one(suppliers, {
    fields: [stockMovements.supplierId],
    references: [suppliers.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [orders.tenantId],
    references: [tenants.id],
  }),
  user: one(user, {
    fields: [orders.userId],
    references: [user.id],
  }),
  assignedDriver: one(drivers, {
    fields: [orders.assignedDriverId],
    references: [drivers.id],
  }),
  supplier: one(suppliers, {
    fields: [orders.supplierId],
    references: [suppliers.id],
  }),
  orderItems: many(orderItems),
  returns: many(returns),
  refunds: many(refunds),
  shippingLabels: many(shippingLabels),
  driverAssignments: many(driverAssignments),
  driverAssignmentHistory: many(driverAssignmentHistory),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
  returnItems: many(returnItems),
}));

export const returnsRelations = relations(returns, ({ one, many }) => ({
  order: one(orders, {
    fields: [returns.orderId],
    references: [orders.id],
  }),
  user: one(user, {
    fields: [returns.userId],
    references: [user.id],
  }),
  returnItems: many(returnItems),
  refunds: many(refunds),
}));

export const returnItemsRelations = relations(returnItems, ({ one }) => ({
  return: one(returns, {
    fields: [returnItems.returnId],
    references: [returns.id],
  }),
  orderItem: one(orderItems, {
    fields: [returnItems.orderItemId],
    references: [orderItems.id],
  }),
  product: one(products, {
    fields: [returnItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [returnItems.variantId],
    references: [productVariants.id],
  }),
}));

export const refundsRelations = relations(refunds, ({ one }) => ({
  order: one(orders, {
    fields: [refunds.orderId],
    references: [orders.id],
  }),
  return: one(returns, {
    fields: [refunds.returnId],
    references: [returns.id],
  }),
}));

export const shippingLabelsRelations = relations(shippingLabels, ({ one }) => ({
  order: one(orders, {
    fields: [shippingLabels.orderId],
    references: [orders.id],
  }),
}));

export const variationAttributesRelations = relations(variationAttributes, ({ many }) => ({
  values: many(variationAttributeValues),
}));

export const variationAttributeValuesRelations = relations(variationAttributeValues, ({ one }) => ({
  attribute: one(variationAttributes, {
    fields: [variationAttributeValues.attributeId],
    references: [variationAttributes.id],
  }),
}));

export const addonGroupsRelations = relations(addonGroups, ({ many }) => ({
  addons: many(addons),
}));

export const addonsRelations = relations(addons, ({ many, one }) => ({
  productAddons: many(productAddons),
  group: one(addonGroups, {
    fields: [addons.groupId],
    references: [addonGroups.id],
  }),
}));

export const productAddonsRelations = relations(productAddons, ({ one }) => ({
  product: one(products, {
    fields: [productAddons.productId],
    references: [products.id],
  }),
  addon: one(addons, {
    fields: [productAddons.addonId],
    references: [addons.id],
  }),
}));

export const adminUsersRelations = relations(adminUsers, ({ one, many }) => ({
  role: one(adminRoles, {
    fields: [adminUsers.roleId],
    references: [adminRoles.id],
  }),
  logs: many(adminLogs),
}));

export const adminRolesRelations = relations(adminRoles, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [adminRoles.tenantId],
    references: [tenants.id],
  }),
  users: many(adminUsers),
}));

export const adminLogsRelations = relations(adminLogs, ({ one }) => ({
  admin: one(adminUsers, {
    fields: [adminLogs.adminId],
    references: [adminUsers.id],
  }),
}));

export const driversRelations = relations(drivers, ({ one, many }) => ({
  user: one(user, {
    fields: [drivers.userId],
    references: [user.id],
  }),
  assignments: many(driverAssignments),
  assignmentHistory: many(driverAssignmentHistory),
}));

export const driverAssignmentsRelations = relations(driverAssignments, ({ one, many }) => ({
  order: one(orders, {
    fields: [driverAssignments.orderId],
    references: [orders.id],
  }),
  driver: one(drivers, {
    fields: [driverAssignments.driverId],
    references: [drivers.id],
  }),
  assignedByUser: one(adminUsers, {
    fields: [driverAssignments.assignedBy],
    references: [adminUsers.id],
  }),
  history: many(driverAssignmentHistory),
}));

export const driverAssignmentHistoryRelations = relations(driverAssignmentHistory, ({ one }) => ({
  order: one(orders, {
    fields: [driverAssignmentHistory.orderId],
    references: [orders.id],
  }),
  assignment: one(driverAssignments, {
    fields: [driverAssignmentHistory.assignmentId],
    references: [driverAssignments.id],
  }),
  previousDriver: one(drivers, {
    fields: [driverAssignmentHistory.previousDriverId],
    references: [drivers.id],
  }),
  newDriver: one(drivers, {
    fields: [driverAssignmentHistory.newDriverId],
    references: [drivers.id],
  }),
  changedByUser: one(adminUsers, {
    fields: [driverAssignmentHistory.changedBy],
    references: [adminUsers.id],
  }),
}));

// Tag Groups - for organizing tags into categories
export const tagGroups = mysqlTable("tag_groups", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull(), // Multi-tenant support
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 7 }), // Hex color code
  icon: varchar("icon", { length: 100 }), // Icon name/class
  allowCustomValues: boolean("allow_custom_values").default(false),
  isRequired: boolean("is_required").default(false), // If true, products must have at least one tag from this group
  maxSelections: int("max_selections").default(0), // 0 = unlimited, >0 = limit selections
  sortOrder: int("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Tags - individual tags that belong to groups
export const tags = mysqlTable("tags", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull(), // Multi-tenant support
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }), // Override group color if needed
  icon: varchar("icon", { length: 100 }), // Override group icon if needed
  groupId: varchar("group_id", { length: 255 }).notNull(),
  isCustom: boolean("is_custom").default(false), // True if this was a custom value created by user
  customValue: text("custom_value"), // Store custom input value if different from name
  sortOrder: int("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Product Tags - junction table linking products to tags with custom values
export const productTags = mysqlTable("product_tags", {
  id: varchar("id", { length: 255 }).primaryKey(),
  productId: varchar("product_id", { length: 255 }).notNull(),
  tagId: varchar("tag_id", { length: 255 }).notNull(),
  customValue: text("custom_value"), // For storing custom values when tag allows it
  sortOrder: int("sort_order").default(0),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Tag Groups Relations
export const tagGroupsRelations = relations(tagGroups, ({ many }) => ({
  tags: many(tags),
}));

// Tags Relations
export const tagsRelations = relations(tags, ({ one, many }) => ({
  group: one(tagGroups, {
    fields: [tags.groupId],
    references: [tagGroups.id],
  }),
  productTags: many(productTags),
}));

// Product Tags Relations
export const productTagsRelations = relations(productTags, ({ one }) => ({
  product: one(products, {
    fields: [productTags.productId],
    references: [products.id],
  }),
  tag: one(tags, {
    fields: [productTags.tagId],
    references: [tags.id],
  }),
}));

// Import Jobs - for tracking bulk import operations
export const importJobs = mysqlTable("import_jobs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull(), // Multi-tenant support
  type: varchar("type", { length: 50 }).notNull(), // users, products, inventory, etc.
  fileName: varchar("file_name", { length: 255 }).notNull(),
  blobUrl: varchar("blob_url", { length: 500 }).notNull(), // Vercel Blob URL
  status: varchar("status", { length: 20 }).default("pending"), // pending, processing, completed, failed
  
  // Progress tracking
  totalRecords: int("total_records").default(0),
  processedRecords: int("processed_records").default(0),
  successfulRecords: int("successful_records").default(0),
  failedRecords: int("failed_records").default(0),
  
  // Results and errors
  errors: json("errors"), // Array of error objects
  results: json("results"), // Summary results
  
  // Timestamps
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  startedAt: datetime("started_at"),
  completedAt: datetime("completed_at"),
  
  // Metadata
  createdBy: varchar("created_by", { length: 255 }).notNull(),
});

// Suppliers Relations
export const suppliersRelations = relations(suppliers, ({ many }) => ({
  products: many(products),
  productInventory: many(productInventory),
  stockMovements: many(stockMovements),
  orders: many(orders),
}));

// Tenant Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  adminUsers: many(adminUsers),
  users: many(user),
  products: many(products),
  categories: many(categories),
  orders: many(orders),
}));

// Update existing user relations to include tenant
export const updatedUsersRelations = relations(user, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [user.tenantId],
    references: [tenants.id],
  }),
  orders: many(orders),
  returns: many(returns),
  loyaltyPoints: one(userLoyaltyPoints),
  loyaltyHistory: many(loyaltyPointsHistory),
}));

// Update admin users relations to include tenant
export const updatedAdminUsersRelations = relations(adminUsers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [adminUsers.tenantId],
    references: [tenants.id],
  }),
  role: one(adminRoles, {
    fields: [adminUsers.roleId],
    references: [adminRoles.id],
  }),
  logs: many(adminLogs),
}));

// Update Products Relations to include tenant and other relations
export const updatedProductsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  subcategory: one(subcategories, {
    fields: [products.subcategoryId],
    references: [subcategories.id],
  }),
  supplier: one(suppliers, {
    fields: [products.supplierId],
    references: [suppliers.id],
  }),
  variants: many(productVariants),
  inventory: many(productInventory),
  orderItems: many(orderItems),
  productAddons: many(productAddons),
  productTags: many(productTags),
}));