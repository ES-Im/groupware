import { z } from 'zod'

/**
 * 부서 등록 폼 클라이언트 사전검증 스키마(`DEPT_REGISTER`, ROADMAP T8.1).
 *
 * 필드 근거: back/build/generated-snippets/DEPT_REGISTER/request-fields.adoc(실측, 추측 금지).
 * - deptCode: "3자리 숫자" → 정확히 숫자 3자리
 * - deptName: "20자 이하"
 *
 * 서버 판정(VALIDATION_ERROR/COMMON_00x 등)은 submitWithErrorMapping이 handleApiError로 위임해
 * 폼 루트 에러/토스트로 처리하므로 여기서는 클라 사전검증 수준만 다룬다(T1.1/T3.1과 동일 컨벤션).
 */
export const registerDepartmentSchema = z.object({
  deptCode: z.string().regex(/^\d{3}$/, '부서 코드는 3자리 숫자로 입력해주세요'),
  deptName: z.string().min(1, '부서명을 입력해주세요').max(20, '부서명은 20자 이하로 입력해주세요'),
})

export type RegisterDepartmentFormValues = z.infer<typeof registerDepartmentSchema>
