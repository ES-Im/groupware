import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {http, HttpResponse} from 'msw'
import {MemoryRouter, Route, Routes} from 'react-router'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {BASE_URL} from '@/shared/api/client'
import {server} from '@/test/mocks/server'
import {BoardEditPage} from './BoardEditPage'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

function editModeFixture(overrides: Record<string, unknown> = {}) {
  return { boardId: 1, categoryId: 2, title: '원본 제목', content: '원본 본문', ...overrides }
}

function detailFixture(overrides: Record<string, unknown> = {}) {
  return {
    boardId: 1,
    categoryId: 2,
    empId: 100,
    authorName: '홍길동',
    title: '원본 제목',
    content: '원본 본문',
    publishedAt: '2026-07-01T09:00:00',
    modifiedAt: '2026-07-01T09:00:00',
    likeCount: 0,
    viewCount: 1,
    commentCount: 0,
    isDraft: false,
    isLiked: false,
    ...overrides,
  }
}

function renderEdit(boardId: number | string = 1) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/boards/${boardId}/edit`]}>
        <Routes>
          <Route path="/boards/:boardId/edit" element={<BoardEditPage />} />
          <Route path="/boards" element={<div>게시판 목록 화면</div>} />
          <Route path="/boards/:boardId" element={<div>게시글 상세 화면</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('BoardEditPage (T13.3-a) - categories/editMode 게이팅', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('editModeQuery가 먼저 도착해도 categoriesQuery가 끝나기 전에는 편집 폼(select)을 렌더하지 않는다', async () => {
    const categoriesDeferred = deferred<Response>()
    server.use(
      http.get(`${BASE_URL}/api/categories`, () => categoriesDeferred.promise as never),
      http.get(`${BASE_URL}/api/boards/1/edit-mode`, () => HttpResponse.json(editModeFixture())),
      http.get(`${BASE_URL}/api/boards/1`, () => HttpResponse.json(detailFixture())),
      http.get(`${BASE_URL}/api/boards/1/files`, () => HttpResponse.json([])),
    )

    renderEdit(1)

    await waitFor(() => expect(screen.getByText('불러오는 중...')).toBeInTheDocument())
    expect(screen.queryByLabelText(/카테고리/)).not.toBeInTheDocument()
    expect(screen.queryByText('게시글 정보')).not.toBeInTheDocument()

    categoriesDeferred.resolve(
      HttpResponse.json([
        { categoryId: 1, categoryName: '공지', isVisible: true },
        { categoryId: 2, categoryName: '자유', isVisible: true },
      ]) as never,
    )

    expect(await screen.findByLabelText(/카테고리/)).toHaveValue('2')
  })
})

describe('BoardEditPage (T13.3-a) - 저장/취소 네비게이션 분기', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('초안(detail의 isDraft=true)을 저장하면 게시판 목록(/boards)으로 이동하고, "취소"도 동일 경로를 가리킨다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/categories`, () =>
        HttpResponse.json([{ categoryId: 1, categoryName: '공지', isVisible: true }]),
      ),
      http.get(`${BASE_URL}/api/boards/1/edit-mode`, () => HttpResponse.json(editModeFixture({ categoryId: 1 }))),
      http.get(`${BASE_URL}/api/boards/1`, () =>
        HttpResponse.json(detailFixture({ categoryId: 1, isDraft: true, modifiedAt: null })),
      ),
      http.get(`${BASE_URL}/api/boards/1/files`, () => HttpResponse.json([])),
      http.patch(`${BASE_URL}/api/boards/1`, () => new HttpResponse(null, { status: 204 })),
    )
    const user = userEvent.setup()
    renderEdit(1)

    await screen.findByRole('link', { name: '취소' })
    await user.clear(screen.getByLabelText(/제목/))
    await user.type(screen.getByLabelText(/제목/), '수정된 제목')

    await waitFor(() => expect(screen.getByRole('button', { name: '저장' })).not.toBeDisabled())
    expect(screen.getByRole('link', { name: '취소' })).toHaveAttribute('href', '/boards')

    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('게시판 목록 화면')).toBeInTheDocument()
  })

  it('발행 글(detail 200)을 저장하면 상세(/boards/:boardId)로 이동하고, "취소"도 동일 경로를 가리킨다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/categories`, () =>
        HttpResponse.json([{ categoryId: 1, categoryName: '공지', isVisible: true }]),
      ),
      http.get(`${BASE_URL}/api/boards/1/edit-mode`, () => HttpResponse.json(editModeFixture({ categoryId: 1 }))),
      http.get(`${BASE_URL}/api/boards/1`, () => HttpResponse.json(detailFixture({ categoryId: 1 }))),
      http.get(`${BASE_URL}/api/boards/1/files`, () => HttpResponse.json([])),
      http.patch(`${BASE_URL}/api/boards/1`, () => new HttpResponse(null, { status: 204 })),
    )
    const user = userEvent.setup()
    renderEdit(1)

    expect(await screen.findByRole('link', { name: '취소' })).toHaveAttribute('href', '/boards/1')

    await user.clear(screen.getByLabelText(/제목/))
    await user.type(screen.getByLabelText(/제목/), '수정된 제목')

    await waitFor(() => expect(screen.getByRole('button', { name: '저장' })).not.toBeDisabled())
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('게시글 상세 화면')).toBeInTheDocument()
  })
})

describe('BoardEditPage - 임시저장 발행 버튼', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('초안(isDraft=true)이면 "발행" 버튼이 보이고, 클릭하면 발행 후 게시판 목록(/boards)으로 이동한다', async () => {
    let publishCalled = false
    server.use(
      http.get(`${BASE_URL}/api/categories`, () =>
        HttpResponse.json([{ categoryId: 1, categoryName: '공지', isVisible: true }]),
      ),
      http.get(`${BASE_URL}/api/boards/1/edit-mode`, () => HttpResponse.json(editModeFixture({ categoryId: 1 }))),
      http.get(`${BASE_URL}/api/boards/1`, () =>
        HttpResponse.json(detailFixture({ categoryId: 1, isDraft: true, modifiedAt: null })),
      ),
      http.get(`${BASE_URL}/api/boards/1/files`, () => HttpResponse.json([])),
      http.patch(`${BASE_URL}/api/boards/1/publishment`, () => {
        publishCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderEdit(1)

    const publishButton = await screen.findByRole('button', { name: '발행' })
    await user.click(publishButton)

    expect(await screen.findByText('게시판 목록 화면')).toBeInTheDocument()
    expect(publishCalled).toBe(true)
  })

  it('발행 글(isDraft=false)이면 "발행" 버튼이 보이지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/categories`, () =>
        HttpResponse.json([{ categoryId: 1, categoryName: '공지', isVisible: true }]),
      ),
      http.get(`${BASE_URL}/api/boards/1/edit-mode`, () => HttpResponse.json(editModeFixture({ categoryId: 1 }))),
      http.get(`${BASE_URL}/api/boards/1`, () => HttpResponse.json(detailFixture({ categoryId: 1 }))),
      http.get(`${BASE_URL}/api/boards/1/files`, () => HttpResponse.json([])),
    )
    renderEdit(1)

    await screen.findByRole('button', { name: '저장' })
    expect(screen.queryByRole('button', { name: '발행' })).not.toBeInTheDocument()
  })
})

describe('BoardEditPage (T13.3-b/F309/F312) - 첨부파일 개별 삭제', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('여러 파일을 빠르게 연속 삭제해도 파일별 독립적인 로딩 상태를 가지며 중복 DELETE가 발생하지 않는다', async () => {
    let files = [
      { fileId: 10, originalName: 'a.pdf', extension: 'pdf', fileSize: 100 },
      { fileId: 20, originalName: 'b.pdf', extension: 'pdf', fileSize: 200 },
    ]
    let del1Count = 0
    let del2Count = 0
    const del1 = deferred<void>()
    const del2 = deferred<void>()

    server.use(
      http.get(`${BASE_URL}/api/categories`, () =>
        HttpResponse.json([{ categoryId: 1, categoryName: '공지', isVisible: true }]),
      ),
      http.get(`${BASE_URL}/api/boards/1/edit-mode`, () => HttpResponse.json(editModeFixture({ categoryId: 1 }))),
      http.get(`${BASE_URL}/api/boards/1`, () => HttpResponse.json(detailFixture({ categoryId: 1 }))),
      http.get(`${BASE_URL}/api/boards/1/files`, () => HttpResponse.json(files)),
      http.delete(`${BASE_URL}/api/boards/1/files/10`, async () => {
        del1Count += 1
        await del1.promise
        files = files.filter((f) => f.fileId !== 10)
        return new HttpResponse(null, { status: 204 })
      }),
      http.delete(`${BASE_URL}/api/boards/1/files/20`, async () => {
        del2Count += 1
        await del2.promise
        files = files.filter((f) => f.fileId !== 20)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderEdit(1)

    await screen.findByText('a.pdf')
    await screen.findByText('b.pdf')

    await user.click(screen.getByRole('button', { name: 'a.pdf 삭제' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'a.pdf 삭제' })).toBeDisabled())
    expect(screen.getByRole('button', { name: 'b.pdf 삭제' })).not.toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'b.pdf 삭제' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'b.pdf 삭제' })).toBeDisabled())

    del1.resolve()
    await waitFor(() => expect(screen.queryByText('a.pdf')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'b.pdf 삭제' })).toBeDisabled()

    del2.resolve()
    await waitFor(() => expect(screen.queryByText('b.pdf')).not.toBeInTheDocument())

    expect(del1Count).toBe(1)
    expect(del2Count).toBe(1)
  })
})

describe('BoardEditPage (T13.2/F304) - 첨부파일 업로드 사전검증', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('허용되지 않는 확장자 첨부 시 네트워크 요청 없이 검증 에러 토스트만 뜬다', async () => {
    let patchCalled = false
    server.use(
      http.get(`${BASE_URL}/api/categories`, () =>
        HttpResponse.json([{ categoryId: 1, categoryName: '공지', isVisible: true }]),
      ),
      http.get(`${BASE_URL}/api/boards/1/edit-mode`, () => HttpResponse.json(editModeFixture({ categoryId: 1 }))),
      http.get(`${BASE_URL}/api/boards/1`, () => HttpResponse.json(detailFixture({ categoryId: 1 }))),
      http.get(`${BASE_URL}/api/boards/1/files`, () => HttpResponse.json([])),
      http.patch(`${BASE_URL}/api/boards/1/files`, () => {
        patchCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { container } = renderEdit(1)

    await screen.findByText('첨부파일이 없습니다.')

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    const badFile = new File(['x'], 'virus.exe', { type: 'application/octet-stream' })
    await userEvent.upload(fileInput, badFile)

    const { toast } = await import('sonner')
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('허용되지 않는 확장자입니다')),
    )
    expect(patchCalled).toBe(false)
  })
})
