import dayjs from 'dayjs'
import { Paperclip, type LucideIcon } from 'lucide-react'
import type { ApprovalStatus } from '@/features/approval/model/approval'

/**
 * 전자결재 공통 표시 유틸(ROADMAP(DRAFT) T1.3). attendance `attendanceStatusBadge.ts`의 배지 매핑
 * 컨벤션을 복제하되, 이 도메인 고유의 4가지 표시 규칙을 한 파일에 모은다:
 *   ① ApprovalStatus 배지(응답이 표시명 문자열로 오므로 표시명↔코드 대응),
 *   ② Approvers.role 라벨(APPROVER/COOPERATOR),
 *   ③ 일시 포맷(dayjs),
 *   ④ 첨부 아이콘 표기.
 * M1(문서함 목록)은 ①④를 소비하고, ②③은 M2(상세) 이후 슬라이스가 소비하는 기반이다.
 */

/** shadcn Badge 표준 variant(attendance와 동일 하위집합). */
export type ApprovalBadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

export interface ApprovalStatusBadgeInfo {
  label: string
  variant: ApprovalBadgeVariant
}

/**
 * ApprovalStatus(5개, ApprovalStatus.java 실측) → 배지 표시 정보 매핑.
 * label은 **백엔드 enum description 그대로**다(서버 응답 표시명과 정확히 일치해야 역매핑이 성립):
 *   UNSUBMITTED="미상신" · WAITING="결재대기" · IN_PROGRESS="결재진행중" · APPROVED="결재완료" · REJECTED="반려".
 * variant는 PRD/백엔드 계약에 색상 규칙이 없어 이번 태스크에서 합리적으로 가정한 값이다(사용자 보고 대상):
 * 미상신(임시저장)=outline, 결재대기·결재진행중(진행성)=secondary, 결재완료(완료)=default, 반려(부정)=destructive.
 */
export const approvalStatusBadgeMap: Record<ApprovalStatus, ApprovalStatusBadgeInfo> = {
  UNSUBMITTED: { label: '미상신', variant: 'outline' },
  WAITING: { label: '결재대기', variant: 'secondary' },
  IN_PROGRESS: { label: '결재진행중', variant: 'secondary' },
  APPROVED: { label: '결재완료', variant: 'default' },
  REJECTED: { label: '반려', variant: 'destructive' },
}

/** 표시명(label) → ApprovalStatus 코드 역매핑. approvalStatusBadgeMap에서 파생해 단일 원천을 유지한다. */
const APPROVAL_STATUS_BY_LABEL: Record<string, ApprovalStatus> = Object.fromEntries(
  (Object.keys(approvalStatusBadgeMap) as ApprovalStatus[]).map((code) => [
    approvalStatusBadgeMap[code].label,
    code,
  ]),
)

/**
 * 서버 응답의 표시명 문자열을 ApprovalStatus 코드로 되돌린다. 계약 밖 값이면 undefined
 * (코드 발명 금지 — 호출부가 방어 처리). M3/M4의 상태 기반 파생 로직이 재사용한다.
 */
export function resolveApprovalStatus(displayName: string): ApprovalStatus | undefined {
  return APPROVAL_STATUS_BY_LABEL[displayName]
}

/**
 * 목록/상세의 `approvalStatus`(표시명 문자열) → 배지 표시 정보.
 * 알 수 없는 표시명은 원문을 그대로 outline 배지로 보여준다(계약 외 값 방어, 발명 금지).
 */
export function getApprovalStatusBadge(displayName: string): ApprovalStatusBadgeInfo {
  const code = resolveApprovalStatus(displayName)
  return code ? approvalStatusBadgeMap[code] : { label: displayName, variant: 'outline' }
}

/**
 * Approvers.role(APPROVER/COOPERATOR, ApprovalRole.java 실측 — 서버는 enum 이름을 그대로 내려준다)
 * → 한국어 라벨. 계약 밖 값이면 원문을 그대로 반환한다(발명 금지). 결재선 타임라인(M2) 표기에 사용.
 */
export function getApprovalRoleLabel(role: string): string {
  switch (role) {
    case 'APPROVER':
      return '결재'
    case 'COOPERATOR':
      return '협조'
    default:
      return role
  }
}

/**
 * 기안서 일시(`yyyy-MM-dd'T'HH:mm:ss`) 표시용 포맷(dayjs). 값 자체는 가공하지 않고 표시 포맷만 입힌다.
 * submittedAt은 미상신 문서에서 null이라 null이면 대시("-")로 표기한다(board 표의 dayjs 포맷 톤 유지).
 */
export function formatDraftDateTime(value: string | null): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

export interface FileAttachedIconInfo {
  /** 첨부가 있으면 Paperclip 아이콘, 없으면 null(호출부가 대시 등으로 대체 표기). */
  Icon: LucideIcon | null
  ariaLabel: string
}

/** isFileAttached(boolean) → 첨부 아이콘 표기 정보. 개수 정보는 계약에 없어 존재 여부만 표기한다. */
export function getFileAttachedIconInfo(isFileAttached: boolean): FileAttachedIconInfo {
  return isFileAttached
    ? { Icon: Paperclip, ariaLabel: '첨부파일 있음' }
    : { Icon: null, ariaLabel: '첨부파일 없음' }
}
