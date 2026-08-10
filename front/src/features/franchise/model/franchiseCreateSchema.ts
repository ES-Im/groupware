import { z } from 'zod'

export const franchiseCreateSchema = z.object({
  businessNumber: z
    .string()
    .min(1, '사업자번호를 입력해주세요')
    .regex(/^\d{10}$/, '사업자번호는 숫자 10자리로 입력해주세요'),
  franchiseName: z
    .string()
    .min(1, '가맹점명을 입력해주세요')
    .max(50, '가맹점명은 50자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '가맹점명은 공백만으로 입력할 수 없습니다'),
  address: z
    .string()
    .min(1, '주소를 입력해주세요')
    .max(200, '주소는 200자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '주소는 공백만으로 입력할 수 없습니다'),
  ownerName: z
    .string()
    .min(1, '대표자명을 입력해주세요')
    .max(50, '대표자명은 50자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '대표자명은 공백만으로 입력할 수 없습니다'),
  contactNumber: z
    .string()
    .min(1, '연락처를 입력해주세요')
    .regex(/^010-\d{3,4}-\d{4}$/, '연락처는 010-0000-0000 형식으로 입력해주세요'),
  contactEmail: z.email('올바른 이메일 형식이 아닙니다'),
  managerEmpId: z.number().optional(),
})

export type FranchiseCreateFormValues = z.infer<typeof franchiseCreateSchema>
