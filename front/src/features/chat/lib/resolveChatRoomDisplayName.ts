const EMPTY_ROOM_NAME = '이름 없는 채팅방'

export function resolveChatRoomDisplayName(
  roomName: string | null | undefined,
  participantNames: string[] | null | undefined,
  maxNames = 2,
): string {
  const trimmed = roomName?.trim()
  if (trimmed) {
    return trimmed
  }
  const names = participantNames ?? []
  if (names.length === 0) {
    return EMPTY_ROOM_NAME
  }
  const shown = names.slice(0, maxNames)
  const remaining = names.length - shown.length
  const base = shown.join(', ')
  return remaining > 0 ? `${base} 외 ${remaining}명` : base
}
