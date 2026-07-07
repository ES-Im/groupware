import { useEffect, useState } from 'react'

/**
 * 사이드바 접힘 상태(순수 로컬 UI 상태)를 localStorage에 영속화하는 훅.
 * 새로고침 후에도 사용자가 마지막에 선택한 접힘/펼침 상태를 유지한다(신규 API/서버 상태 아님).
 * 프라이빗 모드 등 storage 접근이 막힌 환경에서는 조용히 폴백해 렌더가 깨지지 않게 한다.
 */
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
      // 프라이빗 모드 등 storage 접근 실패 시 무시한다.
    }
  }, [collapsed])

  const toggle = () => setCollapsed((prev) => !prev)
  // collapsed 상태에서 그룹 아이콘 클릭 시 사이드바를 강제로 펼치기 위한 헬퍼.
  const expand = () => setCollapsed(false)

  return { collapsed, toggle, expand }
}
