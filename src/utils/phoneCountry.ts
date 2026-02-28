import { parsePhoneNumberFromString } from 'libphonenumber-js'

/**
 * Преобразует ISO 3166-1 alpha-2 код страны (UA, RU, ...) в флаг-эмодзи.
 */
function countryCodeToFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return ''
  return countryCode
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(0x1f1e6 - 65 + char.charCodeAt(0)))
    .join('')
}

/**
 * Информация о стране по номеру телефона.
 */
export interface PhoneCountryInfo {
  /** Название страны на русском */
  countryName: string
  /** Флаг-эмодзи страны (например 🇺🇦) */
  flag: string
  /** ISO 3166-1 alpha-2 код (UA, RU, ...) */
  countryCode: string
}

const displayNames = new Intl.DisplayNames(['ru'], { type: 'region' })

/**
 * Определяет страну по номеру телефона через libphonenumber-js.
 * Возвращает название страны на русском и флаг-эмодзи.
 * Номер может быть в формате 380..., +380..., 8 950... (для РФ).
 */
export function getPhoneCountryInfo(phone: string): PhoneCountryInfo | null {
  const raw = (phone ?? '').trim().replace(/\s/g, '')
  if (!raw) return null
  const withPlus = raw.startsWith('+') ? raw : `+${raw}`
  let parsed = parsePhoneNumberFromString(withPlus)
  if (!parsed && raw.startsWith('8') && raw.length >= 11) {
    parsed = parsePhoneNumberFromString('+7' + raw.slice(1), 'RU')
  }
  if (!parsed?.country) return null
  const countryCode = parsed.country
  try {
    const countryName = displayNames.of(countryCode) ?? countryCode
    return {
      countryName,
      flag: countryCodeToFlagEmoji(countryCode),
      countryCode,
    }
  } catch {
    return null
  }
}

/**
 * Возвращает название страны по номеру телефона (для обратной совместимости).
 */
export function getCountryFromPhone(phone: string): string | null {
  const info = getPhoneCountryInfo(phone)
  return info ? info.countryName : null
}
