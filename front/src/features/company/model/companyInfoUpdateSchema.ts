import { z } from 'zod'

export const companyInfoUpdateSchema = z
  .object({
    companyName: z
      .string()
      .max(50, '회사명은 50자 이하로 입력해주세요')
      .refine(
        (value) => value === '' || value.trim().length > 0,
        '회사명은 공백만으로 입력할 수 없습니다',
      )
      .optional(),
    location: z
      .string()
      .max(200, '위치는 200자 이하로 입력해주세요')
      .refine(
        (value) => value === '' || value.trim().length > 0,
        '위치는 공백만으로 입력할 수 없습니다',
      )
      .optional(),
    ownerName: z
      .string()
      .max(20, '대표자명은 20자 이하로 입력해주세요')
      .refine(
        (value) => value === '' || value.trim().length > 0,
        '대표자명은 공백만으로 입력할 수 없습니다',
      )
      .optional(),
  })
  .refine((data) => !!data.companyName || !!data.location || !!data.ownerName, {
    message: '변경할 값을 하나 이상 입력해주세요',
    path: ['companyName'],
  })

export type CompanyInfoUpdateFormValues = z.infer<typeof companyInfoUpdateSchema>
