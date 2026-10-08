/**
 * FBR Digital Invoicing Library - Main Export
 * 
 * This is the main entry point for the FBR integration library.
 * Import everything you need from here for cleaner imports.
 */

// Types
export type {
  FbrInvoice,
  FbrItem,
  Order,
  OrderItem,
  FbrValidationResponse,
  FbrPostResponse,
  FbrApiResponse,
  SellerInfo,
  ScenarioId,
  RateLabel,
} from './types';

// Sale Types and Scenario Utilities
export {
  localSaleTypeByScenario,
  defaultRateByScenario,
  scenarioRequirements,
  getSaleTypeForScenario,
  getDefaultRateForScenario,
  requiresWithholdingTax,
  isExemptOrZeroRated,
  supportsThirdSchedule,
  requiresFedPayable,
  isRetailScenario,
  isServicesScenario,
  allScenarios,
} from './saleTypes';

// Client Functions (Server-only)
export {
  sanitize,
  validateInvoice,
  postInvoice,
  getSaleTypeToRate,
  validateFbrConfig,
  testFbrConnection,
} from './client';

// Mapper Functions
export {
  parseRate,
  formatRate,
  getSaleTypeForScenarioWithFallback,
  getRateLabelForScenario,
  mapOrderToFbrInvoice,
  validateOrderForFbr,
  createTestFbrInvoice,
} from './mapper';

// Re-export everything for convenience
export * from './types';
export * from './saleTypes';
export * from './client';
export * from './mapper';
