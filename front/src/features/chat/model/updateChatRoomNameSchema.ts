import { z } from 'zod'

export const updateChatRoomNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '표시명을 입력해주세요')
    .max(20, '표시명은 20자 이하로 입력해주세요'),
})

export type UpdateChatRoomNameFormValues = z.infer<typeof updateChatRoomNameSchema>
