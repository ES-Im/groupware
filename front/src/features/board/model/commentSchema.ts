import { z } from 'zod'

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, '댓글 내용을 입력해주세요')
    .max(300, '댓글은 300자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '댓글은 공백만으로 입력할 수 없습니다'),
})

export type CommentFormValues = z.infer<typeof commentSchema>
