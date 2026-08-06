import { z } from 'zod'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

export const empBelongingsFormSchema = z.object({
  deptId: z.string().min(1, '부서를 선택해주세요'),
  position: z.string().min(1, '직급을 선택해주세요'),
  isPrimary: z.literal(true),
  startAt: z
    .string()
    .refine((value) => dayjs(value, 'YYYY-MM-DD', true).isValid(), '발령시작일을 올바르게 입력해주세요'),
})

export type EmpBelongingsFormValues = z.infer<typeof empBelongingsFormSchema>
