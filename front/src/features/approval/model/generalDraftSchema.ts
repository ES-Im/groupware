import { z } from 'zod'

/**
 * 일반 기안 작성/수정 폼 클라이언트 사전검증 스키마(F720 `GENERAL_DRAFT_CREATE(_SUBMISSION)`·
 * F721 `GENERAL_DRAFT_UPDATE`, ROADMAP(DRAFT-COMMON) T1.1).
 *
 * 필드 근거: back/build/generated-snippets/GENERAL_DRAFT_CREATE/request-fields.adoc(실측):
 *   - title: 필수(String)
 *   - content: 필수(String)
 * approvers(결재선)는 이 폼 스키마가 아니라 EmployeePicker(①) 로컬 선택 상태로 관리한다 —
 * 사원 선택 결과를 페이지에서 ApproverParam[](approverId/role/order)로 매핑한다(cancellationDraftSchema
 * 동형). 서버 판정(VALIDATION_ERROR 등)은 submitWithErrorMapping이 handleApiError로 위임하므로
 * 여기서는 클라 사전검증 수준(공백 불가)만 다룬다.
 *
 * 수정(F721)도 title/content가 필수 입력이라는 UX는 동일하므로(부분 전송은 계약상 허용이나 폼은
 * 빈 제목/본문을 막는다) 작성/수정 페이지가 이 스키마를 공유한다.
 */
export const generalDraftSchema = z.object({
  title: z.string().trim().min(1, '제목을 입력해주세요'),
  content: z.string().trim().min(1, '기안 내용을 입력해주세요'),
})

export type GeneralDraftFormValues = z.infer<typeof generalDraftSchema>
