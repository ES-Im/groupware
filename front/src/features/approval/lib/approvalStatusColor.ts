import type { ApprovalStatus } from '../model/approval'
import { resolveApprovalStatus } from './approvalStatusBadge'

/**
 * 문서함 표·상세 헤더 전용 상태 색상(adapt-ui 레퍼런스 이식 — 대기=amber·진행중=blue·완료=emerald·
 * 반려=rose·미상신=slate 5색 구분). `approvalStatusBadge.ts`의 4-variant 매핑(홈/사원 위젯 등 다른
 * 화면이 그대로 소비 중)은 건드리지 않고, 이 두 화면(DocumentBoxTable·DraftDetailHeader)에서만
 * 겹쳐 쓰는 색상 정보를 별도 파일로 분리했다.
 */
export interface ApprovalStatusColor {
  /** Badge에 겹쳐 쓸 클래스(border-0 + 배경/글자/ring). */
  className: string
  /** 상태 점(dot) 배경색 클래스. */
  dotClassName: string
}

const APPROVAL_STATUS_COLOR: Record<ApprovalStatus, ApprovalStatusColor> = {
  UNSUBMITTED: {
    className:
      'border-0 bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    dotClassName: 'bg-slate-400',
  },
  WAITING: {
    className:
      'border-0 bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900',
    dotClassName: 'bg-amber-500',
  },
  IN_PROGRESS: {
    className:
      'border-0 bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-blue-900',
    dotClassName: 'bg-blue-500',
  },
  APPROVED: {
    className:
      'border-0 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900',
    dotClassName: 'bg-emerald-500',
  },
  REJECTED: {
    className:
      'border-0 bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:ring-rose-900',
    dotClassName: 'bg-rose-500',
  },
}

const FALLBACK_COLOR: ApprovalStatusColor = {
  className: 'border-0 bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  dotClassName: 'bg-slate-400',
}

/** approvalStatus 표시명 문자열 → 상태 색상. 계약 밖 값은 slate(미상신과 동일 톤)로 방어한다. */
export function getApprovalStatusColor(displayName: string): ApprovalStatusColor {
  const code = resolveApprovalStatus(displayName)
  return code ? APPROVAL_STATUS_COLOR[code] : FALLBACK_COLOR
}
