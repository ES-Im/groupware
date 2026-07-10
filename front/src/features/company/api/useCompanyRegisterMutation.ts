import { useMutation, useQueryClient } from '@tanstack/react-query'
import { companyKeys } from '../model/companyKeys'
import { registerCompany } from './registerCompany'

/**
 * 회사 정보 최초 등록 mutation 훅(`COMPANY_REGISTER`, ROADMAP-COMPANY T2.1, F1402).
 * 성공(`204 Empty`) 시 `companyKeys.all`을 invalidate해 미등록(404) 상태로 캐시된 조회 쿼리를
 * 갱신하고 카드 뷰로 전환될 수 있게 한다. 실패 시 에러는 그대로 던져 호출부(T2.2)가
 * `error.code === 'COMPANY_002'`(이미 등록됨) 분기와 `handleApiError` 위임을 처리하도록 둔다.
 */
export function useCompanyRegisterMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: registerCompany,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyKeys.all })
    },
  })
}
