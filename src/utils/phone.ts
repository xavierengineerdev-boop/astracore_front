/**
 * Нормализация и отображение телефона.
 * Правила по странам загружаются с бэкенда (GET /phone-rules); при наличии правил
 * формат отображения и валидация зависят от кода страны.
 */

import type { PhoneRule } from '../api/phoneRules'

/** Локальная нормализация (только цифры, 8→7 для РФ); полная нормализация — на бэкенде. */
export function normalizePhone(phoneRaw: string | null | undefined): string {
  if (phoneRaw == null) return ''
  const digits = String(phoneRaw).replace(/\D/g, '')
  if (digits.length === 0) return ''
  let normalized = digits
  if (normalized.startsWith('8') && normalized.length === 11) {
    normalized = '7' + normalized.slice(1)
  } else if (normalized.length === 10 && !normalized.startsWith('7') && !normalized.startsWith('8')) {
    normalized = '7' + normalized
  } else if (normalized.length === 11 && normalized.startsWith('8')) {
    normalized = '7' + normalized.slice(1)
  }
  return normalized
}

/** Найти правило по полному номеру (только цифры) — совпадение по началу с dialCode (длинные коды первыми). */
function findRuleForNumber(digits: string, rules: PhoneRule[]): PhoneRule | undefined {
  const byDial = [...new Set(rules.map((r) => r.dialCode))].sort((a, b) => b.length - a.length)
  for (const code of byDial) {
    if (digits === code || digits.startsWith(code)) {
      return rules.find((r) => r.dialCode === code)
    }
  }
  return undefined
}

/**
 * Форматирует номер для отображения по правилу страны.
 * Если правила переданы — ищем правило по коду страны и nationalDisplaySegments.
 * Иначе — fallback для +7 (Россия/Казахстан).
 */
export function formatPhoneDisplay(
  phone: string | null | undefined,
  rules?: PhoneRule[] | null,
): string {
  const raw = (phone ?? '').trim()
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 0) return raw

  if (rules?.length) {
    const rule = findRuleForNumber(digits, rules)
    if (rule?.dialCode && digits.startsWith(rule.dialCode)) {
      const national = digits.slice(rule.dialCode.length)
      const segments = rule.nationalDisplaySegments
      if (segments?.length) {
        let pos = 0
        const parts: string[] = []
        for (const len of segments) {
          if (pos >= national.length) break
          parts.push(national.slice(pos, pos + len))
          pos += len
        }
        if (parts.length) {
          const first = parts[0]
          const rest = parts.slice(1).join('-')
          return rest ? `+${rule.dialCode} (${first}) ${rest}` : `+${rule.dialCode} (${first})`
        }
      }
      return `+${rule.dialCode} ${national}`
    }
  }

  if (digits.length === 11 && digits.startsWith('7')) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`
  }
  return raw
}

/** Проверка по правилам: подходит ли нормализованный номер под какое-либо правило. */
export function isValidNormalizedPhone(value: string, rules?: PhoneRule[] | null): boolean {
  const digits = (value ?? '').replace(/\D/g, '')
  if (!digits.length || !rules?.length) return /^7\d{10}$/.test(digits)
  return rules.some((r) => new RegExp(r.pattern).test(digits))
}

/** href для tel: — всегда с плюсом для международного набора. */
export function getTelHref(phone: string | null | undefined): string | null {
  const digits = (phone ?? '').replace(/\D/g, '')
  if (digits.length === 0) return null
  return `tel:+${digits}`
}
