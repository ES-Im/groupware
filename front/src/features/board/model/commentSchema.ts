import { z } from 'zod'

/**
 * 댓글 등록/대댓글/수정 공용 폼 클라이언트 사전검증 스키마(`COMMENT_REGISTER`/`COMMENT_REPLY`/
 * `COMMENT_UPDATE`, ROADMAP T14.2, F314/F315/F316).
 *
 * 필드 근거: back/build/generated-snippets/{COMMENT_REGISTER,COMMENT_REPLY,COMMENT_UPDATE}/
 * request-fields.adoc 실측(추측 금지) — 3종 모두 content 단일 필드(300자 이하·공백 불가)로
 * 완전히 동일하다(T14.1 CommentPayload 주석 참조). boardCreateSchema.content와 동일한 이유로
 * "공백 불가"는 공백만으로 채운 값을 막는 제약이며 값 자체를 trim하지 않는다.
 */
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, '댓글 내용을 입력해주세요')
    .max(300, '댓글은 300자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '댓글은 공백만으로 입력할 수 없습니다'),
})

export type CommentFormValues = z.infer<typeof commentSchema>
