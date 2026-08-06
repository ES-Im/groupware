import { z } from 'zod'

export const appointDepartmentLeaderSchema = z.object({
  leaderEmpId: z.string().min(1, '부서장으로 지정할 사원을 선택해주세요'),
  appointedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '지정일을 선택해주세요'),
})

export type AppointDepartmentLeaderFormValues = z.infer<typeof appointDepartmentLeaderSchema>
