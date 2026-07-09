import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { DeptAttendanceRow } from '../model/deptAttendance'
import { DeptAttendanceMonthlyTable } from './DeptAttendanceMonthlyTable'

/**
 * DeptAttendanceMonthlyTable(F305, ROADMAP2 T3.4-a/T4.3) 컴포넌트 테스트.
 *
 * DeptAttendancePendingTable.test.tsx 패턴을 그대로 복제한다: attendanceInfo가 **배열**이라는
 * 계약(DeptAttendanceRow, model/deptAttendance.ts)에 맞춰 컬럼 렌더(사번/이름/직급/요약/상세)와
 * 빈 배열 안내 문구, [수정] 아이콘 버튼(항목별 isApproved===false일 때만 노출) 동작을 검증한다.
 */

function makeItem(overrides: Partial<DeptAttendanceRow['attendanceInfo'][number]> = {}) {
  return {
    attendanceId: 1,
    attendanceStatus: 'NORMAL' as const,
    attendanceDate: '2026-07-01',
    startAt: '09:00:00',
    endAt: '18:00:00',
    isApproved: true,
    draftId: null,
    ...overrides,
  }
}

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
      approvedAttendanceCount: 1,
      pendingAttendanceCount: 0,
      totalAttendanceCount: 1,
      overtimeMinutes: 30,
    },
    attendanceInfo: [makeItem()],
    ...overrides,
  }
}

describe('DeptAttendanceMonthlyTable (F305)', () => {
  it('사번/이름/직급/요약/상세(일자+상태배지)를 한 행에 렌더한다', () => {
    render(<DeptAttendanceMonthlyTable data={[makeRow()]} onEdit={vi.fn()} />)

    expect(screen.getByText('사번')).toBeInTheDocument()
    expect(screen.getByText('이름')).toBeInTheDocument()
    expect(screen.getByText('직급')).toBeInTheDocument()
    expect(screen.getByText('요약')).toBeInTheDocument()
    expect(screen.getByText('상세')).toBeInTheDocument()

    expect(screen.getByText('10000001')).toBeInTheDocument()
    expect(screen.getByText('홍길동')).toBeInTheDocument()
    expect(screen.getByText('팀원')).toBeInTheDocument()
    expect(screen.getByText('07-01 정상')).toBeInTheDocument()
  })

  it('attendanceInfo가 빈 배열이면 상세 셀에 "-"를 표기한다', () => {
    render(<DeptAttendanceMonthlyTable data={[makeRow({ attendanceInfo: [] })]} onEdit={vi.fn()} />)

    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('데이터가 0건이면 "부서원 근태 기록이 없습니다."가 노출되고 표는 렌더되지 않는다', () => {
    render(<DeptAttendanceMonthlyTable data={[]} onEdit={vi.fn()} />)

    expect(screen.getByText('부서원 근태 기록이 없습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('isApproved===true인 항목에는 [수정] 버튼을 렌더하지 않는다', () => {
    render(
      <DeptAttendanceMonthlyTable data={[makeRow({ attendanceInfo: [makeItem({ isApproved: true })] })]} onEdit={vi.fn()} />,
    )

    expect(screen.queryByRole('button', { name: '수정' })).not.toBeInTheDocument()
  })

  it('isApproved===false인 항목에는 [수정] 버튼을 렌더하고, 클릭 시 onEdit가 올바른 AttendanceEditTarget으로 호출된다', async () => {
    const onEdit = vi.fn()
    const user = userEvent.setup()
    render(
      <DeptAttendanceMonthlyTable
        data={[
          makeRow({
            attendanceInfo: [
              makeItem({ isApproved: false, attendanceId: 55, startAt: '10:00:00', endAt: '19:00:00' }),
            ],
          }),
        ]}
        onEdit={onEdit}
      />,
    )

    await user.click(screen.getByRole('button', { name: '수정' }))

    expect(onEdit).toHaveBeenCalledWith({
      targetEmpId: 1,
      attendanceId: 55,
      startAt: '10:00:00',
      endAt: '19:00:00',
    })
  })

  it('한 사원이 여러 항목을 가질 때 미승인 항목에만 [수정] 버튼이 개별적으로 노출된다', () => {
    render(
      <DeptAttendanceMonthlyTable
        data={[
          makeRow({
            attendanceInfo: [
              makeItem({ attendanceId: 1, isApproved: true }),
              makeItem({ attendanceId: 2, isApproved: false }),
            ],
          }),
        ]}
        onEdit={vi.fn()}
      />,
    )

    expect(screen.getAllByRole('button', { name: '수정' })).toHaveLength(1)
  })
})
