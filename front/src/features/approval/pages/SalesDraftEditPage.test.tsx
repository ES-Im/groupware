import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useParams } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { DraftDetailResponse } from '../model/draftDetail'
import { SalesDraftEditPage } from './SalesDraftEditPage'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function meFixture(empId: number) {
  return {
    empBasicInfo: {
      empId,
      empNo: String(empId).padStart(9, '0'),
      name: '기안자',
      loginId: 'test1234',
      email: 'test1234@haruon.com',
      extensionNo: null,
    },
    activeFiles: [],
    currentDepts: [],
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

function draftDetail(overrides: Partial<DraftDetailResponse> = {}): DraftDetailResponse {
  return {
    draftId: 1,
    draftType: 'SalesDraft',
    drafter: { empId: 10, empName: '기안자' },
    title: '7월 매출 보고',
    content: '7월 매출을 보고합니다.',
    submittedAt: null,
    approvalStatus: '미상신',
    files: [],
    approvers: [],
    circulations: [],
    sourceDraftId: null,
    cancellationDraftId: null,
    cancellationSubmittedAt: null,
    leave: null,
    businessTrip: null,
    sales: {
      franchiseId: 5,
      franchiseName: '강남점',
      reportMonth: '2026-07',
      salesAmount: 1000000,
    },
    ...overrides,
  }
}

function mockFormDependencies(meEmpId: number) {
  server.use(
    http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture(meEmpId))),
    http.get(`${BASE_URL}/api/departments`, () => HttpResponse.json(pageOf([]))),
    http.get(`${BASE_URL}/api/franchises`, () => HttpResponse.json(pageOf([]))),
  )
}

function DetailPlaceholder() {
  const { draftId } = useParams()
  return <div>기안 상세 화면 draftId={draftId}</div>
}

function renderPage(draftId = 1) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/approval/drafts/sales/${draftId}/edit`]}>
        <Routes>
          <Route path="/approval/drafts/sales/:draftId/edit" element={<SalesDraftEditPage />} />
          <Route path="/approval/drafts/:draftId" element={<DetailPlaceholder />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('SalesDraftEditPage - 매출 기안이 아니면 수정 불가', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('sales 슬롯이 null이면(다른 유형 기안) 안내 문구를 보여주고 폼을 렌더하지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/drafts/1`, () =>
        HttpResponse.json(
          draftDetail({
            sales: null,
            businessTrip: {
              startAt: '2026-07-01T09:00:00',
              endAt: '2026-07-02T18:00:00',
              destination: '부산',
              purpose: '점검',
              participants: [],
            },
          }),
        ),
      ),
    )
    mockFormDependencies(10)

    renderPage()

    expect(
      await screen.findByText('이 기안은 매출 기안이 아니어서 여기에서 수정할 수 없습니다.'),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText(/^제목/)).not.toBeInTheDocument()
  })
})

describe('SalesDraftEditPage - 권한 부족(기안자 아님/UNSUBMITTED 아님)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('기안자 본인이 아니면 권한 부족 안내를 보여준다', async () => {
    server.use(http.get(`${BASE_URL}/api/drafts/1`, () => HttpResponse.json(draftDetail())))
    mockFormDependencies(99)

    renderPage()

    expect(
      await screen.findByText('이 기안을 수정할 권한이 없거나 이미 상신되어 수정할 수 없습니다.'),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText(/^제목/)).not.toBeInTheDocument()
  })

  it('기안자 본인이어도 UNSUBMITTED(미상신)가 아니면 권한 부족 안내를 보여준다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/drafts/1`, () =>
        HttpResponse.json(draftDetail({ approvalStatus: '결재대기' })),
      ),
    )
    mockFormDependencies(10)

    renderPage()

    expect(
      await screen.findByText('이 기안을 수정할 권한이 없거나 이미 상신되어 수정할 수 없습니다.'),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText(/^제목/)).not.toBeInTheDocument()
  })
})

describe('SalesDraftEditPage - 정상 진입 시 프리필', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('title/content/franchiseId(선택칩)/reportMonth/salesAmount가 프리필된다', async () => {
    server.use(http.get(`${BASE_URL}/api/drafts/1`, () => HttpResponse.json(draftDetail())))
    mockFormDependencies(10)

    renderPage()

    expect(await screen.findByLabelText(/^제목/)).toHaveValue('7월 매출 보고')
    expect(screen.getByLabelText(/^기안 내용/)).toHaveValue('7월 매출을 보고합니다.')
    expect(screen.getByRole('button', { name: '강남점 선택 해제' })).toBeInTheDocument()
    expect(screen.getByLabelText(/매출 보고월/)).toHaveValue('2026-07')
    expect(screen.getByLabelText(/매출액/)).toHaveValue(1000000)
  })
})

describe('SalesDraftEditPage - 저장 성공 흐름', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('저장(204) 성공 시 상세 페이지로 navigate하고 성공 토스트를 띄운다', async () => {
    server.use(http.get(`${BASE_URL}/api/drafts/1`, () => HttpResponse.json(draftDetail())))
    mockFormDependencies(10)
    server.use(
      http.patch(`${BASE_URL}/api/drafts/sales/1`, () => new HttpResponse(null, { status: 204 })),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByLabelText(/^제목/)

    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('기안 상세 화면 draftId=1')).toBeInTheDocument()
    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('매출 기안서를 수정했습니다'))
  })
})

describe('SalesDraftEditPage - 기존 결재선 role(협조 포함) 보존', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('COOPERATOR가 포함된 결재선을 그대로 저장하면 요청 approvers에 기존 role이 보존된다(전원 APPROVER로 덮이지 않음)', async () => {
    server.use(
      http.get(`${BASE_URL}/api/drafts/1`, () =>
        HttpResponse.json(
          draftDetail({
            approvers: [
              {
                empId: 201,
                empName: '박결재',
                role: 'APPROVER',
                order: 1,
                approvedAt: null,
                rejectedAt: null,
                rejectReason: null,
              },
              {
                empId: 202,
                empName: '이협조',
                role: 'COOPERATOR',
                order: 2,
                approvedAt: null,
                rejectedAt: null,
                rejectReason: null,
              },
            ],
          }),
        ),
      ),
    )
    mockFormDependencies(10)
    let updateBody: Record<string, unknown> | undefined
    server.use(
      http.patch(`${BASE_URL}/api/drafts/sales/1`, async ({ request }) => {
        updateBody = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByLabelText(/^제목/)

    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('기안 상세 화면 draftId=1')).toBeInTheDocument()
    expect(updateBody).toEqual({
      param: {
        title: '7월 매출 보고',
        content: '7월 매출을 보고합니다.',
        approvers: [
          { approverId: 201, role: 'APPROVER', order: 1 },
          { approverId: 202, role: 'COOPERATOR', order: 2 },
        ],
      },
      franchiseId: 5,
      reportMonth: '2026-07',
      salesAmount: 1000000,
    })
  })
})
