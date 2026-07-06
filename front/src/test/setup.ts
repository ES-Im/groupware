import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

/**
 * 전역 테스트 setup (vite.config.ts test.setupFiles에서 로드).
 *
 * - @testing-library/jest-dom/vitest: toBeInTheDocument 등 DOM 단언 확장.
 * - MSW 서버 lifecycle:
 *   - onUnhandledRequest: 'error' → 목이 없는 요청은 실패시켜, 계약에 없는 호출을 조기에 드러낸다.
 *   - afterEach resetHandlers → 테스트 간 핸들러 오버라이드(server.use)가 새지 않게 격리.
 * - RTL cleanup → 테스트 간 렌더된 DOM 정리.
 */
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
