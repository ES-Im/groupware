import { useMutation, useQueryClient } from '@tanstack/react-query'
import { companyKeys } from '../model/companyKeys'
import { updateCompanyContact } from './updateCompanyContact'

/**
 * 회사 대표 연락처 수정 mutation 훅(`COMPANY_UPDATE_CONTACT`, ROADMAP(COMPANY).md T3.1-b, F1404).
 *
 * 성공(204) 시 onSuccess에서 companyKeys.all을 invalidate해 useCompanyInfoQuery(T1.1)가
 * 최신 값으로 재조회되도록 한다. 토스트/에러 처리는 호출부(T3.2-b 편집 다이얼로그)의
 * submitWithErrorMapping이 handleApiError로 위임하도록 두고 여기서는 다루지 않는다
 * (useUpdateMeMutation·useUpdateDepartmentNameMutation과 동일 패턴).
 */
export function useUpdateCompanyContactMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCompanyContact,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyKeys.all })
    },
  })
}
