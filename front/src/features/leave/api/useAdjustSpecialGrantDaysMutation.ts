import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { leaveKeys } from '../model/leaveKeys'
import { adjustSpecialGrantDays } from './adjustSpecialGrantDays'

interface AdjustSpecialGrantDaysVariables {
  empId: number
  plusMinusDays: number
}

/**
 * 특별 휴가 부여일수 조정 mutation 훅(`EMP_LEAVE_ADJUST_SPECIAL_GRANT_DAYS`, ROADMAP(LEAVE) M5
 * T5.2, F749).
 *
 * 성공(204) 시 관리자 휴가 현황 요약(F747, T5.1 useEmpLeaveSummaryQuery)·사용률(F748,
 * useEmpLeaveUsageSummaryQuery)을 모두 invalidate한다 — 조정 대상 empId·현재 필터/페이지
 * 조합을 가리지 않고 `[...leaveKeys.all, 'emp']` 접두(prefix)로 한 번에 갱신한다
 * (attendance useApproveAttendanceMutation의 `[...attendanceKeys.all, 'dept']` 동일 패턴).
 *
 * 실패(잔여 일수 규칙 위반 등 서버 판정) 시 handleApiError로 정규화한 메시지를 에러 토스트로 노출한다.
 */
export function useAdjustSpecialGrantDaysMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ empId, plusMinusDays }: AdjustSpecialGrantDaysVariables) =>
      adjustSpecialGrantDays(empId, plusMinusDays),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...leaveKeys.all, 'emp'] })
      toast.success('특별 휴가 부여일수를 조정했습니다')
    },
    onError: (error) => {
      handleApiError(error, { toast })
    },
  })
}
