import { z } from 'zod'

/**
 * 기안서 반려 사유 폼 클라이언트 사전검증 스키마(F706 `DRAFT_REJECT`, ROADMAP(DRAFT) T3.3).
 *
 * 필드 근거: back/build/generated-snippets/DRAFT_REJECT/request-fields.adoc(실측):
 *   - reason: 필수(String), 공백 불가.
 * trim().min(1)로 공백만 입력한 경우도 차단한다(cancellationDraftSchema와 동일 컨벤션). 서버 위반은
 * submitWithErrorMapping이 handleApiError로 위임하므로 여기서는 클라 사전검증(공백 불가)만 다룬다.
 */
export const rejectionSchema = z.object({
  reason: z.string().trim().min(1, '반려 사유를 입력해주세요'),
})

export type RejectionFormValues = z.infer<typeof rejectionSchema>
