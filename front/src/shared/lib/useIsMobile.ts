import { useEffect, useState } from 'react'

/**
 * 뷰포트가 모바일 폭(Tailwind 기본 `lg` 브레이크포인트인 1024px 미만)인지 여부를 matchMedia로
 * 판별하는 훅. 프로젝트는 Tailwind 브레이크포인트를 커스텀 오버라이드하지 않아(index.css @theme
 * 확인 완료) 기본값을 그대로 기준으로 삼는다 — Sidebar.tsx가 이미 `lg:w-64`로 동일 브레이크포인트를
 * 쓰고 있어 정합적이다.
 * // todo: 실제 모바일 드로어 UX 검토 후 브레이크포인트 값이 달라야 한다고 판단되면 논의 후 조정.
 *
 * jsdom(Vitest 테스트 환경)은 matchMedia를 구현하지 않아 그대로 호출하면 TypeError가 난다.
 * 기존 훅들의 "환경 미지원 시 조용히 폴백" 관례(useSidebarCollapsed/useDarkMode의 storage
 * try/catch)를 따라, matchMedia 자체가 없는 환경에서도 렌더가 깨지지 않도록 방어한다.
 */
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
