import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
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
 *
 * `totalElements` prop(부모가 넘기는 서버 전체 미승인 건수) 추가와 상태 필터(select, controlled
 * prop)·행 체크박스·전체선택(indeterminate)·일괄 승인 기능 확장분 테스트를 하단에 추가한다.
 *
 * 상태 필터는 이 컴포넌트 로컬 상태가 아니다(서버 사이드 필터 예정, DeptAttendancePendingTable.tsx
 * JSDoc 참고) — `status`/`onStatusChange` controlled prop만 검증하고, `data` 자체를 필터링하는
 * 책임은 이 컴포넌트에 없다(호출부/서버 책임).
 */

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function makeRow(
  overrides: Partial<DeptPendingRow['attendanceInfo']> = {},
  empOverrides: Partial<DeptPendingRow['empInfo']> = {},
): DeptPendingRow {
  return {
    empInfo: {
      empId: 1,
      empNo: '10000001',
      empName: '홍길동',
      deptName: '영업부',
      positionName: '팀원',
      ...empOverrides,
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

/**
 * totalElements 기본값은 data.length(대부분 테스트에서 서버 총건수=현재 페이지 건수로 충분).
 * status/onStatusChange는 상위(DeptAttendancePage)가 소유하는 서버 사이드 필터 상태를 그대로
 * 흉내낸 controlled prop이다. 기본값은 필터 미적용(undefined) + no-op 콜백이며, 필터 관련
 * 테스트에서만 명시적으로 override한다.
 */
function renderTable(
  data: DeptPendingRow[],
  onEdit = vi.fn(),
  totalElements = data.length,
  status: 'LATE_EARLY' | 'ABSENT' | undefined = undefined,
  onStatusChange = vi.fn(),
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <DeptAttendancePendingTable
        data={data}
        totalElements={totalElements}
        onEdit={onEdit}
        status={status}
        onStatusChange={onStatusChange}
      />
    </QueryClientProvider>,
  )
  return { onEdit, onStatusChange }
}

describe('DeptAttendancePendingTable (F306)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('사번/이름/직급/일자/상태배지/출근/퇴근을 한 행에 렌더한다', () => {
    renderTable([makeRow()])
    // 상태 필터 select의 <option>도 동일한 상태 라벨("지각/조퇴")을 렌더하므로, 표 영역으로 쿼리
    // 범위를 좁혀 배지 텍스트와의 중복 매치를 피한다.
    const table = within(screen.getByRole('table'))

    expect(table.getByText('사번')).toBeInTheDocument()
    expect(table.getByText('이름')).toBeInTheDocument()
    expect(table.getByText('직급')).toBeInTheDocument()
    expect(table.getByText('일자')).toBeInTheDocument()
    expect(table.getByText('상태')).toBeInTheDocument()
    expect(table.getByText('출근')).toBeInTheDocument()
    expect(table.getByText('퇴근')).toBeInTheDocument()

    expect(table.getByText('10000001')).toBeInTheDocument()
    expect(table.getByText('홍길동')).toBeInTheDocument()
    expect(table.getByText('팀원')).toBeInTheDocument()
    expect(table.getByText('2026-07-01')).toBeInTheDocument()
    expect(table.getByText('지각/조퇴')).toBeInTheDocument()
    expect(table.getByText('10:15')).toBeInTheDocument()
    expect(table.getByText('18:30')).toBeInTheDocument()
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

  describe('미승인 총건수 표시(totalElements)', () => {
    it('data.length가 아니라 totalElements(서버 전체 기준)를 그대로 표시한다', () => {
      renderTable([makeRow({ attendanceId: 1 }, { empId: 1, empName: '지각자1' })], vi.fn(), 30)

      expect(
        screen.getByText((_, element) => element?.textContent === '미승인 30건'),
      ).toBeInTheDocument()
    })
  })

  describe('상태 필터(서버 사이드 select, T3.4-b 확장)', () => {
    it('status가 undefined면 필터 select 값이 "전체"(빈 문자열)다', () => {
      renderTable([makeRow({ attendanceId: 1 }, { empId: 1, empName: '지각자' })])

      expect(screen.getByLabelText('근태 상태 필터')).toHaveValue('')
    })

    it('select에서 "지각/조퇴"를 선택하면 onStatusChange가 LATE_EARLY로 호출된다(데이터를 직접 거르지 않는다)', async () => {
      const user = userEvent.setup()
      const { onStatusChange } = renderTable(
        [
          makeRow({ attendanceId: 1, attendanceStatus: 'LATE_EARLY' }, { empId: 1, empName: '지각자' }),
          makeRow({ attendanceId: 2, attendanceStatus: 'ABSENT' }, { empId: 2, empName: '결근자' }),
        ],
      )

      await user.selectOptions(screen.getByLabelText('근태 상태 필터'), '지각/조퇴')

      expect(onStatusChange).toHaveBeenCalledWith('LATE_EARLY')
      // 필터링은 서버(호출부) 책임이라 data를 그대로 넘기면 이 컴포넌트는 재필터링하지 않는다.
      expect(screen.getByText('지각자')).toBeInTheDocument()
      expect(screen.getByText('결근자')).toBeInTheDocument()
    })

    it('select에서 "전체"를 선택하면 onStatusChange가 undefined로 호출된다', async () => {
      const user = userEvent.setup()
      const { onStatusChange } = renderTable(
        [makeRow({ attendanceId: 1, attendanceStatus: 'ABSENT' }, { empId: 1, empName: '결근자' })],
        vi.fn(),
        1,
        'ABSENT',
      )

      await user.selectOptions(screen.getByLabelText('근태 상태 필터'), '전체')

      expect(onStatusChange).toHaveBeenCalledWith(undefined)
    })

    it('status가 설정된 상태에서 data가 빈 배열이면 "선택한 상태의 승인 대기 근태가 없습니다."가 노출되고, 필터 select는 계속 렌더된다', () => {
      renderTable([], vi.fn(), 30, 'LATE_EARLY')

      expect(screen.getByText('선택한 상태의 승인 대기 근태가 없습니다.')).toBeInTheDocument()
      expect(
        screen.getByText((_, element) => element?.textContent === '미승인 30건'),
      ).toBeInTheDocument()
      // data가 비어도 필터를 해제(전체 선택)할 수 있어야 하므로 select는 숨기지 않는다.
      expect(screen.getByLabelText('근태 상태 필터')).toBeInTheDocument()
    })
  })

  describe('행 체크박스/전체선택(T3.4-b 확장)', () => {
    it('행 체크박스를 선택하면 "선택 N건 일괄 승인" 버튼의 건수·활성화 상태가 갱신된다', async () => {
      const user = userEvent.setup()
      renderTable([
        makeRow({ attendanceId: 1 }, { empId: 1, empName: '지각자1' }),
        makeRow({ attendanceId: 2 }, { empId: 2, empName: '지각자2' }),
      ])

      expect(screen.getByRole('button', { name: '선택 0건 일괄 승인' })).toBeDisabled()

      await user.click(screen.getByRole('checkbox', { name: '지각자1 근태 선택' }))

      expect(screen.getByRole('button', { name: '선택 1건 일괄 승인' })).not.toBeDisabled()
    })

    it('isApproved===true인 행은 체크박스가 비활성화되어 선택할 수 없다', () => {
      renderTable([makeRow({ attendanceId: 1, isApproved: true }, { empId: 1, empName: '승인됨' })])

      expect(screen.getByRole('checkbox', { name: '승인됨 근태 선택' })).toBeDisabled()
    })

    it('전체선택 체크박스: 일부만 선택 시 indeterminate, 전체 선택/해제 시 각각 checked/unchecked가 된다', async () => {
      const user = userEvent.setup()
      renderTable([
        makeRow({ attendanceId: 1 }, { empId: 1, empName: '지각자1' }),
        makeRow({ attendanceId: 2 }, { empId: 2, empName: '지각자2' }),
      ])

      expect(screen.getByRole('checkbox', { name: '전체 선택' })).not.toBeChecked()

      await user.click(screen.getByRole('checkbox', { name: '지각자1 근태 선택' }))
      expect(screen.getByRole('checkbox', { name: '전체 선택' })).toBePartiallyChecked()

      await user.click(screen.getByRole('checkbox', { name: '전체 선택' }))
      expect(screen.getByRole('checkbox', { name: '지각자1 근태 선택' })).toBeChecked()
      expect(screen.getByRole('checkbox', { name: '지각자2 근태 선택' })).toBeChecked()

      await user.click(screen.getByRole('checkbox', { name: '전체 선택' }))
      expect(screen.getByRole('checkbox', { name: '지각자1 근태 선택' })).not.toBeChecked()
      expect(screen.getByRole('checkbox', { name: '지각자2 근태 선택' })).not.toBeChecked()
    })

    it('전체선택 체크박스는 선택 가능한(미승인) 행이 없으면 비활성화된다', () => {
      renderTable([makeRow({ attendanceId: 1, isApproved: true }, { empId: 1, empName: '승인됨' })])

      expect(screen.getByRole('checkbox', { name: '전체 선택' })).toBeDisabled()
    })
  })

  describe('일괄 승인(T3.4-b 확장)', () => {
    it('선택 0건이면 일괄 승인 버튼이 비활성화된다', () => {
      renderTable([makeRow({ attendanceId: 1 }, { empId: 1, empName: '지각자1' })])

      expect(screen.getByRole('button', { name: '선택 0건 일괄 승인' })).toBeDisabled()
    })

    it('일괄 승인 클릭 시 선택된 각 attendanceId에 대해 승인 요청이 개별적으로 전송된다', async () => {
      const approvedIds: number[] = []
      server.use(
        http.patch(`${BASE_URL}/api/employees/attendances/:attendanceId/approval`, ({ params }) => {
          approvedIds.push(Number(params.attendanceId))
          return new HttpResponse(null, { status: 204 })
        }),
      )
      const user = userEvent.setup()
      renderTable([
        makeRow({ attendanceId: 1 }, { empId: 1, empName: '지각자1' }),
        makeRow({ attendanceId: 2 }, { empId: 2, empName: '지각자2' }),
      ])

      await user.click(screen.getByRole('checkbox', { name: '전체 선택' }))
      await user.click(screen.getByRole('button', { name: '선택 2건 일괄 승인' }))

      await waitFor(() => expect(approvedIds.sort()).toEqual([1, 2]))
    })
  })
})
