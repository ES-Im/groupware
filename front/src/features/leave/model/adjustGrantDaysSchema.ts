import { z } from 'zod'

export const adjustGrantDaysSchema = z.object({
  plusMinusDays: z
    .number({
      error: (issue) => (Number.isNaN(issue.input) ? '증감 일수를 입력해주세요' : '숫자를 입력해주세요'),
    })
    .refine((value) => value !== 0, '0이 아닌 값을 입력해주세요(음수는 차감)')
    .refine((value) => Number.isInteger(value * 2), '0.5일 단위로 입력해주세요'),
})

export type AdjustGrantDaysFormValues = z.infer<typeof adjustGrantDaysSchema>
