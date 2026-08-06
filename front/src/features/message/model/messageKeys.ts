import type { MailBox } from './messageTypes'

export const messageKeys = {
  all: ['message'] as const,
  list: (
    box: MailBox,
    params?: { keyword?: string; isRead?: boolean; page?: number; size?: number },
  ) => [...messageKeys.all, 'list', box, params] as const,
  detail: (messageId: number | undefined) => [...messageKeys.all, 'detail', messageId] as const,
  files: (messageId: number | undefined) => [...messageKeys.all, 'files', messageId] as const,
  counts: () => [...messageKeys.all, 'counts'] as const,
}
