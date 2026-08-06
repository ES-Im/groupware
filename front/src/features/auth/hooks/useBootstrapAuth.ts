import { useEffect, useRef } from 'react'
import { queryClient } from '@/shared/api/queryClient'
import { decodeJwt } from '@/shared/lib/decodeJwt'
import { employeeKeys } from '@/features/employee/model/queryKeys'
import { getMe } from '@/features/employee/api/getMe'
import { useAuthStore } from '../store/authStore'

export function useBootstrapAuth(): void {
  const hasRunRef = useRef(false)

  useEffect(() => {
    if (hasRunRef.current) return
    hasRunRef.current = true

    async function restoreSession() {
      await useAuthStore.getState().bootstrap()

      const { accessToken } = useAuthStore.getState()
      if (!accessToken) {
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
