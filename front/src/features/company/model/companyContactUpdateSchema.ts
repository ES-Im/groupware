import { z } from 'zod'

const isEmailValid = (value: string) => z.email().safeParse(value).success

export const companyContactUpdateSchema = z
  .object({
    presentedEmail: z
      .string()
      .max(150, '이메일은 150자 이하로 입력해주세요')
      .refine((value) => value === '' || isEmailValid(value), '올바른 이메일 형식이 아닙니다')
      .optional(),
    presentedExternalNo: z
      .string()
      .max(20, '연락처는 20자 이하로 입력해주세요')
      .refine(
        (value) => value === '' || value.trim().length > 0,
        '연락처는 공백만으로 입력할 수 없습니다',
      )
      .optional(),
  })
  .refine((data) => !!data.presentedEmail || !!data.presentedExternalNo, {
    message: '변경할 항목을 최소 1개 입력해주세요',
    path: ['presentedEmail'],
  })

export type CompanyContactUpdateFormValues = z.infer<typeof companyContactUpdateSchema>
