import { QueryClient } from '@tanstack/react-query'
import axios from 'axios'

/**
 * 401/403/404는 query 레벨 재시도 대상이 아니다.
 * 401(ROLE_002)은 axios 인터셉터(client.ts)가 이미 reissue→원요청 재시도를 전담하고,
 * 403/404는 재시도해도 결과가 바뀌지 않는 확정적 실패이기 때문이다.
 */
function isNonRetryableStatus(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false
  const status = error.response?.status
  return status === 401 || status === 403 || status === 404
}

/**
 * QueryClient 기본 방침(ROADMAP T0.3 / §A-3, Open Questions #1 확정치).
 * - retry: 1 — 일시적 네트워크 오류만 1회 재시도. 401/403/404는 재시도하지 않는다.
 * - staleTime: 0 — 그룹웨어 특성상 데이터가 자주 바뀌므로 캐시 신선도보다 최신값을 우선한다.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      retry: (failureCount, error) => {
        if (isNonRetryableStatus(error)) return false
        return failureCount < 1
      },
    },
  },
})
