import dayjs from 'dayjs'
import { z } from 'zod'

/**
 * 수기 일정 수정 폼 클라이언트 사전검증 스키마(`MANUAL_SCHEDULE_UPDATE`, ROADMAP(SCHEDULE) T4.2, F004).
 *
 * request-fields.adoc 실측 기준 전 필드 optional(변경 필드만 전송). startAt/endAt은 CREATE(T3.2,
 * manualScheduleCreateSchema)의 full datetime(`yyyy-MM-dd'T'HH:mm:ss`)과 달리 시각만(`HH:mm:ss`)
 * 전송하므로 별도 타입으로 둔다 — CREATE와 공통 base로 묶지 않는다(필드명은 같지만 optional 여부·
 * 포맷이 근본적으로 다름).
 *
 * meetingReservationUpdateSchema와 동일 경계로, optional()은 undefined(필드 미전송)만 검증을
 * 건너뛰고 빈 문자열은 그대로 하위 검증(min/regex)을 통과해야 한다.
 */
export const manualScheduleUpdateSchema = z
  .object({
    title: z
      .string()
      .min(1, '일정 제목을 입력해주세요')
      .max(100, '일정 제목은 100자 이하로 입력해주세요')
      .refine((value) => value.trim().length > 0, '일정 제목은 공백만으로 입력할 수 없습니다')
      .optional(),
    content: z
      .string()
      .min(1, '일정 내용을 입력해주세요')
      .refine((value) => value.trim().length > 0, '일정 내용은 공백만으로 입력할 수 없습니다')
      .optional(),
    startAt: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/, '시작 시각 형식이 올바르지 않습니다 (HH:mm:ss)')
      .optional(),
    endAt: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/, '종료 시각 형식이 올바르지 않습니다 (HH:mm:ss)')
      .optional(),
  })
  // startAt/endAt은 날짜 없이 HH:mm:ss 시각만이라 동일 기준일에 결합해 비교한다
  // (meetingReservationUpdateSchema와 동일 패턴, CREATE의 full datetime 비교 로직은 재사용 불가).
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

export type ManualScheduleUpdateFormValues = z.infer<typeof manualScheduleUpdateSchema>
