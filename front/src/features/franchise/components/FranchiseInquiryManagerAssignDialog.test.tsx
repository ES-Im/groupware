import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { FranchiseInquiryManagerAssignDialog } from './FranchiseInquiryManagerAssignDialog'

/**
 * FranchiseInquiryManagerAssignDialog(F1620, `FRANCHISE_INQUIRY_ASSIGN_ANSWER`,
 * ROADMAP(FRANCHISE) T5.3) 회귀 방지 테스트.
 * 사원 선택은 FranchiseManagerPicker(FRANCHISE 권한 사원 평면 목록, FRANCHISE_ASSIGNABLE_MANAGERS)로
 * 이뤄진다 — 부서→부서원 드릴다운이 아니라 후보 목록에서 바로 이름을 고른다.
 *
 * 검증 대상:
 * - 미선택 상태에서는 [배정] 버튼이 비활성이다.
 * - 현재 담당자(currentManagerEmpId)는 후보 목록에서 선택 불가(disabled)로 표시된다.
 * - 사원 1명 선택 후 [배정] 클릭 시 PATCH .../assign-answer?assignedEmpId={value}로 호출되고
 *   성공 토스트 + onOpenChange(false).
 * - 서버 판정 실패(도메인 위반) 시 handleApiError 토스트만 뜨고 onOpenChange(false)는 호출되지 않는다.
 * - 배정 요청 중에는 Esc로 닫을 수 없고, 응답 도착 후에 닫힌다.
 */

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

/**
 * FranchiseManagerPicker가 마운트 시 호출하는 배정 후보(FRANCHISE_ASSIGNABLE_MANAGERS) 목.
 * empId 7(현재 담당자, disabledEmpIds로 비활성 확인용)과 empId 101(선택 대상) 2명.
 */
function mockAssignableManagers() {
  server.use(
    http.get(`${BASE_URL}/api/franchises/assignable-managers`, () =>
      HttpResponse.json([
        { empId: 7, empName: '김담당' },
        { empId: 101, empName: '박신입' },
      ]),
    ),
  )
}

function dialogTree(
  open: boolean,
  onOpenChange: (open: boolean) => void,
  queryClient: QueryClient,
) {
  return (
    <QueryClientProvider client={queryClient}>
      <FranchiseInquiryManagerAssignDialog
        open={open}
        onOpenChange={onOpenChange}
        inquiryId={1}
        currentManagerEmpId={7}
      />
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

describe('FranchiseInquiryManagerAssignDialog - 선택 게이팅', () => {
  it('미선택 상태에서는 [배정] 버튼이 비활성이다', async () => {
    mockAssignableManagers()
    renderDialog()

    expect(screen.getByRole('button', { name: '배정' })).toBeDisabled()
  })

  it('현재 담당자(currentManagerEmpId)는 후보 목록에서 선택 불가(disabled)로 표시된다', async () => {
    mockAssignableManagers()
    renderDialog()

    const currentManagerButton = await screen.findByRole('button', { name: /김담당/ })
    expect(currentManagerButton).toBeDisabled()

    const selectableButton = screen.getByRole('button', { name: /박신입/ })
    expect(selectableButton).not.toBeDisabled()
  })
})

describe('FranchiseInquiryManagerAssignDialog - 배정 성공', () => {
  it('사원 1명 선택 후 [배정] 클릭 시 PATCH가 assignedEmpId 쿼리 파라미터로 호출되고 성공 토스트 + onOpenChange(false)', async () => {
    mockAssignableManagers()
    let requestedQuery: string | null = null
    server.use(
      http.patch(`${BASE_URL}/api/franchise-inquiries/1/assign-answer`, ({ request }) => {
        const url = new URL(request.url)
        requestedQuery = url.searchParams.get('assignedEmpId')
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.click(await screen.findByRole('button', { name: /박신입/ }))
    expect(screen.getByRole('button', { name: '박신입 선택 해제' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '배정' }))

    await waitFor(() => expect(requestedQuery).toBe('101'))

    const { toast } = await import('sonner')
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('답변 담당자를 배정했습니다'),
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('FranchiseInquiryManagerAssignDialog - 배정 실패', () => {
  it('서버 도메인 위반(409) 시 handleApiError 토스트만 뜨고 onOpenChange(false)는 호출되지 않는다', async () => {
    mockAssignableManagers()
    server.use(
      http.patch(`${BASE_URL}/api/franchise-inquiries/1/assign-answer`, () =>
        HttpResponse.json(
          {
            code: 'FRANCHISE_INQUIRY_003',
            name: 'CONFLICT',
            httpStatus: 409,
            message: '이미 답변이 제출된 문의는 담당자를 변경할 수 없습니다',
          },
          { status: 409 },
        ),
      ),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.click(await screen.findByRole('button', { name: /박신입/ }))
    await user.click(screen.getByRole('button', { name: '배정' }))

    const { toast } = await import('sonner')
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('이미 답변이 제출된 문의는 담당자를 변경할 수 없습니다'),
    )
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('배정 요청 중에는 Esc로 닫을 수 없고, 응답 도착 후에 닫힌다', async () => {
    mockAssignableManagers()
    let resolveResponse: (() => void) | undefined
    const gate = new Promise<void>((resolve) => {
      resolveResponse = resolve
    })
    server.use(
      http.patch(`${BASE_URL}/api/franchise-inquiries/1/assign-answer`, async () => {
        await gate
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.click(await screen.findByRole('button', { name: /박신입/ }))
    await user.click(screen.getByRole('button', { name: '배정' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '취소' })).toBeDisabled())
    await user.keyboard('{Escape}')
    expect(onOpenChange).not.toHaveBeenCalledWith(false)

    resolveResponse?.()

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })
})
