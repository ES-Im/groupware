import { z } from 'zod'

/**
 * 채팅방 표시명 수정 폼 클라이언트 사전검증 스키마(ROADMAP(CHAT) T4.3, F908).
 *
 * 필드 근거: `back/build/generated-snippets/CHAT_ROOM_NAME_UPDATE/request-fields.adoc` 실측:
 * `name`은 String, 제약 "필수, 공백 불가, 20자 이하"(`@NotBlank` + `@Size(max = 20)`).
 *
 * `.trim()`은 approval 도메인 title/content 스키마(leaveDraftSchema 등)와 동일 컨벤션 —
 * 공백만 입력한 값을 서버 `@NotBlank` 판정과 동일하게 클라에서도 거른다.
 */
export const updateChatRoomNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '표시명을 입력해주세요')
    .max(20, '표시명은 20자 이하로 입력해주세요'),
})

export type UpdateChatRoomNameFormValues = z.infer<typeof updateChatRoomNameSchema>
