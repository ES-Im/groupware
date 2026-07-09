import { describe, expect, it } from 'vitest'
import { Paperclip } from 'lucide-react'
import type { ApprovalStatus } from '../model/approval'
import {
  approvalStatusBadgeMap,
  formatDraftDateTime,
  getApprovalRoleLabel,
  getApprovalStatusBadge,
  getFileAttachedIconInfo,
  resolveApprovalStatus,
} from './approvalStatusBadge'

/**
 * approvalStatusBadge(ROADMAP(DRAFT) T1.3) 표시 유틸 단위 테스트.
 * ①상태 배지(표시명↔코드) ②role 라벨 ③일시 포맷 ④첨부 아이콘 4가지 규칙을 각각 검증한다.
 * label은 백엔드 enum description과 정확히 일치해야 역매핑(resolveApprovalStatus)이 성립한다.
 */

describe('approvalStatusBadgeMap / getApprovalStatusBadge', () => {
  it.each([
    ['UNSUBMITTED', '미상신', 'outline'],
    ['WAITING', '결재대기', 'secondary'],
    ['IN_PROGRESS', '결재진행중', 'secondary'],
    ['APPROVED', '결재완료', 'default'],
    ['REJECTED', '반려', 'destructive'],
  ] satisfies [ApprovalStatus, string, string][])(
    '%s는 label=%s, variant=%s로 매핑된다',
    (status, label, variant) => {
      expect(approvalStatusBadgeMap[status]).toEqual({ label, variant })
    },
  )

  it('approvalStatusBadgeMap은 정확히 5개 키만 갖는다', () => {
    expect(Object.keys(approvalStatusBadgeMap)).toHaveLength(5)
  })

  it('표시명 문자열로 배지를 조회하면 코드 매핑값과 동일하다', () => {
    expect(getApprovalStatusBadge('결재완료')).toEqual({ label: '결재완료', variant: 'default' })
    expect(getApprovalStatusBadge('반려')).toEqual({ label: '반려', variant: 'destructive' })
  })

  it('계약 밖 표시명은 원문을 그대로 outline 배지로 표기한다(발명 금지 방어)', () => {
    expect(getApprovalStatusBadge('알수없음')).toEqual({ label: '알수없음', variant: 'outline' })
  })
})

describe('resolveApprovalStatus (표시명 → 코드 역매핑)', () => {
  it.each([
    ['미상신', 'UNSUBMITTED'],
    ['결재대기', 'WAITING'],
    ['결재진행중', 'IN_PROGRESS'],
    ['결재완료', 'APPROVED'],
    ['반려', 'REJECTED'],
  ] satisfies [string, ApprovalStatus][])(
    '"%s"는 코드 %s로 역매핑된다',
    (label, code) => {
      expect(resolveApprovalStatus(label)).toBe(code)
    },
  )

  it('계약 밖 표시명은 undefined를 반환한다(코드 발명 금지)', () => {
    expect(resolveApprovalStatus('알수없음')).toBeUndefined()
    expect(resolveApprovalStatus('')).toBeUndefined()
  })
})

describe('getApprovalRoleLabel', () => {
  it('APPROVER는 "결재"로 라벨링된다', () => {
    expect(getApprovalRoleLabel('APPROVER')).toBe('결재')
  })

  it('COOPERATOR는 "협조"로 라벨링된다', () => {
    expect(getApprovalRoleLabel('COOPERATOR')).toBe('협조')
  })

  it('계약 밖 role은 원문을 그대로 반환한다(발명 금지)', () => {
    expect(getApprovalRoleLabel('UNKNOWN_ROLE')).toBe('UNKNOWN_ROLE')
  })
})

describe('formatDraftDateTime', () => {
  it('ISO 일시 문자열을 "YYYY-MM-DD HH:mm"로 포맷한다', () => {
    expect(formatDraftDateTime('2026-07-01T14:30:45')).toBe('2026-07-01 14:30')
  })

  it('null이면 대시("-")로 표기한다(미상신 문서 submittedAt)', () => {
    expect(formatDraftDateTime(null)).toBe('-')
  })
})

describe('getFileAttachedIconInfo', () => {
  it('첨부가 있으면 Paperclip 아이콘과 "첨부파일 있음" 라벨을 반환한다', () => {
    expect(getFileAttachedIconInfo(true)).toEqual({ Icon: Paperclip, ariaLabel: '첨부파일 있음' })
  })

  it('첨부가 없으면 Icon=null과 "첨부파일 없음" 라벨을 반환한다', () => {
    expect(getFileAttachedIconInfo(false)).toEqual({ Icon: null, ariaLabel: '첨부파일 없음' })
  })
})
