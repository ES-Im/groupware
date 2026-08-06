import { z } from 'zod'

export const categoryNameSchema = z.object({
  categoryName: z
    .string()
    .min(1, '카테고리명을 입력해주세요')
    .max(30, '카테고리명은 30자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '카테고리명은 공백만으로 입력할 수 없습니다'),
})

export type CategoryNameFormValues = z.infer<typeof categoryNameSchema>
