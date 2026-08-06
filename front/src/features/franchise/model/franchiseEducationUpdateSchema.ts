import { z } from 'zod'

export const franchiseEducationUpdateSchema = z.object({
  educationDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/,
      '교육 일시는 yyyy-MM-ddTHH:mm:ss 형식으로 입력해주세요',
    )
    .optional(),
  place: z.string().max(50, '교육 장소는 50자 이하로 입력해주세요').optional(),
  title: z.string().max(50, '교육 제목은 50자 이하로 입력해주세요').optional(),
  content: z
    .string()
    .refine((value) => value.trim().length > 0, '교육 내용은 공백만으로 입력할 수 없습니다')
    .optional(),
  capacity: z.number('숫자를 입력해주세요').positive('정원은 양수여야 합니다').optional(),
})

export type FranchiseEducationUpdateFormValues = z.infer<typeof franchiseEducationUpdateSchema>
