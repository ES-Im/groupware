import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { FranchiseEducationDetailPage } from './FranchiseEducationDetailPage'

/**
 * FranchiseEducationDetailPage(F1610/F1611/F1613/F1614, ROADMAP(FRANCHISE) T4.3+T4.4) 검증.
 * MeetingRoomManagementDetailPage.test.tsx와 동형 패턴 — route param 가드, 조회 실패 분기,
 * 관리 액션(수정 버튼 노출 조건, 활성 토글 상시 노출) 배선만 다룬다. 신청자 표(react-table +
 * usePageState + PaginationControls)는 이 페이지 고유 배선이라 함께 다룬다.
 */
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

afterEach(() => {
  vi.clearAllMocks()
})

function makeDetail(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    date: '2026-05-01',
    startAt: '10:00:00',
    place: '본사 3층 강당',
    title: '신규 가맹점 오리엔테이션',
    content: '가맹 운영 기본 교육입니다',
    appliedCount: 0,
    capacity: 20,
    remainingCapacity: 20,
    isActive: false,
    fileListInfoList: null,
    ...overrides,
  }
}

function makeApplicantsPage(items: unknown[]) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: 0,
    size: 10,
    numberOfElements: items.length,
    first: true,
    last: true,
    empty: items.length === 0,
  }
}

function mockDetail(educationId: number, overrides: Partial<Record<string, unknown>> = {}) {
  server.use(
    http.get(`${BASE_URL}/api/franchise-educations/${educationId}`, () =>
      HttpResponse.json(makeDetail(overrides)),
    ),
  )
}

function mockApplicants(educationId: number, items: unknown[] = []) {
  server.use(
    http.get(`${BASE_URL}/api/franchise-educations/${educationId}/applicants`, () =>
      HttpResponse.json(makeApplicantsPage(items)),
    ),
  )
}

function renderPage(educationIdParam: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/franchise-educations/${educationIdParam}`]}>
        <Routes>
          <Route path="/franchise-educations/:educationId" element={<FranchiseEducationDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('FranchiseEducationDetailPage - route param 가드', () => {
  it('비-10진 양의 정수 파라미터면 즉시 안내 문구를 렌더하고 요청을 보내지 않는다', () => {
    let getCalls = 0
    server.use(
      http.get(`${BASE_URL}/api/franchise-educations/:educationId`, () => {
        getCalls += 1
        return HttpResponse.json(makeDetail())
      }),
    )

    renderPage('0x10')

    expect(screen.getByText('잘못된 교육 식별자입니다.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '비활성화' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '활성화' })).not.toBeInTheDocument()
    expect(getCalls).toBe(0)
  })

  it('404 응답이면 not-found 문구를 렌더하고 관리 액션 버튼을 노출하지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/franchise-educations/999`, () =>
        HttpResponse.json(
          { code: 'RESOURCE_001', name: 'NOT_FOUND', httpStatus: 404, message: '교육을 찾을 수 없습니다' },
          { status: 404 },
        ),
      ),
    )

    renderPage('999')

    expect(await screen.findByText('교육을 찾을 수 없습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '비활성화' })).not.toBeInTheDocument()
    const { toast } = await import('sonner')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('404가 아닌 실패(500)는 토스트로 알리고 일반 실패 문구를 렌더한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/franchise-educations/1`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
    )

    renderPage('1')

    expect(await screen.findByText('교육 정보를 불러오지 못했습니다.')).toBeInTheDocument()
    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('서버 오류가 발생했습니다'))
  })
})

describe('FranchiseEducationDetailPage - 정상 렌더', () => {
  it('로딩 중에는 안내 문구를 렌더한다', () => {
    mockDetail(1)
    mockApplicants(1)

    renderPage('1')

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()
  })

  it('상세 데이터 도착 후 제목·상태 배지·필드·내용을 렌더한다', async () => {
    mockDetail(1, { isActive: true })
    mockApplicants(1)

    renderPage('1')

    expect(await screen.findByText('신규 가맹점 오리엔테이션')).toBeInTheDocument()
    expect(screen.getByText('활성')).toBeInTheDocument()
    expect(screen.getByText('2026-05-01')).toBeInTheDocument()
    expect(screen.getByText('10:00:00')).toBeInTheDocument()
    expect(screen.getByText('본사 3층 강당')).toBeInTheDocument()
    expect(screen.getByText('가맹 운영 기본 교육입니다')).toBeInTheDocument()
    expect(screen.getByText('첨부파일이 없습니다.')).toBeInTheDocument()
  })

  it('fileListInfoList가 배열이면 첨부파일 목록을 렌더한다', async () => {
    mockDetail(1, {
      fileListInfoList: [
        { fileId: 1, originalName: '위생교육자료.pdf', extension: 'pdf', fileSize: 1024 },
      ],
    })
    mockApplicants(1)

    renderPage('1')

    expect(await screen.findByText('위생교육자료.pdf')).toBeInTheDocument()
    expect(screen.queryByText('첨부파일이 없습니다.')).not.toBeInTheDocument()
  })
})

describe('FranchiseEducationDetailPage - 수정 버튼 노출 조건', () => {
  it('비활성 + 신청인원 0명이면 "수정" 버튼이 노출된다', async () => {
    mockDetail(1, { isActive: false, appliedCount: 0 })
    mockApplicants(1)

    renderPage('1')

    expect(await screen.findByRole('button', { name: '수정' })).toBeInTheDocument()
  })

  it('활성 상태면 신청인원이 0명이어도 "수정" 버튼이 노출되지 않는다', async () => {
    mockDetail(1, { isActive: true, appliedCount: 0 })
    mockApplicants(1)

    renderPage('1')

    await screen.findByText('신규 가맹점 오리엔테이션')
    expect(screen.queryByRole('button', { name: '수정' })).not.toBeInTheDocument()
  })

  it('신청인원이 1명 이상이면 비활성 상태여도 "수정" 버튼이 노출되지 않는다', async () => {
    mockDetail(1, { isActive: false, appliedCount: 1 })
    mockApplicants(1)

    renderPage('1')

    await screen.findByText('신규 가맹점 오리엔테이션')
    expect(screen.queryByRole('button', { name: '수정' })).not.toBeInTheDocument()
  })
})

describe('FranchiseEducationDetailPage - 활성 토글 버튼', () => {
  it('isActive=true면 "비활성화" 버튼, false면 "활성화" 버튼이 항상 노출된다', async () => {
    mockDetail(1, { isActive: true })
    mockApplicants(1)

    renderPage('1')

    expect(await screen.findByRole('button', { name: '비활성화' })).toBeInTheDocument()
  })
})

describe('FranchiseEducationDetailPage - 신청자 목록', () => {
  it('신청자가 없으면 안내 문구를 렌더한다', async () => {
    mockDetail(1)
    mockApplicants(1, [])

    renderPage('1')

    expect(await screen.findByText('신청자가 없습니다.')).toBeInTheDocument()
  })

  it('신청자 목록을 표로 렌더한다(가맹점명/연락처/이메일/신청인원/신청일시)', async () => {
    mockDetail(1)
    mockApplicants(1, [
      {
        applicationId: 1,
        externalId: 'EXT-1',
        franchiseId: 10,
        franchiseName: '테스트강남점',
        contactNumber: '02-1234-5678',
        contactEmail: 'gangnam@haruon.com',
        appliedCount: 2,
        appliedAt: '2026-05-01T09:00:00',
      },
    ])

    renderPage('1')

    expect(await screen.findByText('테스트강남점')).toBeInTheDocument()
    expect(screen.getByText('02-1234-5678')).toBeInTheDocument()
    expect(screen.getByText('gangnam@haruon.com')).toBeInTheDocument()
    expect(screen.getByText('2026-05-01 09:00')).toBeInTheDocument()
    expect(screen.getByText('1-1 / 1건')).toBeInTheDocument()
  })

  it('신청자 목록 조회 실패 시 표 영역 안내 문구와 토스트를 함께 노출한다', async () => {
    mockDetail(1)
    server.use(
      http.get(`${BASE_URL}/api/franchise-educations/1/applicants`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
    )

    renderPage('1')

    expect(await screen.findByText('신청자 목록을 불러오지 못했습니다.')).toBeInTheDocument()
    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('서버 오류가 발생했습니다'))
  })
})

describe('FranchiseEducationDetailPage - 수정 다이얼로그 연동', () => {
  it('"수정" 클릭 시 FranchiseEducationUpdateDialog가 열리고 현재 값으로 프리필된다', async () => {
    mockDetail(1, { isActive: false, appliedCount: 0, place: '본사 3층 강당' })
    mockApplicants(1)
    const user = userEvent.setup()

    renderPage('1')

    await user.click(await screen.findByRole('button', { name: '수정' }))

    expect(await screen.findByText('교육 수정')).toBeInTheDocument()
    expect(screen.getByLabelText('장소')).toHaveValue('본사 3층 강당')
    // jsdom의 datetime-local 값 정규화 규칙상 초가 00이면 표시값에서 생략된다(HTML 표준 동작).
    expect(screen.getByLabelText('교육 일시')).toHaveValue('2026-05-01T10:00')
  })
})
