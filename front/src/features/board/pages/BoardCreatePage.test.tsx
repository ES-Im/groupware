import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { BoardCreatePage } from './BoardCreatePage'

/**
 * BoardCreatePage(F305/F308, ROADMAP T12.2) 회귀 방지 테스트.
 *
 * 방금 발견된 회귀 위험 지점(스타일링 리팩터 직후):
 * - 임시저장/발행 두 제출 경로가 registerBoard에 올바른 페이로드(publishedAt 포함 여부)로
 *   요청을 보내는지.
 * - 발행 시 publishedAt이 dayjs().format('YYYY-MM-DDTHH:mm:ss') 포맷(밀리초/Z 없음)인지.
 * - RHF+zod 사전검증(boardCreateSchema) 실패 경로.
 * - "임시저장글 불러오기" 목록 조회/선택 이동.
 *
 * 참고: 과제 설명에 언급된 "발행 액션에서 401(ROLE_002)을 받아도 handleApiError를 우회해
 * normalizeApiError+toast.error로 직접 토스트를 띄우는 특수 처리"는 실제 소스 상
 * BoardCreatePage.submit()이 아니라 BoardDraftsPage.handlePublish()에 구현되어 있다
 * (BoardCreatePage.submit은 submitWithErrorMapping의 표준 handleApiError 경로를 그대로
 * 사용하며, publishBoard가 아닌 registerBoard(=BOARD_REGISTER, publishedAt 포함)를 호출한다).
 * 해당 회귀 시나리오는 실제 구현 위치인 BoardDraftsPage.test.tsx에서 검증한다.
 */

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function mockCategoriesAndDrafts(drafts: Array<{ boardId: number; title: string; updatedAt: string }> = []) {
  server.use(
    http.get(`${BASE_URL}/api/categories`, () =>
      HttpResponse.json([{ categoryId: 1, categoryName: '공지', isVisible: true }]),
    ),
    http.get(`${BASE_URL}/api/my/boards/drafts`, () => HttpResponse.json(drafts)),
  )
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/boards/new']}>
        <Routes>
          <Route path="/boards/new" element={<BoardCreatePage />} />
          <Route path="/boards" element={<div>게시판 목록 화면</div>} />
          <Route path="/boards/:boardId/edit" element={<div>게시글 수정 화면</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText(/카테고리/), '공지')
  await user.type(screen.getByLabelText(/제목/), '새 글 제목')
  await user.type(screen.getByLabelText(/본문/), '새 글 본문입니다')
}

describe('BoardCreatePage (F305) - zod 사전검증', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('빈 값으로 "임시저장"을 눌러도 zod 사전검증 메시지를 보여주고 API를 호출하지 않는다', async () => {
    mockCategoriesAndDrafts()
    let registerCalled = false
    server.use(
      http.post(`${BASE_URL}/api/boards`, () => {
        registerCalled = true
        return new HttpResponse(null, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('option', { name: '공지' })
    await user.click(screen.getByRole('button', { name: '임시저장' }))

    const alerts = await screen.findAllByRole('alert')
    const alertTexts = alerts.map((el) => el.textContent)
    expect(alertTexts).toContain('카테고리를 선택해주세요')
    expect(alertTexts).toContain('제목을 입력해주세요')
    expect(alertTexts).toContain('본문을 입력해주세요')
    expect(registerCalled).toBe(false)
  })

  it('빈 값으로 "발행"을 눌러도 동일한 zod 사전검증을 통과해야 하며 API를 호출하지 않는다', async () => {
    mockCategoriesAndDrafts()
    let registerCalled = false
    server.use(
      http.post(`${BASE_URL}/api/boards`, () => {
        registerCalled = true
        return new HttpResponse(null, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('option', { name: '공지' })
    await user.click(screen.getByRole('button', { name: '발행' }))

    const alerts = await screen.findAllByRole('alert')
    expect(alerts.map((el) => el.textContent)).toContain('카테고리를 선택해주세요')
    expect(registerCalled).toBe(false)
  })
})

describe('BoardCreatePage (F305) - 임시저장/발행 제출 페이로드', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('"임시저장" 제출 시 publishedAt 없이 registerBoard를 호출하고 목록으로 이동한다', async () => {
    mockCategoriesAndDrafts()
    let registeredBody: Record<string, unknown> | undefined
    server.use(
      http.post(`${BASE_URL}/api/boards`, async ({ request }) => {
        registeredBody = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('option', { name: '공지' })
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: '임시저장' }))

    await waitFor(() =>
      expect(registeredBody).toEqual({
        categoryId: 1,
        title: '새 글 제목',
        content: '새 글 본문입니다',
      }),
    )
    expect(registeredBody?.publishedAt).toBeUndefined()
    expect(await screen.findByText('게시판 목록 화면')).toBeInTheDocument()
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('게시글을 임시저장했습니다')
  })

  it('"발행" 제출 시 publishedAt을 "YYYY-MM-DDTHH:mm:ss"(밀리초/Z 없음) 포맷으로 포함해 registerBoard를 호출한다', async () => {
    mockCategoriesAndDrafts()
    let registeredBody: Record<string, unknown> | undefined
    server.use(
      http.post(`${BASE_URL}/api/boards`, async ({ request }) => {
        registeredBody = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('option', { name: '공지' })
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: '발행' }))

    await waitFor(() => expect(registeredBody).toBeDefined())
    expect(registeredBody).toMatchObject({
      categoryId: 1,
      title: '새 글 제목',
      content: '새 글 본문입니다',
    })
    // "2026-07-07T10:00:00" 형태만 허용 — 밀리초(.SSS)나 zone(Z) 접미사가 붙으면 실패한다.
    expect(registeredBody?.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)

    expect(await screen.findByText('게시판 목록 화면')).toBeInTheDocument()
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('게시글을 발행했습니다')
  })
})

describe('BoardCreatePage (F308) - 임시저장글 인라인 편집', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('"임시저장글"에 마우스를 올리면 목록을 보여주고, 항목을 클릭하면 라우트 이동 없이 인라인 편집 폼으로 전환한다', async () => {
    // 임시저장글 드롭다운은 클릭 토글이 아니라 HoverCard(마우스 오버)이며, 항목 선택 시 라우트 이동
    // (수정 페이지) 대신 같은 카드 자리에서 인라인 편집(BoardEditForm+BoardEditAttachments)으로 전환한다.
    mockCategoriesAndDrafts([
      { boardId: 42, title: '이어쓰던 초안', updatedAt: '2026-07-01T09:00:00' },
    ])
    server.use(
      http.get(`${BASE_URL}/api/boards/42/edit-mode`, () =>
        HttpResponse.json({ boardId: 42, categoryId: 1, title: '이어쓰던 초안', content: '이어쓰던 본문' }),
      ),
      // 초안은 BOARD_DETAIL에서 항상 404 — modifiedAt 폴백 신호로 소비된다(정상 경로).
      http.get(`${BASE_URL}/api/boards/42`, () =>
        HttpResponse.json(
          { code: 'RESOURCE_001', name: 'NOT_FOUND', httpStatus: 404, message: '게시글을 찾을 수 없습니다' },
          { status: 404 },
        ),
      ),
      http.get(`${BASE_URL}/api/boards/42/files`, () => HttpResponse.json([])),
    )
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('option', { name: '공지' })
    await user.hover(screen.getByRole('button', { name: '임시저장글' }))

    expect(await screen.findByText('이어쓰던 초안')).toBeInTheDocument()

    await user.click(screen.getByText('이어쓰던 초안'))

    // 라우트 이동(수정 페이지) 대신 인라인 편집 폼이 뜬다: 편집 초기값이 채워지고 저장 버튼/첨부 섹션이 보인다.
    expect(await screen.findByRole('button', { name: '저장' })).toBeInTheDocument()
    expect(await screen.findByText('첨부파일이 없습니다.')).toBeInTheDocument()
    expect(screen.getByLabelText(/제목/)).toHaveValue('이어쓰던 초안')
    expect(screen.queryByText('게시글 수정 화면')).not.toBeInTheDocument()
  })

  it('임시저장 목록이 비어 있으면 "임시저장한 글이 없습니다."를 보여준다', async () => {
    mockCategoriesAndDrafts([])
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('option', { name: '공지' })
    await user.hover(screen.getByRole('button', { name: '임시저장글' }))

    expect(await screen.findByText('임시저장한 글이 없습니다.')).toBeInTheDocument()
  })
})
