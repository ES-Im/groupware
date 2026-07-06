import { z } from 'zod'

/**
 * 내 정보 수정 폼 클라이언트 사전검증 스키마(ROADMAP T3.1).
 *
 * 필드 근거: back/build/generated-snippets/UPDATE_SELF_INFO/request-fields.adoc(실측, 추측 금지).
 * - extensionNo: "3자리 숫자 - 4자리 숫자 형식" → NNN-NNNN
 * - newRawPassword: "8자이상, 영문+숫자+특수문자 조합" → registerSchema.password와 동일 규칙
 *   (도메인모델.md §Emp 규칙1과도 일치: "영문+숫자+특수문자 포함 8자 이상")
 *
 * 서버 판정(VALIDATION_ERROR/COMMON_00x 등)은 submitWithErrorMapping이 handleApiError로 위임해
 * 폼 루트 에러/토스트로 처리하므로 여기서는 클라 사전검증 수준만 다룬다.
 */
export const updateMeSchema = z.object({
  extensionNo: z
    .string()
    .regex(/^\d{3}-\d{4}$/, '내선번호는 000-0000 형식(3자리 숫자-4자리 숫자)으로 입력해주세요'),
  newRawPassword: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다')
    .regex(/[A-Za-z]/, '비밀번호는 영문을 포함해야 합니다')
    .regex(/[0-9]/, '비밀번호는 숫자를 포함해야 합니다')
    .regex(/[^A-Za-z0-9]/, '비밀번호는 특수문자를 포함해야 합니다'),
})

export type UpdateMeFormValues = z.infer<typeof updateMeSchema>
