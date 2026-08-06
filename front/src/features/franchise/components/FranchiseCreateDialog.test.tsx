import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { FranchiseCreateDialog } from './FranchiseCreateDialog'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function mockAssignableManagers() {
  server.use(
    http.get(`${BASE_URL}/api/franchises/assignable-managers`, () =>
      HttpResponse.json([{ empId: 101, empName: '김담당' }]),
    ),
  )
}

function dialogTree(open: boolean, onOpenChange: (open: boolean) => void, queryClient: QueryClient) {
  return (
    <QueryClientProvider client={queryClient}>
      <FranchiseCreateDialog open={open} onOpenChange={onOpenChange} />
    </QueryClientProvider>
  )
}

function renderDialog(open = true) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const onOpenChange = vi.fn()
  const view = render(dialogTree(open, onOpenChange, queryClient))
  return {
    onOpenChange,
    setOpen: (next: boolean) => view.rerender(dialogTree(next, onOpenChange, queryClient)),
  }
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/사업자번호/), '123-45-67890')
  await user.type(screen.getByLabelText(/가맹점명/), 'HARUON 강남점')
  await user.type(screen.getByLabelText(/주소/), '서울특별시 강남구 테헤란로 1')
  await user.type(screen.getByLabelText(/대표자명/), '홍길동')
  await user.type(screen.getByLabelText(/연락처/), '010-1234-5678')
  await user.type(screen.getByLabelText(/이메일/), 'gangnam@haruon.com')
}

describe('FranchiseCreateDialog - 클라 사전검증', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('빈 값 제출 시 필수 6필드의 zod 메시지가 role=alert로 노출되고 POST 요청이 발생하지 않는다', async () => {
    mockAssignableManagers()
    let postCalls = 0
    server.use(
      http.post(`${BASE_URL}/api/franchises`, () => {
        postCalls += 1
        return HttpResponse.json({ franchiseId: 1 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('사업자번호를 입력해주세요')).toBeInTheDocument()
    const alertMessages = screen.getAllByRole('alert').map((el) => el.textContent)
    expect(alertMessages).toEqual(
      expect.arrayContaining([
        '사업자번호를 입력해주세요',
        '가맹점명을 입력해주세요',
        '주소를 입력해주세요',
        '대표자명을 입력해주세요',
        '연락처를 입력해주세요',
        '올바른 이메일 형식이 아닙니다',
      ]),
    )
    expect(postCalls).toBe(0)
  })

  it('사업자번호 형식(000-00-00000) 위반 시 형식 메시지가 노출되고 POST 요청이 발생하지 않는다', async () => {
    mockAssignableManagers()
    let postCalls = 0
    server.use(
      http.post(`${BASE_URL}/api/franchises`, () => {
        postCalls += 1
        return HttpResponse.json({ franchiseId: 1 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    await fillRequiredFields(user)
    await user.clear(screen.getByLabelText(/사업자번호/))
    await user.type(screen.getByLabelText(/사업자번호/), '1234567890')
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(
      await screen.findByText('사업자번호는 000-00-00000 형식(12자)으로 입력해주세요'),
    ).toBeInTheDocument()
    expect(postCalls).toBe(0)
  })
})

describe('FranchiseCreateDialog - 제출 성공', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('담당자 미선택 제출 시 body에서 managerEmpId가 생략되고 성공 토스트 + onOpenChange(false)', async () => {
    mockAssignableManagers()
    let requestedBody: Record<string, unknown> | undefined
    server.use(
      http.post(`${BASE_URL}/api/franchises`, async ({ request }) => {
        requestedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ franchiseId: 10 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: '등록' }))

    await waitFor(() =>
      expect(requestedBody).toEqual({
        businessNumber: '123-45-67890',
        franchiseName: 'HARUON 강남점',
        address: '서울특별시 강남구 테헤란로 1',
        ownerName: '홍길동',
        contactNumber: '010-1234-5678',
        contactEmail: 'gangnam@haruon.com',
      }),
    )
    expect(requestedBody).not.toHaveProperty('managerEmpId')

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('가맹점을 등록했습니다'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('FranchiseManagerPicker로 담당자를 선택해 제출하면 body에 selected[0].empId가 managerEmpId로 합성된다', async () => {
    mockAssignableManagers()
    let requestedBody: Record<string, unknown> | undefined
    server.use(
      http.post(`${BASE_URL}/api/franchises`, async ({ request }) => {
        requestedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ franchiseId: 11 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.click(await screen.findByRole('button', { name: /김담당/ }))
    expect(screen.getByRole('button', { name: '김담당 선택 해제' })).toBeInTheDocument()

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: '등록' }))

    await waitFor(() => expect(requestedBody).toBeDefined())
    expect(requestedBody).toMatchObject({ managerEmpId: 101 })

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('가맹점을 등록했습니다'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('제출 중에는 Esc/취소로 닫을 수 없고, 응답 도착 후에 닫힌다', async () => {
    mockAssignableManagers()
    let resolveResponse: (() => void) | undefined
    const gate = new Promise<void>((resolve) => {
      resolveResponse = resolve
    })
    server.use(
      http.post(`${BASE_URL}/api/franchises`, async () => {
        await gate
        return HttpResponse.json({ franchiseId: 12 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: '등록' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '취소' })).toBeDisabled())
    await user.keyboard('{Escape}')
    expect(onOpenChange).not.toHaveBeenCalledWith(false)

    resolveResponse?.()

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })
})

describe('FranchiseCreateDialog - 서버 판정 실패', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('VALIDATION_ERROR 시 root 에러가 role=alert로 표시되고 닫히지 않으며 입력값이 유지된다', async () => {
    mockAssignableManagers()
    server.use(
      http.post(`${BASE_URL}/api/franchises`, () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_ERROR',
            name: 'VALIDATION_ERROR',
            httpStatus: 400,
            message: '이미 등록된 이메일입니다',
          },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: '등록' }))

    const rootError = await screen.findByText('이미 등록된 이메일입니다')
    expect(rootError).toHaveRole('alert')
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(screen.getByLabelText(/가맹점명/)).toHaveValue('HARUON 강남점')

    const { toast } = await import('sonner')
    expect(toast.success).not.toHaveBeenCalled()
  })
})

describe('FranchiseCreateDialog - 닫기/재오픈 리셋', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('닫았다 다시 열면 이전 입력값과 담당자 선택이 남지 않는다', async () => {
    mockAssignableManagers()
    const user = userEvent.setup()
    const { setOpen } = renderDialog()

    await user.type(screen.getByLabelText(/가맹점명/), 'HARUON 강남점')
    await user.click(await screen.findByRole('button', { name: /김담당/ }))
    expect(screen.getByRole('button', { name: '김담당 선택 해제' })).toBeInTheDocument()

    setOpen(false)
    setOpen(true)

    expect(await screen.findByLabelText(/가맹점명/)).toHaveValue('')
    expect(screen.queryByRole('button', { name: '김담당 선택 해제' })).not.toBeInTheDocument()
  })
})
