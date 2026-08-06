import { describe, expect, it } from 'vitest'
import { normalizeDeptLeader } from './normalizeDeptLeader'
import type { DeptLeaderWire } from '../model/deptInfo'

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
