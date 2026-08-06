import { z } from 'zod'

export const salesDraftSchema = z.object({
  title: z.string().trim().min(1, '제목을 입력해주세요'),
  content: z.string().trim().min(1, '기안 내용을 입력해주세요'),
  franchiseId: z.number().int().positive('대상 가맹점을 선택해주세요'),
  reportMonth: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, '매출 보고월을 선택해주세요'),
  salesAmount: z
    .number({
      error: (issue) => (Number.isNaN(issue.input) ? '매출액을 입력해주세요' : '숫자를 입력해주세요'),
    })
    .int('매출액은 정수로 입력해주세요')
    .positive('매출액은 0보다 커야 합니다'),
})

export type SalesDraftFormValues = z.infer<typeof salesDraftSchema>
