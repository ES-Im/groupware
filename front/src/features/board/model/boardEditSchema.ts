import { z } from 'zod'

export const boardEditSchema = z.object({
  categoryId: z.string().min(1, '카테고리를 선택해주세요'),
  title: z
    .string()
    .min(1, '제목을 입력해주세요')
    .max(50, '제목은 50자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '제목은 공백만으로 입력할 수 없습니다'),
  content: z
    .string()
    .min(1, '본문을 입력해주세요')
    .refine((value) => value.trim().length > 0, '본문은 공백만으로 입력할 수 없습니다'),
})

export type BoardEditFormValues = z.infer<typeof boardEditSchema>
