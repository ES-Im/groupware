import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { FranchiseInquiryAnswerForm } from './FranchiseInquiryAnswerForm'
import type { FranchiseInquiryAnswer } from '../model/franchise'

/**
 * FranchiseInquiryAnswerForm(F1621·F1622·F1623, ROADMAP(FRANCHISE) T5.4) 회귀 방지 테스트.
 * FranchiseMemoActions(useZodForm+submitWithErrorMapping 폼)·FranchiseEducationActiveToggleButton
 * (AlertDialog 확인 패턴)·FranchiseCreateDialog(zod 검증/서버 에러 검증 관행)를 그대로 복제한다.
 *
 * 검증 대상:
 * - answer 없음(신규): 빈 textarea + "초안 저장" 버튼, 발송 버튼 없음.
 * - zod 클라 사전검증: 빈 값/공백만 제출 시 role=alert 인라인 에러 + POST 미발생.
 * - 신규 제출 성공(201) 시 POST body {answer} + 성공 토스트.
 * - answer 있음(미제출 초안, 수정 모드): textarea가 answer.content로 프리필 + "수정 저장" +
 *   "발송" 버튼 노출.
 * - 수정 제출 성공(204) 시 PATCH body {answer} + 성공 토스트.
 * - 서버 판정 실패(VALIDATION_ERROR)는 root 에러로 표시된다(FranchiseCreateDialog와 동일 관행).
 * - 발송: 트리거 클릭만으로는 요청 미발생(확인 다이얼로그 필요), 확인 클릭 시 PATCH
 *   .../answers/send 호출 + 성공(204) → 성공 토스트. 실패 시 handleApiError 토스트만.
 */

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function draftAnswer(overrides?: Partial<FranchiseInquiryAnswer>): FranchiseInquiryAnswer {
  return {
    answerId: 1,
    content: '기존 초안 내용입니다.',
    isSubmitted: false,
    answeredAt: '2026-07-02T09:00:00',
    answeredEmpId: 7,
    answeredEmpName: '김담당',
    ...overrides,
  }
}

function renderForm(answer: FranchiseInquiryAnswer | undefined) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <FranchiseInquiryAnswerForm inquiryId={1} answer={answer} />
    </QueryClientProvider>,
  )
}

describe('FranchiseInquiryAnswerForm - 신규(answer 없음)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('빈 textarea와 "초안 저장" 버튼만 렌더되고 발송 버튼은 없다', () => {
    renderForm(undefined)

    expect(screen.getByLabelText('답변 내용')).toHaveValue('')
    expect(screen.getByRole('button', { name: '초안 저장' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '발송' })).not.toBeInTheDocument()
  })

  it('빈 값 제출 시 "답변 내용을 입력해주세요"가 role=alert로 노출되고 POST가 발생하지 않는다', async () => {
    let postCalls = 0
    server.use(
      http.post(`${BASE_URL}/api/franchise-inquiries/1/answers`, () => {
        postCalls += 1
        return new HttpResponse(null, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderForm(undefined)

    await user.click(screen.getByRole('button', { name: '초안 저장' }))

    const alert = await screen.findByText('답변 내용을 입력해주세요')
    expect(alert).toHaveRole('alert')
    expect(postCalls).toBe(0)
  })

  it('공백만 입력 시 "답변은 공백만으로 입력할 수 없습니다"가 노출되고 POST가 발생하지 않는다', async () => {
    let postCalls = 0
    server.use(
      http.post(`${BASE_URL}/api/franchise-inquiries/1/answers`, () => {
        postCalls += 1
        return new HttpResponse(null, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderForm(undefined)

    await user.type(screen.getByLabelText('답변 내용'), '   ')
    await user.click(screen.getByRole('button', { name: '초안 저장' }))

    const alert = await screen.findByText('답변은 공백만으로 입력할 수 없습니다')
    expect(alert).toHaveRole('alert')
    expect(postCalls).toBe(0)
  })

  it('제출 성공(201) 시 POST body에 answer가 담기고 성공 토스트가 뜬다', async () => {
    let requestedBody: Record<string, unknown> | undefined
    server.use(
      http.post(`${BASE_URL}/api/franchise-inquiries/1/answers`, async ({ request }) => {
        requestedBody = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderForm(undefined)

    await user.type(screen.getByLabelText('답변 내용'), '환불 처리하겠습니다')
    await user.click(screen.getByRole('button', { name: '초안 저장' }))

    await waitFor(() => expect(requestedBody).toEqual({ answer: '환불 처리하겠습니다' }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('답변 초안을 저장했습니다'))
  })

  it('서버 판정 실패(VALIDATION_ERROR)는 root 에러로 표시된다', async () => {
    server.use(
      http.post(`${BASE_URL}/api/franchise-inquiries/1/answers`, () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_ERROR',
            name: 'VALIDATION_ERROR',
            httpStatus: 400,
            message: '이미 답변이 존재합니다',
          },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderForm(undefined)

    await user.type(screen.getByLabelText('답변 내용'), '환불 처리하겠습니다')
    await user.click(screen.getByRole('button', { name: '초안 저장' }))

    const rootError = await screen.findByText('이미 답변이 존재합니다')
    expect(rootError).toHaveRole('alert')

    const { toast } = await import('sonner')
    expect(toast.success).not.toHaveBeenCalled()
  })
})

describe('FranchiseInquiryAnswerForm - 수정(answer 있음, 미제출)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('textarea가 answer.content로 프리필되고 "수정 저장" + "발송" 버튼이 노출된다', () => {
    renderForm(draftAnswer())

    expect(screen.getByLabelText('답변 내용')).toHaveValue('기존 초안 내용입니다.')
    expect(screen.getByRole('button', { name: '수정 저장' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '발송' })).toBeInTheDocument()
  })

  it('수정 제출 성공(204) 시 PATCH body에 변경된 answer가 담기고 성공 토스트가 뜬다', async () => {
    let requestedBody: Record<string, unknown> | undefined
    server.use(
      http.patch(`${BASE_URL}/api/franchise-inquiries/1/answers`, async ({ request }) => {
        requestedBody = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderForm(draftAnswer())

    await user.clear(screen.getByLabelText('답변 내용'))
    await user.type(screen.getByLabelText('답변 내용'), '수정된 답변입니다')
    await user.click(screen.getByRole('button', { name: '수정 저장' }))

    await waitFor(() => expect(requestedBody).toEqual({ answer: '수정된 답변입니다' }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('답변을 수정했습니다'))
  })

  it('발송 트리거 클릭만으로는 요청이 발생하지 않는다(확인 다이얼로그 필요)', async () => {
    let sendCalls = 0
    server.use(
      http.patch(`${BASE_URL}/api/franchise-inquiries/1/answers/send`, () => {
        sendCalls += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderForm(draftAnswer())

    await user.click(screen.getByRole('button', { name: '발송' }))

    expect(await screen.findByText('답변을 발송하시겠습니까?')).toBeInTheDocument()
    expect(sendCalls).toBe(0)
  })

  it('발송 확인 클릭 시 PATCH .../answers/send가 호출되고 성공 토스트가 뜬다', async () => {
    let sendCalls = 0
    server.use(
      http.patch(`${BASE_URL}/api/franchise-inquiries/1/answers/send`, () => {
        sendCalls += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderForm(draftAnswer())

    await user.click(screen.getByRole('button', { name: '발송' }))
    await user.click(screen.getByRole('button', { name: '발송', hidden: false }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('답변을 발송했습니다'))
    expect(sendCalls).toBe(1)
  })

  it('발송 실패 시 handleApiError로 에러 토스트가 노출된다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/franchise-inquiries/1/answers/send`, () =>
        HttpResponse.json(
          {
            code: 'ROLE_003',
            name: 'FORBIDDEN',
            httpStatus: 403,
            message: '답변 담당자만 발송할 수 있습니다',
          },
          { status: 403 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderForm(draftAnswer())

    await user.click(screen.getByRole('button', { name: '발송' }))
    await user.click(screen.getByRole('button', { name: '발송', hidden: false }))

    const { toast } = await import('sonner')
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('답변 담당자만 발송할 수 있습니다'),
    )
  })
})
