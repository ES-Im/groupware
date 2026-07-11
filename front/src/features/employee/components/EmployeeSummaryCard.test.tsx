import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmployeeSummaryCard } from './EmployeeSummaryCard'
import type { EmployeeInfoResponse } from '../model/me'

/**
 * EmployeeSummaryCard(EmployeeInfoView 좌측 요약 카드, adapt-ui 리디자인) 검증.
 * BlobAvatar가 내부적으로 useEmpFilePreviewUrl을 쓰지만, activeFiles에 PROFILE_PICTURE가
 * 없으면 fileId가 undefined라 네트워크 조회 자체가 발생하지 않는다(이니셜 폴백 경로) —
 * QueryClientProvider/MSW 없이도 격리 검증 가능하다.
 */

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

    // 아바타 상단 배지(대표/겸직 모두, "부서명 · 직위명" 형식).
    const primaryTopBadge = screen.getByText('개발팀 · 팀장')
    const mutedTopBadge = screen.getByText('기획팀 · 사원')
    expect(primaryTopBadge).toHaveClass('text-primary')
    expect(mutedTopBadge).toHaveClass('text-muted-foreground')

    // "현재 부서" 섹션: 부서별 대표/겸직 배지.
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
    // 다른 계정 정보(이메일)는 viewerIsSelf와 무관하게 계속 노출된다.
    expect(screen.getByText('hong@haruon.com')).toBeInTheDocument()
  })
})
