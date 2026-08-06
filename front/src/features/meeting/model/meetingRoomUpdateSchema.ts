import { z } from 'zod'

export const meetingRoomUpdateSchema = z.object({
  name: z
    .string()
    .max(50, '회의실 이름은 50자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '회의실 이름은 공백만으로 입력할 수 없습니다')
    .optional(),
  description: z
    .string()
    .refine((value) => value.trim().length > 0, '회의실 설명은 공백만으로 입력할 수 없습니다')
    .optional(),
  capacity: z.number('숫자를 입력해주세요').positive('수용 인원은 양수여야 합니다').optional(),
})

export type MeetingRoomUpdateFormValues = z.infer<typeof meetingRoomUpdateSchema>
