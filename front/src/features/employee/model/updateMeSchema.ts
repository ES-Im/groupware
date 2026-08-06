import { z } from 'zod'

export const updateMeSchema = z.object({
  extensionNo: z
    .string()
    .regex(/^\d{3}-\d{4}$/, '내선번호는 000-0000 형식(3자리 숫자-4자리 숫자)으로 입력해주세요'),
  newRawPassword: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다')
    .regex(/[A-Za-z]/, '비밀번호는 영문을 포함해야 합니다')
    .regex(/[0-9]/, '비밀번호는 숫자를 포함해야 합니다')
    .regex(/[^A-Za-z0-9]/, '비밀번호는 특수문자를 포함해야 합니다'),
})

export type UpdateMeFormValues = z.infer<typeof updateMeSchema>
