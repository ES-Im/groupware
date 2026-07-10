import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { CancelReservationAlertDialog } from './CancelReservationAlertDialog'

/**
 * CancelReservationAlertDialog(F806, ROADMAP T4.3-c) 회귀 방지 테스트.
 * - 확인 다이얼로그를 거치지 않으면 취소 요청이 나가지 않는다(오클릭 방지).
 * - 성공 시 /meetings로 navigate + 성공 토스트.
 * - 실패(소유자 불일치 등 서버 위반) 시 handleApiError로 토스트만 뜨고 그대로 머문다.
 */
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function LocationDisplay() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function renderComponent() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/meetings/10']}>
        <Routes>
          <Route
            path="/meetings/10"
            element={
              <>
                <CancelReservationAlertDialog meetingId={10} />
                <LocationDisplay />
              </>
            }
          />
          <Route path="/meetings" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('CancelReservationAlertDialog - 확인 게이트', () => {
  it('트리거만 클릭하고 확정하지 않으면 취소 요청이 나가지 않는다', async () => {
    let cancelCalled = false
    server.use(
      http.patch(`${BASE_URL}/api/meetings/10/cancel`, () => {
        cancelCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderComponent()

    await user.click(screen.getByRole('button', { name: '예약 취소' }))
    await screen.findByRole('alertdialog')
    await user.click(screen.getByRole('button', { name: '돌아가기' }))

    expect(cancelCalled).toBe(false)
  })
})

describe('CancelReservationAlertDialog - 확정 성공', () => {
  it('확정 시 PATCH .../cancel을 호출하고 /meetings로 navigate + 성공 토스트', async () => {
    server.use(http.patch(`${BASE_URL}/api/meetings/10/cancel`, () => new HttpResponse(null, { status: 204 })))
    const user = userEvent.setup()
    renderComponent()

    await user.click(screen.getByRole('button', { name: '예약 취소' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: '예약 취소' }))

    expect(await screen.findByTestId('location')).toHaveTextContent('/meetings')
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('예약을 취소했습니다')
  })
})

describe('CancelReservationAlertDialog - 서버 위반 실패', () => {
  it('실패 시 handleApiError로 에러 토스트만 뜨고 navigate하지 않는다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/meetings/10/cancel`, () =>
        HttpResponse.json(
          { code: 'ROLE_003', name: 'FORBIDDEN', httpStatus: 403, message: '예약자 본인만 취소할 수 있습니다' },
          { status: 403 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderComponent()

    await user.click(screen.getByRole('button', { name: '예약 취소' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: '예약 취소' }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('예약자 본인만 취소할 수 있습니다'))
    expect(screen.getByTestId('location')).toHaveTextContent('/meetings/10')
  })
})
