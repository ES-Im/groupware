import { z } from 'zod'

export const updateDepartmentParentSchema = z.object({
  parentDeptId: z.string(),
})

export type UpdateDepartmentParentFormValues = z.infer<typeof updateDepartmentParentSchema>
