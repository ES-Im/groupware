import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { attendanceKeys } from '../model/queryKeys'
import { approveAttendance } from './approveAttendance'

interface ApproveAttendanceVariables {
  attendanceId: number
  targetEmpId: number
}

/**
 * 부서 근태 승인 mutation 훅(`DEPT_ATTENDANCE_APPROVE`, ROADMAP T4.4, F308).
 *
 * 다이얼로그/폼을 경유하지 않는 단발 버튼 클릭 액션이다 — attendanceId·targetEmpId는
 * 승인대기 표(T3.4-b, DeptPendingRow) 행 데이터를 그대로 꺼내 쓰고, approvedAt은
 * mutationFn 호출 시점에 `dayjs().format('YYYY-MM-DDTHH:mm:ss')`로 합성한다(폼 입력값이 아님).
 *
 * WHY format()이고 toISOString()이 아닌가(contract-conformance-reviewer 지적, T4.4): 백엔드
 * 컨트롤러는 approvedAt을 `@DateTimeFormat(iso = ISO.DATE_TIME) LocalDateTime`으로 파싱한다
 * (스니펫 예시 `2026-04-30T09:00:00`, 오프셋 없는 로컬 wall-clock). `dayjs().toISOString()`은
 * UTC 기준 `...Z` 문자열을 만드는데, `LocalDateTime.parse()`는 오프셋/`Z`를 무시하고 날짜·시간
 * 필드를 그대로 떼어 쓰므로 실제 클릭 시각(KST)보다 9시간 이전 값이 서버에 기록된다 —
 * `format('YYYY-MM-DDTHH:mm:ss')`로 로컬 wall-clock 문자열을 직접 합성해야 한다.
 *
 * 성공(204) 시 T4.2(useUpdateAttendanceMutation)와 동일하게 부서 근태 두 탭(월별 T3.3
 * useDeptAttendanceMonthlyQuery·승인대기 useDeptAttendancePendingQuery)을 모두
 * invalidate한다 — 승인 처리 시 두 탭의 요약/목록 정합이 함께 갱신돼야 하므로
 * deptId·params 조합을 가리지 않고 `[...attendanceKeys.all, 'dept']` 접두로 한 번에 갱신한다.
 *
 * 실패(당일 근태 당일 승인 불가·이미 승인건 재승인 불가·상태 없는 건 승인 불가 등 서버 판정
 * 위반) 시 handleApiError로 정규화한 메시지를 에러 토스트로 노출한다.
 */
export function useApproveAttendanceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ attendanceId, targetEmpId }: ApproveAttendanceVariables) =>
      approveAttendance(attendanceId, targetEmpId, dayjs().format('YYYY-MM-DDTHH:mm:ss')),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, 'dept'] })
      toast.success('근태를 승인했습니다')
    },
    onError: (error) => {
      handleApiError(error, { toast })
    },
  })
}
