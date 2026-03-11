import { API_BASE } from './client'

export type PhoneRule = {
  countryCode: string
  name: string
  dialCode: string
  minLength: number
  maxLength: number
  pattern: string
  example: string
  nationalDisplaySegments?: number[]
  order: number
}

type ApiSuccess<T> = { statusCode: number; data: T; timestamp: string }

/** Правила телефонов по странам (эндпоинт публичный, без авторизации) */
export async function getPhoneRules(): Promise<PhoneRule[]> {
  const res = await fetch(`${API_BASE}/phone-rules`)
  if (!res.ok) throw new Error('Не удалось загрузить правила телефонов')
  const body = (await res.json()) as ApiSuccess<PhoneRule[]>
  return body.data ?? body
}

/** Нормализация на бэкенде (опционально): вернёт normalized, countryCode, valid */
export async function normalizePhoneOnServer(phone: string): Promise<{
  normalized: string
  countryCode: string
  dialCode: string
  valid: boolean
}> {
  const res = await fetch(`${API_BASE}/phone-rules/normalize?phone=${encodeURIComponent(phone)}`)
  if (!res.ok) throw new Error('Ошибка нормализации телефона')
  const body = (await res.json()) as ApiSuccess<{ normalized: string; countryCode: string; dialCode: string; valid: boolean }>
  return body.data ?? body
}
