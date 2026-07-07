import { z } from 'zod'

/**
 * 게시글 작성 폼 클라이언트 사전검증 스키마(`BOARD_REGISTER`, ROADMAP T12.2, F305).
 *
 * 필드 근거: back/build/generated-snippets/BOARD_REGISTER/request-fields.adoc(실측, 추측 금지) —
 * categoryId(필수)·title(필수, 50자 이하, 공백 불가)·content(필수, 공백 불가). publishedAt은
 * 이 스키마에 포함하지 않는다(제출 시각에 결정되는 값이라 폼 입력 필드가 아니다 — BoardCreatePage가
 * 임시저장/발행 버튼에 따라 registerBoard 호출 시 직접 채운다).
 *
 * categoryId는 appointDepartmentLeaderSchema.leaderEmpId(T9.2)와 동일한 이유로 문자열로 검증한다:
 * useZodForm은 `ZodType<TFieldValues, TFieldValues>`(입력=출력 동일 타입)를 요구하므로 여기서
 * number로 transform하지 않는다. 네이티브 `<select>` 값은 항상 문자열이며, 실제 number 변환은
 * 제출 핸들러(BoardCreatePage)에서 수행한다.
 *
 * title/content의 "공백 불가"는 공백만으로 채운 값을 막는 제약이다(값 자체를 trim하지 않는다 —
 * 사용자가 입력한 그대로를 서버에 전송해 클라 검증과 서버 검증 대상이 정확히 일치하게 한다).
 */
export const boardCreateSchema = z.object({
  categoryId: z.string().min(1, '카테고리를 선택해주세요'),
  title: z
    .string()
    .min(1, '제목을 입력해주세요')
    .max(50, '제목은 50자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '제목은 공백만으로 입력할 수 없습니다'),
  content: z
    .string()
    .min(1, '본문을 입력해주세요')
    .refine((value) => value.trim().length > 0, '본문은 공백만으로 입력할 수 없습니다'),
})

export type BoardCreateFormValues = z.infer<typeof boardCreateSchema>
