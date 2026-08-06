import { z } from 'zod'

export const companyRegisterSchema = z.object({
  companyName: z
    .string()
    .min(1, '회사명을 입력해주세요')
    .max(50, '회사명은 50자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '회사명은 공백만으로 입력할 수 없습니다'),
  location: z
    .string()
    .min(1, '회사 위치를 입력해주세요')
    .max(200, '회사 위치는 200자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '회사 위치는 공백만으로 입력할 수 없습니다'),
  presentedEmail: z
    .email('올바른 이메일 형식이 아닙니다')
    .max(150, '대표 이메일은 150자 이하로 입력해주세요'),
  presentedExternalNo: z
    .string()
    .min(1, '대표 연락처를 입력해주세요')
    .max(20, '대표 연락처는 20자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '대표 연락처는 공백만으로 입력할 수 없습니다'),
  ownerName: z
    .string()
    .min(1, '대표자명을 입력해주세요')
    .max(20, '대표자명은 20자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '대표자명은 공백만으로 입력할 수 없습니다'),
  homePageURL: z
    .string()
    .min(1, '홈페이지 URL을 입력해주세요')
    .max(200, '홈페이지 URL은 200자 이하로 입력해주세요')
    .refine(
      (value) => value.startsWith('http://') || value.startsWith('https://'),
      'http:// 또는 https://로 시작해야 합니다',
    ),
})

export type CompanyRegisterFormValues = z.infer<typeof companyRegisterSchema>
