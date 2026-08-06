import { z } from 'zod'

export const updateDepartmentNameSchema = z.object({
  newName: z.string().min(1, '부서명을 입력해주세요').max(20, '부서명은 20자 이하로 입력해주세요'),
})

export type UpdateDepartmentNameFormValues = z.infer<typeof updateDepartmentNameSchema>
