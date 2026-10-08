/**
 * Sort order items the same way the edit-order page does:
 *  1. itemSequence (position in the CSV for bulk-imported orders)
 *  2. SKU (natural/numeric-aware)
 *  3. serial number, with empty values last
 * Returns a new array; the input is not mutated.
 */
export interface SortableOrderItem {
  itemSequence?: number | string | null;
  sku?: string | null;
  serialNumber?: string | null;
}

export function sortOrderItems<T extends SortableOrderItem>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aSequence = Number(a.itemSequence) || 0;
    const bSequence = Number(b.itemSequence) || 0;
    if (aSequence && bSequence) {
      return aSequence - bSequence;
    }

    const aSku = a.sku || '';
    const bSku = b.sku || '';
    if (aSku && bSku) {
      return aSku.localeCompare(bSku, undefined, { numeric: true, sensitivity: 'base' });
    }

    const aSerial = a.serialNumber || '';
    const bSerial = b.serialNumber || '';
    if (!aSerial && !bSerial) return 0;
    if (!aSerial) return 1;
    if (!bSerial) return -1;
    return aSerial.localeCompare(bSerial, undefined, { numeric: true, sensitivity: 'base' });
  });
}
