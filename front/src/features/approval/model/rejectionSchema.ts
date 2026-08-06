import { z } from 'zod'

export const rejectionSchema = z.object({
  reason: z.string().trim().min(1, '반려 사유를 입력해주세요'),
})

export type RejectionFormValues = z.infer<typeof rejectionSchema>
