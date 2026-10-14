/**
 * Buyer (customer) constants shared by the users pages and the CSV import.
 *
 * The province and registration-type values must match the <Select> options on the
 * add/edit user and order pages exactly; a stored value that differs (e.g. "KPK")
 * shows up as an unselected dropdown and reaches FBR unchanged.
 */

export const PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa (KPK)',
  'Balochistan',
  'Capital Territory',
  'Azad Jammu & Kashmir (AJK)',
  'Gilgit-Baltistan (GB)',
  'N/A',
] as const;

export type Province = (typeof PROVINCES)[number];

export const REGISTRATION_TYPES = ['Registered', 'Unregistered'] as const;

export type RegistrationType = (typeof REGISTRATION_TYPES)[number];

/** Lower-case, drop punctuation except "/", collapse whitespace. */
function simplify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9/\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Keys are simplified (see above) spellings commonly found in customer spreadsheets.
const PROVINCE_ALIASES: Record<string, Province> = {
  'punjab': 'Punjab',
  'sindh': 'Sindh',
  'sind': 'Sindh',
  'kpk': 'Khyber Pakhtunkhwa (KPK)',
  'kp': 'Khyber Pakhtunkhwa (KPK)',
  'nwfp': 'Khyber Pakhtunkhwa (KPK)',
  'khyber pakhtunkhwa': 'Khyber Pakhtunkhwa (KPK)',
  'khyber pakhtoonkhwa': 'Khyber Pakhtunkhwa (KPK)',
  'balochistan': 'Balochistan',
  'baluchistan': 'Balochistan',
  'capital': 'Capital Territory',
  'capital territory': 'Capital Territory',
  'islamabad': 'Capital Territory',
  'ict': 'Capital Territory',
  'federal': 'Capital Territory',
  'federal capital': 'Capital Territory',
  'islamabad capital territory': 'Capital Territory',
  'ajk': 'Azad Jammu & Kashmir (AJK)',
  'azad kashmir': 'Azad Jammu & Kashmir (AJK)',
  'azad jammu kashmir': 'Azad Jammu & Kashmir (AJK)',
  'azad jammu and kashmir': 'Azad Jammu & Kashmir (AJK)',
  'gb': 'Gilgit-Baltistan (GB)',
  'gilgit': 'Gilgit-Baltistan (GB)',
  'gilgit baltistan': 'Gilgit-Baltistan (GB)',
  'na': 'N/A',
  'n/a': 'N/A',
  'none': 'N/A',
};

const CANONICAL_PROVINCES = new Map<string, Province>(
  PROVINCES.map((province) => [simplify(province), province])
);

/**
 * Map a free-text province to the canonical dropdown value.
 * Blank -> null. Unknown values are returned trimmed (the order pages render them as a
 * custom option) and logged, mirroring normalizeScenarioId in the import core.
 */
export function normalizeProvince(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return null;
  const key = simplify(trimmed);
  const match = CANONICAL_PROVINCES.get(key) ?? PROVINCE_ALIASES[key];
  if (match) return match;
  console.warn(`⚠️ Province "${trimmed}" is not a known province (${PROVINCES.join(', ')}); storing it unchanged`);
  return trimmed;
}

const REGISTRATION_ALIASES: Record<string, RegistrationType> = {
  'registered': 'Registered',
  'reg': 'Registered',
  'r': 'Registered',
  'yes': 'Registered',
  'y': 'Registered',
  'true': 'Registered',
  'unregistered': 'Unregistered',
  'un registered': 'Unregistered', // "un-registered" after simplify()
  'not registered': 'Unregistered',
  'unreg': 'Unregistered',
  'u': 'Unregistered',
  'no': 'Unregistered',
  'n': 'Unregistered',
  'false': 'Unregistered',
};

/**
 * Map a free-text registration type to "Registered" / "Unregistered".
 * Blank -> null. Unknown values are returned trimmed and logged.
 */
export function normalizeRegistrationType(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return null;
  const match = REGISTRATION_ALIASES[simplify(trimmed)];
  if (match) return match;
  console.warn(`⚠️ Registration type "${trimmed}" is not one of ${REGISTRATION_TYPES.join(' / ')}; storing it unchanged`);
  return trimmed;
}
