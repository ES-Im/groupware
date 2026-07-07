import { describe, expect, it } from 'vitest'
import { normalizeDeptLeader } from './normalizeDeptLeader'
import type { DeptLeaderWire } from '../model/deptInfo'

/**
 * normalizeDeptLeader(T6.1) 실동작 검증.
 *
 * wire 계약(3.department-management-prd.md "부서장 공석 wire 계약" 절): 부서장 미지정 부서는
 * `deptLeader`가 JSON null이 아니라 전 필드가 null인 객체로 내려온다. empName/empId 유무로
 * 공석을 판별해 화면 전용 DeptLeader | null로 좁혀야 하며, all-null 필드(빈 문자열/"null" 문자열)가
 * 렌더에 노출되지 않아야 한다(ROADMAP 리뷰 확정 요구사항).
 */
describe('normalizeDeptLeader', () => {
  it('전 필드가 null인 wire 객체(공석)를 null로 정규화한다', () => {
    const allNullWire: DeptLeaderWire = {
      empId: null,
      empNo: null,
      empName: null,
      extensionNo: null,
      email: null,
      position: null,
    }

    expect(normalizeDeptLeader(allNullWire)).toBeNull()
  })

  it('wire 자체가 null이어도(JSON null인 경우까지 방어) null을 반환한다', () => {
    expect(normalizeDeptLeader(null)).toBeNull()
  })

  it('empName만 null이고 나머지 필드가 있어도 공석으로 판별한다(식별 필드 유무 기준)', () => {
    const partialWire: DeptLeaderWire = {
      empId: 1,
      empNo: 'E001',
      empName: null,
      extensionNo: '101-0001',
      email: 'leader@haruon.com',
      position: '팀장',
    }

    expect(normalizeDeptLeader(partialWire)).toBeNull()
  })

  it('empId만 null이고 나머지 필드가 있어도 공석으로 판별한다', () => {
    const partialWire: DeptLeaderWire = {
      empId: null,
      empNo: 'E001',
      empName: '홍길동',
      extensionNo: '101-0001',
      email: 'leader@haruon.com',
      position: '팀장',
    }

    expect(normalizeDeptLeader(partialWire)).toBeNull()
  })

  it('정상 지정된 부서장 wire는 non-null DeptLeader로 좁혀 반환한다', () => {
    const wire: DeptLeaderWire = {
      empId: 1,
      empNo: 'E001',
      empName: '홍길동',
      extensionNo: '101-0001',
      email: 'leader@haruon.com',
      position: '팀장',
    }

    expect(normalizeDeptLeader(wire)).toEqual({
      empId: 1,
      empNo: 'E001',
      empName: '홍길동',
      extensionNo: '101-0001',
      email: 'leader@haruon.com',
      position: '팀장',
    })
  })

  it('empNo/email/position이 null이어도(빈 문자열로만 안전 폴백) empName/empId만 있으면 지정으로 판별한다', () => {
    const wire: DeptLeaderWire = {
      empId: 2,
      empNo: null,
      empName: '김철수',
      extensionNo: null,
      email: null,
      position: null,
    }

    expect(normalizeDeptLeader(wire)).toEqual({
      empId: 2,
      empNo: '',
      empName: '김철수',
      extensionNo: null,
      email: '',
      position: '',
    })
  })
})
