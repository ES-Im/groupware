import { CalendarDays, FileText, Plane, TrendingUp, type LucideIcon } from 'lucide-react'
import type { DraftDetailResponse } from '../model/draftDetail'

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
  /**
   * 선택 카드 노출 최소 role(security.md 역할 코드, 사이드바 minRole 컨벤션 동일). 없으면 전원
   * 노출. UI 게이팅 힌트일 뿐 최종 판정은 서버 403(라우트 가드는 두지 않는다 — 사이드바와 동일 정책).
   */
  minRole?: string
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
    // 매출 기안 API(/api/drafts/sales/**)는 FRANCHISE 게이트(security.md) — 권한 없는 사원에게는
    // 선택 카드 자체를 숨긴다.
    minRole: 'FRANCHISE',
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

/**
 * DRAFT_DETAIL 응답의 유형 → 타입 키. `draftType` enum 값이 아니라 leave/businessTrip/sales
 * **non-null 슬롯 체크**로 판별한다(Open Q#2 회피 — DraftTypeBody와 동일 규칙). 상세 헤더·인쇄
 * 문서가 유형 라벨/아이콘을 얻을 때 공용한다.
 */
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
