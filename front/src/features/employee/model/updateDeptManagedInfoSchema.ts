import { z } from 'zod'

export const updateDeptManagedInfoSchema = z.object({
  extensionNo: z
    .string()
    .refine(
      (value) => value === '' || /^\d{3}-\d{4}$/.test(value),
      '내선번호는 000-0000 형식(3자리 숫자-4자리 숫자)으로 입력해주세요',
    ),
  systemRoleCode: z.array(z.string()).min(1, '권한을 최소 1개 선택해주세요'),
})

export type UpdateDeptManagedInfoFormValues = z.infer<typeof updateDeptManagedInfoSchema>
