import { useEffect, useState } from 'react'

/**
 * 좌측 프로필 패널(ProfileRailPanel) 열림 상태(순수 로컬 UI 상태)를 localStorage에 영속화하는 훅.
 * 헤더의 사원 이름 클릭으로 데스크톱(풀스크린, !isMobile)에서만 여닫는 토글이며(2026-07-13 개편,
 * 요구사항3·4), useSidebarCollapsed와 동일한 "localStorage 영속" 패턴을 복제한다 — 새로고침 후에도
 * 마지막 선택(열림/닫힘)을 유지한다. 기본값은 닫힘(false)이라 처음 진입 시 본문(main)이 최대 폭을 쓴다.
 * 프라이빗 모드 등 storage 접근이 막힌 환경에서는 조용히 폴백해 렌더가 깨지지 않게 한다.
 *
 * 이 상태는 메뉴 사이드바 접힘(useSidebarCollapsed)·모바일 드로어(useMobileSidebarOpen)와 완전히
 * 독립적이다 — 세 토글은 서로 간섭하지 않는다.
 */
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
      // 프라이빗 모드 등 storage 접근 실패 시 무시한다.
    }
  }, [open])

  const toggle = () => setOpen((prev) => !prev)
  const close = () => setOpen(false)

  return { open, toggle, close, setOpen }
}
