/**
 * FBR Digital Invoicing Types
 * 
 * These types define the exact structure required by FBR's API
 * and our internal order structure for mapping.
 */

// FBR API Types - Using exact field names as required by FBR
export interface FbrItem {
  hsCode: string;
  productDescription: string;
  rate: string; // e.g., "18%", "0%", "Exempt", "1%"
  uoM: string; // Unit of Measurement - exact spelling/case as per FBR reference
  quantity: number;
  valueSalesExcludingST: number;
  totalValues: number;
  fixedNotifiedValueOrRetailPrice?: number; // Only for 3rd Schedule (SN008), omit otherwise
  salesTaxApplicable: number;
  salesTaxWithheldAtSource?: number; // For SN002 etc., omit if N/A
  extraTax?: number; // Omit if N/A, never send empty string
  furtherTax?: number;
  sroScheduleNo?: string; // Schedule/SRO text when applicable
  fedPayable?: number; // For FED-in-ST scenarios (SN017/18/23/25)
  discount?: number;
  saleType: string; // Canonical scenario label
  sroItemSerialNo?: string; // When applicable
  
  // Additional fields for display purposes (not sent to FBR API)
  priceIncludingTax?: number; // Original price including tax for display
  priceExcludingTax?: number; // Original price excluding tax for display
  taxPercentage?: number; // Tax percentage for display
}

export interface FbrInvoice {
  // Header fields - using exact FBR field names
  invoiceType: "Sale Invoice" | "Debit Note";
  invoiceDate: string; // YYYY-MM-DD format
  sellerNTNCNIC: string;
  sellerBusinessName: string;
  sellerProvince: string;
  sellerAddress: string;
  buyerNTNCNIC?: string; // Blank/omitted for Unregistered
  buyerBusinessName?: string;
  buyerProvince?: string;
  buyerAddress?: string;
  buyerRegistrationType: "Registered" | "Unregistered";
  invoiceRefNo?: string; // Required if Debit Note
  scenarioId: string; // e.g., "SN002", "SN026"
  
  // Items array
  items: FbrItem[];
}

// Our internal types for mapping
export interface OrderItem {
  id?: string;
  productId: string;
  variantId?: string;
  productName: string;
  productDescription?: string;
  variantTitle?: string;
  sku?: string;
  hsCode?: string;
  price: number;
  quantity: number;
  totalPrice: number;
  
  // Weight-based fields
  weightQuantity?: number; // Weight in grams
  weightUnit?: string; // Display unit (grams, kg)
  isWeightBased?: boolean;
  
  // UOM for non-weight based products
  uom?: string;
  
  // Additional fields
  itemSerialNumber?: string;
  sroScheduleNumber?: string;
  
  // Tax and discount fields
  taxAmount?: number;
  taxPercentage?: number;
  priceIncludingTax?: number;
  priceExcludingTax?: number;
  extraTax?: number;
  furtherTax?: number;
  fedPayableTax?: number;
  discount?: number;
  
  // Additional tax fields
  fixedNotifiedValueOrRetailPrice?: number;
  saleType?: string;
  
  addons?: Array<{
    addonId: string;
    title?: string;
    price: number;
    quantity: number;
  }>;
}

export interface Order {
  id?: string;
  orderNumber?: string;
  userId?: string;
  email: string;
  phone?: string;
  status?: string;
  paymentStatus?: string;
  subtotal: number;
  taxAmount?: number;
  shippingAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  currency?: string;
  
  // Invoice and validation fields
  invoiceType?: string;
  invoiceRefNo?: string;
  scenarioId?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  validationResponse?: string;
  
  // Billing address
  billingFirstName?: string;
  billingLastName?: string;
  billingAddress1?: string;
  billingAddress2?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  
  // Shipping address
  shippingFirstName?: string;
  shippingLastName?: string;
  shippingAddress1?: string;
  shippingAddress2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  
  // Buyer fields (from selected customer)
  buyerNTNCNIC?: string;
  buyerBusinessName?: string;
  buyerProvince?: string;
  buyerAddress?: string;
  buyerRegistrationType?: "Registered" | "Unregistered";
  
  // Seller fields (for FBR Digital Invoicing)
  sellerNTNCNIC?: string;
  sellerBusinessName?: string;
  sellerProvince?: string;
  sellerAddress?: string;
  fbrSandboxToken?: string;
  fbrBaseUrl?: string;
  
  // Production environment fields
  isProductionSubmission?: boolean;
  productionToken?: string;
  
  // Order items
  items: OrderItem[];
  
  createdAt?: string;
  updatedAt?: string;
}

// FBR API Response Types
export interface FbrValidationResponse {
  validationResponse?: {
    status: "Valid" | "Invalid";
    error?: string;
    details?: any;
  };
  [key: string]: any;
}

export interface FbrPostResponse {
  invoiceNumber?: string;
  dated?: string;
  validationResponse?: {
    statusCode?: string;   // "00" means Valid
    status?: string;       // "Valid"
    error?: string;        // usually ""
    invoiceStatuses?: Array<{
      statusCode?: string; // "00"
      status?: string;     // "Valid"
      invoiceNo?: string;  // e.g., "6408543DI175...-1"
      errorCode?: string;
      error?: string;
    }>;
  };
  [key: string]: any;
}

// API Response wrapper
export interface FbrApiResponse {
  step: "validate" | "post" | "validation" | "mapping" | "error";
  ok: boolean;
  response: FbrValidationResponse | FbrPostResponse;
  error?: string;
}

// Seller information (from environment or settings)
export interface SellerInfo {
  ntncnic: string;
  businessName: string;
  province: string;
  address: string;
}

// Rate conversion utility type
export type RateLabel = "18%" | "0%" | "Exempt" | "1%" | "3%" | "5%" | "10%" | "15%" | "17%";

// Scenario types for type safety
export type ScenarioId =
  | "SN001" | "SN002" | "SN003" | "SN004" | "SN005" | "SN006" | "SN007" | "SN008"
  | "SN009" | "SN010" | "SN011" | "SN012" | "SN013" | "SN014" | "SN015" | "SN016"
  | "SN017" | "SN018" | "SN019" | "SN020" | "SN021" | "SN022" | "SN023" | "SN024"
  | "SN025" | "SN026" | "SN027" | "SN028";
