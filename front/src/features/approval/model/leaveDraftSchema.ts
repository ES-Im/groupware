import { z } from 'zod'

/**
 * 휴가 유형 enum 6종(F740 `LEAVE_DRAFT_CREATE` request-fields.adoc 실측: "예: ANNUAL, HOURLY, SICK,
 * OFFICIAL, COMPENSATORY, SPECIAL"). 표시 라벨은 백엔드 `LeaveType.java`의 `@Getter description`
 * 값을 그대로 소스 대조로 확정한다(추측 아님) — 작성 요청 body·`DRAFT_DETAIL`의 `leave.leaveType`
 * (①) 둘 다 이 enum 코드로 내려오므로 라벨 매핑을 작성 Select와 상세 본문(`LeaveDraftBody`, M2)이
 * 공용한다. `HOURLY`의 "공휴일" 라벨은 도메인모델의 "연가는 1시간 단위로 사용" 규칙과 겹쳐 보여
 * PRD Open Q#3로 남아 있으나, 백엔드가 직접 선언한 값이라 임시 라벨이 아닌 실측값으로 채택한다.
 */
const LEAVE_TYPES = ['ANNUAL', 'HOURLY', 'SICK', 'OFFICIAL', 'COMPENSATORY', 'SPECIAL'] as const

export type LeaveType = (typeof LEAVE_TYPES)[number]

export const leaveTypeLabels: Record<LeaveType, string> = {
  ANNUAL: '연차',
  HOURLY: '공휴일',
  SICK: '병가',
  OFFICIAL: '공가',
  COMPENSATORY: '대체휴무',
  SPECIAL: '특별휴가',
}

/** 작성 폼 Select 옵션 목록(enum 선언 순서 유지). */
export const leaveTypeOptions = LEAVE_TYPES.map((value) => ({
  value,
  label: leaveTypeLabels[value],
}))

/**
 * 휴가 기안 작성 폼 클라이언트 사전검증 스키마(F740 `LEAVE_DRAFT_CREATE(_SUBMISSION)`,
 * ROADMAP(LEAVE) T1.1).
 *
 * 필드 근거: back/build/generated-snippets/LEAVE_DRAFT_CREATE/request-fields.adoc(실측):
 *   - param.title / param.content: 필수(String)
 *   - startAt / endAt: 필수(String, `yyyy-MM-dd'T'HH:mm:ss`) — 폼 입력은 `datetime-local`(분 단위)이라
 *     이 스키마는 분 단위 문자열을 그대로 다루고, 초 보정은 제출 핸들러(페이지)가 dayjs로 수행한다.
 *   - leaveType: 필수(String enum 6종)
 *
 * `businessTripDraftSchema`(③)를 동형 확장한다 — title/content 검증은 그대로 이어받고, 휴가 전용
 * 필드(leaveType/startAt/endAt)를 추가한 뒤 object-level refine으로 `endAt >= startAt`(출장의
 * 엄격한 `<`와 달리 시작·종료가 같은 시각도 허용 — 로드맵 §Done 조건 "endAt≥startAt refine")을
 * 검증한다. 결재선(`param.approvers`)은 이 스키마가 아니라 EmployeePicker(①) 로컬 선택 상태로
 * 관리한다(②③와 동일한 경계).
 *
 * 서버 판정(VALIDATION_ERROR 등)은 submitWithErrorMapping이 handleApiError로 위임하므로 여기서는
 * 클라 사전검증 수준(공백 불가·유형 택1·기간 순서)만 다룬다.
 */
export const leaveDraftSchema = z
  .object({
    title: z.string().trim().min(1, '제목을 입력해주세요'),
    content: z.string().trim().min(1, '본문을 입력해주세요'),
    leaveType: z.enum(LEAVE_TYPES, { error: '휴가 유형을 선택해주세요' }),
    startAt: z.string().min(1, '휴가 시작 일시를 입력해주세요'),
    endAt: z.string().min(1, '휴가 종료 일시를 입력해주세요'),
  })
  .refine(
    (data) =>
      data.startAt === '' || data.endAt === '' || new Date(data.startAt) <= new Date(data.endAt),
    {
      message: '휴가 종료 일시는 시작 일시 이후여야 합니다',
      path: ['endAt'],
    },
  )

export type LeaveDraftFormValues = z.infer<typeof leaveDraftSchema>
