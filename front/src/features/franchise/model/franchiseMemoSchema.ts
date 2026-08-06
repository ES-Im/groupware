import { z } from 'zod'

export const franchiseMemoSchema = z.object({
  memo: z
    .string()
    .min(1, '메모를 입력해주세요')
    .refine((value) => value.trim().length > 0, '메모는 공백만으로 입력할 수 없습니다'),
})

export type FranchiseMemoFormValues = z.infer<typeof franchiseMemoSchema>
