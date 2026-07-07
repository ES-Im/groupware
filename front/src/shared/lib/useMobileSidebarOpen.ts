import { useState } from 'react'

/**
 * 모바일 사이드바 드로어(오버레이) 열림 상태를 관리하는 훅.
 * useSidebarCollapsed(데스크톱 접힘/펼침)는 사용자의 마지막 선택을 유지해야 해서 localStorage에
 * 영속화하지만, 이 상태는 그렇지 않다 — 모바일 드로어는 열려 있어도 새로고침하거나 다시 진입하면
 * 닫힌 채로 시작하는 것이 자연스러운 오버레이 UX이므로 순수 휘발성 상태로 둔다(영속화 없음).
 */
export function useMobileSidebarOpen() {
  const [open, setOpen] = useState(false)

  const toggle = () => setOpen((prev) => !prev)
  const close = () => setOpen(false)

  return { open, setOpen, toggle, close }
}
