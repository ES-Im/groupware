import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup, configure } from '@testing-library/react'
import { server } from './mocks/server'

/**
 * 전역 테스트 setup (vite.config.ts test.setupFiles에서 로드).
 *
 * - @testing-library/jest-dom/vitest: toBeInTheDocument 등 DOM 단언 확장.
 * - MSW 서버 lifecycle:
 *   - onUnhandledRequest: 'error' → 목이 없는 요청은 실패시켜, 계약에 없는 호출을 조기에 드러낸다.
 *   - afterEach resetHandlers → 테스트 간 핸들러 오버라이드(server.use)가 새지 않게 격리.
 * - RTL cleanup → 테스트 간 렌더된 DOM 정리.
 * - asyncUtilTimeout: 기본 1000ms는 전체 스위트(200+ 테스트)를 병렬로 돌릴 때 부하로 인해
 *   findBy 계열/waitFor가 실제로는 곧 해소될 상태인데도 타임아웃으로 flaky하게 실패하는 원인이 됐다.
 */
configure({ asyncUtilTimeout: 5000 })

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
