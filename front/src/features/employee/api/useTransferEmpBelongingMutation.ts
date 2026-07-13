import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { employeeKeys } from '../model/queryKeys'
import { updateEmpBelongings } from '../registration/api/updateEmpBelongings'
import type { PositionCode } from '../registration/model/positionCode'

interface TransferEmpBelongingInput {
  empId: number
  /** 종료 대상인 현재 주요 소속의 시작일. 값을 바꾸지 않고 그대로 재전송해야 하는 값이라 별도로 받는다(아래 JSDoc 참고). */
  currentPrimaryStartAt: string
  /** 전보(신규 등록)할 소속 정보. */
  deptId: number
  position: PositionCode
  startAt: string
}

/**
 * 재직 중인 사원의 부서 전보(`HR_UPDATE_EMP_BELONGINGS` 2-call 오케스트레이션).
 *
 * 이 엔드포인트는 단일 요청으로 "전보"를 표현하지 못한다(`Emp.java` `changeBelongingsByHR` 실측):
 * `deptId != null`이면 신규 소속을 등록만 할 뿐 기존 주요 소속을 자동으로 종료하지 않고,
 * `deptId == null`이면 현재 주요 소속만 수정한다. 그래서 **①현재 소속을 종료(endAt=신규 시작일
 * 전날)한 뒤 ②신규 소속을 등록(isPrimary:true)** 하는 순서로 2번 호출한다.
 *
 * 순서가 절대적이다 — ②를 먼저 호출하면 `registerEmpBelonging`이 기존 belonging 전부의 primary를
 * 해제해버려, ①의 `findCurrentPrimaryBelonging()`이 방금 등록된 신규 소속을 "현재 주요 소속"으로
 * 잘못 찾아 종료해버린다. (2026-07-13 dev 서버 실사용 curl로 검증: empId=6/wizardtest01을
 * dept1→dept2로 전보, ①→② 순서로 호출 시 dept1={isPrimary:false,endAt:신규시작일-1일},
 * dept2={isPrimary:true,endAt:null}로 정확히 반영됨을 확인.)
 *
 * ①의 endAt 유효성 가드(`Emp.updateCurrentBelonging`의 `state(!endAt.isBefore(startAt),...)`)는
 * "현재 belonging의 실제 startAt"이 아니라 **요청에 함께 온 startAt 파라미터**를 비교한다. endAt만
 * 보내고 startAt을 생략하면 그 파라미터가 null이 되어 `endAt.isBefore(null)`에서 NPE가 난다. 그래서
 * 호출부가 현재 소속의 startAt(`currentPrimaryStartAt`)을 그대로 동봉한다(`changeStartAt`이 같은
 * 값으로 재호출되어 사실상 no-op).
 *
 * 호출부(전보 폼)는 `startAt > currentPrimaryStartAt`을 사전 검증해야 한다(신규 시작일 전날을
 * endAt으로 역산하므로, 같거나 이전이면 서버가 "종료시각은 시작시간보다 이를 수 없음" 도메인
 * 에러로 거부한다).
 */
export function useTransferEmpBelongingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      empId,
      currentPrimaryStartAt,
      deptId,
      position,
      startAt,
    }: TransferEmpBelongingInput) => {
      const endAt = dayjs(startAt).subtract(1, 'day').format('YYYY-MM-DD')

      // ① 현재 주요 소속 종료
      await updateEmpBelongings(empId, {
        deptId: null,
        position: null,
        isPrimary: null,
        startAt: currentPrimaryStartAt,
        endAt,
      })

      // ② 신규 소속 등록(주요 소속으로 전환)
      await updateEmpBelongings(empId, {
        deptId,
        position,
        isPrimary: true,
        startAt,
        endAt: null,
      })
    },
    onSuccess: async (_data, { empId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: employeeKeys.detail(empId) }),
        queryClient.invalidateQueries({ queryKey: [...employeeKeys.all, 'empsForManagement'] }),
      ])
    },
  })
}
