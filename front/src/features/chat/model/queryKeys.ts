export const chatKeys = {
  all: ['chat'] as const,
  rooms: (params?: { keyword?: string; isBookmark?: boolean }) =>
    [...chatKeys.all, 'rooms', params] as const,
  detail: (roomId: number | undefined) => [...chatKeys.all, 'room', roomId] as const,
  messages: (roomId: number | undefined, params?: { cursor?: number; size?: number }) =>
    [...chatKeys.all, 'room', roomId, 'messages', params] as const,
}
