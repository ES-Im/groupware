import { useEffect, useState } from 'react'

const STORAGE_KEY = 'haruon-groupware:dark-mode'

export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    try {
      window.localStorage.setItem(STORAGE_KEY, String(isDark))
    } catch {
    }
  }, [isDark])

  const toggle = () => setIsDark((prev) => !prev)

  return { isDark, toggle }
}
