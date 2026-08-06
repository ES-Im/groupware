import { z } from 'zod'

export const registerDepartmentSchema = z.object({
  deptCode: z.string().regex(/^\d{3}$/, '부서 코드는 3자리 숫자로 입력해주세요'),
  deptName: z.string().min(1, '부서명을 입력해주세요').max(20, '부서명은 20자 이하로 입력해주세요'),
})

export type RegisterDepartmentFormValues = z.infer<typeof registerDepartmentSchema>
