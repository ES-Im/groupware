import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { MailBox, MessageDetailResponse } from '../model/messageTypes'
import { MessageDetailView } from './MessageDetailView'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function makeDetail(overrides: Partial<MessageDetailResponse> = {}): MessageDetailResponse {
  return {
    messageId: 1,
    title: '점심 회의 안내',
    content: '오늘 점심 12시에 뵙겠습니다.',
    senderId: 10,
    senderDeptName: '개발팀',
    senderName: '김철수',
    receivers: [{ receiverId: 101, receiverDeptName: '영업팀', receiverName: '이영희', isRead: false }],
    sentAt: '2026-07-10T09:00:00',
    isSentByMe: false,
    isTrashedByMe: false,
    fileCount: 0,
    ...overrides,
  }
}

function mockDetail(messageId: number, detail: MessageDetailResponse) {
  server.use(
    http.get(`${BASE_URL}/api/messages/${messageId}`, () => HttpResponse.json(detail)),
    http.get(`${BASE_URL}/api/messages/${messageId}/files`, () => HttpResponse.json([])),
  )
}

function renderDetail(props: Partial<React.ComponentProps<typeof MessageDetailView>> & { messageId: number; box: MailBox }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const onBack = vi.fn()
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MessageDetailView onBack={onBack} {...props} />
    </QueryClientProvider>,
  )
  return { ...utils, onBack, queryClient }
}

describe('MessageDetailView (F1511) - 받은쪽지 자동 읽음', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('받은함 상세 로드 성공 시 markMessageRead를 정확히 1회 호출한다', async () => {
    mockDetail(1, makeDetail({ messageId: 1 }))
    let readCallCount = 0
    server.use(
      http.patch(`${BASE_URL}/api/messages/received/1/read`, () => {
        readCallCount += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderDetail({ messageId: 1, box: 'received' })

    await screen.findByText('점심 회의 안내')
    await waitFor(() => expect(readCallCount).toBe(1))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(readCallCount).toBe(1)
  })

  it('보낸함 상세에서는 markMessageRead를 호출하지 않는다', async () => {
    mockDetail(2, makeDetail({ messageId: 2, isSentByMe: true }))
    let readCalled = false
    server.use(
      http.patch(`${BASE_URL}/api/messages/received/2/read`, () => {
        readCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderDetail({ messageId: 2, box: 'sent' })

    await screen.findByText('점심 회의 안내')
    expect(readCalled).toBe(false)
  })

  it('휴지통 상세에서는 markMessageRead를 호출하지 않는다', async () => {
    mockDetail(3, makeDetail({ messageId: 3, isTrashedByMe: true }))
    let readCalled = false
    server.use(
      http.patch(`${BASE_URL}/api/messages/received/3/read`, () => {
        readCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderDetail({ messageId: 3, box: 'trash' })

    await screen.findByText('점심 회의 안내')
    expect(readCalled).toBe(false)
  })
})

describe('MessageDetailView (F1502) - 수신자별 읽음 배지', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('보낸함에서는 수신자별 읽음/미열람 배지를 표기한다', async () => {
    mockDetail(
      4,
      makeDetail({
        messageId: 4,
        isSentByMe: true,
        receivers: [
          { receiverId: 101, receiverDeptName: '영업팀', receiverName: '이영희', isRead: true },
          { receiverId: 102, receiverDeptName: '인사팀', receiverName: '박민수', isRead: false },
        ],
      }),
    )
    renderDetail({ messageId: 4, box: 'sent' })

    await screen.findByText('점심 회의 안내')
    expect(screen.getByText('읽음')).toBeInTheDocument()
    expect(screen.getByText('미열람')).toBeInTheDocument()
  })

  it('받은함에서는 수신자별 배지를 표기하지 않는다', async () => {
    mockDetail(5, makeDetail({ messageId: 5 }))
    let readCalled = false
    server.use(
      http.patch(`${BASE_URL}/api/messages/received/5/read`, () => {
        readCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderDetail({ messageId: 5, box: 'received' })

    await screen.findByText('점심 회의 안내')
    await waitFor(() => expect(readCalled).toBe(true))
    expect(screen.queryByText('미열람')).not.toBeInTheDocument()
  })
})

describe('MessageDetailView - 조회 실패 처리', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('404면 "쪽지를 찾을 수 없습니다" 안내를 보여주고 토스트는 띄우지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/messages/6`, () =>
        HttpResponse.json(
          { code: 'MESSAGE_NOT_FOUND', name: 'NOT_FOUND', httpStatus: 404, message: '쪽지를 찾을 수 없습니다' },
          { status: 404 },
        ),
      ),
    )
    renderDetail({ messageId: 6, box: 'received' })

    expect(
      await screen.findByText('쪽지를 찾을 수 없습니다. 삭제되었거나 접근할 수 없는 쪽지입니다.'),
    ).toBeInTheDocument()
    const { toast } = await import('sonner')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('403이면 "조회할 권한이 없습니다" 안내를 보여주고 토스트는 띄우지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/messages/7`, () =>
        HttpResponse.json(
          { code: 'MESSAGE_003', name: 'FORBIDDEN', httpStatus: 403, message: '권한이 없습니다' },
          { status: 403 },
        ),
      ),
    )
    renderDetail({ messageId: 7, box: 'received' })

    expect(await screen.findByText('이 쪽지를 조회할 권한이 없습니다.')).toBeInTheDocument()
    const { toast } = await import('sonner')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('그 외 에러(500)는 토스트로만 알린다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/messages/8`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'SERVER_ERROR', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
    )
    renderDetail({ messageId: 8, box: 'received' })

    expect(await screen.findByText('쪽지를 불러오지 못했습니다.')).toBeInTheDocument()
    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
  })
})

describe('MessageDetailView - 박스별 액션 버튼 구성', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('임시보관함(drafts)은 액션 버튼을 렌더하지 않는다', async () => {
    mockDetail(9, makeDetail({ messageId: 9 }))
    renderDetail({ messageId: 9, box: 'drafts' })

    await screen.findByText('점심 회의 안내')
    expect(screen.queryByRole('button', { name: '답장' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '휴지통 이동' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '복구' })).not.toBeInTheDocument()
  })

  it('휴지통이지만 내가 버린 쪽지가 아니면(isTrashedByMe=false) 액션 버튼을 렌더하지 않는다', async () => {
    mockDetail(10, makeDetail({ messageId: 10, isTrashedByMe: false }))
    renderDetail({ messageId: 10, box: 'trash' })

    await screen.findByText('점심 회의 안내')
    expect(screen.queryByRole('button', { name: '복구' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '완전 삭제' })).not.toBeInTheDocument()
  })

  it('휴지통 + 내가 버린 쪽지면 복구/완전삭제 버튼을 렌더한다', async () => {
    mockDetail(11, makeDetail({ messageId: 11, isTrashedByMe: true }))
    renderDetail({ messageId: 11, box: 'trash' })

    await screen.findByText('점심 회의 안내')
    expect(screen.getByRole('button', { name: '복구' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '완전 삭제' })).toBeInTheDocument()
  })

  it('받은함은 답장+휴지통 이동 버튼을 렌더한다', async () => {
    mockDetail(12, makeDetail({ messageId: 12 }))
    let readCalled = false
    server.use(
      http.patch(`${BASE_URL}/api/messages/received/12/read`, () => {
        readCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderDetail({ messageId: 12, box: 'received' })

    await screen.findByText('점심 회의 안내')
    await waitFor(() => expect(readCalled).toBe(true))
    expect(screen.getByRole('button', { name: '답장' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '휴지통 이동' })).toBeInTheDocument()
  })

  it('보낸함은 휴지통 이동 버튼만 렌더한다(답장 없음)', async () => {
    mockDetail(13, makeDetail({ messageId: 13, isSentByMe: true }))
    renderDetail({ messageId: 13, box: 'sent' })

    await screen.findByText('점심 회의 안내')
    expect(screen.queryByRole('button', { name: '답장' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '휴지통 이동' })).toBeInTheDocument()
  })

  it('콜백이 제공되지 않으면 버튼은 disabled로 렌더된다', async () => {
    mockDetail(14, makeDetail({ messageId: 14 }))
    let readCalled = false
    server.use(
      http.patch(`${BASE_URL}/api/messages/received/14/read`, () => {
        readCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderDetail({ messageId: 14, box: 'received', onReply: undefined, onTrash: undefined })

    await screen.findByText('점심 회의 안내')
    await waitFor(() => expect(readCalled).toBe(true))
    expect(screen.getByRole('button', { name: '답장' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '휴지통 이동' })).toBeDisabled()
  })
})
