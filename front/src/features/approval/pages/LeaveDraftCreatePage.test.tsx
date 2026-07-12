import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useParams } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import {
  DRAFT_PRINT_PREVIEW_STORAGE_KEY,
  type DraftPrintPreviewPayload,
} from '../model/draftPreview'
import { LeaveDraftCreatePage } from './LeaveDraftCreatePage'

/**
 * LeaveDraftCreatePage(F740 `LEAVE_DRAFT_CREATE(_SUBMISSION)`, ROADMAP(LEAVE) T1.3) 회귀 방지
 * 테스트. ③BusinessTripDraftCreatePage(F730)의 폼 로직을 동형 이식한 페이지라 검증 축도 동형이다:
 *   - zod 사전검증(빈 값 제출 시 인라인 에러, 두 버튼 모두 동일 검증) — API 미호출.
 *   - [생성 후 상신] 결재선 0명 클라 가드(root 에러) — API 미호출.
 *   - 정상 입력 + 결재선 1명 지정 후 [임시저장으로 생성] 성공 시 상세로 navigate + 성공 토스트.
 *   - 결재선 행 역할 select(결재/협조): COOPERATOR가 approvers[].role로 실리고, 전원 협조
 *     (APPROVER 0명)면 [생성 후 상신]이 root 에러로 차단된다(생성 API 미호출).
 *   - [기안서 미리보기]: localStorage payload에 approvers[].role·circulations가 적재된다.
 *
 * EmployeePicker(결재선)는 department 도메인의 useDepartmentsQuery/useDepartmentMembersQuery를
 * 그대로 재사용하므로, 이 페이지가 마운트되는 순간 GET /api/departments가 항상 나간다 — 모든
 * 테스트 케이스에서 목이 필요하다(onUnhandledRequest:'error').
 */

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function deptSummary(deptId: number, deptName: string) {
  return {
    deptInfoResponse: {
      deptId,
      deptCode: String(deptId).padStart(3, '0'),
      deptName,
      isActive: true,
      parentDeptId: null,
    },
    deptLeader: { empId: null, empNo: null, empName: null, extensionNo: null, email: null, position: null },
  }
}

function pageOf<T>(items: T[]) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: 0,
    size: 50,
    first: true,
    last: true,
    numberOfElements: items.length,
    empty: items.length === 0,
  }
}

/**
 * EmployeePicker가 항상 마운트 즉시 조회하는 부서 목록 + 부서 선택 후 조회하는 부서원 목록 목.
 * 부서원은 2명(김철수=결재선 선택용, 이영희=공람 선택용)이라 두 필드를 서로 다른 사원으로 채워
 * 결재선 행 버튼과 공람 다이얼로그 버튼의 접근 이름이 충돌하지 않는다.
 */
function mockEmployeePicker() {
  server.use(
    http.get(`${BASE_URL}/api/departments`, () => HttpResponse.json(pageOf([deptSummary(1, '개발팀')]))),
    http.get(`${BASE_URL}/api/departments/1/members`, () =>
      HttpResponse.json(
        pageOf([
          { empId: 101, empNo: 'E101', empName: '김철수', extensionNo: null, email: 'kim@haruon.com', position: '사원' },
          { empId: 102, empNo: 'E102', empName: '이영희', extensionNo: null, email: 'lee@haruon.com', position: '대리' },
        ]),
      ),
    ),
  )
}

function DetailPlaceholder() {
  const { draftId } = useParams()
  return <div>기안 상세 화면 draftId={draftId}</div>
}

/**
 * 유형별 잔여 휴가(MY_EMP_LEAVE_SUMMARY) 목 — 페이지가 마운트 즉시 조회한다
 * (useMyLeaveSummaryQuery). 연차 잔여 = 15 − 0.5 = 14.5일.
 */
function mockMyLeaveSummary() {
  server.use(
    http.get(`${BASE_URL}/api/employees/me/leaves/summary`, () =>
      HttpResponse.json({
        annualBaseGrantDays: 15.0,
        annualUsedDays: 0.5,
        specialGrantDays: 10.0,
        specialUsedDays: 1.0,
        compensatoryGrantDays: 3.0,
        compensatoryUsedDays: 0.0,
      }),
    ),
  )
}

function renderPage() {
  mockMyLeaveSummary()
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/approval/drafts/leaves/new']}>
        <Routes>
          <Route path="/approval/drafts/leaves/new" element={<LeaveDraftCreatePage />} />
          <Route path="/approval/drafts/:draftId" element={<DetailPlaceholder />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/**
 * 테스트 기준 날짜 = 오늘. DatePickerField(shadcn Calendar 팝오버)는 minDate(오늘) 이전을
 * disabled하고 기본으로 이번 달을 펼치므로, 오늘을 고르면 달 네비게이션 없이 항상 클릭 가능하다.
 */
const TODAY = dayjs()
const TODAY_STR = TODAY.format('YYYY-MM-DD')

/** DatePickerField 트리거(라벨 연결 버튼)를 열고 달력(ko locale)에서 해당 날짜를 클릭한다. */
async function pickDate(
  user: ReturnType<typeof userEvent.setup>,
  triggerLabel: RegExp,
  date: dayjs.Dayjs,
) {
  await user.click(screen.getByLabelText(triggerLabel))
  const grid = await screen.findByRole('grid')
  // day 버튼 접근 이름은 ko locale 전체 날짜 표기("2026년 7월 11일 …")라 "M월 D일"로 좁힌다
  // (outside day는 월이 달라 중복되지 않는다).
  await user.click(
    within(grid).getByRole('button', {
      name: new RegExp(`${date.month() + 1}월 ${date.date()}일`),
    }),
  )
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^제목/), '연차 신청')
  // 본문은 유형 필드 기반 자동 입력으로 이미 채워져 있어, 직접 작성 시나리오는 비우고 다시 쓴다
  // (clear/type이 직접 수정으로 간주되어 이후 유형·기간 변경에도 본문이 덮이지 않는다).
  await user.clear(screen.getByLabelText(/^기안 내용/))
  await user.type(screen.getByLabelText(/^기안 내용/), '개인 사정으로 연차를 신청합니다')
  await user.selectOptions(screen.getByLabelText(/휴가 유형/), '연차')
  // 연차(4시간 단위 유형)는 시각 옵션이 반차 경계(시작 09/13, 종료 13/18)로 제한된다 —
  // 시작·종료를 직접 고른다(2026-07-11 폼 개편). 09:00 ~ 18:00 같은 날 = 1.0일(8시간).
  await pickDate(user, /휴가 시작 일시/, TODAY)
  await user.selectOptions(screen.getByLabelText('휴가 시작 시간'), '09')
  await pickDate(user, /휴가 종료 일시/, TODAY)
  await user.selectOptions(screen.getByLabelText('휴가 종료 시간'), '18')
}

/** 결재선 "추가" 버튼(접근 이름 "결재선 추가" — 공람 필드와 구분)으로 Dialog를 연 뒤 부서→부서원을 선택하고 "완료"로 닫는다. */
async function selectOneApprover(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '결재선 추가' }))
  await user.click(await screen.findByRole('button', { name: '개발팀' }))
  await user.click(await screen.findByRole('button', { name: /김철수/ }))
  await user.click(screen.getByRole('button', { name: '완료' }))
}

/**
 * 공람 "추가" 버튼(접근 이름 "공람 (선택) 추가")으로 Dialog를 연 뒤 부서→이영희를 선택하고
 * "완료"로 닫는다. 결재선에 이미 선택된 사원의 행 버튼(제거 등)과 접근 이름이 겹치지 않도록
 * 조회를 열린 다이얼로그 스코프로 한정한다.
 */
async function selectOneCirculation(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '공람 (선택) 추가' }))
  const dialog = await screen.findByRole('dialog')
  await user.click(await within(dialog).findByRole('button', { name: '개발팀' }))
  await user.click(await within(dialog).findByRole('button', { name: /이영희/ }))
  await user.click(within(dialog).getByRole('button', { name: '완료' }))
}

describe('LeaveDraftCreatePage (F740) - zod 사전검증(빈 값)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('빈 값으로 "생성 후 상신"을 눌러도 4개 필드 인라인 에러를 보여주고 API를 호출하지 않는다(본문은 자동 입력이라 비지 않는다)', async () => {
    mockEmployeePicker()
    let leaveCalled = false
    let submissionCalled = false
    server.use(
      http.post(`${BASE_URL}/api/drafts/leaves`, () => {
        leaveCalled = true
        return HttpResponse.json({ draftId: 1 }, { status: 201 })
      }),
      http.post(`${BASE_URL}/api/drafts/leaves/submission`, () => {
        submissionCalled = true
        return HttpResponse.json({ draftId: 1 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '상신' }))

    const alerts = await screen.findAllByRole('alert')
    const alertTexts = alerts.map((el) => el.textContent)
    expect(alertTexts).toContain('제목을 입력해주세요')
    expect(alertTexts).toContain('휴가 유형을 선택해주세요')
    expect(alertTexts).toContain('휴가 시작 일시를 입력해주세요')
    expect(alertTexts).toContain('휴가 종료 일시를 입력해주세요')
    // 본문은 마운트 직후 자동 입력으로 채워지므로(레퍼런스 자동 구성 이식) 빈 값 에러가 뜨지 않는다.
    expect(alertTexts).not.toContain('기안 내용을 입력해주세요')
    expect(leaveCalled).toBe(false)
    expect(submissionCalled).toBe(false)
  })

  it('빈 값으로 "임시저장으로 생성"을 눌러도 동일한 zod 사전검증을 통과해야 하며 API를 호출하지 않는다', async () => {
    mockEmployeePicker()
    let leaveCalled = false
    server.use(
      http.post(`${BASE_URL}/api/drafts/leaves`, () => {
        leaveCalled = true
        return HttpResponse.json({ draftId: 1 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '임시저장' }))

    const alerts = await screen.findAllByRole('alert')
    expect(alerts.map((el) => el.textContent)).toContain('제목을 입력해주세요')
    expect(leaveCalled).toBe(false)
  })
})

describe('LeaveDraftCreatePage (F740) - [생성 후 상신] 결재선 0명 클라 가드', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('필드는 정상 입력했지만 결재선을 0명 지정한 채 "생성 후 상신"을 누르면 root 에러가 뜨고 API를 호출하지 않는다', async () => {
    mockEmployeePicker()
    let leaveCalled = false
    let submissionCalled = false
    server.use(
      http.post(`${BASE_URL}/api/drafts/leaves`, () => {
        leaveCalled = true
        return HttpResponse.json({ draftId: 1 }, { status: 201 })
      }),
      http.post(`${BASE_URL}/api/drafts/leaves/submission`, () => {
        submissionCalled = true
        return HttpResponse.json({ draftId: 1 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: '상신' }))

    expect(
      await screen.findByText('상신하려면 결재선에 최소 1명을 지정해주세요'),
    ).toBeInTheDocument()
    expect(leaveCalled).toBe(false)
    expect(submissionCalled).toBe(false)
  })
})

describe('LeaveDraftCreatePage (F740) - 기안 내용 자동 입력(레퍼런스 이식)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('마운트 직후 본문이 자동 구성되고, 유형·시작을 채우면 자동 계산된 종료까지 본문에 반영된다', async () => {
    mockEmployeePicker()
    const user = userEvent.setup()
    renderPage()

    const content = screen.getByLabelText(/^기안 내용/)
    expect(content).toHaveValue(
      '[연가 신청]\n휴가 유형: -\n휴가 기간: - ~ -\n업무 인수인계 후 휴가를 신청합니다.',
    )

    await user.selectOptions(screen.getByLabelText(/휴가 유형/), '특별휴가')
    // 특별휴가(4시간 단위 유형)는 시작·종료를 반차 경계에서 직접 고르며, 그 조합으로 계산된
    // 사용 일수(09~18 = 1.0일)가 본문 "사용 일수" 줄에 자동 반영된다(2026-07-11 폼 개편).
    await pickDate(user, /휴가 시작 일시/, TODAY)
    await user.selectOptions(screen.getByLabelText('휴가 시작 시간'), '09')
    await pickDate(user, /휴가 종료 일시/, TODAY)
    await user.selectOptions(screen.getByLabelText('휴가 종료 시간'), '18')

    await waitFor(() =>
      expect(content).toHaveValue(
        `[연가 신청]\n휴가 유형: 특별휴가\n휴가 기간: ${TODAY_STR} 09:00 ~ ${TODAY_STR} 18:00\n사용 일수: 1.0일\n업무 인수인계 후 휴가를 신청합니다.`,
      ),
    )
  })

  it('본문을 직접 수정한 뒤에는 유형 필드를 바꿔도 본문이 덮이지 않는다', async () => {
    mockEmployeePicker()
    const user = userEvent.setup()
    renderPage()

    const content = screen.getByLabelText(/^기안 내용/)
    await user.clear(content)
    await user.type(content, '직접 작성한 본문')
    await user.selectOptions(screen.getByLabelText(/휴가 유형/), '병가')

    expect(content).toHaveValue('직접 작성한 본문')
  })
})

describe('LeaveDraftCreatePage (F740) - 정상 입력 + 결재선 1명 + [임시저장으로 생성] 해피패스', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('성공(201 {draftId}) 시 param 중첩 구조로 요청을 보내고 상세로 navigate하며 성공 토스트를 띄운다', async () => {
    mockEmployeePicker()
    let registeredBody: Record<string, unknown> | undefined
    server.use(
      http.post(`${BASE_URL}/api/drafts/leaves`, async ({ request }) => {
        registeredBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ draftId: 55 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await fillValidForm(user)
    await selectOneApprover(user)
    await user.click(screen.getByRole('button', { name: '임시저장' }))

    await waitFor(() =>
      expect(registeredBody).toEqual({
        param: {
          title: '연차 신청',
          content: '개인 사정으로 연차를 신청합니다',
          approvers: [{ approverId: 101, role: 'APPROVER', order: 1 }],
        },
        startAt: `${TODAY_STR}T09:00:00`,
        endAt: `${TODAY_STR}T18:00:00`,
        leaveType: 'ANNUAL',
      }),
    )

    expect(await screen.findByText('기안 상세 화면 draftId=55')).toBeInTheDocument()
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('휴가 기안서를 임시저장했습니다')
  })
})

describe('LeaveDraftCreatePage (F740) - 결재선 행 역할 select(결재/협조)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('결재선 1명의 역할을 협조로 바꾸고 "임시저장으로 생성"하면 approvers[0].role이 COOPERATOR로 실린다', async () => {
    mockEmployeePicker()
    let registeredBody: Record<string, unknown> | undefined
    server.use(
      http.post(`${BASE_URL}/api/drafts/leaves`, async ({ request }) => {
        registeredBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ draftId: 60 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await fillValidForm(user)
    await selectOneApprover(user)
    await user.selectOptions(screen.getByLabelText('김철수 역할 선택'), 'COOPERATOR')
    await user.click(screen.getByRole('button', { name: '임시저장' }))

    await waitFor(() => expect(registeredBody).toBeDefined())
    expect(registeredBody?.param).toMatchObject({
      approvers: [{ approverId: 101, role: 'COOPERATOR', order: 1 }],
    })
    // 역할만 바뀌었을 뿐 생성 성공 흐름(상세 navigate)은 그대로 유지된다.
    expect(await screen.findByText('기안 상세 화면 draftId=60')).toBeInTheDocument()
  })

  it('결재선 전원이 협조(APPROVER 0명)면 "생성 후 상신" 시 root 에러가 뜨고 생성 API를 호출하지 않는다', async () => {
    mockEmployeePicker()
    let leaveCalled = false
    let submissionCalled = false
    server.use(
      http.post(`${BASE_URL}/api/drafts/leaves`, () => {
        leaveCalled = true
        return HttpResponse.json({ draftId: 1 }, { status: 201 })
      }),
      http.post(`${BASE_URL}/api/drafts/leaves/submission`, () => {
        submissionCalled = true
        return HttpResponse.json({ draftId: 1 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await fillValidForm(user)
    await selectOneApprover(user)
    await user.selectOptions(screen.getByLabelText('김철수 역할 선택'), 'COOPERATOR')
    await user.click(screen.getByRole('button', { name: '상신' }))

    expect(
      await screen.findByText('상신하려면 결재 역할의 결재자가 최소 1명 필요합니다'),
    ).toBeInTheDocument()
    expect(leaveCalled).toBe(false)
    expect(submissionCalled).toBe(false)
  })
})

describe('LeaveDraftCreatePage (F740) - [기안서 미리보기] localStorage 핸드오프(role·공람 포함)', () => {
  afterEach(() => {
    // window.open spy는 restore로 원복하고, 미리보기 payload가 다른 테스트로 새지 않게 키를 지운다.
    vi.clearAllMocks()
    vi.restoreAllMocks()
    localStorage.removeItem(DRAFT_PRINT_PREVIEW_STORAGE_KEY)
  })

  it('협조 결재자 + 공람자를 지정한 뒤 미리보기를 누르면 payload에 approvers[].role과 circulations가 적재된다', async () => {
    mockEmployeePicker()
    // jsdom은 window.open 미구현 — 새 창 오픈은 스파이로 대체하고 호출 계약만 검증한다.
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)
    const user = userEvent.setup()
    renderPage()

    await selectOneApprover(user)
    await user.selectOptions(screen.getByLabelText('김철수 역할 선택'), 'COOPERATOR')
    await selectOneCirculation(user)
    await user.click(screen.getByRole('button', { name: '기안서 미리보기' }))

    const raw = localStorage.getItem(DRAFT_PRINT_PREVIEW_STORAGE_KEY)
    expect(raw).not.toBeNull()
    const payload = JSON.parse(raw as string) as DraftPrintPreviewPayload
    expect(payload.approvers).toEqual([{ empId: 101, empName: '김철수', role: 'COOPERATOR' }])
    expect(payload.circulations).toEqual([{ empId: 102, empName: '이영희' }])
    expect(openSpy).toHaveBeenCalledWith('/approval/drafts/preview', '_blank', 'noopener,noreferrer')
  })
})
