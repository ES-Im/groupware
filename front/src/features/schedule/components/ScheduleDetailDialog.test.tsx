import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { ScheduleDetailResponse } from '../lib/scheduleTypes'
import { ScheduleDetailDialog } from './ScheduleDetailDialog'

/**
 * ScheduleDetailDialog(ROADMAP(SCHEDULE) T2.2, SCHEDULE_DETAIL) 회귀 방지 테스트.
 * - 4개 scheduleType 전부 조회 전용으로 기본 필드가 렌더된다.
 * - 액션 영역(schedule-detail-actions)은 MANUAL + isEditable + 미취소 조합에서만 DOM에 나타난다.
 * - (T4.3) 인라인 ScheduleEditForm: 전환/프리필, 취소, 저장(scope 쿼리·성공 시 재조회), 제출 중
 *   다이얼로그 닫힘 방지, 서버 검증 실패 표시.
 */
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// radix-ui RadioGroupItem(react-use-size)이 크기 관측에 ResizeObserver를 쓰는데 jsdom에는 구현이
// 없다. no-op 스텁으로 충분하다(전역 setup 수정 금지 제약에 따라 테스트 파일 로컬로만 주입,
// FranchiseSalesPage.test.tsx 선례와 동일 패턴).
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

/**
 * canManage=true 조합(MANUAL+isEditable+미취소)에서는 항상 노출되는 참여자 추가 섹션이
 * EmployeePicker를 마운트해 GET /api/departments를 즉시 호출한다. MSW onUnhandledRequest:'error'
 * 정책상 목이 없으면 콘솔 에러가 찍히므로(선례: MeetingParticipantsReplaceDialog.test.tsx의
 * mockDeptPickers), canManage=true가 되는 모든 테스트가 renderDialog() 이전에 이 헬퍼를 호출한다.
 * 개발팀(deptId=1)에 소유자(empId=100 김철수)+신규후보(301 이민수), 영업팀(deptId=2)에 기존
 * 참여자(empId=201 박영희)+신규후보(302 최유진)를 배치해, T5.2 disabledEmpIds 검증(소유자·기존
 * 참여자가 부서원 목록에서 disabled로 렌더되는지)까지 이 하나의 헬퍼로 커버한다.
 */
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

/**
 * 참여자 제외 섹션(T5.3) 테스트 전용 상세 오버라이드. 공용 detail()의 기본 participants(영업팀
 * 박영희 1명)만으로는 소유자 행(disabled+"(소유자)")을 검증할 수 없다(소유자 empId=100 김철수가
 * participants 배열에 없음) — 소유자 본인을 참여자로 포함시키고, 다건 선택(participantIds 배열)
 * 검증을 위한 두 번째 비소유자(302 최유진)를 추가한다.
 */
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

describe('ScheduleDetailDialog - 타입별 기본 필드 렌더', () => {
  it.each([
    ['MANUAL', 'MANUAL'],
    ['MEETING', 'MEETING'],
    ['LEAVE', 'LEAVE'],
    ['BUSINESS_TRIP', 'BUSINESS_TRIP'],
  ] as const)('scheduleType=%s일 때 제목/내용/날짜 등 기본 필드가 렌더된다', async (_label, scheduleType) => {
    mockDetail(1, detail({ scheduleType }))
    mockDeptPickers() // scheduleType=MANUAL 케이스는 canManage=true라 참여자 추가 섹션이 마운트된다.

    renderDialog()

    expect(await screen.findByText('팀 회의 일정')).toBeInTheDocument()
    expect(screen.getByText('주간 스크럼 진행')).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`${scheduleType} · 개발팀 김철수`))).toBeInTheDocument()
    expect(screen.getByText(/2026-07-15 10:00:00~11:00:00/)).toBeInTheDocument()
    expect(screen.getByText('참여자 1명')).toBeInTheDocument()
    // canManage=true(MANUAL)면 참여자 제외 섹션(T5.3)도 같은 참여자명을 체크리스트로 렌더하므로
    // 조회 전용 참여자 목록(schedule-detail-participants)으로 스코프해 유일하게 매칭한다.
    expect(within(screen.getByTestId('schedule-detail-participants')).getByText('영업팀 박영희')).toBeInTheDocument()
  })
})

describe('ScheduleDetailDialog - 액션 영역 게이팅', () => {
  it('MANUAL + isEditable=true + isCanceled=false면 schedule-detail-actions가 나타난다', async () => {
    mockDetail(1, detail({ scheduleType: 'MANUAL', isEditable: true, isCanceled: false }))
    mockDeptPickers()

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

describe('ScheduleDetailDialog - 수정 폼 전환/프리필', () => {
  it('수정 버튼을 클릭하면 인라인 폼으로 전환되고 조회 값으로 프리필된다', async () => {
    mockDetail(1, detail())
    mockDeptPickers()
    const user = userEvent.setup()
    renderDialog()

    await user.click(await screen.findByRole('button', { name: '수정' }))

    expect(screen.getByLabelText('제목')).toHaveValue('팀 회의 일정')
    expect(screen.getByLabelText('내용')).toHaveValue('주간 스크럼 진행')
    expect(screen.getByLabelText('시작 시각')).toHaveValue('10:00:00')
    expect(screen.getByLabelText('종료 시각')).toHaveValue('11:00:00')
    expect(screen.getByRole('radio', { name: /일정 수정 적용 범위:\s*이 날짜만/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /일정 수정 적용 범위:\s*동일 일정 전체/ })).not.toBeChecked()
  })

  it('취소 버튼을 클릭하면 폼이 닫히고 변경사항이 저장되지 않는다', async () => {
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

    await user.click(await screen.findByRole('button', { name: '수정' }))
    await user.clear(screen.getByLabelText('제목'))
    await user.type(screen.getByLabelText('제목'), '변경해볼 제목')
    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(await screen.findByRole('button', { name: '수정' })).toBeInTheDocument()
    expect(screen.getByText('팀 회의 일정')).toBeInTheDocument()
    expect(screen.queryByLabelText('제목')).not.toBeInTheDocument()
    expect(patchCalled).toBe(false)
  })
})

describe('ScheduleDetailDialog - 수정 저장', () => {
  it('저장 시 scope=SINGLE(기본값) 쿼리와 함께 PATCH하고, 성공하면 폼이 닫히고 상세가 재조회된다', async () => {
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

    await user.click(await screen.findByRole('button', { name: '수정' }))
    await waitFor(() => expect(getCallCount).toBe(1))

    await user.clear(screen.getByLabelText('제목'))
    await user.type(screen.getByLabelText('제목'), '수정된 제목')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(patchUrl).toBeDefined())
    expect(new URL(patchUrl as string).searchParams.get('scope')).toBe('SINGLE')
    expect(patchBody).toEqual({
      title: '수정된 제목',
      content: '주간 스크럼 진행',
      startAt: '10:00:00',
      endAt: '11:00:00',
    })

    expect(await screen.findByRole('button', { name: '수정' })).toBeInTheDocument()
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

    await user.click(await screen.findByRole('button', { name: '수정' }))
    await user.click(screen.getByRole('radio', { name: /일정 수정 적용 범위:\s*동일 일정 전체/ }))
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(scopeParam).toBe('SERIES'))
  })

  it('저장 실패(400 VALIDATION_ERROR) 시 폼에 에러 메시지가 표시되고 폼이 유지된다', async () => {
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

    await user.click(await screen.findByRole('button', { name: '수정' }))
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

    await user.click(await screen.findByRole('button', { name: '수정' }))
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '저장' })).toBeDisabled())
    await user.keyboard('{Escape}')
    expect(onOpenChange).not.toHaveBeenCalledWith(false)

    resolvePatch?.()

    expect(await screen.findByRole('button', { name: '수정' })).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})

describe('ScheduleDetailDialog - 참여자 추가(ROADMAP(SCHEDULE) T5.2, SCHEDULE_PARTICIPANTS_ADD)', () => {
  it('참여자 추가 섹션은 수정 폼 토글과 무관하게 항상 렌더된다', async () => {
    mockDetail(1, detail())
    mockDeptPickers()
    const user = userEvent.setup()
    renderDialog()

    // "참여자 추가"는 섹션 헤딩(p)과 버튼(button) 양쪽에 동일 텍스트가 있어 selector로 헤딩만 좁힌다.
    expect(await screen.findByText('참여자 추가', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText('부서')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '수정' }))

    // 수정 폼이 펼쳐진 뒤에도 참여자 추가 섹션은 토글 없이 그대로 남아있다.
    expect(screen.getByText('참여자 추가', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByLabelText('제목')).toBeInTheDocument()
  })

  it('부서→부서원을 선택하기 전에는 참여자 추가 버튼이 비활성이고, 선택하면 활성화된다', async () => {
    mockDetail(1, detail())
    mockDeptPickers()
    const user = userEvent.setup()
    renderDialog()

    // "참여자 추가" 텍스트는 헤딩·버튼 양쪽에 있어, 곧바로 상호작용할 버튼을 기준으로 로드를 기다린다.
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

    // "참여자 추가" 텍스트는 헤딩·버튼 양쪽에 있어, 곧바로 상호작용할 버튼을 기준으로 로드를 기다린다.
    await screen.findByRole('button', { name: '참여자 추가' })

    await user.click(await screen.findByRole('button', { name: '개발팀' }))
    // ownerId=100(김철수)은 소유자라 disabled, 같은 부서 신규후보(301 이민수)는 선택 가능하다.
    expect(await screen.findByRole('button', { name: /김철수/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /이민수/ })).not.toBeDisabled()

    await user.click(await screen.findByRole('button', { name: '영업팀' }))
    // empId=201(박영희)은 이미 참여 중이라 disabled, 같은 부서 신규후보(302 최유진)는 선택 가능하다.
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

    // "참여자 추가" 텍스트는 헤딩·버튼 양쪽에 있어, 곧바로 상호작용할 버튼을 기준으로 로드를 기다린다.
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

    // 선택 목록이 초기화되어 칩이 사라지고 버튼이 다시 비활성으로 돌아간다.
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

    // "참여자 추가" 텍스트는 헤딩·버튼 양쪽에 있어, 곧바로 상호작용할 버튼을 기준으로 로드를 기다린다.
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

    // "참여자 추가" 텍스트는 헤딩·버튼 양쪽에 있어, 곧바로 상호작용할 버튼을 기준으로 로드를 기다린다.
    await screen.findByRole('button', { name: '참여자 추가' })
    await user.click(await screen.findByRole('button', { name: '개발팀' }))
    await user.click(await screen.findByRole('button', { name: /이민수/ }))
    await user.click(screen.getByRole('button', { name: '참여자 추가' }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('이미 참여 중인 사원입니다'))

    // 폼이 아니라 버튼 액션이라 setError 대상이 없다(handleApiError가 토스트로만 처리) — 선택 칩은
    // 그대로 남아 있어 재시도할 수 있다.
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

    await screen.findByText('참여자 제외', { selector: 'p' })
    await waitFor(() => expect(getCallCount).toBe(1))

    await user.click(screen.getByRole('checkbox', { name: '영업팀 박영희' }))
    await user.click(screen.getByRole('button', { name: '참여자 제외' }))

    await waitFor(() => expect(getCallCount).toBeGreaterThanOrEqual(2))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('참여자를 제외했습니다'))

    // 선택이 초기화되어(setSelectedEmpIds([])) 버튼이 다시 비활성으로 돌아간다.
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

    // toast.success는 vi.mock('sonner')로 파일 전역에 공유되는 mock이라 앞선 describe 블록들(수정
    // 저장·참여자 추가 성공)의 호출 이력이 이미 누적돼 있다 — 이 테스트에서 새로 호출됐는지만 보려면
    // 액션 전 호출 횟수를 기준선으로 잡아 이후 증가하지 않았는지로 판정해야 한다.
    const { toast } = await import('sonner')
    const successCallCountBefore = vi.mocked(toast.success).mock.calls.length

    await screen.findByText('참여자 제외', { selector: 'p' })
    const memberCheckbox = screen.getByRole('checkbox', { name: '영업팀 박영희' })
    await user.click(memberCheckbox)
    await user.click(screen.getByRole('button', { name: '참여자 제외' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('일정 소유자는 제외할 수 없습니다'))
    expect(vi.mocked(toast.success).mock.calls.length).toBe(successCallCountBefore)

    // 폼이 아니라 버튼 액션이라 setError 대상이 없다(handleApiError가 토스트로만 처리) — 체크박스는
    // 그대로 선택된 채 남아 있어 재시도할 수 있다.
    expect(memberCheckbox).toBeChecked()
    expect(screen.getByRole('button', { name: '참여자 제외' })).not.toBeDisabled()
  })
})

describe('ScheduleDetailDialog - 일정 취소(ROADMAP(SCHEDULE) T6.2, SCHEDULE_CANCEL)', () => {
  it('participantCount>1이면 취소 버튼이 disabled이고 안내 문구가 보이며, participantCount=1이면 활성 상태다', async () => {
    mockDetail(1, detail({ participantCount: 2 }))
    mockDeptPickers()
    renderDialog()

    await screen.findByText('일정 취소', { selector: 'p' })
    expect(screen.getByText('참가자를 먼저 제외해야 취소할 수 있습니다.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '일정 취소' })).toBeDisabled()
  })

  it('participantCount=1(소유자만)이면 취소 버튼이 활성 상태이고 안내 문구가 없다', async () => {
    mockDetail(1, detail({ participantCount: 1 }))
    mockDeptPickers()
    renderDialog()

    await screen.findByText('일정 취소', { selector: 'p' })
    expect(screen.queryByText('참가자를 먼저 제외해야 취소할 수 있습니다.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '일정 취소' })).not.toBeDisabled()
  })

  it('취소 버튼을 클릭하면 확인 다이얼로그가 열리고, 취소 확정 버튼과 scope 라디오(SINGLE 기본)가 보인다', async () => {
    mockDetail(1, detail({ participantCount: 1 }))
    mockDeptPickers()
    const user = userEvent.setup()
    renderDialog()

    await screen.findByText('일정 취소', { selector: 'p' })
    await user.click(screen.getByRole('button', { name: '일정 취소' }))

    expect(await screen.findByText('일정을 취소하시겠습니까?')).toBeInTheDocument()
    expect(screen.getByText('취소한 일정은 되돌릴 수 없습니다.')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /일정 취소 적용 범위:\s*이 날짜만/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /일정 취소 적용 범위:\s*동일 일정 전체/ })).not.toBeChecked()
    expect(screen.getByRole('button', { name: '돌아가기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '취소 확정' })).toBeInTheDocument()
  })

  it('취소 확정 클릭 시 scope=SINGLE(기본값) 쿼리로 PATCH하고, 요청 본문은 없다', async () => {
    mockDetail(1, detail({ participantCount: 1 }))
    mockDeptPickers()
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

    await screen.findByText('일정 취소', { selector: 'p' })
    await user.click(screen.getByRole('button', { name: '일정 취소' }))
    await screen.findByText('일정을 취소하시겠습니까?')
    await user.click(screen.getByRole('button', { name: '취소 확정' }))

    await waitFor(() => expect(patchUrl).toBeDefined())
    expect(new URL(patchUrl as string).searchParams.get('scope')).toBe('SINGLE')
    expect(patchBodyText!).toBe('')
  })

  it("적용 범위를 '동일 일정 전체'로 선택하고 확정하면 scope=SERIES 쿼리로 PATCH된다", async () => {
    mockDetail(1, detail({ participantCount: 1 }))
    mockDeptPickers()
    let scopeParam: string | null = null
    server.use(
      http.patch(`${BASE_URL}/api/schedules/1/cancellation`, async ({ request }) => {
        scopeParam = new URL(request.url).searchParams.get('scope')
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    await screen.findByText('일정 취소', { selector: 'p' })
    await user.click(screen.getByRole('button', { name: '일정 취소' }))
    await screen.findByText('일정을 취소하시겠습니까?')
    await user.click(screen.getByRole('radio', { name: /일정 취소 적용 범위:\s*동일 일정 전체/ }))
    await user.click(screen.getByRole('button', { name: '취소 확정' }))

    await waitFor(() => expect(scopeParam).toBe('SERIES'))
  })

  it('성공(204) 시 성공 토스트가 뜨고 onOpenChange(false)가 호출되어 다이얼로그가 닫힌다', async () => {
    mockDetail(1, detail({ participantCount: 1 }))
    mockDeptPickers()
    server.use(
      http.patch(`${BASE_URL}/api/schedules/1/cancellation`, () => new HttpResponse(null, { status: 204 })),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await screen.findByText('일정 취소', { selector: 'p' })
    await user.click(screen.getByRole('button', { name: '일정 취소' }))
    await screen.findByText('일정을 취소하시겠습니까?')
    await user.click(screen.getByRole('button', { name: '취소 확정' }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('일정을 취소했습니다'))
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it('실패(400 VALIDATION_ERROR) 시 에러 토스트만 뜨고 다이얼로그는 닫히지 않는다', async () => {
    mockDetail(1, detail({ participantCount: 1 }))
    mockDeptPickers()
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

    // toast.success는 vi.mock('sonner')로 파일 전역에 공유되는 mock이라 앞선 describe 블록들의 호출
    // 이력이 이미 누적돼 있다 — 이 테스트에서 새로 호출됐는지만 보려면 액션 전 호출 횟수를 기준선으로
    // 잡아 이후 증가하지 않았는지로 판정해야 한다.
    const { toast } = await import('sonner')
    const successCallCountBefore = vi.mocked(toast.success).mock.calls.length

    await screen.findByText('일정 취소', { selector: 'p' })
    await user.click(screen.getByRole('button', { name: '일정 취소' }))
    await screen.findByText('일정을 취소하시겠습니까?')
    await user.click(screen.getByRole('button', { name: '취소 확정' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('참가자가 있어 취소할 수 없습니다'))
    expect(vi.mocked(toast.success).mock.calls.length).toBe(successCallCountBefore)
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
