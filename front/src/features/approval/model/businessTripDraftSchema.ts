import { z } from 'zod'

export const businessTripDraftSchema = z
  .object({
    title: z.string().trim().min(1, '제목을 입력해주세요'),
    content: z.string().trim().min(1, '기안 내용을 입력해주세요'),
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
