import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseCurrency(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return NaN;
  if (typeof value === 'number') return value;

  const strValue = String(value).trim();
  if (strValue === '#N/DISP') {
    return 0;
  }

  // Keep only digits, comma, dot, and negative sign.
  let cleanedValue = strValue.replace(/[^0-9,.-]/g, '');

  // if it's just a negative sign, or empty, it's not a number
  if (cleanedValue === '-' || cleanedValue === '') return NaN;

  const lastComma = cleanedValue.lastIndexOf(',');
  const lastDot = cleanedValue.lastIndexOf('.');

  // If comma is the last decimal separator, assume pt-BR format.
  if (lastComma > lastDot) {
    // Remove dots (thousands separators), replace comma with dot (decimal separator).
    cleanedValue = cleanedValue.replace(/\./g, '').replace(',', '.');
  } else {
    // Assume en-US format or a format with no thousands separators.
    // Remove commas (thousands separators).
    cleanedValue = cleanedValue.replace(/,/g, '');
  }

  return parseFloat(cleanedValue);
}
