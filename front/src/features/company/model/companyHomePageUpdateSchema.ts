import { z } from 'zod'

export const companyHomePageUpdateSchema = z.object({
  homePageURL: z
    .string()
    .min(1, '홈페이지 URL을 입력해주세요')
    .max(200, '홈페이지 URL은 200자 이하로 입력해주세요')
    .refine((value) => value.startsWith('http://') || value.startsWith('https://'), {
      message: '홈페이지 URL은 http:// 또는 https://로 시작해야 합니다',
    }),
})

export type CompanyHomePageUpdateFormValues = z.infer<typeof companyHomePageUpdateSchema>
