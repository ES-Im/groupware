import dayjs from 'dayjs'
import { z } from 'zod'

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
      .regex(/^\d{2}:\d{2}$/, '시작 시각 형식이 올바르지 않습니다 (HH:mm)')
      .optional(),
    endAt: z
      .string()
      .regex(/^\d{2}:\d{2}$/, '종료 시각 형식이 올바르지 않습니다 (HH:mm)')
      .optional(),
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

export type ManualScheduleUpdateFormValues = z.infer<typeof manualScheduleUpdateSchema>
