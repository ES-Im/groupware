import { FilePen, Inbox, Send, Trash2, type LucideIcon } from 'lucide-react'
import type { MailBox, MessageCountResponse } from '../model/messageTypes'

/**
 * 메일박스 4종(받은/보낸/임시보관/휴지통)의 시각 표현 설정. 좌측 박스 네비(MailboxNav)와
 * 좁은 뷰포트 폴백 탭(MessageBoxPage TabsList)이 이 단일 원천을 공유해 라벨·아이콘·건수 배지
 * selector가 어긋나지 않게 한다(옵션 B 2단 레이아웃 도입 시 MessageBoxPage에서 분리).
 */
export interface MailboxTabConfig {
  /** URL 세그먼트 겸 탭 value. */
  key: MailBox
  /** 네비/탭 라벨(받은 쪽지함 등). */
  navLabel: string
  /** 활성 박스 헤더 보조 설명(레퍼런스 메일함 톤 — 메인 헤더 3요소 중 부제). */
  description: string
  /** 네비/탭 아이콘(모노크롬 톤). */
  icon: LucideIcon
  /** 건수 배지 selector(F1510 MessageCountResponse). */
  getBadge: (counts: MessageCountResponse) => number
  /** 강조 배지 selector — 받은함 안읽음(unreadReceivedCount)만 사용한다. */
  getEmphasizedBadge?: (counts: MessageCountResponse) => number
}

/**
 * 메일박스 탭 4종 정의(F1501~F1504·F1510). box 값(received/sent/drafts/trash)은 URL 세그먼트이자
 * Tabs value다. 건수 배지는 useMailboxCountsQuery를 단일 소스로 소비하며, 받은함은 전체 건수에 더해
 * 안읽음(unreadReceivedCount)을 별도 강조 배지로 표기한다.
 */
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

/** 노출 순서(받은 → 보낸 → 임시보관 → 휴지통). */
export const BOX_ORDER = ['received', 'sent', 'drafts', 'trash'] as const

/** :box URL 세그먼트가 4종 메일박스 값인지 판별한다(문서함 tab 검증 컨벤션). */
export function isMailBox(value: string | undefined): value is MailBox {
  return value != null && value in BOX_TABS
}
