import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { BoardEditPage } from './BoardEditPage'

/**
 * BoardEditPage(F307/F304/F309/F312, ROADMAP T13.3-a/T13.3-b) 회귀 방지 테스트.
 *
 * 방금 발견된 회귀 위험 지점(스타일링 리팩터 직후):
 * - categoriesQuery·editModeQuery 게이팅: 둘 다 로딩 완료되기 전에는 편집 폼(select)이
 *   레이스 컨디션 없이 렌더되지 않는지(BoardEditPage.tsx L492-504 주석 참조).
 * - 저장 성공 시 초안(detail 404)이면 /boards, 발행 글(detail 200)이면 /boards/:boardId로
 *   네비게이션이 올바르게 분기되는지("취소" Link도 동일 경로를 가리키는지).
 * - deletingFileIds(Set) 로컬 상태 — 여러 파일을 빠르게 연속 삭제해도 파일별로 독립적인
 *   로딩 상태를 가지며 중복 DELETE 요청이 발생하지 않는지.
 * - 첨부파일 업로드 사전검증(validateBoardFileUpload) 위반 시 네트워크 요청 없이 에러 토스트만.
 */

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

/** resolve를 밖으로 노출해 언제든 응답을 확정지을 수 있는 지연 프라미스 헬퍼(BoardListPage.test.tsx와 동일). */
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
    ...overrides,
  }
}

function notFoundBody() {
  return { code: 'RESOURCE_001', name: 'NOT_FOUND', httpStatus: 404, message: '게시글을 찾을 수 없습니다' }
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

    // editMode는 먼저 도착하지만 categories가 아직이므로 "불러오는 중..."만 보여야 하고,
    // select는 마운트되지 않아야 한다(레이스 컨디션 가드).
    await waitFor(() => expect(screen.getByText('불러오는 중...')).toBeInTheDocument())
    expect(screen.queryByLabelText(/카테고리/)).not.toBeInTheDocument()
    expect(screen.queryByText('게시글 정보')).not.toBeInTheDocument()

    categoriesDeferred.resolve(
      HttpResponse.json([
        { categoryId: 1, categoryName: '공지', isVisible: true },
        { categoryId: 2, categoryName: '자유', isVisible: true },
      ]) as never,
    )

    // categories까지 도착한 뒤에야 select가 마운트되고, editMode.categoryId(2)와 매칭되는
    // option이 이미 존재하는 상태로 마운트되어 값이 정확히 반영된다.
    expect(await screen.findByLabelText(/카테고리/)).toHaveValue('2')
  })
})

describe('BoardEditPage (T13.3-a) - 저장/취소 네비게이션 분기', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('초안(detail 404)을 저장하면 게시판 목록(/boards)으로 이동하고, "취소"도 동일 경로를 가리킨다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/categories`, () =>
        HttpResponse.json([{ categoryId: 1, categoryName: '공지', isVisible: true }]),
      ),
      http.get(`${BASE_URL}/api/boards/1/edit-mode`, () => HttpResponse.json(editModeFixture({ categoryId: 1 }))),
      http.get(`${BASE_URL}/api/boards/1`, () => HttpResponse.json(notFoundBody(), { status: 404 })),
      http.get(`${BASE_URL}/api/boards/1/files`, () => HttpResponse.json([])),
      http.patch(`${BASE_URL}/api/boards/1`, () => new HttpResponse(null, { status: 204 })),
    )
    const user = userEvent.setup()
    renderEdit(1)

    await screen.findByRole('link', { name: '취소' })
    await user.clear(screen.getByLabelText(/제목/))
    await user.type(screen.getByLabelText(/제목/), '수정된 제목')

    // detailQuery(BOARD_DETAIL)가 404로 resolve된 뒤(=초안 신호 확정, "저장" 버튼이 활성화되는
    // 시점과 동일)에야 cancelPath가 "/boards"로 안정된다 — 그 전에는 상세 경로로 계산되는
    // 알려진 레이스가 있다(BoardEditPage.tsx L521 //todo 주석 참조, 소스 수정 범위 밖).
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

    // a.pdf 삭제 클릭: a.pdf만 로딩(disabled) 상태여야 하고, b.pdf는 영향받지 않아야 한다.
    await user.click(screen.getByRole('button', { name: 'a.pdf 삭제' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'a.pdf 삭제' })).toBeDisabled())
    expect(screen.getByRole('button', { name: 'b.pdf 삭제' })).not.toBeDisabled()

    // a.pdf 삭제가 아직 진행 중인 상태에서 b.pdf도 연속 클릭 — 각자 독립적으로 로딩 표시되어야 한다.
    await user.click(screen.getByRole('button', { name: 'b.pdf 삭제' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'b.pdf 삭제' })).toBeDisabled())

    del1.resolve()
    await waitFor(() => expect(screen.queryByText('a.pdf')).not.toBeInTheDocument())
    // a.pdf가 사라진 뒤에도 b.pdf 삭제는 여전히 진행 중이어야 한다(개별 상태 독립성).
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
