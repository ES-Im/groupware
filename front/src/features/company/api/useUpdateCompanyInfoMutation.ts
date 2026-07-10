import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import type { CompanyInfoUpdateFormValues } from '../model/companyInfoUpdateSchema'
import { companyKeys } from '../model/companyKeys'
import { updateCompanyInfo } from './updateCompanyInfo'

/**
 * 회사 기본정보 수정 mutation 훅(`COMPANY_UPDATE_INFO`, ROADMAP-COMPANY T3.1-a, F1403).
 *
 * 다이얼로그/폼(T3.2-a)이 넘기는 값은 T3.1-a 스키마(CompanyInfoUpdateFormValues)까지만이고,
 * editedAt은 mutationFn 호출 시점에 `dayjs().format('YYYY-MM-DDTHH:mm:ss')`로 합성해 동봉한다
 * (useApproveAttendanceMutation과 동일 컨벤션 — toISOString() 사용 금지, LocalDateTime 파싱 대응).
 *
 * 성공(204) 시 onSuccess에서 companyKeys.all을 invalidate해 useCompanyInfoQuery(T1.1)가
 * 최신 값으로 재조회되도록 한다. 토스트/에러 처리는 호출부(T3.2-a 편집 다이얼로그)의
 * submitWithErrorMapping이 handleApiError로 위임하도록 두고 여기서는 다루지 않는다
 * (형제 훅 useUpdateCompanyContact/HomePageURLMutation과 동일 패턴).
 */
export function useUpdateCompanyInfoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: CompanyInfoUpdateFormValues) =>
      updateCompanyInfo({ ...variables, editedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss') }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyKeys.all })
    },
  })
}
