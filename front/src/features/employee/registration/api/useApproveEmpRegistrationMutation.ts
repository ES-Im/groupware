import { useMutation } from '@tanstack/react-query'
import { approveEmpRegistration } from './approveEmpRegistration'

/**
 * HR/ADMIN의 신규 사원 가입 승인 mutation 훅(`HR_APPROVE_EMP_REGISTRATION`).
 * 승인만으로는 목록(가입대기자)에서 대상이 사라지지 않으므로 이 훅은 캐시를 invalidate하지 않는다 —
 * 성공/실패 결과 분기(2단계 전진, 에러 토스트+목록 갱신)는 호출부(마법사 다이얼로그)의 책임이다.
 */
export function useApproveEmpRegistrationMutation() {
  return useMutation({
    mutationFn: ({ empId, hiredAt }: { empId: number; hiredAt: string }) =>
      approveEmpRegistration(empId, hiredAt),
  })
}
