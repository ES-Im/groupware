import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { BoardComment } from '../model/board'
import { CommentSection } from './CommentSection'

function comment(overrides: Partial<BoardComment> = {}): BoardComment {
  return {
    parentCommentId: null,
    commentId: 1,
    writerEmpId: 10,
    writerEmpName: '홍길동',
    content: '댓글 내용',
    registerAt: '2026-07-01T10:00:00',
    isEdited: false,
    isDeleted: false,
    ...overrides,
  }
}

function commentsPage(content: BoardComment[], overrides: Record<string, unknown> = {}) {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    number: 0,
    size: 10,
    numberOfElements: content.length,
    first: true,
    last: true,
    ...overrides,
  }
}

function renderSection(boardId = 1) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <CommentSection boardId={boardId} />
    </QueryClientProvider>,
  )
}

describe('CommentSection (F313~F317) - 페이지 경계를 넘는 대댓글', () => {
  it('부모가 현재 페이지 content에 없는 대댓글도 유실하지 않고 독립적으로 렌더한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/boards/1/comments`, () =>
        HttpResponse.json(
          commentsPage([
            comment({ commentId: 2, parentCommentId: null, content: '최상위 댓글' }),
            comment({
              commentId: 3,
              parentCommentId: 1,
              writerEmpName: '김철수',
              content: '부모가 다른 페이지에 있는 답글',
            }),
          ]),
        ),
      ),
    )

    renderSection(1)

    expect(await screen.findByText('최상위 댓글')).toBeInTheDocument()
    expect(screen.getByText('부모가 다른 페이지에 있는 답글')).toBeInTheDocument()

    const articles = screen.getAllByRole('article')
    expect(articles).toHaveLength(2)
    const topLevelArticle = screen.getByText('최상위 댓글').closest('article') as HTMLElement
    const replyArticle = screen.getByText('부모가 다른 페이지에 있는 답글').closest('article') as HTMLElement
    expect(within(topLevelArticle).getByRole('button', { name: '답글' })).toBeInTheDocument()
    expect(within(replyArticle).queryByRole('button', { name: '답글' })).not.toBeInTheDocument()
  })
})

describe('CommentSection (F313~F317) - 조회 실패/빈 목록 구분', () => {
  it('댓글 목록이 비어 있으면 "등록된 댓글이 없습니다."를 렌더한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/boards/1/comments`, () => HttpResponse.json(commentsPage([]))),
    )

    renderSection(1)

    expect(await screen.findByText('등록된 댓글이 없습니다.')).toBeInTheDocument()
  })

  it('조회가 403(ROLE_003)으로 실패하면 "댓글을 조회할 권한이 없습니다."를 렌더한다(빈 목록과 구분)', async () => {
    server.use(
      http.get(`${BASE_URL}/api/boards/1/comments`, () =>
        HttpResponse.json(
          { code: 'ROLE_003', name: 'FORBIDDEN', httpStatus: 403, message: '권한이 없습니다' },
          { status: 403 },
        ),
      ),
    )

    renderSection(1)

    expect(await screen.findByText('댓글을 조회할 권한이 없습니다.')).toBeInTheDocument()
    expect(screen.queryByText('등록된 댓글이 없습니다.')).not.toBeInTheDocument()
  })

  it('조회가 403 외 사유로 실패하면 "댓글을 불러오지 못했습니다."를 렌더한다(빈 목록과 구분)', async () => {
    server.use(
      http.get(`${BASE_URL}/api/boards/1/comments`, () =>
        HttpResponse.json(
          { code: 'COMMON_001', name: 'INTERNAL_SERVER_ERROR', httpStatus: 500, message: '서버 오류' },
          { status: 500 },
        ),
      ),
    )

    renderSection(1)

    expect(await screen.findByText('댓글을 불러오지 못했습니다.')).toBeInTheDocument()
    expect(screen.queryByText('등록된 댓글이 없습니다.')).not.toBeInTheDocument()
  })
})

describe('CommentSection (F313~F317) - 댓글 등록 폼', () => {
  it('빈 값으로 등록 제출 시 zod 사전검증 메시지를 보여주고 API를 호출하지 않는다', async () => {
    let registerCalled = false
    server.use(
      http.get(`${BASE_URL}/api/boards/1/comments`, () => HttpResponse.json(commentsPage([]))),
      http.post(`${BASE_URL}/api/boards/1/comments`, () => {
        registerCalled = true
        return new HttpResponse(null, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderSection(1)

    await screen.findByText('등록된 댓글이 없습니다.')
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('댓글 내용을 입력해주세요')).toBeInTheDocument()
    expect(registerCalled).toBe(false)
  })

  it('유효한 값으로 등록 제출 시 COMMENT_REGISTER를 호출한다', async () => {
    let registeredBody: unknown
    server.use(
      http.get(`${BASE_URL}/api/boards/1/comments`, () => HttpResponse.json(commentsPage([]))),
      http.post(`${BASE_URL}/api/boards/1/comments`, async ({ request }) => {
        registeredBody = await request.json()
        return new HttpResponse(null, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderSection(1)

    await screen.findByText('등록된 댓글이 없습니다.')
    await user.type(screen.getByLabelText('댓글 내용'), '새 댓글입니다')
    await user.click(screen.getByRole('button', { name: '등록' }))

    await waitFor(() => expect(registeredBody).toEqual({ content: '새 댓글입니다' }))
  })
})
