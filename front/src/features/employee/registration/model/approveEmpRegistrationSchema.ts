import { z } from 'zod'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

export const approveEmpRegistrationSchema = z.object({
  hiredAt: z
    .string()
    .refine((value) => dayjs(value, 'YYYY-MM-DD', true).isValid(), '입사일자를 올바르게 입력해주세요'),
})

export type ApproveEmpRegistrationFormValues = z.infer<typeof approveEmpRegistrationSchema>
