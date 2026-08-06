import { z } from 'zod'

export const cancellationDraftSchema = z.object({
  title: z.string().trim().min(1, '제목을 입력해주세요'),
  content: z.string().trim().min(1, '본문을 입력해주세요'),
})

export type CancellationDraftFormValues = z.infer<typeof cancellationDraftSchema>
