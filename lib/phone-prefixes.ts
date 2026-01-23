// Phone country codes and prefixes
// Format: countryCode -> { prefix, name, placeholder, exampleLocal }

export interface CountryPhoneConfig {
  prefix: string;        // e.g., "+54 9"
  dialCode: string;      // e.g., "549" (for wa.me links)
  name: string;          // e.g., "Argentina"
  flag: string;          // e.g., "🇦🇷"
  placeholder: string;   // e.g., "11 1234 5678"
  format: (phone: string) => string; // Format function
}

export const COUNTRY_PHONE_CONFIGS: Record<string, CountryPhoneConfig> = {
  AR: {
    prefix: '+54 9',
    dialCode: '549',
    name: 'Argentina',
    flag: '🇦🇷',
    placeholder: '11 1234 5678',
    format: (phone) => phone.replace(/\D/g, ''),
  },
  MX: {
    prefix: '+52',
    dialCode: '52',
    name: 'México',
    flag: '🇲🇽',
    placeholder: '55 1234 5678',
    format: (phone) => phone.replace(/\D/g, ''),
  },
  CO: {
    prefix: '+57',
    dialCode: '57',
    name: 'Colombia',
    flag: '🇨🇴',
    placeholder: '300 123 4567',
    format: (phone) => phone.replace(/\D/g, ''),
  },
  CL: {
    prefix: '+56 9',
    dialCode: '569',
    name: 'Chile',
    flag: '🇨🇱',
    placeholder: '1234 5678',
    format: (phone) => phone.replace(/\D/g, ''),
  },
  PE: {
    prefix: '+51',
    dialCode: '51',
    name: 'Perú',
    flag: '🇵🇪',
    placeholder: '999 123 456',
    format: (phone) => phone.replace(/\D/g, ''),
  },
  UY: {
    prefix: '+598',
    dialCode: '598',
    name: 'Uruguay',
    flag: '🇺🇾',
    placeholder: '99 123 456',
    format: (phone) => phone.replace(/\D/g, ''),
  },
  EC: {
    prefix: '+593',
    dialCode: '593',
    name: 'Ecuador',
    flag: '🇪🇨',
    placeholder: '99 123 4567',
    format: (phone) => phone.replace(/\D/g, ''),
  },
  VE: {
    prefix: '+58',
    dialCode: '58',
    name: 'Venezuela',
    flag: '🇻🇪',
    placeholder: '412 123 4567',
    format: (phone) => phone.replace(/\D/g, ''),
  },
  BO: {
    prefix: '+591',
    dialCode: '591',
    name: 'Bolivia',
    flag: '🇧🇴',
    placeholder: '7123 4567',
    format: (phone) => phone.replace(/\D/g, ''),
  },
  PY: {
    prefix: '+595',
    dialCode: '595',
    name: 'Paraguay',
    flag: '🇵🇾',
    placeholder: '981 123 456',
    format: (phone) => phone.replace(/\D/g, ''),
  },
  BR: {
    prefix: '+55',
    dialCode: '55',
    name: 'Brasil',
    flag: '🇧🇷',
    placeholder: '11 91234 5678',
    format: (phone) => phone.replace(/\D/g, ''),
  },
  ES: {
    prefix: '+34',
    dialCode: '34',
    name: 'España',
    flag: '🇪🇸',
    placeholder: '612 345 678',
    format: (phone) => phone.replace(/\D/g, ''),
  },
  US: {
    prefix: '+1',
    dialCode: '1',
    name: 'Estados Unidos',
    flag: '🇺🇸',
    placeholder: '(555) 123-4567',
    format: (phone) => phone.replace(/\D/g, ''),
  },
  // Default fallback
  DEFAULT: {
    prefix: '+',
    dialCode: '',
    name: 'Otro país',
    flag: '🌐',
    placeholder: 'Número completo',
    format: (phone) => phone.replace(/\D/g, ''),
  },
};

// Get all countries as array for dropdown
export const COUNTRIES_LIST = Object.entries(COUNTRY_PHONE_CONFIGS)
  .filter(([code]) => code !== 'DEFAULT')
  .map(([code, config]) => ({
    code,
    ...config,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

/**
 * Get phone config by country code
 */
export function getPhoneConfig(countryCode: string): CountryPhoneConfig {
  return COUNTRY_PHONE_CONFIGS[countryCode] || COUNTRY_PHONE_CONFIGS.DEFAULT;
}

/**
 * Combine prefix + local number into full phone number for storage
 * Returns format suitable for WhatsApp (just numbers)
 */
export function buildFullPhoneNumber(dialCode: string, localNumber: string): string {
  const cleanLocal = localNumber.replace(/\D/g, '');
  return `${dialCode}${cleanLocal}`;
}

/**
 * Format phone for display
 */
export function formatPhoneForDisplay(dialCode: string, localNumber: string, prefix: string): string {
  return `${prefix} ${localNumber}`;
}
