import { useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryKeys } from '../model/queryKeys'
import { registerCategory } from './registerCategory'

/**
 * 카테고리 등록 mutation 훅(`CATEGORY_REGISTER`, ADMIN 전용). 성공(201) 시 카테고리 관리 목록
 * (CategoryManagementPanel)과 노출 카테고리 목록(BoardListPage 좌측 필터·게시글 작성 폼 셀렉트,
 * `CATEGORY_LIST`)을 함께 갱신해야 하므로 categoryKeys.all 전체를 invalidate한다 — 두 목록이
 * 서로 다른 엔드포인트라 franchise류의 좁은 접두사 invalidate 대신 all로 묶는다.
 */
export function useCategoryRegisterMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: registerCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}
