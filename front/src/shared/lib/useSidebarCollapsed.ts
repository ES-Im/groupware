import { useEffect, useState } from 'react'

const STORAGE_KEY = 'haruon-groupware:sidebar-collapsed'

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(collapsed))
    } catch {
    }
  }, [collapsed])

  const toggle = () => setCollapsed((prev) => !prev)
  const expand = () => setCollapsed(false)

  return { collapsed, toggle, expand }
}
