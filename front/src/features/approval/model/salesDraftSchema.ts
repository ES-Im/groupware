import { z } from 'zod'

/**
 * 매출 기안 작성 폼 클라이언트 사전검증 스키마(F760 `SALES_DRAFT_CREATE(_SUBMISSION)`,
 * ROADMAP(SALES) T2.1).
 *
 * 필드 근거: back/build/generated-snippets/SALES_DRAFT_CREATE/request-fields.adoc(실측):
 *   - param.title / param.content: 필수(String)
 *   - franchiseId: 필수(Number) — `FranchisePicker`(T1.2) 선택 결과를 `setValue`로 동기화(네이티브
 *     입력이 아니므로 register 대상 아님). 기본값 0은 "미선택" 상태를 겸한다.
 *   - reportMonth: 필수(String, `yyyy-MM`) — `<input type="month">` 값이 이 형식 그대로 방출된다.
 *   - salesAmount: 필수(Number, 백엔드 `SalesDraft.validateSalesInitParam`가 `salesAmount>0` 강제) →
 *     양의 정수(`.int().positive()`). `<input type="number">`+`valueAsNumber`는 빈 값을 NaN으로
 *     방출하므로(`adjustGrantDaysSchema` 선례) zod v4 `error` 콜백으로 "미입력"과 "숫자 아님"을 구분한다.
 *
 * 결재선(`param.approvers`)은 이 스키마가 아니라 `EmployeePicker`(①) 로컬 선택 상태로 관리한다
 * (②③④ 동일 경계). 서버 판정(VALIDATION_ERROR 등)은 submitWithErrorMapping이 handleApiError로
 * 위임하므로 여기서는 클라 사전검증 수준만 다룬다.
 */
export const salesDraftSchema = z.object({
  title: z.string().trim().min(1, '제목을 입력해주세요'),
  content: z.string().trim().min(1, '본문을 입력해주세요'),
  franchiseId: z.number().int().positive('대상 가맹점을 선택해주세요'),
  reportMonth: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, '매출 보고월을 선택해주세요'),
  salesAmount: z
    .number({
      error: (issue) => (Number.isNaN(issue.input) ? '매출액을 입력해주세요' : '숫자를 입력해주세요'),
    })
    .int('매출액은 정수로 입력해주세요')
    .positive('매출액은 0보다 커야 합니다'),
})

export type SalesDraftFormValues = z.infer<typeof salesDraftSchema>
