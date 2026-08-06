import { z } from 'zod'

export const endDepartmentLeaderSchema = z.object({
  endAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '종료일을 선택해주세요'),
})

export type EndDepartmentLeaderFormValues = z.infer<typeof endDepartmentLeaderSchema>
