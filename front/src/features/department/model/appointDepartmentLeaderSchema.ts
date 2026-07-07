import { z } from 'zod'

/**
 * 부서장 지정 폼 클라이언트 사전검증 스키마(`DEPT_APPOINT_LEADER`, ROADMAP T9.2).
 *
 * 필드 근거: back/build/generated-snippets/DEPT_APPOINT_LEADER/query-parameters.adoc 실측 —
 * `leaderEmpId`(부서장으로 지정할 사원 식별 번호, 필수)·`appointedAt`(지정 시작일, `yyyy-MM-dd`, 필수).
 *
 * useZodForm은 `ZodType<TFieldValues, TFieldValues>`(입력=출력 동일 타입)를 요구하므로 여기서는
 * transform으로 숫자 변환을 하지 않는다(RHF 네이티브 select/input 값은 항상 문자열). leaderEmpId는
 * 문자열 그대로 검증하고, 실제 number 변환은 제출 핸들러(다이얼로그 컴포넌트)에서 수행한다.
 * appointedAt은 `<input type="date">`가 항상 `yyyy-MM-dd` 문자열을 내보내므로 정규식으로만 형식을 확인한다.
 */
export const appointDepartmentLeaderSchema = z.object({
  leaderEmpId: z.string().min(1, '부서장으로 지정할 사원을 선택해주세요'),
  appointedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '지정일을 선택해주세요'),
})

export type AppointDepartmentLeaderFormValues = z.infer<typeof appointDepartmentLeaderSchema>
