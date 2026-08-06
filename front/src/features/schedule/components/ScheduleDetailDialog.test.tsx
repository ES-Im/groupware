import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { ScheduleDetailResponse } from '../lib/scheduleTypes'
import { ScheduleDetailDialog } from './ScheduleDetailDialog'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
}

function detail(overrides: Partial<ScheduleDetailResponse> = {}): ScheduleDetailResponse {
  return {
    scheduleId: 1,
    scheduleType: 'MANUAL',
    ownerId: 100,
    ownerDeptName: '개발팀',
    ownerEmpName: '김철수',
    isEditable: true,
    title: '팀 회의 일정',
    content: '주간 스크럼 진행',
    scheduleDate: '2026-07-15',
    startAt: '10:00:00',
    endAt: '11:00:00',
    isAllDay: false,
    isCanceled: false,
    participantCount: 1,
    participants: [{ empId: 201, deptName: '영업팀', empName: '박영희' }],
    ...overrides,
  }
}

function mockDetail(scheduleId: number, response: ScheduleDetailResponse) {
  server.use(http.get(`${BASE_URL}/api/schedules/${scheduleId}`, () => HttpResponse.json(response)))
}

function pageOf(items: unknown[]) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: 0,
    size: 50,
    numberOfElements: items.length,
    first: true,
    last: true,
    empty: items.length === 0,
  }
}

function deptSummary(deptId: number, deptName: string) {
  return {
    deptInfoResponse: { deptId, deptCode: String(deptId).padStart(3, '0'), deptName, isActive: true, parentDeptId: null },
    deptLeader: { empId: null, empNo: null, empName: null, extensionNo: null, email: null, position: null },
  }
}

function member(empId: number, empName: string) {
  return { empId, empNo: `E${empId}`, empName, extensionNo: null, email: `${empName}@haruon.com`, position: '사원' }
}

function mockDeptPickers() {
  server.use(
    http.get(`${BASE_URL}/api/departments`, () =>
      HttpResponse.json(pageOf([deptSummary(1, '개발팀'), deptSummary(2, '영업팀')])),
    ),
    http.get(`${BASE_URL}/api/departments/1/members`, () =>
      HttpResponse.json(pageOf([member(100, '김철수'), member(301, '이민수')])),
    ),
    http.get(`${BASE_URL}/api/departments/2/members`, () =>
      HttpResponse.json(pageOf([member(201, '박영희'), member(302, '최유진')])),
    ),
  )
}

function removeSectionDetail(overrides: Partial<ScheduleDetailResponse> = {}) {
  return detail({
    participants: [
      { empId: 100, deptName: '개발팀', empName: '김철수' },
      { empId: 201, deptName: '영업팀', empName: '박영희' },
      { empId: 302, deptName: '영업팀', empName: '최유진' },
    ],
    participantCount: 3,
    ...overrides,
  })
}

function renderDialog(scheduleId = 1, { open = true, onOpenChange = vi.fn() } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return {
    onOpenChange,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ScheduleDetailDialog scheduleId={scheduleId} open={open} onOpenChange={onOpenChange} />
      </QueryClientProvider>,
    ),
  }
}

async function openEditView(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: '참여자 수정' }))
}

async function openContentEdit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: '본문 수정' }))
}

async function openDatetimeEdit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: '일시 변경' }))
}

describe('ScheduleDetailDialog - 타입별 기본 필드 렌더', () => {
  it.each([
    ['MANUAL', 'MANUAL'],
    ['MEETING', 'MEETING'],
    ['LEAVE', 'LEAVE'],
    ['BUSINESS_TRIP', 'BUSINESS_TRIP'],
  ] as const)('scheduleType=%s일 때 제목/내용/날짜 등 기본 필드가 렌더된다', async (_label, scheduleType) => {
    mockDetail(1, detail({ scheduleType }))

    renderDialog()

    expect(await screen.findByText('팀 회의 일정')).toBeInTheDocument()
    expect(screen.getByText('주간 스크럼 진행')).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`${scheduleType} · 개발팀 김철수`))).toBeInTheDocument()
    expect(screen.getByText(/2026-07-15 10:00:00~11:00:00/)).toBeInTheDocument()
    expect(screen.getByText('참여자 1명')).toBeInTheDocument()
    expect(within(screen.getByTestId('schedule-detail-participants')).getByText('영업팀 박영희')).toBeInTheDocument()
  })
})

describe('ScheduleDetailDialog - 액션 영역 게이팅', () => {
  it('MANUAL + isEditable=true + isCanceled=false면 schedule-detail-actions가 나타난다', async () => {
    mockDetail(1, detail({ scheduleType: 'MANUAL', isEditable: true, isCanceled: false }))

    renderDialog()

    expect(await screen.findByText('팀 회의 일정')).toBeInTheDocument()
    expect(screen.getByTestId('schedule-detail-actions')).toBeInTheDocument()
  })

  it('MANUAL이지만 isEditable=false면 schedule-detail-actions가 나타나지 않는다', async () => {
    mockDetail(1, detail({ scheduleType: 'MANUAL', isEditable: false, isCanceled: false }))

    renderDialog()

    expect(await screen.findByText('팀 회의 일정')).toBeInTheDocument()
    expect(screen.queryByTestId('schedule-detail-actions')).not.toBeInTheDocument()
  })

  it('MANUAL + isEditable=true지만 isCanceled=true면 schedule-detail-actions가 나타나지 않는다', async () => {
    mockDetail(1, detail({ scheduleType: 'MANUAL', isEditable: true, isCanceled: true }))

    renderDialog()

    expect(await screen.findByText('팀 회의 일정')).toBeInTheDocument()
    expect(screen.queryByTestId('schedule-detail-actions')).not.toBeInTheDocument()
  })

  it('MEETING + isEditable=true + isCanceled=false여도 schedule-detail-actions가 나타나지 않는다', async () => {
    mockDetail(1, detail({ scheduleType: 'MEETING', isEditable: true, isCanceled: false }))

    renderDialog()

    expect(await screen.findByText('팀 회의 일정')).toBeInTheDocument()
    expect(screen.queryByTestId('schedule-detail-actions')).not.toBeInTheDocument()
  })
})

describe('ScheduleDetailDialog - 수정 뷰 전환/프리필', () => {
  it('본문 수정을 클릭하면 조회 값(제목/내용)으로 프리필된다', async () => {
    mockDetail(1, detail())
    const user = userEvent.setup()
    renderDialog()

    await openContentEdit(user)

    expect(screen.getByLabelText('제목')).toHaveValue('팀 회의 일정')
    expect(screen.getByLabelText('내용')).toHaveValue('주간 스크럼 진행')
    expect(screen.getByRole('radio', { name: /본문 수정 적용 범위:\s*이 날짜만/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /본문 수정 적용 범위:\s*동일 일정 전체/ })).not.toBeChecked()
  })

  it('일시 변경을 클릭하면 날짜는 읽기전용, 시각은 분 단위로 프리필되고 저장 시 HH:mm:ss로 전송된다', async () => {
    let patchUrl: string | undefined
    let patchBody: unknown
    server.use(
      http.get(`${BASE_URL}/api/schedules/1`, () => HttpResponse.json(detail())),
      http.patch(`${BASE_URL}/api/schedules/1`, async ({ request }) => {
        patchUrl = request.url
        patchBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    await openDatetimeEdit(user)

    expect(screen.getByLabelText('시작 시각')).toHaveValue('10:00')
    expect(screen.getByLabelText('종료 시각')).toHaveValue('11:00')
    expect(screen.getAllByText('2026-07-15').length).toBeGreaterThanOrEqual(2)

    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(patchUrl).toBeDefined())
    expect(patchBody).toEqual({ startAt: '10:00:00', endAt: '11:00:00' })
  })

  it('뒤로를 클릭하면 수정 뷰가 닫히고 변경사항이 저장되지 않는다', async () => {
    mockDetail(1, detail())
    mockDeptPickers()
    let patchCalled = false
    server.use(
      http.patch(`${BASE_URL}/api/schedules/1`, () => {
        patchCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    await openContentEdit(user)
    await user.clear(screen.getByLabelText('제목'))
    await user.type(screen.getByLabelText('제목'), '변경해볼 제목')
    await user.click(screen.getAllByRole('button', { name: '뒤로' })[0])

    expect(await screen.findByRole('button', { name: '본문 수정' })).toBeInTheDocument()
    expect(screen.getByText('팀 회의 일정')).toBeInTheDocument()
    expect(screen.queryByLabelText('제목')).not.toBeInTheDocument()
    expect(patchCalled).toBe(false)
  })
})

describe('ScheduleDetailDialog - 수정 저장', () => {
  it('저장 시 scope=SINGLE(기본값) 쿼리와 함께 PATCH하고, 성공하면 조회 뷰로 돌아가고 상세가 재조회된다', async () => {
    mockDeptPickers()
    let getCallCount = 0
    server.use(
      http.get(`${BASE_URL}/api/schedules/1`, () => {
        getCallCount += 1
        return HttpResponse.json(detail())
      }),
    )
    let patchUrl: string | undefined
    let patchBody: unknown
    server.use(
      http.patch(`${BASE_URL}/api/schedules/1`, async ({ request }) => {
        patchUrl = request.url
        patchBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    await openContentEdit(user)
    await waitFor(() => expect(getCallCount).toBe(1))

    await user.clear(screen.getByLabelText('제목'))
    await user.type(screen.getByLabelText('제목'), '수정된 제목')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(patchUrl).toBeDefined())
    expect(new URL(patchUrl as string).searchParams.get('scope')).toBe('SINGLE')
    expect(patchBody).toEqual({
      title: '수정된 제목',
      content: '주간 스크럼 진행',
    })

    expect(await screen.findByRole('button', { name: '본문 수정' })).toBeInTheDocument()
    await waitFor(() => expect(getCallCount).toBeGreaterThanOrEqual(2))

    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('일정이 수정되었습니다')
  })

  it("적용 범위를 '동일 일정 전체'로 선택하면 scope=SERIES 쿼리로 저장된다", async () => {
    mockDetail(1, detail())
    mockDeptPickers()
    let scopeParam: string | null = null
    server.use(
      http.patch(`${BASE_URL}/api/schedules/1`, async ({ request }) => {
        scopeParam = new URL(request.url).searchParams.get('scope')
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    await openContentEdit(user)
    await user.click(screen.getByRole('radio', { name: /본문 수정 적용 범위:\s*동일 일정 전체/ }))
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(scopeParam).toBe('SERIES'))
  })

  it('저장 실패(400 VALIDATION_ERROR) 시 폼에 에러 메시지가 표시되고 수정 뷰가 유지된다', async () => {
    mockDetail(1, detail())
    mockDeptPickers()
    server.use(
      http.patch(`${BASE_URL}/api/schedules/1`, () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_ERROR',
            name: 'VALIDATION_ERROR',
            httpStatus: 400,
            message: '종료 시각은 시작 시각보다 이후여야 합니다',
          },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await openContentEdit(user)
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('종료 시각은 시작 시각보다 이후여야 합니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})

describe('ScheduleDetailDialog - 수정 제출 중 다이얼로그 닫힘 방지', () => {
  it('저장 요청이 진행 중일 때 Esc를 눌러도 다이얼로그가 닫히지 않는다', async () => {
    mockDetail(1, detail())
    mockDeptPickers()
    let resolvePatch: (() => void) | undefined
    const gate = new Promise<void>((resolve) => {
      resolvePatch = resolve
    })
    server.use(
      http.patch(`${BASE_URL}/api/schedules/1`, async () => {
        await gate
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await openContentEdit(user)
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '저장' })).toBeDisabled())
    await user.keyboard('{Escape}')
    expect(onOpenChange).not.toHaveBeenCalledWith(false)

    resolvePatch?.()

    expect(await screen.findByRole('button', { name: '본문 수정' })).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})

describe('ScheduleDetailDialog - 참여자 추가(ROADMAP(SCHEDULE) T5.2, SCHEDULE_PARTICIPANTS_ADD)', () => {
  it('참여자 수정을 클릭하면 참여자 추가/제외 섹션이 렌더된다', async () => {
    mockDetail(1, detail())
    mockDeptPickers()
    const user = userEvent.setup()
    renderDialog()

    await openEditView(user)

    expect(screen.getByText('참여자 추가', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText('참여자 제외', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText('부서')).toBeInTheDocument()
  })

  it('부서→부서원을 선택하기 전에는 참여자 추가 버튼이 비활성이고, 선택하면 활성화된다', async () => {
    mockDetail(1, detail())
    mockDeptPickers()
    const user = userEvent.setup()
    renderDialog()

    await openEditView(user)
    await screen.findByRole('button', { name: '참여자 추가' })
    expect(screen.getByRole('button', { name: '참여자 추가' })).toBeDisabled()

    await user.click(await screen.findByRole('button', { name: '개발팀' }))
    await user.click(await screen.findByRole('button', { name: /이민수/ }))

    expect(screen.getByRole('button', { name: '참여자 추가' })).not.toBeDisabled()
  })

  it('소유자와 기존 참여자는 부서원 목록에서 선택 불가(disabled)로 렌더된다', async () => {
    mockDetail(1, detail())
    mockDeptPickers()
    const user = userEvent.setup()
    renderDialog()

    await openEditView(user)
    await screen.findByRole('button', { name: '참여자 추가' })

    await user.click(await screen.findByRole('button', { name: '개발팀' }))
    expect(await screen.findByRole('button', { name: /김철수/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /이민수/ })).not.toBeDisabled()

    await user.click(await screen.findByRole('button', { name: '영업팀' }))
    expect(await screen.findByRole('button', { name: /박영희/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /최유진/ })).not.toBeDisabled()
  })

  it('참여자 추가 버튼 클릭 시 scope=SINGLE(기본값) 쿼리로 POST하고, 성공하면 상세가 재조회되고 선택이 초기화된다', async () => {
    mockDeptPickers()
    let getCallCount = 0
    server.use(
      http.get(`${BASE_URL}/api/schedules/1`, () => {
        getCallCount += 1
        return HttpResponse.json(detail())
      }),
    )
    let postUrl: string | undefined
    let postBody: unknown
    server.use(
      http.post(`${BASE_URL}/api/schedules/1/participants`, async ({ request }) => {
        postUrl = request.url
        postBody = await request.json()
        return new HttpResponse(null, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    await openEditView(user)
    await screen.findByRole('button', { name: '참여자 추가' })
    await waitFor(() => expect(getCallCount).toBe(1))

    await user.click(await screen.findByRole('button', { name: '개발팀' }))
    await user.click(await screen.findByRole('button', { name: /이민수/ }))
    await user.click(screen.getByRole('button', { name: '참여자 추가' }))

    await waitFor(() => expect(postUrl).toBeDefined())
    expect(new URL(postUrl as string).searchParams.get('scope')).toBe('SINGLE')
    expect(postBody).toEqual({ participantIds: [301] })

    await waitFor(() => expect(getCallCount).toBeGreaterThanOrEqual(2))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('참여자를 추가했습니다'))

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: '이민수 선택 해제' })).not.toBeInTheDocument(),
    )
    expect(screen.getByRole('button', { name: '참여자 추가' })).toBeDisabled()
  })

  it("적용 범위를 '동일 일정 전체'로 선택하면 scope=SERIES 쿼리로 POST된다", async () => {
    mockDetail(1, detail())
    mockDeptPickers()
    let scopeParam: string | null = null
    server.use(
      http.post(`${BASE_URL}/api/schedules/1/participants`, async ({ request }) => {
        scopeParam = new URL(request.url).searchParams.get('scope')
        return new HttpResponse(null, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    await openEditView(user)
    await screen.findByRole('button', { name: '참여자 추가' })
    await user.click(await screen.findByRole('button', { name: '개발팀' }))
    await user.click(await screen.findByRole('button', { name: /이민수/ }))
    await user.click(
      screen.getByRole('radio', { name: /참여자 추가 적용 범위:\s*동일 일정 전체/ }),
    )
    await user.click(screen.getByRole('button', { name: '참여자 추가' }))

    await waitFor(() => expect(scopeParam).toBe('SERIES'))
  })

  it('추가 실패(400 VALIDATION_ERROR) 시 에러 토스트만 뜨고 선택 목록은 유지된다(재시도 가능)', async () => {
    mockDetail(1, detail())
    mockDeptPickers()
    server.use(
      http.post(`${BASE_URL}/api/schedules/1/participants`, () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_ERROR',
            name: 'VALIDATION_ERROR',
            httpStatus: 400,
            message: '이미 참여 중인 사원입니다',
          },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderDialog()

    await openEditView(user)
    await screen.findByRole('button', { name: '참여자 추가' })
    await user.click(await screen.findByRole('button', { name: '개발팀' }))
    await user.click(await screen.findByRole('button', { name: /이민수/ }))
    await user.click(screen.getByRole('button', { name: '참여자 추가' }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('이미 참여 중인 사원입니다'))

    expect(screen.getByRole('button', { name: '이민수 선택 해제' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '참여자 추가' })).not.toBeDisabled()
  })
})

describe('ScheduleDetailDialog - 참여자 제외(ROADMAP(SCHEDULE) T5.3, SCHEDULE_PARTICIPANTS_REMOVE)', () => {
  it('소유자 체크박스는 disabled이고 라벨에 (소유자)가 붙으며, 다른 참여자는 정상 클릭 가능하다', async () => {
    mockDetail(1, removeSectionDetail())
    mockDeptPickers()
    const user = userEvent.setup()
    renderDialog()

    await openEditView(user)
    await screen.findByText('참여자 제외', { selector: 'p' })

    const ownerCheckbox = screen.getByRole('checkbox', { name: '개발팀 김철수 (소유자)' })
    expect(ownerCheckbox).toBeDisabled()
    expect(ownerCheckbox).not.toBeChecked()

    const memberCheckbox = screen.getByRole('checkbox', { name: '영업팀 박영희' })
    expect(memberCheckbox).not.toBeDisabled()

    await user.click(memberCheckbox)
    expect(memberCheckbox).toBeChecked()
  })

  it('선택한 참여자들이 PATCH 요청 바디(participantIds)에 담기고, scope는 기본값 SINGLE로 전송된다', async () => {
    mockDetail(1, removeSectionDetail())
    mockDeptPickers()
    let patchUrl: string | undefined
    let patchBody: unknown
    server.use(
      http.patch(`${BASE_URL}/api/schedules/1/participants`, async ({ request }) => {
        patchUrl = request.url
        patchBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    await openEditView(user)
    await screen.findByText('참여자 제외', { selector: 'p' })
    await user.click(screen.getByRole('checkbox', { name: '영업팀 박영희' }))
    await user.click(screen.getByRole('checkbox', { name: '영업팀 최유진' }))
    await user.click(screen.getByRole('button', { name: '참여자 제외' }))

    await waitFor(() => expect(patchUrl).toBeDefined())
    expect(new URL(patchUrl as string).searchParams.get('scope')).toBe('SINGLE')
    expect(patchBody).toEqual({ participantIds: [201, 302] })
  })

  it("적용 범위를 '동일 일정 전체'로 선택하면 scope=SERIES 쿼리로 PATCH된다", async () => {
    mockDetail(1, removeSectionDetail())
    mockDeptPickers()
    let scopeParam: string | null = null
    server.use(
      http.patch(`${BASE_URL}/api/schedules/1/participants`, async ({ request }) => {
        scopeParam = new URL(request.url).searchParams.get('scope')
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    await openEditView(user)
    await screen.findByText('참여자 제외', { selector: 'p' })
    await user.click(screen.getByRole('checkbox', { name: '영업팀 박영희' }))
    await user.click(screen.getByRole('radio', { name: /참여자 제외 적용 범위:\s*동일 일정 전체/ }))
    await user.click(screen.getByRole('button', { name: '참여자 제외' }))

    await waitFor(() => expect(scopeParam).toBe('SERIES'))
  })

  it('성공(204) 시 상세가 재조회되고 성공 토스트가 뜨며, 선택이 초기화되어 버튼이 다시 비활성화된다', async () => {
    mockDeptPickers()
    let getCallCount = 0
    server.use(
      http.get(`${BASE_URL}/api/schedules/1`, () => {
        getCallCount += 1
        return HttpResponse.json(removeSectionDetail())
      }),
    )
    server.use(
      http.patch(`${BASE_URL}/api/schedules/1/participants`, () => new HttpResponse(null, { status: 204 })),
    )
    const user = userEvent.setup()
    renderDialog()

    await openEditView(user)
    await screen.findByText('참여자 제외', { selector: 'p' })
    await waitFor(() => expect(getCallCount).toBe(1))

    await user.click(screen.getByRole('checkbox', { name: '영업팀 박영희' }))
    await user.click(screen.getByRole('button', { name: '참여자 제외' }))

    await waitFor(() => expect(getCallCount).toBeGreaterThanOrEqual(2))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('참여자를 제외했습니다'))

    expect(screen.getByRole('button', { name: '참여자 제외' })).toBeDisabled()
  })

  it('실패(400 VALIDATION_ERROR) 시 에러 토스트만 뜨고 선택 상태는 유지된다(재시도 가능)', async () => {
    mockDetail(1, removeSectionDetail())
    mockDeptPickers()
    server.use(
      http.patch(`${BASE_URL}/api/schedules/1/participants`, () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_ERROR',
            name: 'VALIDATION_ERROR',
            httpStatus: 400,
            message: '일정 소유자는 제외할 수 없습니다',
          },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderDialog()

    const { toast } = await import('sonner')
    const successCallCountBefore = vi.mocked(toast.success).mock.calls.length

    await openEditView(user)
    await screen.findByText('참여자 제외', { selector: 'p' })
    const memberCheckbox = screen.getByRole('checkbox', { name: '영업팀 박영희' })
    await user.click(memberCheckbox)
    await user.click(screen.getByRole('button', { name: '참여자 제외' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('일정 소유자는 제외할 수 없습니다'))
    expect(vi.mocked(toast.success).mock.calls.length).toBe(successCallCountBefore)

    expect(memberCheckbox).toBeChecked()
    expect(screen.getByRole('button', { name: '참여자 제외' })).not.toBeDisabled()
  })
})

describe('ScheduleDetailDialog - 일정 삭제(ROADMAP(SCHEDULE) T6.2, SCHEDULE_CANCEL, 소프트 취소)', () => {
  it('participantCount>1이면 일정 삭제 버튼이 disabled이고 안내 문구가 보인다', async () => {
    mockDetail(1, detail({ participantCount: 2 }))
    renderDialog()

    expect(await screen.findByRole('button', { name: '일정 삭제' })).toBeDisabled()
    expect(screen.getByText('참가자를 먼저 제외해야 삭제할 수 있습니다.')).toBeInTheDocument()
  })

  it('participantCount=1(소유자만)이면 일정 삭제 버튼이 활성 상태이고 안내 문구가 없다', async () => {
    mockDetail(1, detail({ participantCount: 1 }))
    renderDialog()

    expect(await screen.findByRole('button', { name: '일정 삭제' })).not.toBeDisabled()
    expect(screen.queryByText('참가자를 먼저 제외해야 삭제할 수 있습니다.')).not.toBeInTheDocument()
  })

  it('일정 삭제 버튼을 클릭하면 확인 다이얼로그가 열리고, 삭제 버튼과 scope 라디오(SINGLE 기본)가 보인다', async () => {
    mockDetail(1, detail({ participantCount: 1 }))
    const user = userEvent.setup()
    renderDialog()

    await user.click(await screen.findByRole('button', { name: '일정 삭제' }))

    expect(await screen.findByText('일정을 삭제하시겠습니까?')).toBeInTheDocument()
    expect(screen.getByText('삭제한 일정은 되돌릴 수 없습니다.')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /일정 삭제 적용 범위:\s*이 날짜만/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /일정 삭제 적용 범위:\s*동일 일정 전체/ })).not.toBeChecked()
    expect(screen.getByRole('button', { name: '돌아가기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()
  })

  it('삭제 확정 클릭 시 scope=SINGLE(기본값) 쿼리로 PATCH하고, 요청 본문은 없다', async () => {
    mockDetail(1, detail({ participantCount: 1 }))
    let patchUrl: string | undefined
    let patchBodyText: string
    server.use(
      http.patch(`${BASE_URL}/api/schedules/1/cancellation`, async ({ request }) => {
        patchUrl = request.url
        patchBodyText = await request.text()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    await user.click(await screen.findByRole('button', { name: '일정 삭제' }))
    await screen.findByText('일정을 삭제하시겠습니까?')
    await user.click(screen.getByRole('button', { name: '삭제' }))

    await waitFor(() => expect(patchUrl).toBeDefined())
    expect(new URL(patchUrl as string).searchParams.get('scope')).toBe('SINGLE')
    expect(patchBodyText!).toBe('')
  })

  it("적용 범위를 '동일 일정 전체'로 선택하고 확정하면 scope=SERIES 쿼리로 PATCH된다", async () => {
    mockDetail(1, detail({ participantCount: 1 }))
    let scopeParam: string | null = null
    server.use(
      http.patch(`${BASE_URL}/api/schedules/1/cancellation`, async ({ request }) => {
        scopeParam = new URL(request.url).searchParams.get('scope')
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    await user.click(await screen.findByRole('button', { name: '일정 삭제' }))
    await screen.findByText('일정을 삭제하시겠습니까?')
    await user.click(screen.getByRole('radio', { name: /일정 삭제 적용 범위:\s*동일 일정 전체/ }))
    await user.click(screen.getByRole('button', { name: '삭제' }))

    await waitFor(() => expect(scopeParam).toBe('SERIES'))
  })

  it('성공(204) 시 성공 토스트가 뜨고 onOpenChange(false)가 호출되어 다이얼로그가 닫힌다', async () => {
    mockDetail(1, detail({ participantCount: 1 }))
    server.use(
      http.patch(`${BASE_URL}/api/schedules/1/cancellation`, () => new HttpResponse(null, { status: 204 })),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.click(await screen.findByRole('button', { name: '일정 삭제' }))
    await screen.findByText('일정을 삭제하시겠습니까?')
    await user.click(screen.getByRole('button', { name: '삭제' }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('일정을 삭제했습니다'))
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it('실패(400 VALIDATION_ERROR) 시 에러 토스트만 뜨고 다이얼로그는 닫히지 않는다', async () => {
    mockDetail(1, detail({ participantCount: 1 }))
    server.use(
      http.patch(`${BASE_URL}/api/schedules/1/cancellation`, () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_ERROR',
            name: 'VALIDATION_ERROR',
            httpStatus: 400,
            message: '참가자가 있어 취소할 수 없습니다',
          },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    const { toast } = await import('sonner')
    const successCallCountBefore = vi.mocked(toast.success).mock.calls.length

    await user.click(await screen.findByRole('button', { name: '일정 삭제' }))
    await screen.findByText('일정을 삭제하시겠습니까?')
    await user.click(screen.getByRole('button', { name: '삭제' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('참가자가 있어 취소할 수 없습니다'))
    expect(vi.mocked(toast.success).mock.calls.length).toBe(successCallCountBefore)
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
