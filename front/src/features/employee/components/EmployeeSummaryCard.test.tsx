import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmployeeSummaryCard } from './EmployeeSummaryCard'
import type { EmployeeInfoResponse } from '../model/me'

function makeData(overrides: Partial<EmployeeInfoResponse> = {}): EmployeeInfoResponse {
  return {
    empBasicInfo: {
      empId: 1,
      empNo: '202607001',
      name: '홍길동',
      loginId: 'test1234',
      email: 'hong@haruon.com',
      extensionNo: '000-1234',
    },
    activeFiles: [],
    currentDepts: [
      { deptId: 1, deptCode: 'D1', deptName: '개발팀', positionName: '팀장', isPrimary: true, startAt: '2024-01-01', endAt: null },
      { deptId: 2, deptCode: 'D2', deptName: '기획팀', positionName: '사원', isPrimary: false, startAt: '2025-01-01', endAt: null },
    ],
    ...overrides,
  }
}

describe('EmployeeSummaryCard - 부서 배지', () => {
  it('currentDepts 전체가 배지로 렌더되며, 대표 부서는 primary tone, 겸직 부서는 muted tone이다', () => {
    render(<EmployeeSummaryCard data={makeData()} empId={1} />)

    const primaryTopBadge = screen.getByText('개발팀 · 팀장')
    const mutedTopBadge = screen.getByText('기획팀 · 사원')
    expect(primaryTopBadge).toHaveClass('text-primary')
    expect(mutedTopBadge).toHaveClass('text-muted-foreground')

    expect(screen.getByText('개발팀')).toBeInTheDocument()
    expect(screen.getByText('기획팀')).toBeInTheDocument()
    const primaryBadge = screen.getByText('대표')
    const jointBadge = screen.getByText('겸직')
    expect(primaryBadge).toHaveClass('text-primary')
    expect(jointBadge).toHaveClass('text-muted-foreground')
  })

  it('소속 부서가 없으면 "소속된 부서가 없습니다." 안내를 보여준다', () => {
    render(<EmployeeSummaryCard data={makeData({ currentDepts: [] })} empId={1} />)

    expect(screen.getByText('소속된 부서가 없습니다.')).toBeInTheDocument()
  })
})

describe('EmployeeSummaryCard - viewerIsSelf', () => {
  it('viewerIsSelf=true(기본값)면 아이디 필드를 노출한다', () => {
    render(<EmployeeSummaryCard data={makeData()} empId={1} />)

    expect(screen.getByText('아이디')).toBeInTheDocument()
    expect(screen.getByText('test1234')).toBeInTheDocument()
  })

  it('viewerIsSelf=false면 아이디 필드를 노출하지 않는다', () => {
    render(<EmployeeSummaryCard data={makeData()} empId={1} viewerIsSelf={false} />)

    expect(screen.queryByText('아이디')).not.toBeInTheDocument()
    expect(screen.queryByText('test1234')).not.toBeInTheDocument()
    expect(screen.getByText('hong@haruon.com')).toBeInTheDocument()
  })
})
