import { z } from 'zod'

/**
 * 회의실 등록 다이얼로그 폼 클라이언트 사전검증 스키마(`MEETING_ROOM_CREATE`, ROADMAP(MEETING-ROOMS) T6.2, F812).
 *
 * 필드 근거: back/build/generated-snippets/MEETING_ROOM_CREATE/request-fields.adoc(실측, 추측 금지) —
 * name(필수, 공백 불가, 50자 이하)·description(필수, 공백 불가)·capacity(필수, 양수).
 *
 * name/description의 "공백 불가"는 boardCreateSchema·meetingReservationCreateSchema와 동일하게
 * refine(trim 후 길이 검사)으로 처리하고, 원본 값은 trim하지 않은 채로 서버에 그대로 전달한다.
 *
 * capacity는 `<input type="number">` + `register(..., { valueAsNumber: true })` 조합이 빈 값을
 * `NaN`으로 방출하는 문제(adjustGrantDaysSchema와 동일 사유)를 zod v4 `error` 콜백(issue.input)으로
 * "미입력"과 "숫자 아님"을 구분해 처리한다.
 */
export const meetingRoomCreateSchema = z.object({
  name: z
    .string()
    .min(1, '회의실 이름을 입력해주세요')
    .max(50, '회의실 이름은 50자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '회의실 이름은 공백만으로 입력할 수 없습니다'),
  description: z
    .string()
    .min(1, '회의실 설명을 입력해주세요')
    .refine((value) => value.trim().length > 0, '회의실 설명은 공백만으로 입력할 수 없습니다'),
  capacity: z
    .number({
      error: (issue) => (Number.isNaN(issue.input) ? '수용 인원을 입력해주세요' : '숫자를 입력해주세요'),
    })
    .positive('수용 인원은 양수여야 합니다'),
})

export type MeetingRoomCreateFormValues = z.infer<typeof meetingRoomCreateSchema>
