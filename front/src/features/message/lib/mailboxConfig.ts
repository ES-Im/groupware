import { FilePen, Inbox, Send, Trash2, type LucideIcon } from 'lucide-react'
import type { MailBox, MessageCountResponse } from '../model/messageTypes'

export interface MailboxTabConfig {
  key: MailBox
  navLabel: string
  description: string
  icon: LucideIcon
  getBadge: (counts: MessageCountResponse) => number
  getEmphasizedBadge?: (counts: MessageCountResponse) => number
}

export const BOX_TABS: Record<MailBox, MailboxTabConfig> = {
  received: {
    key: 'received',
    navLabel: '받은 쪽지함',
    description: '나에게 도착한 쪽지를 확인합니다.',
    icon: Inbox,
    getBadge: (c) => c.receivedCount,
    getEmphasizedBadge: (c) => c.unreadReceivedCount,
  },
  sent: {
    key: 'sent',
    navLabel: '보낸 쪽지함',
    description: '내가 보낸 쪽지를 확인합니다.',
    icon: Send,
    getBadge: (c) => c.sentCount,
  },
  drafts: {
    key: 'drafts',
    navLabel: '임시보관함',
    description: '임시 저장한 쪽지를 이어서 작성합니다.',
    icon: FilePen,
    getBadge: (c) => c.draftCount,
  },
  trash: {
    key: 'trash',
    navLabel: '휴지통',
    description: '삭제한 쪽지를 복구하거나 완전히 비웁니다.',
    icon: Trash2,
    getBadge: (c) => c.trashCount,
  },
}

export const BOX_ORDER = ['received', 'sent', 'drafts', 'trash'] as const

export function isMailBox(value: string | undefined): value is MailBox {
  return value != null && value in BOX_TABS
}
