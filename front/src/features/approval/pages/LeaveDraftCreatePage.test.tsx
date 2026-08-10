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

const TODAY = dayjs()
const TODAY_STR = TODAY.format('YYYY-MM-DD')

async function pickDate(
  user: ReturnType<typeof userEvent.setup>,
  triggerLabel: RegExp,
  date: dayjs.Dayjs,
) {
  await user.click(screen.getByLabelText(triggerLabel))
  const grid = await screen.findByRole('grid')
  await user.click(
    within(grid).getByRole('button', {
      name: new RegExp(`${date.month() + 1}월 ${date.date()}일`),
    }),
  )
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^제목/), '연차 신청')
  await user.clear(screen.getByLabelText(/^기안 내용/))
  await user.type(screen.getByLabelText(/^기안 내용/), '개인 사정으로 연차를 신청합니다')
  await user.selectOptions(screen.getByLabelText(/휴가 유형/), '연차')
  await pickDate(user, /휴가 시작 일시/, TODAY)
  await user.selectOptions(screen.getByLabelText('휴가 시작 시간'), '09')
  await pickDate(user, /휴가 종료 일시/, TODAY)
  await user.selectOptions(screen.getByLabelText('휴가 종료 시간'), '18')
}

async function selectOneApprover(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '결재선 추가' }))
  await user.click(await screen.findByRole('button', { name: '개발팀' }))
  await user.click(await screen.findByRole('button', { name: /김철수/ }))
  await user.click(screen.getByRole('button', { name: '완료' }))
}

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
        return HttpResponse.json({ id: 1 }, { status: 201 })
      }),
      http.post(`${BASE_URL}/api/drafts/leaves/submission`, () => {
        submissionCalled = true
        return HttpResponse.json({ id: 1 }, { status: 201 })
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
        return HttpResponse.json({ id: 1 }, { status: 201 })
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
        return HttpResponse.json({ id: 1 }, { status: 201 })
      }),
      http.post(`${BASE_URL}/api/drafts/leaves/submission`, () => {
        submissionCalled = true
        return HttpResponse.json({ id: 1 }, { status: 201 })
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
        return HttpResponse.json({ id: 55 }, { status: 201 })
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
        return HttpResponse.json({ id: 60 }, { status: 201 })
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
    expect(await screen.findByText('기안 상세 화면 draftId=60')).toBeInTheDocument()
  })

  it('결재선 전원이 협조(APPROVER 0명)면 "생성 후 상신" 시 root 에러가 뜨고 생성 API를 호출하지 않는다', async () => {
    mockEmployeePicker()
    let leaveCalled = false
    let submissionCalled = false
    server.use(
      http.post(`${BASE_URL}/api/drafts/leaves`, () => {
        leaveCalled = true
        return HttpResponse.json({ id: 1 }, { status: 201 })
      }),
      http.post(`${BASE_URL}/api/drafts/leaves/submission`, () => {
        submissionCalled = true
        return HttpResponse.json({ id: 1 }, { status: 201 })
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
    vi.clearAllMocks()
    vi.restoreAllMocks()
    localStorage.removeItem(DRAFT_PRINT_PREVIEW_STORAGE_KEY)
  })

  it('협조 결재자 + 공람자를 지정한 뒤 미리보기를 누르면 payload에 approvers[].role과 circulations가 적재된다', async () => {
    mockEmployeePicker()
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
