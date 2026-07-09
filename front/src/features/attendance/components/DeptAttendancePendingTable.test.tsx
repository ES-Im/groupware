import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { DeptPendingRow } from '../model/deptAttendance'
import { DeptAttendancePendingTable } from './DeptAttendancePendingTable'

/**
 * DeptAttendancePendingTable(F306, ROADMAP2 T3.4-b/T4.3/T4.4) 컴포넌트 테스트.
 *
 * DeptAttendanceMonthlyTable(T3.4-a)에 대응하는 테스트가 아직 없어 신규로 작성한다. attendanceInfo가
 * 단건 객체라는 계약(DeptPendingRow, model/deptAttendance.ts)에 맞춰 컬럼 렌더(사번/이름/직급/일자/
 * 상태배지/출근/퇴근)와 빈 배열 안내 문구만 검증한다(정렬은 이 태스크 범위 밖).
 * [수정] 액션 버튼(T4.3)은 onEdit prop이 새로 필수가 되어 아래 케이스를 추가한다.
 *
 * T4.4(F308)부터 이 컴포넌트가 `useApproveAttendanceMutation`을 내부에서 직접 호출하므로
 * (컴포넌트 최상단 참조), 모든 렌더는 QueryClientProvider로 감싸야 한다("No QueryClient set" 회피).
 * MSW 핸들러/에러 토스트 검증은 useApproveAttendanceMutation.test.tsx의 표준 패턴을 그대로 재사용한다.
 */

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function makeRow(overrides: Partial<DeptPendingRow['attendanceInfo']> = {}): DeptPendingRow {
  return {
    empInfo: {
      empId: 1,
      empNo: '10000001',
      empName: '홍길동',
      deptName: '영업부',
      positionName: '팀원',
    },
    attendanceInfo: {
      attendanceId: 101,
      attendanceStatus: 'LATE_EARLY',
      attendanceDate: '2026-07-01',
      startAt: '10:15:00',
      endAt: '18:30:00',
      isApproved: false,
      draftId: null,
      ...overrides,
    },
  }
}

function renderTable(data: DeptPendingRow[], onEdit = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <DeptAttendancePendingTable data={data} onEdit={onEdit} />
    </QueryClientProvider>,
  )
  return { onEdit }
}

describe('DeptAttendancePendingTable (F306)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('사번/이름/직급/일자/상태배지/출근/퇴근을 한 행에 렌더한다', () => {
    renderTable([makeRow()])

    expect(screen.getByText('사번')).toBeInTheDocument()
    expect(screen.getByText('이름')).toBeInTheDocument()
    expect(screen.getByText('직급')).toBeInTheDocument()
    expect(screen.getByText('일자')).toBeInTheDocument()
    expect(screen.getByText('상태')).toBeInTheDocument()
    expect(screen.getByText('출근')).toBeInTheDocument()
    expect(screen.getByText('퇴근')).toBeInTheDocument()

    expect(screen.getByText('10000001')).toBeInTheDocument()
    expect(screen.getByText('홍길동')).toBeInTheDocument()
    expect(screen.getByText('팀원')).toBeInTheDocument()
    expect(screen.getByText('2026-07-01')).toBeInTheDocument()
    expect(screen.getByText('지각/조퇴')).toBeInTheDocument()
    expect(screen.getByText('10:15')).toBeInTheDocument()
    expect(screen.getByText('18:30')).toBeInTheDocument()
  })

  it('startAt/endAt이 null이면 "-"로 표기한다', () => {
    renderTable([makeRow({ startAt: null, endAt: null })])

    const dashes = screen.getAllByText('-')
    expect(dashes).toHaveLength(2)
  })

  it('데이터가 0건이면 "승인 대기 중인 근태가 없습니다."가 노출되고 표 헤더는 렌더되지 않는다', () => {
    renderTable([])

    expect(screen.getByText('승인 대기 중인 근태가 없습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('isApproved===true인 행은 [수정]/[승인] 버튼을 렌더하지 않는다', () => {
    renderTable([makeRow({ isApproved: true })])

    expect(screen.queryByRole('button', { name: '수정' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '승인' })).not.toBeInTheDocument()
  })

  it('isApproved===false인 행은 [수정] 버튼을 렌더하고, 클릭 시 onEdit가 올바른 AttendanceEditTarget으로 호출된다', async () => {
    const user = userEvent.setup()
    const { onEdit } = renderTable([
      makeRow({ isApproved: false, attendanceId: 101, startAt: '10:15:00', endAt: '18:30:00' }),
    ])

    await user.click(screen.getByRole('button', { name: '수정' }))

    expect(onEdit).toHaveBeenCalledWith({
      targetEmpId: 1,
      attendanceId: 101,
      startAt: '10:15:00',
      endAt: '18:30:00',
    })
  })

  describe('[승인] 버튼(F308, T4.4)', () => {
    it('isApproved===false인 행은 [승인] 버튼을 렌더한다', () => {
      renderTable([makeRow({ isApproved: false })])

      expect(screen.getByRole('button', { name: '승인' })).toBeInTheDocument()
    })

    it('[승인] 클릭 시 attendanceId(path)·targetEmpId·approvedAt이 올바르게 전달되고 성공 토스트가 노출된다', async () => {
      let capturedTargetEmpId: string | null = null
      let capturedApprovedAt: string | null = null
      server.use(
        http.patch(`${BASE_URL}/api/employees/attendances/101/approval`, ({ request }) => {
          const url = new URL(request.url)
          capturedTargetEmpId = url.searchParams.get('targetEmpId')
          capturedApprovedAt = url.searchParams.get('approvedAt')
          return new HttpResponse(null, { status: 204 })
        }),
      )
      const user = userEvent.setup()
      renderTable([makeRow({ isApproved: false, attendanceId: 101 })])

      await user.click(screen.getByRole('button', { name: '승인' }))

      const { toast } = await import('sonner')
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith('근태를 승인했습니다'))
      expect(capturedTargetEmpId).toBe('1')
      expect(capturedApprovedAt).not.toBeNull()
      expect(capturedApprovedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
      expect(toast.error).not.toHaveBeenCalled()
    })

    it('서버 에러(이미 승인된 근태 재승인 시도) 시 에러 토스트가 노출된다', async () => {
      server.use(
        http.patch(`${BASE_URL}/api/employees/attendances/101/approval`, () =>
          HttpResponse.json(
            {
              code: 'ATTENDANCE_ALREADY_APPROVED',
              name: 'ATTENDANCE_ALREADY_APPROVED',
              httpStatus: 400,
              message: '이미 승인된 근태입니다',
            },
            { status: 400 },
          ),
        ),
      )
      const user = userEvent.setup()
      renderTable([makeRow({ isApproved: false, attendanceId: 101 })])

      await user.click(screen.getByRole('button', { name: '승인' }))

      const { toast } = await import('sonner')
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('이미 승인된 근태입니다'))
      expect(toast.success).not.toHaveBeenCalled()
    })

    it('요청이 in-flight인 동안 [승인] 버튼이 비활성화된다', async () => {
      let resolveResponse: (() => void) | undefined
      const gate = new Promise<void>((resolve) => {
        resolveResponse = resolve
      })
      server.use(
        http.patch(`${BASE_URL}/api/employees/attendances/101/approval`, async () => {
          await gate
          return new HttpResponse(null, { status: 204 })
        }),
      )
      const user = userEvent.setup()
      renderTable([makeRow({ isApproved: false, attendanceId: 101 })])

      await user.click(screen.getByRole('button', { name: '승인' }))

      await waitFor(() => expect(screen.getByRole('button', { name: '승인' })).toBeDisabled())

      resolveResponse?.()
      await waitFor(() => expect(screen.getByRole('button', { name: '승인' })).not.toBeDisabled())
    })
  })
})
