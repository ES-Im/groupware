import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { updateFranchise, type FranchiseUpdatePayload } from './updateFranchise'

/** useFranchiseUpdateMutation 호출 변수. */
interface FranchiseUpdateVariables {
  franchiseId: number
  payload: FranchiseUpdatePayload
}

/**
 * 가맹점 기본정보 수정 mutation 훅(`FRANCHISE_UPDATE`, ROADMAP(FRANCHISE) T2.4-a, F1604).
 * 성공(204) 시 가맹점 상세(`franchiseKeys.detail`)와 목록 접두사(`[...all, 'list']`)를 함께
 * invalidate한다 — name/address/ownerName은 목록(P1)에도 노출되는 필드다. 목록은 params 없는
 * `franchiseKeys.list()` 호출이 실제 캐시 키(params 포함)와 partial match되지 않으므로
 * 접두사 배열로 무효화한다(useMeetingRoomUpdateMutation의 roomManagement 접두사와 동일 근거).
 * 실패 시 에러는 그대로 던져 호출부가 handleApiError로 위임하도록 둔다.
 */
export function useFranchiseUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ franchiseId, payload }: FranchiseUpdateVariables) => updateFranchise(franchiseId, payload),
    onSuccess: async (_data, { franchiseId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: franchiseKeys.detail(franchiseId) }),
        queryClient.invalidateQueries({ queryKey: [...franchiseKeys.all, 'list'] }),
      ])
    },
  })
}
