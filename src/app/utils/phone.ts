const DEFAULT_PHONE_DIGITS = 10;

export function stripPhoneDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, DEFAULT_PHONE_DIGITS);
}

export function formatSriLankanPhoneNumber(value: string): string {
  const digits = stripPhoneDigits(value);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

export function isValidSriLankanPhoneNumber(value: string): boolean {
  return stripPhoneDigits(value).length === DEFAULT_PHONE_DIGITS;
}

export const PHONE_NUMBER_MAX_LENGTH = 12;
export const PHONE_NUMBER_DIGITS = DEFAULT_PHONE_DIGITS;
