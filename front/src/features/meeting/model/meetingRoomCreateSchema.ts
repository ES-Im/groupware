import { z } from 'zod'

export const meetingRoomCreateSchema = z.object({
  name: z
    .string()
    .min(1, '회의실 이름을 입력해주세요')
    .max(50, '회의실 이름은 50자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '회의실 이름은 공백만으로 입력할 수 없습니다'),
  description: z
    .string()
    .min(1, '회의실 설명을 입력해주세요')
    .refine((value) => value.trim().length > 0, '회의실 설명은 공백만으로 입력할 수 없습니다'),
  capacity: z
    .number({
      error: (issue) => (Number.isNaN(issue.input) ? '수용 인원을 입력해주세요' : '숫자를 입력해주세요'),
    })
    .positive('수용 인원은 양수여야 합니다'),
})

export type MeetingRoomCreateFormValues = z.infer<typeof meetingRoomCreateSchema>
