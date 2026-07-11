import { z } from 'zod'

/**
 * 가맹점 메모 수정 폼 클라이언트 사전검증 스키마(`FRANCHISE_MEMO_UPDATE`, ROADMAP(FRANCHISE) T2.4-d, F1607).
 *
 * 필드 근거: back/build/generated-snippets/FRANCHISE_MEMO_UPDATE/request-fields.adoc(실측, 추측 금지) —
 * memo(필수, 공백 불가) 단일 필드. "공백 불가"는 franchiseCreateSchema와 동일하게 refine(trim 후
 * 길이 검사)으로 처리하고 원본 값은 trim 없이 서버에 그대로 전달한다. 메모를 비우는 것은 이 폼이
 * 아니라 삭제(FRANCHISE_MEMO_CLEAR, AlertDialog 확인)가 담당한다.
 */
export const franchiseMemoSchema = z.object({
  memo: z
    .string()
    .min(1, '메모를 입력해주세요')
    .refine((value) => value.trim().length > 0, '메모는 공백만으로 입력할 수 없습니다'),
})

export type FranchiseMemoFormValues = z.infer<typeof franchiseMemoSchema>
