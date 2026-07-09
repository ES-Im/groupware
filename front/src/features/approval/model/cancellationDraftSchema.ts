import { z } from 'zod'

/**
 * 취소 기안 작성 폼 클라이언트 사전검증 스키마(F704 `DRAFT_CANCELLATION_CREATE(_SUBMISSION)`,
 * ROADMAP(DRAFT) T4.5).
 *
 * 필드 근거: back/build/generated-snippets/DRAFT_CANCELLATION_CREATE/request-fields.adoc(실측):
 *   - title: 필수(String)
 *   - content: 필수(String)
 * approvers(결재선)는 이 폼 스키마가 아니라 EmployeePicker(T4.4) 로컬 선택 상태로 관리한다 —
 * 사원 선택 결과를 다이얼로그에서 ApproverParam[](approverId/role/order)로 매핑한다. 서버 판정
 * (VALIDATION_ERROR 등)은 submitWithErrorMapping이 handleApiError로 위임하므로 여기서는 클라
 * 사전검증 수준(공백 불가)만 다룬다(registerDepartmentSchema와 동일 컨벤션).
 */
export const cancellationDraftSchema = z.object({
  title: z.string().trim().min(1, '제목을 입력해주세요'),
  content: z.string().trim().min(1, '본문을 입력해주세요'),
})

export type CancellationDraftFormValues = z.infer<typeof cancellationDraftSchema>
