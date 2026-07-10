import { useMutation, useQueryClient } from '@tanstack/react-query'
import { companyKeys } from '../model/companyKeys'
import { updateCompanyHomePageURL } from './updateCompanyHomePageURL'

/**
 * 회사 홈페이지 URL 수정 mutation 훅(`COMPANY_UPDATE_HOME_PAGE_URL`, ROADMAP-COMPANY.md T3.1-c).
 * 성공(204) 시 companyKeys.all을 invalidate해 useCompanyInfoQuery(T1.1)가 변경된 홈페이지 URL로
 * 재조회되도록 한다. 실패 시 에러는 그대로 던져 호출부(T3.2-c)가 handleApiError로 위임하도록 둔다.
 */
export function useUpdateCompanyHomePageURLMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCompanyHomePageURL,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyKeys.all })
    },
  })
}
