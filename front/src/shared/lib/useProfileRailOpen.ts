import { useEffect, useState } from 'react'

const STORAGE_KEY = 'haruon-groupware:profile-rail-open'

export function useProfileRailOpen() {
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(open))
    } catch {
    }
  }, [open])

  const toggle = () => setOpen((prev) => !prev)
  const close = () => setOpen(false)

  return { open, toggle, close, setOpen }
}
