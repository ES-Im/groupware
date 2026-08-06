import { z } from 'zod'

export const messageDraftSchema = z.object({
  title: z.string().trim().min(1, '제목을 입력해주세요').max(50, '제목은 50자 이하로 입력해주세요'),
  content: z.string().trim().min(1, '내용을 입력해주세요'),
})

export type MessageDraftFormValues = z.infer<typeof messageDraftSchema>
