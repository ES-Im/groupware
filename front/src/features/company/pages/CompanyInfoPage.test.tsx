import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { useAuthStore } from '@/features/auth/store/authStore'
import { server } from '@/test/mocks/server'
import { CompanyInfoPage } from './CompanyInfoPage'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function companyFixture(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    companyId: 1,
    companyName: 'HARUON',
    location: '서울특별시 강남구',
    presentedEmail: 'contact@haruon.com',
    presentedExternalNo: '02-1234-5678',
    ownerName: '김대표',
    homePageURL: 'https://haruon.com',
    editedAt: '2026-07-01T10:00:00',
    ...overrides,
  }
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <CompanyInfoPage />
    </QueryClientProvider>,
  )
}

describe('CompanyInfoPage - 조회 분기', () => {
  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, roles: [], status: 'idle' })
    vi.clearAllMocks()
  })

  it('로딩 중에는 로딩 문구를 노출한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/companies`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 20))
        return HttpResponse.json(companyFixture())
      }),
    )

    renderPage()

    expect(screen.getByText('회사 정보를 불러오는 중...')).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByText('HARUON').length).toBeGreaterThan(0))
  })

  it('조회 실패(500)면 에러 문구를 노출하고 에러 토스트를 띄운다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/companies`, () =>
        HttpResponse.json(
          { code: 'COMMON_001', name: 'INTERNAL_SERVER_ERROR', httpStatus: 500, message: '서버 오류' },
          { status: 500 },
        ),
      ),
    )

    renderPage()

    expect(await screen.findByText('회사 정보를 불러오지 못했습니다.')).toBeInTheDocument()
    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('서버 오류'))
  })

  it('미등록(404) + ADMIN이면 최초 등록 폼(CompanyRegisterCard)이 렌더된다', async () => {
    useAuthStore.setState({ roles: ['ADMIN'] })
    server.use(
      http.get(`${BASE_URL}/api/companies`, () =>
        HttpResponse.json(
          { code: 'COMPANY_NOT_FOUND', name: 'COMPANY_NOT_FOUND', httpStatus: 404, message: '등록된 회사 정보가 없습니다' },
          { status: 404 },
        ),
      ),
    )

    renderPage()

    expect(await screen.findByText('등록된 회사 정보가 없습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '회사 정보 등록' })).toBeInTheDocument()
  })

  it('미등록(404) + 비-ADMIN이면 등록 CTA 없이 안내 문구만 노출된다', async () => {
    useAuthStore.setState({ roles: ['EMPLOYEE'] })
    server.use(
      http.get(`${BASE_URL}/api/companies`, () =>
        HttpResponse.json(
          { code: 'COMPANY_NOT_FOUND', name: 'COMPANY_NOT_FOUND', httpStatus: 404, message: '등록된 회사 정보가 없습니다' },
          { status: 404 },
        ),
      ),
    )

    renderPage()

    expect(await screen.findByText('등록된 회사 정보가 없습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '회사 정보 등록' })).not.toBeInTheDocument()
  })

  it('등록됨 + ADMIN이면 3개 섹션 편집 버튼이 모두 노출된다', async () => {
    useAuthStore.setState({ roles: ['ADMIN'] })
    server.use(http.get(`${BASE_URL}/api/companies`, () => HttpResponse.json(companyFixture())))

    renderPage()

    await waitFor(() => expect(screen.getAllByText('HARUON').length).toBeGreaterThan(0))
    expect(screen.getAllByRole('button', { name: '편집' })).toHaveLength(3)
    expect(screen.getAllByText('서울특별시 강남구').length).toBeGreaterThan(0)
    expect(screen.getByText('contact@haruon.com')).toBeInTheDocument()
    expect(screen.getByText('https://haruon.com')).toBeInTheDocument()
  })

  it('등록됨 + 비-ADMIN이면 편집 버튼이 노출되지 않는다', async () => {
    useAuthStore.setState({ roles: ['EMPLOYEE'] })
    server.use(http.get(`${BASE_URL}/api/companies`, () => HttpResponse.json(companyFixture())))

    renderPage()

    await waitFor(() => expect(screen.getAllByText('HARUON').length).toBeGreaterThan(0))
    expect(screen.queryByRole('button', { name: '편집' })).not.toBeInTheDocument()
  })
})

describe('CompanyInfoPage - 최초 등록 폼(CompanyRegisterCard, F1402)', () => {
  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, roles: [], status: 'idle' })
    vi.clearAllMocks()
  })

  function notFoundHandler() {
    return http.get(`${BASE_URL}/api/companies`, () =>
      HttpResponse.json(
        { code: 'COMPANY_NOT_FOUND', name: 'COMPANY_NOT_FOUND', httpStatus: 404, message: '등록된 회사 정보가 없습니다' },
        { status: 404 },
      ),
    )
  }

  it('editedAt 입력 필드는 폼에 노출되지 않는다(제출 시각 자동 주입)', async () => {
    useAuthStore.setState({ roles: ['ADMIN'] })
    server.use(notFoundHandler())

    renderPage()

    await screen.findByRole('button', { name: '회사 정보 등록' })
    expect(screen.queryByLabelText(/수정일시|editedAt/i)).not.toBeInTheDocument()
  })

  it('필수값 미입력 시 zod 클라 사전검증 메시지를 노출하고 요청을 보내지 않는다', async () => {
    useAuthStore.setState({ roles: ['ADMIN'] })
    server.use(notFoundHandler())
    const user = userEvent.setup()

    renderPage()

    await user.click(await screen.findByRole('button', { name: '회사 정보 등록' }))

    expect(await screen.findByText('회사명을 입력해주세요')).toBeInTheDocument()
    expect(screen.getByText('회사 위치를 입력해주세요')).toBeInTheDocument()
    expect(screen.getByText('대표 연락처를 입력해주세요')).toBeInTheDocument()
    expect(screen.getByText('대표자명을 입력해주세요')).toBeInTheDocument()
    expect(screen.getByText('홈페이지 URL을 입력해주세요')).toBeInTheDocument()
  })

  it('홈페이지 URL이 http(s)://로 시작하지 않으면 zod 검증 에러를 노출한다', async () => {
    useAuthStore.setState({ roles: ['ADMIN'] })
    server.use(notFoundHandler())
    const user = userEvent.setup()

    renderPage()

    await user.type(await screen.findByLabelText(/회사명/), 'HARUON')
    await user.type(screen.getByLabelText(/위치/), '서울특별시 강남구')
    await user.type(screen.getByLabelText(/대표 이메일/), 'contact@haruon.com')
    await user.type(screen.getByLabelText(/대표 연락처/), '02-1234-5678')
    await user.type(screen.getByLabelText(/대표자명/), '김대표')
    await user.type(screen.getByLabelText(/홈페이지 URL/), 'haruon.com')
    await user.click(screen.getByRole('button', { name: '회사 정보 등록' }))

    expect(
      await screen.findByText('http:// 또는 https://로 시작해야 합니다'),
    ).toBeInTheDocument()
  })

  it('등록 성공(204) 시 성공 토스트를 띄우고 조회가 재조회되어 카드 뷰로 전환된다', async () => {
    useAuthStore.setState({ roles: ['ADMIN'] })
    let registered = false
    server.use(
      http.get(`${BASE_URL}/api/companies`, () =>
        registered
          ? HttpResponse.json(companyFixture())
          : HttpResponse.json(
              { code: 'COMPANY_NOT_FOUND', name: 'COMPANY_NOT_FOUND', httpStatus: 404, message: '등록된 회사 정보가 없습니다' },
              { status: 404 },
            ),
      ),
      http.post(`${BASE_URL}/api/companies/new`, () => {
        registered = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()

    renderPage()

    await user.type(await screen.findByLabelText(/회사명/), 'HARUON')
    await user.type(screen.getByLabelText(/위치/), '서울특별시 강남구')
    await user.type(screen.getByLabelText(/대표 이메일/), 'contact@haruon.com')
    await user.type(screen.getByLabelText(/대표 연락처/), '02-1234-5678')
    await user.type(screen.getByLabelText(/대표자명/), '김대표')
    await user.type(screen.getByLabelText(/홈페이지 URL/), 'https://haruon.com')
    await user.click(screen.getByRole('button', { name: '회사 정보 등록' }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('회사 정보를 등록했습니다'))
    await waitFor(() => expect(screen.getAllByText('HARUON').length).toBeGreaterThan(0))
  })

  it('COMPANY_002(이미 등록됨, 400)면 전용 안내 토스트를 띄우고 재조회한다(root 에러로 표시하지 않음)', async () => {
    useAuthStore.setState({ roles: ['ADMIN'] })
    let alreadyRegistered = true
    server.use(
      http.get(`${BASE_URL}/api/companies`, () =>
        alreadyRegistered
          ? HttpResponse.json(companyFixture())
          : HttpResponse.json(
              { code: 'COMPANY_NOT_FOUND', name: 'COMPANY_NOT_FOUND', httpStatus: 404, message: '등록된 회사 정보가 없습니다' },
              { status: 404 },
            ),
      ),
      http.post(`${BASE_URL}/api/companies/new`, () =>
        HttpResponse.json(
          { code: 'COMPANY_002', name: 'COMPANY_ALREADY_EXISTS', httpStatus: 400, message: '이미 등록된 회사 정보가 있습니다' },
          { status: 400 },
        ),
      ),
    )
    alreadyRegistered = false
    const user = userEvent.setup()

    renderPage()

    await user.type(await screen.findByLabelText(/회사명/), 'HARUON')
    await user.type(screen.getByLabelText(/위치/), '서울특별시 강남구')
    await user.type(screen.getByLabelText(/대표 이메일/), 'contact@haruon.com')
    await user.type(screen.getByLabelText(/대표 연락처/), '02-1234-5678')
    await user.type(screen.getByLabelText(/대표자명/), '김대표')
    await user.type(screen.getByLabelText(/홈페이지 URL/), 'https://haruon.com')

    alreadyRegistered = true
    await user.click(screen.getByRole('button', { name: '회사 정보 등록' }))

    const { toast } = await import('sonner')
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('이미 등록된 회사 정보가 있습니다'),
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await screen.findAllByText('서울특별시 강남구')
  })

  it('그 외 서버 에러(VALIDATION_ERROR)는 handleApiError 기본 경로로 위임되어 root 에러가 표시된다', async () => {
    useAuthStore.setState({ roles: ['ADMIN'] })
    server.use(
      notFoundHandler(),
      http.post(`${BASE_URL}/api/companies/new`, () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', name: 'VALIDATION_ERROR', httpStatus: 400, message: '입력값을 다시 확인해주세요' },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()

    renderPage()

    await user.type(await screen.findByLabelText(/회사명/), 'HARUON')
    await user.type(screen.getByLabelText(/위치/), '서울특별시 강남구')
    await user.type(screen.getByLabelText(/대표 이메일/), 'contact@haruon.com')
    await user.type(screen.getByLabelText(/대표 연락처/), '02-1234-5678')
    await user.type(screen.getByLabelText(/대표자명/), '김대표')
    await user.type(screen.getByLabelText(/홈페이지 URL/), 'https://haruon.com')
    await user.click(screen.getByRole('button', { name: '회사 정보 등록' }))

    expect(await screen.findByText('입력값을 다시 확인해주세요')).toBeInTheDocument()
    expect(screen.getByLabelText(/회사명/)).toHaveValue('HARUON')
  })
})
