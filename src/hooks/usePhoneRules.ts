import { useState, useEffect } from 'react'
import { getPhoneRules } from '@/api/phoneRules'
import type { PhoneRule } from '@/api/phoneRules'

let cached: PhoneRule[] | null = null

/** Загружает правила телефонов с бэкенда один раз, кэширует в памяти. */
export function usePhoneRules(): PhoneRule[] {
  const [rules, setRules] = useState<PhoneRule[]>(cached ?? [])

  useEffect(() => {
    if (cached) {
      setRules(cached)
      return
    }
    getPhoneRules()
      .then((list) => {
        cached = list
        setRules(list)
      })
      .catch(() => setRules([]))
  }, [])

  return rules
}
