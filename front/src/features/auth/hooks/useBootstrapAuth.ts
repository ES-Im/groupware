import { useEffect, useRef } from 'react'
import { queryClient } from '@/shared/api/queryClient'
import { decodeJwt } from '@/shared/lib/decodeJwt'
import { employeeKeys } from '@/features/employee/model/queryKeys'
import { getMe } from '@/features/employee/api/getMe'
import { useAuthStore } from '../store/authStore'

/**
 * 앱 부팅/새로고침 세션 복원 훅(ROADMAP T1.4).
 *
 * 1) authStore.bootstrap()으로 REISSUE_TOKEN을 1회 시도한다. 실패(주로 ROLE_002)하면
 *    스토어가 스스로 clear()해 status=unauthenticated로 확정하고, 이 훅은 더 할 일이 없다
 *    (ProtectedRoute가 로그인으로 리디렉션).
 * 2) 성공하면 useMeQuery(T1.3)와 동일한 queryKey/queryFn으로 fetchQuery해 사용자 정보를
 *    복원하고, 새 accessToken의 JWT `roles` claim을 디코드해 setUser로 status=authenticated
 *    전이한다. 여기서 React Query "훅" 대신 fetchQuery를 쓰는 이유: useMeQuery(T1.3)는 옵션
 *    없는 공용 훅으로 유지하기로 했고, 이 훅은 마운트 시 1회성 명령형 흐름이면 충분하다.
 *    같은 캐시 키를 쓰므로 이후 useMeQuery 소비처(T1.6 헤더 등)는 예열된 캐시를 재사용한다.
 * 3) me 조회가 실패하면(토큰은 받았지만 이후 호출이 깨진 경우) 세션을 신뢰할 수 없으므로
 *    clear()로 unauthenticated 확정한다.
 *
 * 이중 호출 방지: React 18 StrictMode(dev)는 effect를 마운트 시 2회 실행하지만, 이 훅은
 * 앱 루트(App.tsx)에서 딱 한 번만 마운트되는 컴포넌트에 붙는다. useRef 가드로 같은 컴포넌트
 * 인스턴스 안에서는 실제 세션 복원 로직이 정확히 1회만 실행되도록 한다(재발급 중복 호출 방지).
 * 인터셉터(client.ts)의 401 자동 재발급과는 트리거 시점이 달라 충돌하지 않는다 — 부팅
 * 시점에는 아직 다른 API 요청이 없으므로 401을 받을 대상 자체가 없다.
 */
export function useBootstrapAuth(): void {
  const hasRunRef = useRef(false)

  useEffect(() => {
    if (hasRunRef.current) return
    hasRunRef.current = true

    async function restoreSession() {
      await useAuthStore.getState().bootstrap()

      const { accessToken } = useAuthStore.getState()
      if (!accessToken) {
        // reissue 자체가 실패했다면 bootstrap()이 이미 clear()로 unauthenticated 확정을 마쳤다.
        // accessToken이 빈 문자열 등 falsy인 비정상 응답(성공했지만 토큰 없음)도 세션을
        // 신뢰할 수 없으므로 동일하게 fail-closed 처리해 status가 idle에 머물지 않게 한다.
        useAuthStore.getState().clear()
        return
      }

      try {
        const me = await queryClient.fetchQuery({
          queryKey: employeeKeys.me(),
          queryFn: getMe,
        })
        const { roles } = decodeJwt(accessToken)
        useAuthStore.getState().setUser(me, roles)
      } catch {
        useAuthStore.getState().clear()
      }
    }

    void restoreSession()
  }, [])
}
