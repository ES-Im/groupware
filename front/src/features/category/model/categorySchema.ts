import { z } from 'zod'

/**
 * 카테고리명 클라이언트 사전검증 스키마(`CATEGORY_REGISTER`/`CATEGORY_UPDATE_NAME` 공용,
 * 카테고리 관리 기능, ADMIN 전용, api-endpoint.md 150~155행).
 *
 * 필드 근거: back/build/generated-snippets/{CATEGORY_REGISTER,CATEGORY_UPDATE_NAME}/
 * request-fields.adoc 실측(추측 금지) — 두 엔드포인트 모두 categoryName 단일 필드(30자 이하·
 * 공백 불가)로 완전히 동일하다. franchiseCreateSchema와 동일하게 "공백 불가"는
 * refine(trim 후 길이 검사)으로 처리하고 원본 값은 trim 없이 서버에 그대로 전달한다.
 */
export const categoryNameSchema = z.object({
  categoryName: z
    .string()
    .min(1, '카테고리명을 입력해주세요')
    .max(30, '카테고리명은 30자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '카테고리명은 공백만으로 입력할 수 없습니다'),
})

export type CategoryNameFormValues = z.infer<typeof categoryNameSchema>
