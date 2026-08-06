import { z } from 'zod'

export const registerSchema = z.object({
  empNo: z.string().regex(/^\d{9}$/, '사원번호는 숫자 9자리(입사연월 6자리 + 일련번호 3자리)로 입력해주세요'),
  name: z.string().min(1, '이름을 입력해주세요').max(20, '이름은 20자 이하로 입력해주세요'),
  loginId: z
    .string()
    .regex(/^[A-Za-z0-9]{8,20}$/, '아이디는 영문/숫자로 8자~20자 이내로 입력해주세요'),
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다')
    .regex(/[A-Za-z]/, '비밀번호는 영문을 포함해야 합니다')
    .regex(/[0-9]/, '비밀번호는 숫자를 포함해야 합니다')
    .regex(/[^A-Za-z0-9]/, '비밀번호는 특수문자를 포함해야 합니다'),
})

export type RegisterFormValues = z.infer<typeof registerSchema>
