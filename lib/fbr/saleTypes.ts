/**
 * FBR Sale Types Mapping
 *
 * Source of truth: PRAL "Technical Specification for DI API" v1.12 (24-Jul-2025),
 * section 9 "Scenarios for Sandbox Testing" (scenario -> sale type) and the
 * transaction-type reference API (section 5.5) for the exact sale type strings.
 * The item "rate" must be one of the rate descriptions FBR returns for that sale
 * type (reference API 5.8 SaleTypeToRate), otherwise FBR rejects the item with
 * "Provided Rate is not correct. Please provide valid rate for selected Sales Type".
 */

import type { ScenarioId } from './types';

// Scenario -> sale type, exactly as listed in DI spec v1.12 section 9.
export const localSaleTypeByScenario: Record<ScenarioId, string> = {
  SN001: "Goods at standard rate (default)",   // Goods at standard rate to registered buyers
  SN002: "Goods at standard rate (default)",   // Goods at standard rate to unregistered buyers
  SN003: "Steel melting and re-rolling",       // Sale of steel (melted and re-rolled)
  SN004: "Ship breaking",                      // Sale by ship breakers
  SN005: "Goods at Reduced Rate",              // Reduced rate sale (8th Schedule)
  SN006: "Exempt goods",                       // Exempt goods sale (6th Schedule)
  SN007: "Goods at zero-rate",                 // Zero rated sale (5th Schedule)
  SN008: "3rd Schedule Goods",                 // Sale of 3rd Schedule goods
  SN009: "Cotton ginners",                     // Cotton spinners purchase from cotton ginners
  SN010: "Telecommunication services",         // Telecom services rendered or provided
  SN011: "Toll Manufacturing",                 // Toll manufacturing sale by steel sector
  SN012: "Petroleum Products",                 // Sale of petroleum products
  SN013: "Electricity Supply to Retailers",    // Electricity supply to retailers
  SN014: "Gas to CNG stations",                // Sale of gas to CNG stations
  SN015: "Mobile Phones",                      // Sale of mobile phones
  SN016: "Processing/Conversion of Goods",     // Processing / conversion of goods
  SN017: "Goods (FED in ST Mode)",             // Goods where FED is charged in ST mode
  SN018: "Services (FED in ST Mode)",          // Services where FED is charged in ST mode
  SN019: "Services",                           // Services rendered or provided
  SN020: "Electric Vehicle",                   // Sale of electric vehicles
  SN021: "Cement /Concrete Block",             // Sale of cement / concrete block
  SN022: "Potassium Chlorate",                 // Sale of potassium chlorate
  SN023: "CNG Sales",                          // Sale of CNG
  SN024: "Goods as per SRO.297(|)/2023",       // Goods listed in SRO 297(I)/2023
  SN025: "Non-Adjustable Supplies",            // Drugs at fixed ST rate, 8th Schedule Table 1 serial 81
  SN026: "Goods at standard rate (default)",   // Sale to end consumer by retailers (retailers only)
  SN027: "3rd Schedule Goods",                 // Sale to end consumer by retailers (retailers only)
  SN028: "Goods at Reduced Rate",              // Sale to end consumer by retailers (retailers only)
};

// Default rate label per scenario. Used when an item has no tax percentage of its
// own. FBR's SaleTypeToRate reference API is authoritative for the exact label;
// the entries marked "confirm" have not been verified against it.
export const defaultRateByScenario: Record<ScenarioId, string> = {
  SN001: "18%",
  SN002: "18%",
  SN003: "18%",    // confirm
  SN004: "18%",    // confirm
  SN005: "1%",     // Reduced rate
  SN006: "Exempt", // Exempt goods
  SN007: "0%",     // Zero-rate
  SN008: "18%",    // 3rd Schedule
  SN009: "18%",    // confirm
  SN010: "18%",    // confirm
  SN011: "18%",    // confirm
  SN012: "18%",    // confirm
  SN013: "18%",    // confirm
  SN014: "18%",    // confirm
  SN015: "18%",    // confirm
  SN016: "18%",
  SN017: "8%",     // FED in ST mode
  SN018: "8%",     // Services with FED in ST mode
  SN019: "Exempt", // Services
  SN020: "18%",    // confirm
  SN021: "18%",    // confirm
  SN022: "18% along with rupees 60 per kilogram", // label from spec sample (section 5.8)
  SN023: "18%",    // confirm
  SN024: "25%",    // Goods as per SRO
  SN025: "0%",     // Non-Adjustable Supplies
  SN026: "18%",
  SN027: "18%",
  SN028: "18%",
};

// Scenarios that require special handling
export const scenarioRequirements = {
  // Withholding tax is never added automatically. DI spec v1.12 error 0008 requires
  // ST withheld at source to be zero or equal to the sales tax, and error 0070 says
  // it cannot be created for unregistered buyers at all. Only a user-entered value
  // is passed through.
  witholdingTaxRequired: [] as ScenarioId[],

  // Scenarios that are exempt/zero-rated (force salesTaxApplicable = 0)
  exemptOrZeroRated: ['SN006', 'SN007', 'SN019', 'SN025'] as ScenarioId[],

  // Scenarios that support 3rd Schedule (fixedNotifiedValueOrRetailPrice)
  thirdSchedule: ['SN008', 'SN027'] as ScenarioId[],

  // Scenarios where FED is charged in sales tax mode (fedPayable field)
  fedInStMode: ['SN017', 'SN018'] as ScenarioId[],

  // Sale to end consumer by retailers (spec section 9 note: retailers only)
  retail: ['SN026', 'SN027', 'SN028'] as ScenarioId[],

  // Services scenarios
  services: ['SN010', 'SN018', 'SN019'] as ScenarioId[],
};

/**
 * Get the canonical saleType for a given scenario
 * @param scenarioId The FBR scenario ID
 * @returns The canonical saleType string
 */
export function getSaleTypeForScenario(scenarioId: ScenarioId): string {
  return localSaleTypeByScenario[scenarioId] || localSaleTypeByScenario.SN001;
}

/**
 * Get the default rate for a given scenario
 * @param scenarioId The FBR scenario ID
 * @returns The default rate string (e.g., "18%", "Exempt", "0%")
 */
export function getDefaultRateForScenario(scenarioId: ScenarioId): string {
  return defaultRateByScenario[scenarioId] || "18%";
}

/**
 * Check if a scenario requires withholding tax
 * @param scenarioId The FBR scenario ID
 * @returns True if withholding tax is required
 */
export function requiresWithholdingTax(scenarioId: ScenarioId): boolean {
  return scenarioRequirements.witholdingTaxRequired.includes(scenarioId);
}

/**
 * Check if a scenario is exempt or zero-rated
 * @param scenarioId The FBR scenario ID
 * @returns True if exempt or zero-rated
 */
export function isExemptOrZeroRated(scenarioId: ScenarioId): boolean {
  return scenarioRequirements.exemptOrZeroRated.includes(scenarioId);
}

/**
 * Check if a scenario supports 3rd Schedule
 * @param scenarioId The FBR scenario ID
 * @returns True if 3rd Schedule is supported
 */
export function supportsThirdSchedule(scenarioId: ScenarioId): boolean {
  return scenarioRequirements.thirdSchedule.includes(scenarioId);
}

/**
 * Check if a scenario requires FED payable
 * @param scenarioId The FBR scenario ID
 * @returns True if FED payable is required
 */
export function requiresFedPayable(scenarioId: ScenarioId): boolean {
  return scenarioRequirements.fedInStMode.includes(scenarioId);
}

/**
 * Check if a scenario is a retail scenario
 * @param scenarioId The FBR scenario ID
 * @returns True if it's a retail scenario
 */
export function isRetailScenario(scenarioId: ScenarioId): boolean {
  return scenarioRequirements.retail.includes(scenarioId);
}

/**
 * Check if a scenario is a services scenario
 * @param scenarioId The FBR scenario ID
 * @returns True if it's a services scenario
 */
export function isServicesScenario(scenarioId: ScenarioId): boolean {
  return scenarioRequirements.services.includes(scenarioId);
}

// Export all scenario IDs for convenience
export const allScenarios: ScenarioId[] = [
  'SN001', 'SN002', 'SN003', 'SN004', 'SN005', 'SN006', 'SN007', 'SN008',
  'SN009', 'SN010', 'SN011', 'SN012', 'SN013', 'SN014', 'SN015', 'SN016',
  'SN017', 'SN018', 'SN019', 'SN020', 'SN021', 'SN022', 'SN023', 'SN024',
  'SN025', 'SN026', 'SN027', 'SN028'
];
