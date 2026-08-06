import { useEffect, useState } from 'react'

const MOBILE_QUERY = '(max-width: 1023px)'

function getIsMobile(): boolean {
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia(MOBILE_QUERY).matches
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(getIsMobile)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return

    const mediaQueryList = window.matchMedia(MOBILE_QUERY)
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches)

    mediaQueryList.addEventListener('change', handleChange)
    return () => mediaQueryList.removeEventListener('change', handleChange)
  }, [])

  return isMobile
}
