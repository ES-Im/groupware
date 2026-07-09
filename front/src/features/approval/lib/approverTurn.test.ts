import { describe, expect, it } from 'vitest'
import type { DraftApprover } from '../model/draftDetail'
import { isMyApprovalTurn } from './approverTurn'

/**
 * isMyApprovalTurn(ROADMAP(DRAFT) T3.1) 순수 파생 로직 단위 테스트.
 *
 * 판정 규칙(도메인모델 §6 · approverTurn.ts 주석):
 *  - myEmpId 미확정(undefined) → false(fail-closed).
 *  - 결재선 밖(본인 approver 없음) → false.
 *  - 본인 이미 처리(approvedAt·rejectedAt 중 하나라도 채워짐) → false.
 *  - 내 차례 전(더 낮은 order 미처리 잔존) → false.
 *  - 미처리 최소 order == 본인 order → true.
 *  - COOPERATOR(협조자)도 role 무관하게 order 흐름에 참여(role 필터 없음).
 *  - order 동률(같은 order 미처리 복수) → 모두 현재 차례로 판정.
 */

function approver(overrides: Partial<DraftApprover> = {}): DraftApprover {
  return {
    empId: 1,
    empName: '홍길동',
    role: 'APPROVER',
    order: 1,
    approvedAt: null,
    rejectedAt: null,
    rejectReason: null,
    ...overrides,
  }
}

describe('isMyApprovalTurn', () => {
  it('myEmpId가 undefined이면 false(fail-closed)', () => {
    const approvers = [approver({ empId: 1, order: 1 })]
    expect(isMyApprovalTurn(approvers, undefined)).toBe(false)
  })

  it('본인이 결재선 밖(approvers에 없음)이면 false', () => {
    const approvers = [approver({ empId: 1, order: 1 }), approver({ empId: 2, order: 2 })]
    expect(isMyApprovalTurn(approvers, 99)).toBe(false)
  })

  it('본인이 이미 승인(approvedAt 채워짐)했으면 false', () => {
    const approvers = [approver({ empId: 1, order: 1, approvedAt: '2026-07-01T10:00:00' })]
    expect(isMyApprovalTurn(approvers, 1)).toBe(false)
  })

  it('본인이 이미 반려(rejectedAt 채워짐)했으면 false', () => {
    const approvers = [
      approver({ empId: 1, order: 1, rejectedAt: '2026-07-01T10:00:00', rejectReason: '사유' }),
    ]
    expect(isMyApprovalTurn(approvers, 1)).toBe(false)
  })

  it('본인보다 낮은 order에 미처리 결재자가 남아 있으면(내 차례 전) false', () => {
    const approvers = [
      approver({ empId: 1, order: 1 }), // 미처리 (앞선 차례)
      approver({ empId: 2, order: 2 }), // 본인
    ]
    expect(isMyApprovalTurn(approvers, 2)).toBe(false)
  })

  it('본인보다 낮은 order가 전부 처리되고 본인이 미처리 최소 order면(현재 차례) true', () => {
    const approvers = [
      approver({ empId: 1, order: 1, approvedAt: '2026-07-01T10:00:00' }), // 처리 완료
      approver({ empId: 2, order: 2 }), // 본인 = 현재 차례
      approver({ empId: 3, order: 3 }), // 뒤 차례
    ]
    expect(isMyApprovalTurn(approvers, 2)).toBe(true)
  })

  it('결재선 첫 결재자(order 최소)가 미처리면 true', () => {
    const approvers = [approver({ empId: 1, order: 1 }), approver({ empId: 2, order: 2 })]
    expect(isMyApprovalTurn(approvers, 1)).toBe(true)
  })

  it('COOPERATOR(협조자)도 role 무관하게 order 흐름에 참여해 현재 차례면 true', () => {
    const approvers = [
      approver({ empId: 1, order: 1, role: 'APPROVER', approvedAt: '2026-07-01T10:00:00' }),
      approver({ empId: 2, order: 2, role: 'COOPERATOR' }), // 협조자 본인 = 현재 차례
      approver({ empId: 3, order: 3, role: 'APPROVER' }),
    ]
    expect(isMyApprovalTurn(approvers, 2)).toBe(true)
  })

  it('앞선 COOPERATOR가 미처리면 뒤 APPROVER는 아직 차례가 아니다(협조자 차례를 건너뛰지 않음)', () => {
    const approvers = [
      approver({ empId: 1, order: 1, role: 'COOPERATOR' }), // 협조자 미처리 (앞 차례)
      approver({ empId: 2, order: 2, role: 'APPROVER' }), // 본인 = 아직 차례 아님
    ]
    expect(isMyApprovalTurn(approvers, 2)).toBe(false)
  })

  it('order 동률(같은 order에 미처리 복수)이면 해당 order 미처리자 모두 현재 차례로 판정된다', () => {
    const approvers = [
      approver({ empId: 1, order: 1 }),
      approver({ empId: 2, order: 1 }),
    ]
    expect(isMyApprovalTurn(approvers, 1)).toBe(true)
    expect(isMyApprovalTurn(approvers, 2)).toBe(true)
  })
})
