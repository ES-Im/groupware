import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useParams } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { FileListInfo, MessageDetailResponse } from '../model/messageTypes'
import { MessageComposeView, type MessageComposeInitialValues } from './MessageComposeView'

/**
 * MessageComposeView(ROADMAP(MESSAGE) T4.1·T4.3-b·T4.4·T5.1·T5.2·T5.3-b·T5.4) 회귀 방지 테스트.
 *
 * LeaveDraftCreatePage.test.tsx의 실제 훅 + MSW 패턴을 따른다. EmployeePicker가 마운트 즉시
 * GET /api/departments를 조회하므로 모든 케이스에서 목이 필요하다(onUnhandledRequest:'error').
 * 검증 축:
 *   - zod 사전검증(빈 값 제출, 제목 51자) — API 미호출.
 *   - 받는 사람 0명 클라 가드([전송]에서만) — API 미호출.
 *   - 첨부 스테이징(신규작성): 유효 파일 추가/제거, 사전검증 위반 시 토스트+미추가.
 *   - 신규작성 해피패스: 첨부 없는 [전송](sendMessage 단건), [임시저장](createDraft 단건).
 *   - 첨부 있는 [전송]의 draft-first 오케스트레이션 순서(createDraft→upload→sendDraft).
 *   - 편집모드(messageId) 프리필과 [저장](dirtyFields만 갱신)·[발송]·[삭제] 버튼 배선.
 *   - 답장모드(initialValues) 프리필.
 */

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function deptSummary(deptId: number, deptName: string) {
  return {
    deptInfoResponse: {
      deptId,
      deptCode: String(deptId).padStart(3, '0'),
      deptName,
      isActive: true,
      parentDeptId: null,
    },
    deptLeader: { empId: null, empNo: null, empName: null, extensionNo: null, email: null, position: null },
  }
}

function pageOf<T>(items: T[]) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: 0,
    size: 50,
    first: true,
    last: true,
    numberOfElements: items.length,
    empty: items.length === 0,
  }
}

/** EmployeePicker가 항상 마운트 즉시 조회하는 부서 목록 + 부서 선택 후 조회하는 부서원 목록 목. */
function mockEmployeePicker() {
  server.use(
    http.get(`${BASE_URL}/api/departments`, () => HttpResponse.json(pageOf([deptSummary(1, '개발팀')]))),
    http.get(`${BASE_URL}/api/departments/1/members`, () =>
      HttpResponse.json(
        pageOf([
          { empId: 101, empNo: 'E101', empName: '김철수', extensionNo: null, email: 'kim@haruon.com', position: '사원' },
        ]),
      ),
    ),
  )
}

/**
 * 수신자 선택: [수신자 선택]으로 모달을 열고 부서 → 부서원 순서로 클릭한 뒤 [완료]로 닫는다.
 * (EmployeePicker의 부서/검색 브라우징이 인라인에서 모달 안으로 이동함.)
 */
async function selectReceiver(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '수신자 선택' }))
  await user.click(await screen.findByRole('button', { name: '개발팀' }))
  await user.click(await screen.findByRole('button', { name: /김철수/ }))
  await user.click(screen.getByRole('button', { name: /완료/ }))
}

function makeFile(name: string, size = 10): File {
  return new File([new Uint8Array(size)], name, { type: 'application/octet-stream' })
}

function BoxPlaceholder() {
  const { box } = useParams()
  return <div>박스 이동됨: {box}</div>
}

function renderCompose(props: Partial<React.ComponentProps<typeof MessageComposeView>> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const onBack = vi.fn()
  const onSend = vi.fn()
  const onDelete = vi.fn()
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/messages/compose']}>
        <Routes>
          <Route
            path="/messages/compose"
            element={<MessageComposeView onBack={onBack} onSend={onSend} onDelete={onDelete} {...props} />}
          />
          <Route path="/messages/:box" element={<BoxPlaceholder />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return { ...utils, onBack, onSend, onDelete, queryClient }
}

describe('MessageComposeView (F1506·F1507) - zod 사전검증', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('빈 값으로 [전송]을 눌러도 제목/내용 인라인 에러를 보여주고 API를 호출하지 않는다', async () => {
    mockEmployeePicker()
    let sendCalled = false
    server.use(
      http.post(`${BASE_URL}/api/messages`, () => {
        sendCalled = true
        return HttpResponse.json({ messageId: 1 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderCompose()

    await user.click(screen.getByRole('button', { name: '전송' }))

    const alerts = await screen.findAllByRole('alert')
    const alertTexts = alerts.map((el) => el.textContent)
    expect(alertTexts).toContain('제목을 입력해주세요')
    expect(alertTexts).toContain('내용을 입력해주세요')
    expect(sendCalled).toBe(false)
  })

  it('제목이 51자면 "제목은 50자 이하로 입력해주세요" 에러를 보여주고 API를 호출하지 않는다', async () => {
    mockEmployeePicker()
    let sendCalled = false
    server.use(
      http.post(`${BASE_URL}/api/messages`, () => {
        sendCalled = true
        return HttpResponse.json({ messageId: 1 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderCompose()

    await user.type(screen.getByLabelText(/^제목/), 'a'.repeat(51))
    await user.type(screen.getByLabelText(/^내용/), '본문입니다')
    await user.click(screen.getByRole('button', { name: '전송' }))

    expect(await screen.findByText('제목은 50자 이하로 입력해주세요')).toBeInTheDocument()
    expect(sendCalled).toBe(false)
  })
})

describe('MessageComposeView (F1506) - 받는 사람 0명 클라 가드([전송] 전용)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('제목/내용은 채웠지만 받는 사람을 선택하지 않고 [전송]하면 토스트로 막고 API를 호출하지 않는다', async () => {
    mockEmployeePicker()
    let sendCalled = false
    server.use(
      http.post(`${BASE_URL}/api/messages`, () => {
        sendCalled = true
        return HttpResponse.json({ messageId: 1 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderCompose()

    await user.type(screen.getByLabelText(/^제목/), '점심 회의 안내')
    await user.type(screen.getByLabelText(/^내용/), '오늘 점심에 뵙겠습니다')
    await user.click(screen.getByRole('button', { name: '전송' }))

    const { toast } = await import('sonner')
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('받는 사람을 최소 1명 선택해주세요'),
    )
    expect(sendCalled).toBe(false)
  })
})

describe('MessageComposeView (F1520) - 첨부 스테이징(신규작성)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('유효한 파일을 추가하면 목록에 표시되고, 제거 버튼으로 뺄 수 있다', async () => {
    mockEmployeePicker()
    const user = userEvent.setup()
    renderCompose()

    const input = screen.getByLabelText('쪽지 첨부파일')
    await user.upload(input, makeFile('보고서.pdf'))

    expect(await screen.findByText('보고서.pdf')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '보고서.pdf 첨부 제거' }))
    expect(screen.queryByText('보고서.pdf')).not.toBeInTheDocument()
  })

  it('허용되지 않는 확장자를 추가하면 토스트로 알리고 목록에 추가하지 않는다', async () => {
    mockEmployeePicker()
    const user = userEvent.setup()
    renderCompose()

    const input = screen.getByLabelText('쪽지 첨부파일')
    await user.upload(input, makeFile('virus.exe'))

    const { toast } = await import('sonner')
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('허용되지 않는 확장자입니다: .exe'),
    )
    expect(screen.queryByText('virus.exe')).not.toBeInTheDocument()
  })
})

describe('MessageComposeView (F1506) - 신규작성 해피패스: 첨부 없는 [전송]', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('성공(201 {messageId}) 시 sendMessage 단건 호출 + 성공 토스트 + onBack + 보낸함 이동', async () => {
    mockEmployeePicker()
    let registeredBody: Record<string, unknown> | undefined
    server.use(
      http.post(`${BASE_URL}/api/messages`, async ({ request }) => {
        registeredBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ messageId: 100 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    const { onBack } = renderCompose()

    await user.type(screen.getByLabelText(/^제목/), '점심 회의 안내')
    await user.type(screen.getByLabelText(/^내용/), '오늘 점심에 뵙겠습니다')
    await selectReceiver(user)
    await user.click(screen.getByRole('button', { name: '전송' }))

    await waitFor(() =>
      expect(registeredBody).toEqual({
        title: '점심 회의 안내',
        content: '오늘 점심에 뵙겠습니다',
        receiverIds: [101],
      }),
    )
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('쪽지를 전송했습니다')
    expect(onBack).toHaveBeenCalled()
    expect(await screen.findByText('박스 이동됨: sent')).toBeInTheDocument()
  })
})

describe('MessageComposeView (F1507) - 신규작성 해피패스: [임시저장]', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('받는 사람 없이도 createDraft 단건 호출 성공 + 임시보관함 이동(receiverIds 미전송)', async () => {
    mockEmployeePicker()
    let registeredBody: Record<string, unknown> | undefined
    server.use(
      http.post(`${BASE_URL}/api/messages/drafts`, async ({ request }) => {
        registeredBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ messageId: 200 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    const { onBack } = renderCompose()

    await user.type(screen.getByLabelText(/^제목/), '임시 메모')
    await user.type(screen.getByLabelText(/^내용/), '나중에 마저 쓸 내용')
    await user.click(screen.getByRole('button', { name: '임시저장' }))

    await waitFor(() => expect(registeredBody).toBeDefined())
    expect(registeredBody).toEqual({ title: '임시 메모', content: '나중에 마저 쓸 내용' })
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('임시보관함에 저장했습니다')
    expect(onBack).toHaveBeenCalled()
    expect(await screen.findByText('박스 이동됨: drafts')).toBeInTheDocument()
  })
})

describe('MessageComposeView (T4.3-b) - 첨부 있는 [전송] draft-first 오케스트레이션', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('createDraft → uploadMessageFiles → sendDraft 순서로 호출한 뒤 성공 토스트+보낸함 이동한다', async () => {
    mockEmployeePicker()
    const callOrder: string[] = []
    server.use(
      http.post(`${BASE_URL}/api/messages/drafts`, () => {
        callOrder.push('createDraft')
        return HttpResponse.json({ messageId: 300 }, { status: 201 })
      }),
      http.patch(`${BASE_URL}/api/messages/300/files`, () => {
        callOrder.push('uploadFiles')
        return new HttpResponse(null, { status: 204 })
      }),
      http.patch(`${BASE_URL}/api/messages/drafts/300/send`, () => {
        callOrder.push('sendDraft')
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onBack } = renderCompose()

    await user.type(screen.getByLabelText(/^제목/), '자료 공유')
    await user.type(screen.getByLabelText(/^내용/), '첨부 확인 부탁드립니다')
    await selectReceiver(user)
    await user.upload(screen.getByLabelText('쪽지 첨부파일'), makeFile('자료.pdf'))
    await screen.findByText('자료.pdf')
    await user.click(screen.getByRole('button', { name: '전송' }))

    await waitFor(() => expect(callOrder).toEqual(['createDraft', 'uploadFiles', 'sendDraft']))
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('쪽지를 전송했습니다')
    expect(onBack).toHaveBeenCalled()
    expect(await screen.findByText('박스 이동됨: sent')).toBeInTheDocument()
  })
})

describe('MessageComposeView (T5.1) - 편집모드 프리필', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  function mockDetail(
    messageId: number,
    overrides: Partial<MessageDetailResponse> = {},
    files: FileListInfo[] = [],
  ) {
    const detail: MessageDetailResponse = {
      messageId,
      title: '원본 제목',
      content: '원본 본문',
      senderId: 1,
      senderDeptName: '개발팀',
      senderName: '나',
      receivers: [{ receiverId: 101, receiverDeptName: '개발팀', receiverName: '김철수', isRead: false }],
      sentAt: null,
      isSentByMe: true,
      isTrashedByMe: false,
      fileCount: 0,
      ...overrides,
    }
    server.use(
      http.get(`${BASE_URL}/api/messages/${messageId}`, () => HttpResponse.json(detail)),
      http.get(`${BASE_URL}/api/messages/${messageId}/files`, () => HttpResponse.json(files)),
    )
  }

  it('제목/본문/수신자를 프리필하고 "쪽지 수정" 헤더 + 저장/발송/삭제 버튼을 렌더한다', async () => {
    mockEmployeePicker()
    mockDetail(55)
    renderCompose({ messageId: 55 })

    expect(await screen.findByText('쪽지 수정')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText(/^제목/)).toHaveValue('원본 제목'))
    expect(screen.getByLabelText(/^내용/)).toHaveValue('원본 본문')
    expect(screen.getByText('김철수')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '발송' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()
    // 편집모드는 신규작성 전용 [임시저장]/[전송] 버튼을 렌더하지 않는다.
    expect(screen.queryByRole('button', { name: '임시저장' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '전송' })).not.toBeInTheDocument()
  })

  it('[발송] 클릭 시 onSend를 즉시 호출한다(확인 다이얼로그 없음)', async () => {
    mockEmployeePicker()
    mockDetail(55)
    const user = userEvent.setup()
    const { onSend } = renderCompose({ messageId: 55 })

    await screen.findByText('쪽지 수정')
    await user.click(screen.getByRole('button', { name: '발송' }))

    expect(onSend).toHaveBeenCalled()
  })

  it('[삭제]는 AlertDialog 확인 후에만 onDelete를 호출한다', async () => {
    mockEmployeePicker()
    mockDetail(55)
    const user = userEvent.setup()
    const { onDelete } = renderCompose({ messageId: 55 })

    await screen.findByText('쪽지 수정')
    await user.click(screen.getByRole('button', { name: '삭제' }))
    expect(onDelete).not.toHaveBeenCalled()

    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: '삭제' }))
    expect(onDelete).toHaveBeenCalled()
  })

  it('[저장]은 제목/본문이 변경된 경우에만 updateDraft를 호출하고, 수신자는 항상 updateDraftReceivers를 호출한다', async () => {
    mockEmployeePicker()
    mockDetail(55)
    let updateDraftCalled = false
    let updateReceiversCalled = false
    server.use(
      http.patch(`${BASE_URL}/api/messages/drafts/55`, () => {
        updateDraftCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
      http.patch(`${BASE_URL}/api/messages/drafts/55/receivers`, () => {
        updateReceiversCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderCompose({ messageId: 55 })

    await waitFor(() => expect(screen.getByLabelText(/^제목/)).toHaveValue('원본 제목'))
    await user.type(screen.getByLabelText(/^제목/), ' 추가')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(updateDraftCalled).toBe(true))
    expect(updateReceiversCalled).toBe(true)
    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('임시 쪽지를 저장했습니다'))
  })
})

describe('MessageComposeView (T5.4) - 편집모드 첨부: 여러 파일 동시 삭제는 각각 독립적으로 처리된다', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('파일별 독립 mutation 인스턴스라 하나가 지연되어도 다른 하나의 성공 콜백을 덮어쓰지 않는다', async () => {
    mockEmployeePicker()
    const files: FileListInfo[] = [
      { fileId: 1, originalName: '느린파일.pdf', extension: 'pdf', fileSize: 1024 },
      { fileId: 2, originalName: '빠른파일.pdf', extension: 'pdf', fileSize: 1024 },
    ]
    const detail: MessageDetailResponse = {
      messageId: 55,
      title: '원본 제목',
      content: '원본 본문',
      senderId: 1,
      senderDeptName: '개발팀',
      senderName: '나',
      receivers: [{ receiverId: 101, receiverDeptName: '개발팀', receiverName: '김철수', isRead: false }],
      sentAt: null,
      isSentByMe: true,
      isTrashedByMe: false,
      fileCount: 2,
    }
    server.use(
      http.get(`${BASE_URL}/api/messages/55`, () => HttpResponse.json(detail)),
      http.get(`${BASE_URL}/api/messages/55/files`, () => HttpResponse.json(files)),
    )
    const deleted: number[] = []
    server.use(
      http.delete(`${BASE_URL}/api/messages/55/files/1`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 80))
        deleted.push(1)
        return new HttpResponse(null, { status: 204 })
      }),
      http.delete(`${BASE_URL}/api/messages/55/files/2`, () => {
        deleted.push(2)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderCompose({ messageId: 55 })

    await screen.findByText('느린파일.pdf')
    await screen.findByText('빠른파일.pdf')

    // 느린 파일(1) 삭제를 먼저 트리거하고, 완료를 기다리지 않은 채 빠른 파일(2) 삭제도 트리거한다.
    await user.click(screen.getByRole('button', { name: '느린파일.pdf 삭제' }))
    await user.click(screen.getByRole('button', { name: '빠른파일.pdf 삭제' }))

    // 실제 완료 순서는 MSW 요청 스케줄링에 따라 달라질 수 있어(느린 쪽 인위적 지연이 있어도
    // 항상 나중에 끝난다는 보장은 없음) 순서는 검증 대상이 아니다 — 각자 독립된 mutation이라
    // 둘 다 누락 없이 완료되고, 서로의 onSuccess/onError 콜백을 덮어쓰지 않는지(DeletableFileItem
    // 인스턴스 분리 회귀)만 확인한다.
    await waitFor(() => expect(deleted).toContain(2))
    await waitFor(() => expect(deleted).toContain(1))
    expect(deleted).toHaveLength(2)

    const { toast } = await import('sonner')
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledTimes(2),
    )
    expect(toast.success).toHaveBeenCalledWith('첨부파일을 삭제했습니다')
  })
})

describe('MessageComposeView (T4.4) - 답장모드 프리필', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('발신자를 수신자로, 제목/인용 본문을 프리필하고 "새 쪽지 작성" 헤더를 유지한다', async () => {
    mockEmployeePicker()
    const initialValues: MessageComposeInitialValues = {
      receiverId: 9,
      receiverName: '홍길동',
      title: 'RE: 점심 회의 안내',
      quotedContent: '오늘 점심에 뵙겠습니다',
    }
    renderCompose({ initialValues })

    expect(screen.getByText('새 쪽지 작성')).toBeInTheDocument()
    expect(screen.getByLabelText(/^제목/)).toHaveValue('RE: 점심 회의 안내')
    expect(screen.getByLabelText(/^내용/)).toHaveValue(
      '\n\n----- 원본 메시지 -----\n오늘 점심에 뵙겠습니다',
    )
    expect(screen.getByText('홍길동')).toBeInTheDocument()
  })
})
