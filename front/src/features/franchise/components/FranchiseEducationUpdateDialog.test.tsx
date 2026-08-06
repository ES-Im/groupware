import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { FranchiseEducationDetail } from '../model/franchise'
import { FranchiseEducationUpdateDialog } from './FranchiseEducationUpdateDialog'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

afterEach(() => {
  vi.clearAllMocks()
})

const DETAIL: FranchiseEducationDetail = {
  id: 1,
  date: '2026-05-01',
  startAt: '10:00:00',
  place: '본사 3층 강당',
  title: '신규 가맹점 오리엔테이션',
  content: '가맹 운영 기본 교육입니다',
  appliedCount: 0,
  capacity: 20,
  remainingCapacity: 20,
  isActive: false,
  fileListInfoList: null,
}

function renderDialog(open = true, detail: FranchiseEducationDetail = DETAIL) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const onOpenChange = vi.fn()
  render(
    <QueryClientProvider client={queryClient}>
      <FranchiseEducationUpdateDialog
        open={open}
        onOpenChange={onOpenChange}
        educationId={detail.id}
        detail={detail}
      />
    </QueryClientProvider>,
  )
  return { onOpenChange }
}

describe('FranchiseEducationUpdateDialog - 프리필', () => {
  it('열릴 때 date/startAt을 합성한 교육 일시와 나머지 상세값으로 입력을 채운다', () => {
    renderDialog()

    expect(screen.getByLabelText('교육 일시')).toHaveValue('2026-05-01T10:00')
    expect(screen.getByLabelText('장소')).toHaveValue('본사 3층 강당')
    expect(screen.getByLabelText('제목')).toHaveValue('신규 가맹점 오리엔테이션')
    expect(screen.getByLabelText('내용')).toHaveValue('가맹 운영 기본 교육입니다')
    expect(screen.getByLabelText('정원')).toHaveValue(20)
  })
})

describe('FranchiseEducationUpdateDialog - 변경 필드만 PATCH(diff)', () => {
  it('장소만 바꿔 제출하면 PATCH body에 place만 담긴다', async () => {
    let receivedBody: unknown
    server.use(
      http.patch(`${BASE_URL}/api/franchise-educations/1`, async ({ request }) => {
        receivedBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    const placeInput = screen.getByLabelText('장소')
    await user.clear(placeInput)
    await user.type(placeInput, '본사 5층 세미나실')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(receivedBody).toEqual({ place: '본사 5층 세미나실' }))
  })

  it('아무 필드도 바꾸지 않고 제출하면 빈 payload({})가 그대로 전송된다', async () => {
    let receivedBody: unknown
    server.use(
      http.patch(`${BASE_URL}/api/franchise-educations/1`, async ({ request }) => {
        receivedBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(receivedBody).toEqual({}))
  })

  it('정원을 지워서 제출하면(setValueAs로 undefined 변환) zod 검증을 통과하고 payload에서 capacity가 생략된다', async () => {
    let receivedBody: unknown
    server.use(
      http.patch(`${BASE_URL}/api/franchise-educations/1`, async ({ request }) => {
        receivedBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    const titleInput = screen.getByLabelText('제목')
    await user.clear(titleInput)
    await user.type(titleInput, '위생 교육')
    await user.clear(screen.getByLabelText('정원'))
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(receivedBody).toEqual({ title: '위생 교육' }))
    expect(receivedBody).not.toHaveProperty('capacity')
  })

  it('교육 일시를 초 없이(yyyy-MM-ddTHH:mm) 입력해도 :00이 보정되어 전송된다', async () => {
    let receivedBody: unknown
    server.use(
      http.patch(`${BASE_URL}/api/franchise-educations/1`, async ({ request }) => {
        receivedBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderDialog()

    fireEvent.change(screen.getByLabelText('교육 일시'), {
      target: { value: '2026-05-02T11:30' },
    })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(receivedBody).toEqual({ educationDate: '2026-05-02T11:30:00' }),
    )
  })
})

describe('FranchiseEducationUpdateDialog - zod 클라 사전검증', () => {
  it('정원에 0을 입력하면 "정원은 양수여야 합니다" 에러를 노출하고 요청을 보내지 않는다', async () => {
    let patchCalled = false
    server.use(
      http.patch(`${BASE_URL}/api/franchise-educations/1`, () => {
        patchCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    const capacityInput = screen.getByLabelText('정원')
    await user.clear(capacityInput)
    await user.type(capacityInput, '0')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('정원은 양수여야 합니다')).toBeInTheDocument()
    expect(patchCalled).toBe(false)
  })

  it('내용을 공백만으로 채우면 "교육 내용은 공백만으로 입력할 수 없습니다" 에러를 노출하고 요청을 보내지 않는다', async () => {
    let patchCalled = false
    server.use(
      http.patch(`${BASE_URL}/api/franchise-educations/1`, () => {
        patchCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    const contentInput = screen.getByLabelText('내용')
    await user.clear(contentInput)
    await user.type(contentInput, '   ')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(
      await screen.findByText('교육 내용은 공백만으로 입력할 수 없습니다'),
    ).toBeInTheDocument()
    expect(patchCalled).toBe(false)
  })
})

describe('FranchiseEducationUpdateDialog - 제출 성공/실패', () => {
  it('제출 성공 시 성공 토스트가 뜨고 다이얼로그가 닫힌다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/franchise-educations/1`, () => new HttpResponse(null, { status: 204 })),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    const placeInput = screen.getByLabelText('장소')
    await user.clear(placeInput)
    await user.type(placeInput, '본사 5층 세미나실')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('교육 정보를 수정했습니다')
  })

  it('서버 판정 실패(등록자 아님 등) 시 다이얼로그가 닫히지 않고 root 에러가 표시된다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/franchise-educations/1`, () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', name: 'VALIDATION_ERROR', httpStatus: 400, message: '등록자만 수정할 수 있습니다' },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('등록자만 수정할 수 있습니다')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
