/**
 * FBR Sale Types Mapping
 * 
 * Provides a robust scenario → saleType map using canonical strings
 * that have been tested to work with FBR's sandbox environment.
 */

import type { ScenarioId } from './types';

// Local mapping of scenario IDs to their canonical saleType labels
// These strings have been tested and verified to work with FBR's API
export const localSaleTypeByScenario: Record<ScenarioId, string> = {
  SN001: "Goods at standard rate (default)",
  SN002: "Goods at standard rate (default)",               // with WHT at item level
  SN003: "Goods at standard rate (default)",
  SN004: "Goods at standard rate (default)",
  SN005: "Goods at Reduced Rate",
  SN006: "Exempt goods",
  SN007: "Goods at zero-rate",
  SN008: "3rd Schedule Goods",
  SN009: "Cotton ginners",
  SN010: "Ship breaking",
  SN011: "Steel Melters / Re-Rollers",
  SN012: "Petroleum products",
  SN013: "Natural Gas / CNG",
  SN014: "Electric power / Electricity",
  SN015: "Telecommunication services",
  SN016: "Processing/Conversion of Goods",
  SN017: "Goods (FED in ST Mode)",
  SN018: "Services (FED in ST Mode)",
  SN019: "Services",
  SN020: "Mobile phones (9th Schedule)",
  SN021: "Drugs at fixed rate (Eighth Schedule)",
  SN022: "Services (ICT Ordinance)",
  SN023: "Services (FED in ST Mode)",
  SN024: "Goods as per SRO.297(|)/2023",
  SN025: "Non-Adjustable Supplies",
  // Based on user's sandbox success:
  SN026: "Goods at standard rate (default)",
  SN027: "3rd Schedule Goods",
  SN028: "Goods at Reduced Rate",
};

// Default rates for each scenario (can be overridden by product-specific rates)
export const defaultRateByScenario: Record<ScenarioId, string> = {
  SN001: "18%",
  SN002: "18%",
  SN003: "18%",
  SN004: "18%",
  SN005: "1%",     // Reduced rate
  SN006: "Exempt", // Exempt goods
  SN007: "0%",     // Zero-rate
  SN008: "18%",    // 3rd Schedule
  SN009: "18%",
  SN010: "18%",
  SN011: "18%",
  SN012: "18%",
  SN013: "18%",
  SN014: "18%",
  SN015: "18%",
  SN016: "18%",
  SN017: "8%",     // FED in ST mode
  SN018: "8%",     // Services with FED in ST mode
  SN019: "Exempt", // Services
  SN020: "18%",
  SN021: "18%",    // Fixed rate drugs
  SN022: "18%",
  SN023: "8%",     // Services (FED in ST Mode)
  SN024: "25%",    // Goods as per SRO
  SN025: "0%",     // Non-Adjustable Supplies
  SN026: "18%",
  SN027: "18%",
  SN028: "18%",
};

// Scenarios that require special handling
export const scenarioRequirements = {
  // Scenarios that require withholding tax at item level
  witholdingTaxRequired: ['SN002'] as ScenarioId[],
  
  // Scenarios that are exempt/zero-rated (force salesTaxApplicable = 0)
  exemptOrZeroRated: ['SN006', 'SN007', 'SN019', 'SN025'] as ScenarioId[],
  
  // Scenarios that support 3rd Schedule (fixedNotifiedValueOrRetailPrice)
  thirdSchedule: ['SN008', 'SN027'] as ScenarioId[],
  
  // Scenarios that require FED payable (fedPayable field)
  fedInStMode: ['SN017', 'SN018', 'SN023', 'SN025'] as ScenarioId[],
  
  // Retail scenarios
  retail: ['SN027', 'SN028'] as ScenarioId[],
  
  // Services scenarios
  services: ['SN015', 'SN018', 'SN019', 'SN022', 'SN023'] as ScenarioId[],
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
