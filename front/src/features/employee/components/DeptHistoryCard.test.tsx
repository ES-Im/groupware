import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DeptHistoryCard } from './DeptHistoryCard'
import type { CurrentDept } from '../model/me'

/**
 * DeptHistoryCard("소속·발령" 카드, adapt-ui 리디자인 3차 — EmployeeProfileTabs의 "부서이력"
 * 탭에서 분리된 신규 컴포넌트) 검증.
 */

function makeDept(overrides: Partial<CurrentDept> = {}): CurrentDept {
  return {
    deptId: 1,
    deptCode: 'D1',
    deptName: '개발팀',
    positionName: '팀장',
    isPrimary: true,
    startAt: '2024-01-01',
    endAt: null,
    ...overrides,
  }
}

describe('DeptHistoryCard - 정렬/배지', () => {
  it('startAt 내림차순으로 정렬하고 대표/겸직 배지를 구분해 렌더한다', () => {
    render(
      <DeptHistoryCard
        currentDepts={[
          makeDept({ deptId: 1, deptName: '인사팀', isPrimary: true, startAt: '2023-01-14' }),
          makeDept({ deptId: 2, deptName: '채용TF', isPrimary: false, startAt: '2025-03-02' }),
        ]}
      />,
    )

    const items = screen.getAllByRole('listitem')
    // 2025-03-02(채용TF)가 2023-01-14(인사팀)보다 먼저 나온다(최신순).
    expect(items[0]).toHaveTextContent('채용TF')
    expect(items[0]).toHaveTextContent('겸직')
    expect(items[1]).toHaveTextContent('인사팀')
    expect(items[1]).toHaveTextContent('주 소속')
  })

  it('소속된 부서가 없으면 안내 문구를 보여준다', () => {
    render(<DeptHistoryCard currentDepts={[]} />)

    expect(screen.getByText('소속된 부서가 없습니다.')).toBeInTheDocument()
  })
})
