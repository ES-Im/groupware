import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { DeptAttendanceRow } from '../model/deptAttendance'
import { DeptAttendanceMemberList } from './DeptAttendanceMemberList'

/**
 * DeptAttendanceMemberList(F305 좌측 사원 목록, DeptAttendanceMonthlyTable(표) 대체) 테스트.
 *
 * 이 컴포넌트는 순수 선택형 리스트다 — [수정] 버튼 등 근태 수정 진입점이 없고(수정은 우측
 * AttendanceCalendar 이벤트 클릭으로 옮겨짐, mapAttendanceToEvents.test.ts 참조), 클릭 시
 * onSelect(empId) 호출과 선택 상태(aria-pressed) 반영만 검증한다.
 */

function makeRow(overrides: Partial<DeptAttendanceRow> = {}): DeptAttendanceRow {
  return {
    empInfo: {
      empId: 1,
      empNo: '10000001',
      empName: '홍길동',
      deptName: '영업부',
      positionName: '팀원',
    },
    summary: {
      approvedAttendanceCount: 3,
      pendingAttendanceCount: 1,
      totalAttendanceCount: 4,
      overtimeMinutes: 90,
    },
    attendanceInfo: [],
    ...overrides,
  }
}

describe('DeptAttendanceMemberList (F305)', () => {
  it('사번/이름/직급/요약(승인·대기·전체·초과근무)을 렌더한다', () => {
    render(<DeptAttendanceMemberList data={[makeRow()]} selectedEmpId={null} onSelect={vi.fn()} />)

    expect(screen.getByText('홍길동')).toBeInTheDocument()
    expect(screen.getByText('10000001 · 팀원')).toBeInTheDocument()
    expect(screen.getByText('승인 3')).toBeInTheDocument()
    expect(screen.getByText('대기 1')).toBeInTheDocument()
    expect(screen.getByText('전체 4')).toBeInTheDocument()
    expect(screen.getByText('초과 1시간 30분')).toBeInTheDocument()
  })

  it('데이터가 0건이면 "부서원 근태 기록이 없습니다."가 노출되고 목록은 렌더되지 않는다', () => {
    render(<DeptAttendanceMemberList data={[]} selectedEmpId={null} onSelect={vi.fn()} />)

    expect(screen.getByText('부서원 근태 기록이 없습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('사원 클릭 시 onSelect가 해당 empId로 호출된다(네비게이션이 아니라 선택만 한다)', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <DeptAttendanceMemberList
        data={[makeRow({ empInfo: { ...makeRow().empInfo, empId: 7 } })]}
        selectedEmpId={null}
        onSelect={onSelect}
      />,
    )

    await user.click(screen.getByRole('button', { name: /홍길동/ }))

    expect(onSelect).toHaveBeenCalledWith(7)
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('selectedEmpId와 일치하는 사원 버튼만 aria-pressed=true다', () => {
    render(
      <DeptAttendanceMemberList
        data={[
          makeRow({ empInfo: { ...makeRow().empInfo, empId: 1, empName: '홍길동' } }),
          makeRow({
            empInfo: { ...makeRow().empInfo, empId: 2, empName: '김철수', empNo: '10000002' },
          }),
        ]}
        selectedEmpId={2}
        onSelect={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /홍길동/ })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: /김철수/ })).toHaveAttribute('aria-pressed', 'true')
  })
})
