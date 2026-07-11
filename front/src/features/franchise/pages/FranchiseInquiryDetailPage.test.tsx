import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { FranchiseInquiryDetailPage } from './FranchiseInquiryDetailPage'

/**
 * FranchiseInquiryDetailPage(F1618·F1619, ROADMAP(FRANCHISE) T5.2) 회귀 방지 테스트.
 * FranchiseDetailPage와 동일 패턴(route param 가드·not-found/기타 에러 분기·useEffect 1회성
 * 토스트)을 문의 상세(FRANCHISE_INQUIRY_DETAIL) + 답변(FRANCHISE_INQUIRY_ANSWER_DETAIL) 2개
 * 쿼리로 확장한 페이지다. FranchiseInquiryListPage.test.tsx의 MSW server.use + QueryClient
 * 래퍼 + MemoryRouter 패턴을 그대로 따른다.
 *
 * 검증 대상:
 * - route param 가드: 순수 10진 양의 정수가 아니면 "잘못된 문의 식별자입니다." + 쿼리 미호출.
 * - 로딩 중 "불러오는 중..." 표시.
 * - 상세 200 → Card 타이틀(제목) + 부제(가맹점명·문의일시) + isDeleted 배지 + dl(문의자연락처·담당자·문의내용).
 * - 답변 200(작성됨) → 내용·제출여부·제출일시·답변담당자 렌더.
 * - 답변 미작성(404 또는 200+빈 문자열) → "아직 작성된 답변이 없습니다." + 토스트 없음(정상 흐름).
 * - 상세 404 → "문의를 찾을 수 없습니다." + 토스트 없음.
 * - 상세 500 등 기타 에러 → useEffect 1회성 토스트 + "문의 정보를 불러오지 못했습니다."
 * - 답변이 404가 아닌 에러(500)면 별도 useEffect가 토스트를 띄운다(상세와 독립적인 useEffect).
 */

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// toast mock은 파일 전역에서 공유되므로, 테스트 간 호출 카운트가 누적되지 않도록 매 테스트 후 초기화한다
// (FranchiseSalesPage.test.tsx와 동일 컨벤션).
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

/** useMeQuery(GET /api/employees/me) 목. FranchiseSalesPage.test.tsx의 meFixture 패턴과 동형. */
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

/** 응답이 도착한 카드(CardTitle 텍스트 기준)의 dt/dd 스코프를 좁혀 동일 라벨("내용" 등) 충돌을 피한다. */
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

      // enabled:false 가드라 네트워크 호출 자체가 없어야 한다 — 한 틱 대기 후에도 카운트가 0인지 확인.
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

    // 응답 도착 전에는 로딩 문구가 보인다.
    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()

    await screen.findByText('테스트강남점')

    const detailCard = getCardByHeading('테스트강남점')
    // 제목(CardTitle)은 이제 inquiryTitle이며, 가맹점명·문의일시는 라벨 없이 부제 span으로 노출된다.
    expect(detailCard.getByText('환불 문의')).toBeInTheDocument()
    expect(detailCard.getByText('테스트강남점')).toBeInTheDocument()
    expect(detailCard.getByText('2026-07-01T10:30:00')).toBeInTheDocument()
    // isDeleted가 false이면 "삭제 요청" 배지 자체가 렌더되지 않는다.
    expect(detailCard.queryByText('삭제 요청')).not.toBeInTheDocument()
    expect(detailCard.getByText('문의자 연락처')).toBeInTheDocument()
    expect(detailCard.getByText('010-1234-5678')).toBeInTheDocument()
    expect(detailCard.getByText('담당자')).toBeInTheDocument()
    expect(detailCard.getByText('문의 내용')).toBeInTheDocument()
    expect(detailCard.getByText('환불 요청드립니다.')).toBeInTheDocument()
    // '담당자' dt 값은 두 카드에 동명(김담당)으로 등장할 수 있어 상세 카드 스코프로만 확인한다.
    expect(detailCard.getAllByText('김담당').length).toBeGreaterThan(0)

    const answerCard = getCardByHeading('답변')
    expect(answerCard.getByText('내용')).toBeInTheDocument()
    expect(answerCard.getByText('환불 처리 완료했습니다.')).toBeInTheDocument()
    expect(answerCard.getByText('제출 여부')).toBeInTheDocument()
    expect(answerCard.getByText('제출됨')).toBeInTheDocument()
    expect(answerCard.getByText('제출 일시')).toBeInTheDocument()
    expect(answerCard.getByText('2026-07-02T09:00:00')).toBeInTheDocument()
    expect(answerCard.getByText('답변 담당자')).toBeInTheDocument()
    expect(answerCard.getByText('김담당')).toBeInTheDocument()

    const { toast } = await import('sonner')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('isDeleted가 true면 "삭제 요청" 배지가 렌더된다', async () => {
    mockDetail(1, detailFixture({ isDeleted: true }))
    mockAnswer(1)

    renderPage('1')

    await screen.findByText('테스트강남점')
    const detailCard = getCardByHeading('테스트강남점')
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

    await screen.findByText('테스트강남점')
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

    await screen.findByText('테스트강남점')
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

    // 상세는 정상 렌더된다(에러 경로 아님).
    await screen.findByText('테스트강남점')

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
    // FranchiseInquiryManagerAssignDialog가 마운트하는 EmployeePicker가 부서 목록(DEPT_LIST)을
    // 추가 호출한다 — 빈 페이지로 응답만 보장(FranchiseListPage.test.tsx의 담당자 필터 다이얼로그
    // 테스트와 동일 패턴, 오픈 확인까지만 검증).
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

    await screen.findByText('테스트강남점')
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

    await screen.findByText('테스트강남점')
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

    // 생성 mutation의 invalidate로 답변이 재조회되어 프리필된 수정 모드로 전환된다.
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

    await screen.findByText('테스트강남점')
    expect(screen.queryByLabelText('답변 내용')).not.toBeInTheDocument()
    const answerCard = getCardByHeading('답변')
    expect(answerCard.getByText('제출됨')).toBeInTheDocument()
  })

  it('담당자가 배정되어 있어도 본인이 담당자가 아니면(myEmpId !== assignedManagerId) 읽기전용으로만 보인다', async () => {
    mockDetail(1, detailFixture({ assignedManagerId: 7, assignedManagerName: '김담당' }))
    mockMe(99)
    mockAnswer(1, answerFixture({ isSubmitted: false, content: '미제출 초안' }))

    renderPage('1')

    await screen.findByText('테스트강남점')
    expect(screen.queryByLabelText('답변 내용')).not.toBeInTheDocument()
    const answerCard = getCardByHeading('답변')
    expect(answerCard.getByText('미제출')).toBeInTheDocument()
  })
})
