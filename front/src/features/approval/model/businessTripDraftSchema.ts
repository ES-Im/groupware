import { z } from 'zod'

/**
 * 출장 기안 작성 폼 클라이언트 사전검증 스키마(F730 `BUSINESS_TRIP_DRAFT_CREATE(_SUBMISSION)`,
 * ROADMAP(DRAFT-BUSINESSTRIP) T1.1).
 *
 * 필드 근거: back/build/generated-snippets/BUSINESS_TRIP_DRAFT_CREATE/request-fields.adoc(실측):
 *   - param.title / param.content: 필수(String)
 *   - startAt / endAt: 필수(String, `yyyy-MM-dd'T'HH:mm:ss`) — 폼 입력은 `datetime-local`(분 단위)이라
 *     이 스키마는 분 단위 문자열을 그대로 다루고, 초 보정은 제출 핸들러(페이지)가 dayjs로 수행한다.
 *   - destination / purpose: 필수(String)
 *
 * `generalDraftSchema`(②)를 동형 확장한다 — title/content 검증은 그대로 이어받고, 출장 전용 필드
 * (destination/purpose/startAt/endAt)를 추가한 뒤 object-level refine으로 `startAt < endAt`을
 * 검증한다. 결재선(`param.approvers`)·참여자(`participantIds`)는 이 스키마가 아니라 EmployeePicker(①)
 * 로컬 선택 상태로 관리한다(generalDraftSchema와 동일한 경계).
 *
 * 서버 판정(VALIDATION_ERROR 등)은 submitWithErrorMapping이 handleApiError로 위임하므로 여기서는
 * 클라 사전검증 수준(공백 불가·기간 순서)만 다룬다.
 */
export const businessTripDraftSchema = z
  .object({
    title: z.string().trim().min(1, '제목을 입력해주세요'),
    content: z.string().trim().min(1, '본문을 입력해주세요'),
    destination: z.string().trim().min(1, '출장지를 입력해주세요'),
    purpose: z.string().trim().min(1, '출장 목적을 입력해주세요'),
    startAt: z.string().min(1, '출장 시작 일시를 입력해주세요'),
    endAt: z.string().min(1, '출장 종료 일시를 입력해주세요'),
  })
  .refine(
    (data) =>
      data.startAt === '' || data.endAt === '' || new Date(data.startAt) < new Date(data.endAt),
    {
      message: '출장 종료 일시는 시작 일시보다 이후여야 합니다',
      path: ['endAt'],
    },
  )

export type BusinessTripDraftFormValues = z.infer<typeof businessTripDraftSchema>
