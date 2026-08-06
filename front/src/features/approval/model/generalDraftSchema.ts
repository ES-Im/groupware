import { z } from 'zod'

export const generalDraftSchema = z.object({
  title: z.string().trim().min(1, '제목을 입력해주세요'),
  content: z.string().trim().min(1, '기안 내용을 입력해주세요'),
})

export type GeneralDraftFormValues = z.infer<typeof generalDraftSchema>
