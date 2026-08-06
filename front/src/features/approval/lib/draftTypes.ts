import { CalendarDays, FileText, Plane, TrendingUp, type LucideIcon } from 'lucide-react'
import type { DraftDetailResponse } from '../model/draftDetail'

export type DraftTypeKey = 'general' | 'business-trip' | 'leave' | 'sales'

export interface DraftTypeMeta {
  key: DraftTypeKey
  label: string
  description: string
  route: string
  icon: LucideIcon
  minRole?: string
}

export const DRAFT_TYPES: DraftTypeMeta[] = [
  {
    key: 'general',
    label: '일반기안서',
    description: '품의 및 일반 업무 보고',
    route: '/approval/drafts/new',
    icon: FileText,
  },
  {
    key: 'business-trip',
    label: '출장신청서',
    description: '출장 일정 및 참여자 신청',
    route: '/approval/drafts/business-trips/new',
    icon: Plane,
  },
  {
    key: 'leave',
    label: '연가신청',
    description: '연차 및 휴가 사용 신청',
    route: '/approval/drafts/leaves/new',
    icon: CalendarDays,
  },
  {
    key: 'sales',
    label: '매출보고서',
    description: '가맹점 월별 매출 보고',
    route: '/approval/drafts/sales/new',
    icon: TrendingUp,
    minRole: 'FRANCHISE',
  },
]

export function getDraftTypeMeta(key: DraftTypeKey): DraftTypeMeta {
  const meta = DRAFT_TYPES.find((type) => type.key === key)
  if (!meta) {
    throw new Error(`알 수 없는 기안서 타입: ${key}`)
  }
  return meta
}

export function resolveDraftTypeKey(
  draft: Pick<DraftDetailResponse, 'leave' | 'businessTrip' | 'sales'>,
): DraftTypeKey {
  if (draft.leave != null) {
    return 'leave'
  }
  if (draft.businessTrip != null) {
    return 'business-trip'
  }
  if (draft.sales != null) {
    return 'sales'
  }
  return 'general'
}
