import { z } from 'zod'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

export const updateHrManagedInfoSchema = z.object({
  empName: z.string().min(1, '이름을 입력해주세요').max(20, '이름은 20자 이하로 입력해주세요'),
  password: z
    .string()
    .refine((value) => value === '' || value.length >= 8, '비밀번호는 8자 이상이어야 합니다')
    .refine((value) => value === '' || /[A-Za-z]/.test(value), '비밀번호는 영문을 포함해야 합니다')
    .refine((value) => value === '' || /[0-9]/.test(value), '비밀번호는 숫자를 포함해야 합니다')
    .refine((value) => value === '' || /[^A-Za-z0-9]/.test(value), '비밀번호는 특수문자를 포함해야 합니다'),
  extensionNo: z
    .string()
    .refine(
      (value) => value === '' || /^\d{3}-\d{4}$/.test(value),
      '내선번호는 000-0000 형식(3자리 숫자-4자리 숫자)으로 입력해주세요',
    ),
  systemRoleCode: z.array(z.string()).min(1, '권한을 최소 1개 선택해주세요'),
  hireAt: z
    .string()
    .refine((value) => dayjs(value, 'YYYY-MM-DD', true).isValid(), '입사일자를 올바르게 입력해주세요'),
})

export type UpdateHrManagedInfoFormValues = z.infer<typeof updateHrManagedInfoSchema>
