import { useEffect, useState } from 'react'

/**
 * 다크모드 활성 여부(순수 로컬 UI 상태)를 localStorage에 영속화하는 훅.
 * `<html>`에 `.dark` 클래스를 토글한다(index.css의 `@custom-variant dark (&:is(.dark *))`가
 * 이 클래스를 기준으로 다크 토큰을 적용한다). 새로고침 후에도 마지막 선택을 유지한다.
 * 프라이빗 모드 등 storage 접근이 막힌 환경에서는 조용히 폴백해 렌더가 깨지지 않게 한다.
 */
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
      // 프라이빗 모드 등 storage 접근 실패 시 무시한다.
    }
  }, [isDark])

  const toggle = () => setIsDark((prev) => !prev)

  return { isDark, toggle }
}
