import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { CompanyInfoEditDialog } from './CompanyInfoEditDialog'

/**
 * CompanyInfoEditDialog(COMPANY_UPDATE_INFO, ROADMAP-COMPANY T3.2-a, F1403) 검증.
 *
 * - open 시 현재 조회값으로 프리필된다.
 * - 무변경 제출(프리필값 그대로) 클라 차단: 서버 요청이 나가지 않아야 한다(회귀 가치 높음,
 *   PRD §5번 포인트).
 * - companyName/location/ownerName 공백-only 입력 거부(회귀 가치 높음, PRD §6번 포인트).
 * - 성공(204) 시 토스트 + onOpenChange(false).
 * - 서버 에러는 삼켜지지 않고 root 에러로 표시된다(닫히지 않음).
 */
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function renderDialog(open = true) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const onOpenChange = vi.fn()
  render(
    <QueryClientProvider client={queryClient}>
      <CompanyInfoEditDialog
        open={open}
        onOpenChange={onOpenChange}
        currentCompanyName="HARUON"
        currentLocation="서울특별시 강남구"
        currentOwnerName="김대표"
      />
    </QueryClientProvider>,
  )
  return { onOpenChange }
}

describe('CompanyInfoEditDialog', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('열릴 때 현재 조회값으로 입력값이 채워진다', () => {
    renderDialog()

    expect(screen.getByLabelText('회사명')).toHaveValue('HARUON')
    expect(screen.getByLabelText('위치')).toHaveValue('서울특별시 강남구')
    expect(screen.getByLabelText('대표자명')).toHaveValue('김대표')
  })

  it('프리필값 그대로 제출(무변경)하면 root 에러를 노출하고 요청을 보내지 않는다', async () => {
    const putSpy = vi.fn()
    server.use(
      http.post(`${BASE_URL}/api/companies/info`, () => {
        putSpy()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('변경할 값을 하나 이상 입력해주세요')).toBeInTheDocument()
    expect(putSpy).not.toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('공백만 추가한 값(트레일링 스페이스)도 무변경으로 판정해 차단한다', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByLabelText('회사명'), ' ')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('변경할 값을 하나 이상 입력해주세요')).toBeInTheDocument()
  })

  it('회사명을 공백만으로 지우면 zod 검증 에러를 노출한다(공백-only 거부)', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.clear(screen.getByLabelText('회사명'))
    await user.type(screen.getByLabelText('회사명'), '   ')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(
      await screen.findByText('회사명은 공백만으로 입력할 수 없습니다'),
    ).toBeInTheDocument()
  })

  it('값을 실제로 변경하면 성공(204) 시 성공 토스트가 뜨고 다이얼로그가 닫힌다', async () => {
    let capturedBody: unknown
    server.use(
      http.post(`${BASE_URL}/api/companies/info`, async ({ request }) => {
        capturedBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.clear(screen.getByLabelText('회사명'))
    await user.type(screen.getByLabelText('회사명'), '하루온 주식회사')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('회사 기본정보를 수정했습니다')
    expect(capturedBody).toMatchObject({ companyName: '하루온 주식회사' })
    // editedAt은 자동 주입되지만 사용자 입력 필드는 아니다 — 서버 바디엔 존재해야 한다.
    expect(capturedBody).toHaveProperty('editedAt')
  })

  it('서버 실패 시 다이얼로그가 닫히지 않고 root 에러가 표시된다(실패가 삼켜지지 않음)', async () => {
    server.use(
      http.post(`${BASE_URL}/api/companies/info`, () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', name: 'VALIDATION_ERROR', httpStatus: 400, message: '회사명이 이미 존재합니다' },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.clear(screen.getByLabelText('회사명'))
    await user.type(screen.getByLabelText('회사명'), '하루온 주식회사')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('회사명이 이미 존재합니다')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('제출 중에는 Esc/취소 버튼으로 닫을 수 없다', async () => {
    let resolveResponse: (() => void) | undefined
    const gate = new Promise<void>((resolve) => {
      resolveResponse = resolve
    })
    server.use(
      http.post(`${BASE_URL}/api/companies/info`, async () => {
        await gate
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.clear(screen.getByLabelText('회사명'))
    await user.type(screen.getByLabelText('회사명'), '하루온 주식회사')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '취소' })).toBeDisabled())
    await user.keyboard('{Escape}')
    expect(onOpenChange).not.toHaveBeenCalledWith(false)

    resolveResponse?.()
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })
})
