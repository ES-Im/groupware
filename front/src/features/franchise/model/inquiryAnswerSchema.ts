import { z } from 'zod'

export const inquiryAnswerSchema = z.object({
  answer: z
    .string()
    .min(1, '답변 내용을 입력해주세요')
    .refine((value) => value.trim().length > 0, '답변은 공백만으로 입력할 수 없습니다'),
})

export type InquiryAnswerFormValues = z.infer<typeof inquiryAnswerSchema>
