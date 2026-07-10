import dayjs from 'dayjs'
import { z } from 'zod'

/**
 * 회의 예약 생성 폼 클라이언트 사전검증 스키마(`MEETING_RESERVATION_CREATE`, ROADMAP(MEETING-ROOMS) T3.2, F803).
 *
 * 필드 근거: back/build/generated-snippets/MEETING_RESERVATION_CREATE/request-fields.adoc(실측,
 * 추측 금지) — title(필수, 공백 불가, 100자 이하)·meetingDate(필수, 현재 이후 날짜, yyyy-MM-dd)·
 * startAt/endAt(필수, HH:mm — 필드 스펙 기준 전송 포맷 확정, PRD §계약 실측 메모 Open Q#5)·
 * participantIds(필수, 빈 배열 불가).
 *
 * meetingRoomId·reserverId는 이 스키마에 포함하지 않는다 — meetingRoomId는 회의실 카드 선택으로,
 * reserverId는 상위(T3.3-b)에서 useMeQuery().data?.empBasicInfo.empId로 각각 주입되는 값이라
 * 타이핑/피킹 검증 대상인 폼 필드가 아니다(boardCreateSchema가 publishedAt을 제외하는 것과 동일 경계).
 *
 * title의 "공백 불가"는 boardCreateSchema와 동일하게 refine(trim 후 길이 검사)으로 처리하고,
 * 원본 값은 trim하지 않은 채로 서버에 그대로 전달한다.
 */
export const meetingReservationCreateSchema = z
  .object({
    title: z
      .string()
      .min(1, '회의 제목을 입력해주세요')
      .max(100, '회의 제목은 100자 이하로 입력해주세요')
      .refine((value) => value.trim().length > 0, '회의 제목은 공백만으로 입력할 수 없습니다'),
    meetingDate: z.string().min(1, '회의 날짜를 선택해주세요'),
    startAt: z.string().min(1, '시작 시각을 입력해주세요'),
    endAt: z.string().min(1, '종료 시각을 입력해주세요'),
    participantIds: z.array(z.number()).min(1, '참여자를 최소 1명 선택해주세요'),
  })
  // 백엔드 MeetingReserveRequest는 LocalDateTime.of(meetingDate, startAt).isBefore(now)로 판정한다
  // — meetingDate 단독(day 단위)이 아니라 meetingDate+startAt 조합을 now와 비교해야, startAt이
  // 현재 이후인 당일 예약(정상 케이스)을 클라에서 잘못 거부하지 않는다.
  .refine(
    (data) => {
      if (data.meetingDate === '' || data.startAt === '') return true
      return !dayjs(`${data.meetingDate}T${data.startAt}`).isBefore(dayjs())
    },
    {
      message: '회의 시작 시각은 현재 이후여야 합니다',
      path: ['startAt'],
    },
  )
  .refine(
    (data) => {
      if (data.startAt === '' || data.endAt === '') return true
      const referenceDate = '2000-01-01'
      return dayjs(`${referenceDate}T${data.endAt}`).isAfter(dayjs(`${referenceDate}T${data.startAt}`))
    },
    {
      message: '종료 시각은 시작 시각보다 이후여야 합니다',
      path: ['endAt'],
    },
  )

export type MeetingReservationCreateFormValues = z.infer<typeof meetingReservationCreateSchema>
