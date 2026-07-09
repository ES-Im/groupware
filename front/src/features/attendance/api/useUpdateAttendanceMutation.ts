import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { attendanceKeys } from '../model/queryKeys'
import { updateAttendance, type UpdateAttendanceRequest } from './updateAttendance'

interface UpdateAttendanceVariables {
  attendanceId: number
  payload: UpdateAttendanceRequest
}

/**
 * 부서 근태 수정 mutation 훅(`DEPT_ATTENDANCE_UPDATE`, ROADMAP T4.2, F307).
 *
 * attendanceId는 목록 조회(T3.3) 응답값을 그대로 path에 사용하고(재조회 신설 금지),
 * payload의 빈 startAt/endAt(`''`) 필터링은 updateAttendance() 함수가 담당한다.
 *
 * 성공(204) 시 부서 근태 두 탭(월별 T3.3 useDeptAttendanceMonthlyQuery· 승인대기
 * useDeptAttendancePendingQuery)을 모두 invalidate한다 — 이미 승인된 건을 수정하면
 * 두 탭의 요약/목록 정합이 함께 깨질 수 있어 deptId·params 조합을 가리지 않고
 * `[...attendanceKeys.all, 'dept']` 접두(prefix)로 한 번에 갱신한다(useBoardRegisterMutation의
 * `[...boardKeys.all, 'list']` 넓은 무효화와 동일 패턴 — deptId를 몰라도, 어떤 필터/페이지
 * 조합이 캐시돼 있어도 전부 매치된다).
 *
 * 실패(예: 이미 승인된 건 수정 시도) 시 handleApiError로 정규화한 메시지를 에러 토스트로 노출한다.
 */
export function useUpdateAttendanceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ attendanceId, payload }: UpdateAttendanceVariables) =>
      updateAttendance(attendanceId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, 'dept'] })
      toast.success('근태 정보를 수정했습니다')
    },
    onError: (error) => {
      handleApiError(error, { toast })
    },
  })
}
