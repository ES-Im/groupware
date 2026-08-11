import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LoginForm } from './LoginForm'

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

function fakeAxiosError(status: number, code: string, message: string) {
  return Object.assign(new Error(message), {
    isAxiosError: true,
    response: { status, data: { code, name: code, httpStatus: status, message } },
  })
}

describe('LoginForm (T1.1 표준 폼 패턴)', () => {
  it('빈 값 제출 시 zod 클라 사전검증 메시지를 노출하고 onSubmit을 호출하지 않는다', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<LoginForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByText('아이디를 입력해주세요')).toBeInTheDocument()
    expect(screen.getByText('비밀번호를 입력해주세요')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('서버 VALIDATION_ERROR 응답을 폼 루트 에러로 매핑한다(필드 특정 불가 폴백)', async () => {
    const user = userEvent.setup()
    const onSubmit = vi
      .fn()
      .mockRejectedValue(fakeAxiosError(400, 'VALIDATION_ERROR', '아이디는 필수입니다'))
    render(<LoginForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('ID *'), 'user01')
    await user.type(screen.getByLabelText('Password *'), 'pw12345')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    const rootError = await screen.findByText('아이디는 필수입니다')
    expect(rootError).toBeInTheDocument()
    expect(rootError).toHaveAttribute('role', 'alert')
    expect(onSubmit).toHaveBeenCalledWith(
      { loginId: 'user01', password: 'pw12345' },
      expect.anything(),
    )
  })

  it('서버 AUTH_002(가입 승인 대기) 응답을 폼 루트 에러로 매핑하고 토스트는 띄우지 않는다', async () => {
    const { toast } = await import('sonner')
    const user = userEvent.setup()
    const onSubmit = vi
      .fn()
      .mockRejectedValue(
        fakeAxiosError(401, 'AUTH_002', '가입 승인 대기 중입니다. 관리자에게 가입 승인을 요청해 주세요.'),
      )
    render(<LoginForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('ID *'), 'user01')
    await user.type(screen.getByLabelText('Password *'), 'pw12345')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    const rootError = await screen.findByText(
      '가입 승인 대기 중입니다. 관리자에게 가입 승인을 요청해 주세요.',
    )
    expect(rootError).toBeInTheDocument()
    expect(rootError).toHaveAttribute('role', 'alert')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('필드로 특정할 수 없는 서버 에러는 토스트로 폴백한다', async () => {
    const { toast } = await import('sonner')
    const user = userEvent.setup()
    const onSubmit = vi
      .fn()
      .mockRejectedValue(fakeAxiosError(500, 'INTERNAL_SERVER_ERROR', '서버 오류입니다'))
    render(<LoginForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('ID *'), 'user01')
    await user.type(screen.getByLabelText('Password *'), 'pw12345')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('서버 오류입니다'))
  })
})
