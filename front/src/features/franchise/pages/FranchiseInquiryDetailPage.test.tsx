import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { FranchiseInquiryDetailPage } from './FranchiseInquiryDetailPage'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

afterEach(() => {
  vi.clearAllMocks()
})

function detailFixture(overrides?: Record<string, unknown>) {
  return {
    inquiryId: 1,
    externalId: 'EXT-1',
    franchiseId: 10,
    franchiseName: '테스트강남점',
    inquirerContact: '010-1234-5678',
    inquiryAt: '2026-07-01T10:30:00',
    inquiryTitle: '환불 문의',
    inquiryContent: '환불 요청드립니다.',
    assignedManagerId: 7,
    assignedManagerName: '김담당',
    isDeleted: false,
    ...overrides,
  }
}

function answerFixture(overrides?: Record<string, unknown>) {
  return {
    answerId: 1,
    content: '환불 처리 완료했습니다.',
    isSubmitted: true,
    answeredAt: '2026-07-02T09:00:00',
    answeredEmpId: 7,
    answeredEmpName: '김담당',
    ...overrides,
  }
}

function mockDetail(inquiryId: number, body: unknown = detailFixture()) {
  server.use(
    http.get(`${BASE_URL}/api/franchise-inquiries/${inquiryId}`, () => HttpResponse.json(body)),
  )
}

function mockAnswer(inquiryId: number, body: unknown = answerFixture()) {
  server.use(
    http.get(`${BASE_URL}/api/franchise-inquiries/${inquiryId}/answer`, () =>
      HttpResponse.json(body),
    ),
  )
}

function mockDetailError(inquiryId: number, status: number, body: unknown) {
  server.use(
    http.get(`${BASE_URL}/api/franchise-inquiries/${inquiryId}`, () =>
      HttpResponse.json(body, { status }),
    ),
  )
}

function mockAnswerError(inquiryId: number, status: number, body: unknown) {
  server.use(
    http.get(`${BASE_URL}/api/franchise-inquiries/${inquiryId}/answer`, () =>
      HttpResponse.json(body, { status }),
    ),
  )
}

function mockMe(empId: number) {
  server.use(
    http.get(`${BASE_URL}/api/employees/me`, () =>
      HttpResponse.json({
        empBasicInfo: {
          empId,
          empNo: '000000001',
          name: '홍길동',
          loginId: 'test1234',
          email: 'test1234@haruon.com',
          extensionNo: null,
        },
        activeFiles: [],
        currentDepts: [],
      }),
    ),
  )
}

function getCardByHeading(headingText: string) {
  const heading = screen.getByText(headingText)
  const card = heading.closest('[data-slot="card"]')
  if (!card) {
    throw new Error(`카드(${headingText})를 찾을 수 없습니다`)
  }
  return within(card as HTMLElement)
}

function renderPage(inquiryIdParam: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/franchise-inquiries/${inquiryIdParam}`]}>
        <Routes>
          <Route
            path="/franchise-inquiries/:inquiryId"
            element={<FranchiseInquiryDetailPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('FranchiseInquiryDetailPage (F1618·F1619) - route param 가드', () => {
  it.each(['abc', '-1', '0x10', '01', '1.5'])(
    '무효 형식 inquiryId(%s)는 "잘못된 문의 식별자입니다."를 렌더하고 쿼리를 호출하지 않는다',
    async (invalidId) => {
      let detailCallCount = 0
      let answerCallCount = 0
      server.use(
        http.get(`${BASE_URL}/api/franchise-inquiries/:inquiryId`, () => {
          detailCallCount += 1
          return HttpResponse.json(detailFixture())
        }),
        http.get(`${BASE_URL}/api/franchise-inquiries/:inquiryId/answer`, () => {
          answerCallCount += 1
          return HttpResponse.json(answerFixture())
        }),
      )

      renderPage(invalidId)

      expect(screen.getByText('잘못된 문의 식별자입니다.')).toBeInTheDocument()

      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(detailCallCount).toBe(0)
      expect(answerCallCount).toBe(0)

      const { toast } = await import('sonner')
      expect(toast.error).not.toHaveBeenCalled()
    },
  )
})

describe('FranchiseInquiryDetailPage (F1618·F1619) - 상세·답변 성공', () => {
  it('로딩 문구 이후 상세 카드(제목·가맹점명·문의일시·문의자연락처·담당자·문의내용)와 답변(작성됨)이 렌더된다', async () => {
    mockDetail(1)
    mockAnswer(1)

    renderPage('1')

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()

    await screen.findByText('환불 문의')

    const detailCard = getCardByHeading('환불 문의')
    expect(detailCard.getByText('환불 문의')).toBeInTheDocument()
    expect(detailCard.getByText('테스트강남점')).toBeInTheDocument()
    expect(detailCard.getByText('2026-07-01T10:30:00')).toBeInTheDocument()
    expect(detailCard.queryByText('삭제 요청')).not.toBeInTheDocument()
    expect(detailCard.getByText('환불 요청드립니다.')).toBeInTheDocument()

    const summaryCard = getCardByHeading('가맹점 정보')
    expect(summaryCard.getByText('문의자 연락처')).toBeInTheDocument()
    expect(summaryCard.getByText('010-1234-5678')).toBeInTheDocument()
    expect(summaryCard.getByText('코드')).toBeInTheDocument()
    expect(summaryCard.getByText('EXT-1')).toBeInTheDocument()
    expect(summaryCard.queryByText('담당자')).not.toBeInTheDocument()

    const answerCard = getCardByHeading('답변')
    expect(answerCard.getByText('답변 담당')).toBeInTheDocument()
    expect(answerCard.getByRole('button', { name: '담당자 배정' })).toBeInTheDocument()
    expect(answerCard.getByText('내용')).toBeInTheDocument()
    expect(answerCard.getByText('환불 처리 완료했습니다.')).toBeInTheDocument()
    expect(answerCard.getByText('제출 여부')).toBeInTheDocument()
    expect(answerCard.getByText('제출됨')).toBeInTheDocument()
    expect(answerCard.getByText('제출 일시')).toBeInTheDocument()
    expect(answerCard.getByText('2026-07-02T09:00:00')).toBeInTheDocument()
    expect(answerCard.getByText('답변 담당자')).toBeInTheDocument()
    expect(answerCard.getAllByText('김담당').length).toBeGreaterThan(0)

    const { toast } = await import('sonner')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('isDeleted가 true면 "삭제 요청" 배지가 렌더된다', async () => {
    mockDetail(1, detailFixture({ isDeleted: true }))
    mockAnswer(1)

    renderPage('1')

    await screen.findByText('환불 문의')
    const detailCard = getCardByHeading('환불 문의')
    expect(detailCard.getByText('삭제 요청')).toBeInTheDocument()
  })
})

describe('FranchiseInquiryDetailPage (F1618·F1619) - 답변 미작성(정상 흐름)', () => {
  it('답변 조회 404면 "아직 작성된 답변이 없습니다."를 렌더하고 토스트는 뜨지 않는다', async () => {
    mockDetail(1)
    mockAnswerError(1, 404, {
      code: 'FRANCHISE_INQUIRY_ANSWER_NOT_FOUND',
      name: 'NOT_FOUND',
      httpStatus: 404,
      message: '답변을 찾을 수 없습니다',
    })

    renderPage('1')

    await screen.findByText('환불 문의')
    expect(
      await screen.findByText('아직 작성된 답변이 없습니다.'),
    ).toBeInTheDocument()

    const { toast } = await import('sonner')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('답변 조회가 200 성공+빈 문자열이면 "아직 작성된 답변이 없습니다."를 렌더하고 토스트는 뜨지 않는다', async () => {
    mockDetail(1)
    mockAnswer(1, '')

    renderPage('1')

    await screen.findByText('환불 문의')
    expect(
      await screen.findByText('아직 작성된 답변이 없습니다.'),
    ).toBeInTheDocument()

    const { toast } = await import('sonner')
    expect(toast.error).not.toHaveBeenCalled()
  })
})

describe('FranchiseInquiryDetailPage (F1618·F1619) - 상세 조회 실패', () => {
  it('상세 404면 "문의를 찾을 수 없습니다."를 렌더하고 토스트는 뜨지 않는다', async () => {
    mockDetailError(1, 404, {
      code: 'FRANCHISE_INQUIRY_NOT_FOUND',
      name: 'NOT_FOUND',
      httpStatus: 404,
      message: '문의를 찾을 수 없습니다',
    })
    mockAnswerError(1, 404, {
      code: 'FRANCHISE_INQUIRY_ANSWER_NOT_FOUND',
      name: 'NOT_FOUND',
      httpStatus: 404,
      message: '답변을 찾을 수 없습니다',
    })

    renderPage('1')

    expect(await screen.findByText('문의를 찾을 수 없습니다.')).toBeInTheDocument()

    const { toast } = await import('sonner')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('상세 500 등 기타 에러면 useEffect 1회성 토스트와 "문의 정보를 불러오지 못했습니다."를 렌더한다', async () => {
    mockDetailError(1, 500, {
      code: 'UNKNOWN',
      name: 'UNKNOWN',
      httpStatus: 500,
      message: '서버 오류가 발생했습니다',
    })
    mockAnswerError(1, 404, {
      code: 'FRANCHISE_INQUIRY_ANSWER_NOT_FOUND',
      name: 'NOT_FOUND',
      httpStatus: 404,
      message: '답변을 찾을 수 없습니다',
    })

    renderPage('1')

    expect(
      await screen.findByText('문의 정보를 불러오지 못했습니다.'),
    ).toBeInTheDocument()

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('서버 오류가 발생했습니다'))
    expect(toast.error).toHaveBeenCalledTimes(1)
  })
})

describe('FranchiseInquiryDetailPage (F1618·F1619) - 답변 조회 실패(404 아님)', () => {
  it('답변 500이면 상세와 별개 useEffect가 토스트를 띄운다', async () => {
    mockDetail(1)
    mockAnswerError(1, 500, {
      code: 'UNKNOWN',
      name: 'UNKNOWN',
      httpStatus: 500,
      message: '답변 조회 중 오류가 발생했습니다',
    })

    renderPage('1')

    await screen.findByText('환불 문의')

    const { toast } = await import('sonner')
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('답변 조회 중 오류가 발생했습니다'),
    )
    expect(toast.error).toHaveBeenCalledTimes(1)
  })
})

describe('FranchiseInquiryDetailPage (F1618·F1619) - 담당자 배정(F1620, T5.3)', () => {
  it('"담당자 배정" 버튼 클릭 시 FranchiseInquiryManagerAssignDialog가 열린다', async () => {
    mockDetail(1)
    mockAnswer(1)
    server.use(
      http.get(`${BASE_URL}/api/departments`, () =>
        HttpResponse.json({
          content: [],
          totalElements: 0,
          totalPages: 1,
          number: 0,
          size: 100,
          first: true,
          last: true,
          numberOfElements: 0,
          empty: true,
        }),
      ),
    )

    const user = userEvent.setup()
    renderPage('1')

    await screen.findByText('환불 문의')
    await user.click(screen.getByRole('button', { name: '담당자 배정' }))

    expect(await screen.findByText('답변 담당자 배정')).toBeInTheDocument()
  })
})

describe('FranchiseInquiryDetailPage (F1618·F1619) - 답변 작성/수정/발송(F1621~F1623, T5.4)', () => {
  it('담당자 미배정(assignedManagerId===null)이면 배정 유도 문구만 보이고 답변 폼이 없다', async () => {
    mockDetail(1, detailFixture({ assignedManagerId: null, assignedManagerName: null }))
    mockMe(7)
    mockAnswerError(1, 404, {
      code: 'FRANCHISE_INQUIRY_ANSWER_NOT_FOUND',
      name: 'NOT_FOUND',
      httpStatus: 404,
      message: '답변을 찾을 수 없습니다',
    })

    renderPage('1')

    await screen.findByText('환불 문의')
    expect(
      await screen.findByText(/담당자가 배정되지 않아 답변을 작성할 수 없습니다/),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('답변 내용')).not.toBeInTheDocument()
  })

  it('본인이 담당자이고 답변이 없으면 작성 폼이 보이고, 제출 성공(201) 시 답변 섹션이 수정 모드로 갱신된다', async () => {
    mockDetail(1, detailFixture({ assignedManagerId: 7, assignedManagerName: '김담당' }))
    mockMe(7)
    let answerBody: unknown = null
    server.use(
      http.get(`${BASE_URL}/api/franchise-inquiries/1/answer`, () => {
        if (!answerBody) {
          return HttpResponse.json(
            {
              code: 'FRANCHISE_INQUIRY_ANSWER_NOT_FOUND',
              name: 'NOT_FOUND',
              httpStatus: 404,
              message: '답변을 찾을 수 없습니다',
            },
            { status: 404 },
          )
        }
        return HttpResponse.json(answerBody)
      }),
      http.post(`${BASE_URL}/api/franchise-inquiries/1/answers`, () => {
        answerBody = answerFixture({ content: '환불 처리하겠습니다', isSubmitted: false })
        return new HttpResponse(null, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage('1')

    const answerTextarea = await screen.findByLabelText('답변 내용')
    await user.type(answerTextarea, '환불 처리하겠습니다')
    await user.click(screen.getByRole('button', { name: '초안 저장' }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('답변 초안을 저장했습니다'))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: '수정 저장' })).toBeInTheDocument(),
    )
    expect(screen.getByLabelText('답변 내용')).toHaveValue('환불 처리하겠습니다')
  })

  it('본인이 담당자이고 미제출 초안이 있으면 프리필된 수정 폼이 보이고, 수정 제출 성공(204) 시 갱신된다', async () => {
    mockDetail(1, detailFixture({ assignedManagerId: 7, assignedManagerName: '김담당' }))
    mockMe(7)
    let content = '초안 내용입니다'
    server.use(
      http.get(`${BASE_URL}/api/franchise-inquiries/1/answer`, () =>
        HttpResponse.json(answerFixture({ content, isSubmitted: false })),
      ),
      http.patch(`${BASE_URL}/api/franchise-inquiries/1/answers`, async ({ request }) => {
        const body = (await request.json()) as { answer: string }
        content = body.answer
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderPage('1')

    const answerTextarea = await screen.findByLabelText('답변 내용')
    expect(answerTextarea).toHaveValue('초안 내용입니다')
    expect(screen.getByRole('button', { name: '수정 저장' })).toBeInTheDocument()

    await user.clear(answerTextarea)
    await user.type(answerTextarea, '수정된 답변입니다')
    await user.click(screen.getByRole('button', { name: '수정 저장' }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('답변을 수정했습니다'))
    await waitFor(() => expect(screen.getByLabelText('답변 내용')).toHaveValue('수정된 답변입니다'))
  })

  it('미제출 초안에서 발송 확인 시 PATCH .../send 성공(204) 후 폼이 사라지고 읽기전용으로 전환된다', async () => {
    mockDetail(1, detailFixture({ assignedManagerId: 7, assignedManagerName: '김담당' }))
    mockMe(7)
    let isSubmitted = false
    server.use(
      http.get(`${BASE_URL}/api/franchise-inquiries/1/answer`, () =>
        HttpResponse.json(answerFixture({ content: '초안 내용입니다', isSubmitted })),
      ),
      http.patch(`${BASE_URL}/api/franchise-inquiries/1/answers/send`, () => {
        isSubmitted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderPage('1')

    await screen.findByLabelText('답변 내용')
    await user.click(screen.getByRole('button', { name: '발송' }))
    await user.click(screen.getByRole('button', { name: '발송', hidden: false }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('답변을 발송했습니다'))

    await waitFor(() => expect(screen.queryByLabelText('답변 내용')).not.toBeInTheDocument())
    const answerCard = getCardByHeading('답변')
    expect(answerCard.getByText('제출됨')).toBeInTheDocument()
  })

  it('본인이 담당자여도 이미 발송된 답변(isSubmitted=true)은 읽기전용으로만 보이고 폼이 없다(발송 완료 후 수정 불가)', async () => {
    mockDetail(1, detailFixture({ assignedManagerId: 7, assignedManagerName: '김담당' }))
    mockMe(7)
    mockAnswer(1, answerFixture({ isSubmitted: true }))

    renderPage('1')

    await screen.findByText('환불 문의')
    expect(screen.queryByLabelText('답변 내용')).not.toBeInTheDocument()
    const answerCard = getCardByHeading('답변')
    expect(answerCard.getByText('제출됨')).toBeInTheDocument()
  })

  it('담당자가 배정되어 있어도 본인이 담당자가 아니면(myEmpId !== assignedManagerId) 읽기전용으로만 보인다', async () => {
    mockDetail(1, detailFixture({ assignedManagerId: 7, assignedManagerName: '김담당' }))
    mockMe(99)
    mockAnswer(1, answerFixture({ isSubmitted: false, content: '미제출 초안' }))

    renderPage('1')

    await screen.findByText('환불 문의')
    expect(screen.queryByLabelText('답변 내용')).not.toBeInTheDocument()
    const answerCard = getCardByHeading('답변')
    expect(answerCard.getByText('미제출')).toBeInTheDocument()
  })
})
