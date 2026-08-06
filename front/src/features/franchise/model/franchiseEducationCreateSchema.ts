import { z } from 'zod'

export const franchiseEducationCreateSchema = z.object({
  educationDate: z.string().min(1, '교육 날짜를 선택해주세요'),
  educationTime: z.string().min(1, '교육 시작 시각을 입력해주세요'),
  place: z
    .string()
    .min(1, '교육 장소를 입력해주세요')
    .max(50, '교육 장소는 50자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '교육 장소는 공백만으로 입력할 수 없습니다'),
  title: z
    .string()
    .min(1, '교육 제목을 입력해주세요')
    .max(50, '교육 제목은 50자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '교육 제목은 공백만으로 입력할 수 없습니다'),
  content: z.string().min(1, '교육 내용을 입력해주세요'),
  capacity: z
    .number({
      error: (issue) => (Number.isNaN(issue.input) ? '정원을 입력해주세요' : '숫자를 입력해주세요'),
    })
    .positive('정원은 양수여야 합니다'),
})

export type FranchiseEducationCreateFormValues = z.infer<typeof franchiseEducationCreateSchema>
