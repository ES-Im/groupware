import { z } from 'zod'

export const manualScheduleCreateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, '제목을 입력해주세요')
      .max(100, '제목은 100자 이하로 입력해주세요'),
    content: z.string().trim().min(1, '내용을 입력해주세요'),
    startAt: z.string().min(1, '시작 일시를 입력해주세요'),
    endAt: z.string().min(1, '종료 일시를 입력해주세요'),
  })
  .refine(
    (data) =>
      data.startAt === '' || data.endAt === '' || new Date(data.startAt) < new Date(data.endAt),
    {
      message: '종료 일시는 시작 일시 이후여야 합니다',
      path: ['endAt'],
    },
  )

export type ManualScheduleCreateFormValues = z.infer<typeof manualScheduleCreateSchema>
