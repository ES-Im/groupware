import { z } from 'zod'

/**
 * 문의 답변 생성/수정 폼 클라이언트 사전검증 스키마(`FRANCHISE_INQUIRY_ANSWER_CREATE`/`_UPDATE`,
 * ROADMAP(FRANCHISE) T5.4, F1621·F1622).
 *
 * 필드 근거: back/build/generated-snippets/FRANCHISE_INQUIRY_ANSWER_CREATE·_UPDATE/
 * request-fields.adoc(실측, 추측 금지) — answer(필수, 공백 불가) 단일 필드. 생성/수정의 요청
 * body 계약이 완전히 동일해 스키마 하나를 공유한다(franchiseMemoSchema와 동일 "공백 불가"
 * refine 패턴).
 */
export const inquiryAnswerSchema = z.object({
  answer: z
    .string()
    .min(1, '답변 내용을 입력해주세요')
    .refine((value) => value.trim().length > 0, '답변은 공백만으로 입력할 수 없습니다'),
})

export type InquiryAnswerFormValues = z.infer<typeof inquiryAnswerSchema>
