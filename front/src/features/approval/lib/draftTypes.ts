import { CalendarDays, FileText, Plane, TrendingUp, type LucideIcon } from 'lucide-react'

/** 기안서 작성 4종 타입 키(라우트/헤더/선택 카드가 공유하는 식별자). */
export type DraftTypeKey = 'general' | 'business-trip' | 'leave' | 'sales'

/** 기안서 종류 한 개의 표시 메타(선택 카드·폼 카드 헤더 공용). */
export interface DraftTypeMeta {
  key: DraftTypeKey
  /** 타입명(예: 일반기안서). */
  label: string
  /** 한 줄 설명(예: 품의 및 일반 업무 보고). */
  description: string
  /** 이동 경로(선택 카드 클릭 시 navigate 대상). */
  route: string
  icon: LucideIcon
}

/**
 * 기안서 작성 4종 메타 정의(레퍼런스 좌측 "기안서 종류" 카드 순서·문구를 그대로 복제).
 * 라우트는 router.tsx의 approval/drafts 하위 작성 경로와 일치한다.
 */
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
  },
]

/** 타입 키로 메타를 조회한다(4종은 상수라 항상 존재). */
export function getDraftTypeMeta(key: DraftTypeKey): DraftTypeMeta {
  const meta = DRAFT_TYPES.find((type) => type.key === key)
  if (!meta) {
    throw new Error(`알 수 없는 기안서 타입: ${key}`)
  }
  return meta
}
