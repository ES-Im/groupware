import type {ComponentProps} from 'react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'
import {employeeKeys} from '@/features/employee/model/queryKeys'
import type {BoardComment} from '../model/board'
import {CommentItem} from './CommentItem'

function comment(overrides: Partial<BoardComment> = {}): BoardComment {
  return {
    parentCommentId: null,
    commentId: 1,
    writerEmpId: 10,
    writerEmpName: '홍길동',
    content: '댓글 내용입니다',
    registerAt: '2026-07-01T10:00:00',
    isEdited: false,
    isDeleted: false,
    ...overrides,
  }
}

function meFixture(empId: number) {
  return {
    empBasicInfo: {
      empId,
      empNo: '000000001',
      name: '나',
      loginId: 'test1234',
      email: 'test1234@haruon.com',
      extensionNo: null,
    },
    activeFiles: [],
    currentDepts: [],
  }
}

function renderItem(
  props: Partial<ComponentProps<typeof CommentItem>> = {},
  meEmpId?: number,
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  if (meEmpId !== undefined) {
    queryClient.setQueryData(employeeKeys.me(), meFixture(meEmpId))
  }
  return render(
    <QueryClientProvider client={queryClient}>
      <CommentItem boardId={1} comment={comment()} allowReply={true} {...props} />
    </QueryClientProvider>,
  )
}

describe('CommentItem (F313~F317) - 다른 사원의 댓글', () => {
  it('최상위 댓글(allowReply=true)에서 "답글" 버튼은 보이지만 "수정"/"삭제" 버튼은 보이지 않는다', () => {
    renderItem({ allowReply: true, indented: false }, 999)

    expect(screen.getByText('댓글 내용입니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '답글' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '수정' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument()
  })

  it('대댓글(allowReply=false, indented=true)에서는 "답글"/"수정"/"삭제" 버튼이 모두 보이지 않는다', () => {
    renderItem({ allowReply: false, indented: true }, 999)

    expect(screen.queryByRole('button', { name: '답글' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '수정' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument()
  })
})

describe('CommentItem (F313~F317) - 내 댓글(isOwner=true)', () => {
  it('내가 작성한 댓글이면 "수정"/"삭제" 버튼이 보인다', () => {
    renderItem({ allowReply: true, indented: false }, 10)

    expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()
  })

  it('"수정" 버튼을 누르면 내용 수정 폼이 열린다', async () => {
    const user = userEvent.setup()
    renderItem({ allowReply: true, indented: false }, 10)

    await user.click(screen.getByRole('button', { name: '수정' }))

    expect(screen.getByDisplayValue('댓글 내용입니다')).toBeInTheDocument()
  })
})

describe('CommentItem (F313~F317) - 삭제된 댓글', () => {
  it('isDeleted=true면 "삭제된 댓글입니다."만 렌더하고 원 내용/버튼은 렌더하지 않는다', () => {
    renderItem({
      comment: comment({
        isDeleted: true,
        writerEmpId: null,
        writerEmpName: null,
        content: null,
        registerAt: null,
        isEdited: null,
      }),
    })

    expect(screen.getByText('삭제된 댓글입니다.')).toBeInTheDocument()
    expect(screen.queryByText('댓글 내용입니다')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '답글' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '수정' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument()
  })
})

describe('CommentItem (F313~F317) - 답글 폼 토글', () => {
  it('"답글" 버튼을 누르면 답글 입력 폼이 열린다', async () => {
    const user = userEvent.setup()
    renderItem({ allowReply: true })

    await user.click(screen.getByRole('button', { name: '답글' }))

    expect(screen.getByPlaceholderText('답글을 입력해주세요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '답글 등록' })).toBeInTheDocument()
  })
})
