import { z } from 'zod'

export const franchiseUpdateSchema = z.object({
  businessNumber: z
    .string()
    .regex(/^\d{3}-\d{2}-\d{5}$/, '사업자번호는 000-00-00000 형식(12자)으로 입력해주세요')
    .optional(),
  franchiseName: z
    .string()
    .max(50, '가맹점명은 50자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '가맹점명은 공백만으로 입력할 수 없습니다')
    .optional(),
  address: z
    .string()
    .max(200, '주소는 200자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '주소는 공백만으로 입력할 수 없습니다')
    .optional(),
  ownerName: z
    .string()
    .max(50, '대표자명은 50자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '대표자명은 공백만으로 입력할 수 없습니다')
    .optional(),
  contactNumber: z
    .string()
    .regex(/^010-\d{3,4}-\d{4}$/, '연락처는 010-0000-0000 형식으로 입력해주세요')
    .optional(),
  contactEmail: z.email('올바른 이메일 형식이 아닙니다').optional(),
})

export type FranchiseUpdateFormValues = z.infer<typeof franchiseUpdateSchema>
