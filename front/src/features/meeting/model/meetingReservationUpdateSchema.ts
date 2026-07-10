import dayjs from 'dayjs'
import { z } from 'zod'

/**
 * 회의 예약 수정 폼 클라이언트 사전검증 스키마(`MEETING_RESERVATION_UPDATE`, ROADMAP(MEETING-ROOMS) T4.3-b, F804).
 *
 * request-fields.adoc 실측 기준 전 필드 optional(변경 필드만 전송, MeetingReservationUpdatePayload와
 * 동형). 다이얼로그가 항상 현재 값으로 프리필하므로 실질적으로는 모든 필드가 문자열/숫자로 채워진
 * 채 제출되지만, 사용자가 값을 지워 빈 문자열로 만드는 경우까지 막기 위해 optional() 내부에도
 * min(1) 등 형식 검증을 그대로 둔다(`.optional()`은 undefined만 검증을 건너뛰고, 빈 문자열은
 * 그대로 하위 검증을 통과해야 한다).
 *
 * meetingRoomId는 회의실 변경 검색(T3.1 재사용) 선택 결과로 setValue되는 값이다 — register 없이
 * 채워진다는 점에서 meetingReservationCreateSchema의 meetingDate/startAt/endAt(선택 시 동기화)과
 * 동일 경계다.
 */
export const meetingReservationUpdateSchema = z
  .object({
    title: z
      .string()
      .min(1, '회의 제목을 입력해주세요')
      .max(100, '회의 제목은 100자 이하로 입력해주세요')
      .refine((value) => value.trim().length > 0, '회의 제목은 공백만으로 입력할 수 없습니다')
      .optional(),
    meetingDate: z.string().min(1, '회의 날짜를 선택해주세요').optional(),
    startAt: z.string().min(1, '시작 시각을 입력해주세요').optional(),
    endAt: z.string().min(1, '종료 시각을 입력해주세요').optional(),
    meetingRoomId: z.number().optional(),
  })
  // startAt/endAt은 HH:mm 문자열이라 동일 기준일에 결합해 비교한다(meetingReservationCreateSchema와 동일 패턴).
  .refine(
    (data) => {
      if (!data.startAt || !data.endAt) return true
      const referenceDate = '2000-01-01'
      return dayjs(`${referenceDate}T${data.endAt}`).isAfter(dayjs(`${referenceDate}T${data.startAt}`))
    },
    {
      message: '종료 시각은 시작 시각보다 이후여야 합니다',
      path: ['endAt'],
    },
  )

export type MeetingReservationUpdateFormValues = z.infer<typeof meetingReservationUpdateSchema>
