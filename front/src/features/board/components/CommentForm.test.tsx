import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CommentForm } from './CommentForm'

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

function fakeAxiosError(status: number, code: string, message: string) {
  return Object.assign(new Error(message), {
    isAxiosError: true,
    response: { status, data: { code, name: code, httpStatus: status, message } },
  })
}

describe('CommentForm (F314) - 등록 모드(초기값 없음, 취소 버튼 없음)', () => {
  it('빈 값 제출 시 zod 사전검증 메시지를 보여주고 onSubmit을 호출하지 않는다', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<CommentForm onSubmit={onSubmit} submitLabel="등록" />)

    expect(screen.queryByRole('button', { name: '취소' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('댓글 내용을 입력해주세요')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('공백만으로 제출하면 "공백만으로 입력할 수 없습니다" 메시지를 보여주고 onSubmit을 호출하지 않는다', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<CommentForm onSubmit={onSubmit} submitLabel="등록" />)

    await user.type(screen.getByLabelText('댓글 내용'), '   ')
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('댓글은 공백만으로 입력할 수 없습니다')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('300자를 초과하면 길이 제한 메시지를 보여주고 onSubmit을 호출하지 않는다', async () => {
    const onSubmit = vi.fn()
    render(<CommentForm onSubmit={onSubmit} submitLabel="등록" />)

    const textarea = screen.getByLabelText('댓글 내용')
    const overLong = 'a'.repeat(301)
    const { fireEvent } = await import('@testing-library/react')
    fireEvent.change(textarea, { target: { value: overLong } })
    fireEvent.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('댓글은 300자 이하로 입력해주세요')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('유효한 값으로 제출하면 onSubmit이 호출되고, 성공 후 입력창이 빈 값으로 초기화된다', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<CommentForm onSubmit={onSubmit} submitLabel="등록" />)

    await user.type(screen.getByLabelText('댓글 내용'), '새 댓글입니다')
    await user.click(screen.getByRole('button', { name: '등록' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ content: '새 댓글입니다' }))
    await waitFor(() => expect(screen.getByLabelText('댓글 내용')).toHaveValue(''))
  })

  it('onSubmit이 서버 에러(VALIDATION_ERROR)로 실패하면 폼 루트 에러로 매핑하고 입력값을 유지한다(실패 삼킴 없음)', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(fakeAxiosError(400, 'VALIDATION_ERROR', '댓글 내용은 필수입니다'))
    const user = userEvent.setup()
    render(<CommentForm onSubmit={onSubmit} submitLabel="등록" />)

    await user.type(screen.getByLabelText('댓글 내용'), '실패할 댓글')
    await user.click(screen.getByRole('button', { name: '등록' }))

    const rootError = await screen.findByText('댓글 내용은 필수입니다')
    expect(rootError).toHaveAttribute('role', 'alert')
    expect(screen.getByLabelText('댓글 내용')).toHaveValue('실패할 댓글')
  })
})

describe('CommentForm (F315) - 대댓글 모드(초기값 없음, 취소 버튼 있음)', () => {
  it('onCancel이 주어지면 "취소" 버튼이 보이고 클릭 시 onCancel을 호출한다', async () => {
    const onSubmit = vi.fn()
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(
      <CommentForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        submitLabel="답글 등록"
        placeholder="답글을 입력해주세요"
        autoFocus
      />,
    )

    expect(screen.getByPlaceholderText('답글을 입력해주세요')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('유효한 값으로 제출하면 답글 content로 onSubmit이 호출된다', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<CommentForm onSubmit={onSubmit} onCancel={vi.fn()} submitLabel="답글 등록" />)

    await user.type(screen.getByLabelText('댓글 내용'), '대댓글입니다')
    await user.click(screen.getByRole('button', { name: '답글 등록' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ content: '대댓글입니다' }))
  })
})

describe('CommentForm (F316) - 수정 모드(initialContent 초기값)', () => {
  it('initialContent로 입력창을 채워 마운트하고, 성공 후 initialContent로 리셋한다(빈 값 아님)', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(
      <CommentForm
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        initialContent="기존 댓글 내용"
        submitLabel="저장"
      />,
    )

    expect(screen.getByLabelText('댓글 내용')).toHaveValue('기존 댓글 내용')

    await user.clear(screen.getByLabelText('댓글 내용'))
    await user.type(screen.getByLabelText('댓글 내용'), '수정된 댓글 내용')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ content: '수정된 댓글 내용' }))
    await waitFor(() => expect(screen.getByLabelText('댓글 내용')).toHaveValue('기존 댓글 내용'))
  })

  it('빈 값으로 지우고 제출하면 zod 사전검증 메시지를 보여주고 onSubmit을 호출하지 않는다', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(
      <CommentForm
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        initialContent="기존 댓글 내용"
        submitLabel="저장"
      />,
    )

    await user.clear(screen.getByLabelText('댓글 내용'))
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('댓글 내용을 입력해주세요')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
