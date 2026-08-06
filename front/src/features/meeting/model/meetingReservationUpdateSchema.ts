import dayjs from 'dayjs'
import { z } from 'zod'

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
