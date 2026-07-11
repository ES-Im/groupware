import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { createFranchise } from './createFranchise'

/**
 * 가맹점 등록 mutation 훅(`FRANCHISE_CREATE`, ROADMAP(FRANCHISE) T2.2, F1603).
 * 성공(201) 시 갱신 대상은 가맹점 목록(F1601, T2.1)뿐이므로 franchiseKeys.all 전체가 아니라
 * `[...franchiseKeys.all, 'list']` 2단계 접두사로 invalidate한다(useMeetingRoomCreateMutation
 * 동일 컨벤션) — franchiseKeys.list()를 인자 없이 호출하면 3번째 원소가 `undefined`로 고정되어
 * keyword/page 등 실제 파라미터가 채워진 캐시 키와 partial match되지 않는다. 이메일 중복 등
 * 서버 판정 실패는 그대로 던져 호출부(T2.2 다이얼로그)가 handleApiError로 위임하도록 둔다.
 */
export function useFranchiseCreateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createFranchise,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...franchiseKeys.all, 'list'] })
    },
  })
}
