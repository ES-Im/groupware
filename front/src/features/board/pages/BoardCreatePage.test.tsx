import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {http, HttpResponse} from 'msw'
import {MemoryRouter, Route, Routes} from 'react-router'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {BASE_URL} from '@/shared/api/client'
import {server} from '@/test/mocks/server'
import {BoardCreatePage} from './BoardCreatePage'

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

  it('빈 값으로 "임시저장"을 눌러도 제목/본문 사전검증 메시지를 보여주고 API를 호출하지 않는다', async () => {
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
    expect(alerts.map((el) => el.textContent)).toContain('제목을 입력해주세요')
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
    mockCategoriesAndDrafts([
      { boardId: 42, title: '이어쓰던 초안', updatedAt: '2026-07-01T09:00:00' },
    ])
    server.use(
      http.get(`${BASE_URL}/api/boards/42/edit-mode`, () =>
        HttpResponse.json({ boardId: 42, categoryId: 1, title: '이어쓰던 초안', content: '이어쓰던 본문' }),
      ),
      http.get(`${BASE_URL}/api/boards/42`, () =>
        HttpResponse.json({
          boardId: 42,
          categoryId: 1,
          empId: 100,
          authorName: '홍길동',
          title: '이어쓰던 초안',
          content: '이어쓰던 본문',
          publishedAt: null,
          modifiedAt: null,
          likeCount: 0,
          viewCount: 0,
          commentCount: 0,
          isDraft: true,
          isLiked: false,
        }),
      ),
      http.get(`${BASE_URL}/api/boards/42/files`, () => HttpResponse.json([])),
    )
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('option', { name: '공지' })
    await user.hover(screen.getByRole('button', { name: /임시저장글/ }))

    expect(await screen.findByText('이어쓰던 초안')).toBeInTheDocument()

    await user.click(screen.getByText('이어쓰던 초안'))

    expect(await screen.findByRole('button', { name: '저장' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '발행' })).toBeInTheDocument()
    expect(await screen.findByText('첨부파일이 없습니다.')).toBeInTheDocument()
    expect(screen.getByLabelText(/제목/)).toHaveValue('이어쓰던 초안')
    expect(screen.queryByText('게시글 수정 화면')).not.toBeInTheDocument()
  })

  it('임시저장글 인라인 편집에서 "발행"을 클릭하면 발행 후 목록으로 돌아간다', async () => {
    mockCategoriesAndDrafts([
      { boardId: 42, title: '이어쓰던 초안', updatedAt: '2026-07-01T09:00:00' },
    ])
    let publishCalled = false
    server.use(
      http.get(`${BASE_URL}/api/boards/42/edit-mode`, () =>
        HttpResponse.json({ boardId: 42, categoryId: 1, title: '이어쓰던 초안', content: '이어쓰던 본문' }),
      ),
      http.get(`${BASE_URL}/api/boards/42`, () =>
        HttpResponse.json({
          boardId: 42,
          categoryId: 1,
          empId: 100,
          authorName: '홍길동',
          title: '이어쓰던 초안',
          content: '이어쓰던 본문',
          publishedAt: null,
          modifiedAt: null,
          likeCount: 0,
          viewCount: 0,
          commentCount: 0,
          isDraft: true,
          isLiked: false,
        }),
      ),
      http.get(`${BASE_URL}/api/boards/42/files`, () => HttpResponse.json([])),
      http.patch(`${BASE_URL}/api/boards/42/publishment`, () => {
        publishCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('option', { name: '공지' })
    await user.hover(screen.getByRole('button', { name: /임시저장글/ }))
    await user.click(await screen.findByText('이어쓰던 초안'))

    await user.click(await screen.findByRole('button', { name: '발행' }))

    expect(await screen.findByText('게시판 목록 화면')).toBeInTheDocument()
    expect(publishCalled).toBe(true)
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('게시글을 발행했습니다')
  })

  it('임시저장 목록이 비어 있으면 "임시저장한 글이 없습니다."를 보여준다', async () => {
    mockCategoriesAndDrafts([])
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('option', { name: '공지' })
    await user.hover(screen.getByRole('button', { name: /임시저장글/ }))

    expect(await screen.findByText('임시저장한 글이 없습니다.')).toBeInTheDocument()
  })
})
