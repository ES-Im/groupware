import { z } from 'zod'

const TIME_FORMAT_REGEX = /^\d{2}:\d{2}:\d{2}$/
const TIME_FORMAT_MESSAGE = '시각 형식이 올바르지 않습니다'

function optionalTimeField() {
  return z
    .string()
    .refine((value) => value === '' || TIME_FORMAT_REGEX.test(value), TIME_FORMAT_MESSAGE)
    .optional()
}

export const updateAttendanceSchema = z
  .object({
    targetEmpId: z.number(),
    startAt: optionalTimeField(),
    endAt: optionalTimeField(),
    editReason: z
      .string()
      .min(1, '수정 사유를 입력해주세요')
      .max(100, '수정 사유는 100자 이하로 입력해주세요'),
  })
  .refine((data) => !!data.startAt || !!data.endAt, {
    message: '시작 또는 종료 시각 중 하나는 입력해야 합니다',
    path: ['startAt'],
  })

export type UpdateAttendanceFormValues = z.infer<typeof updateAttendanceSchema>
