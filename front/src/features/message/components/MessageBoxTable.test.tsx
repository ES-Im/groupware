import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { MailBox, MessagesResponse } from '../model/messageTypes'
import { MessageBoxTable } from './MessageBoxTable'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function makeRow(overrides: Partial<MessagesResponse> = {}): MessagesResponse {
  return {
    messageId: 1,
    title: '점심 회의 안내',
    senderId: 10,
    senderDeptName: '개발팀',
    senderName: '김철수',
    representativeReceiverId: null,
    representativeReceiverDeptName: null,
    representativeReceiverName: null,
    receiverCount: 0,
    sentAt: '2026-07-10T09:00:00',
    isRead: false,
    trashedAt: null,
    isSentByMe: false,
    fileCount: 0,
    ...overrides,
  }
}

function pageOf(content: MessagesResponse[]) {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    number: 0,
    size: 10,
    numberOfElements: content.length,
    first: true,
    last: true,
    empty: content.length === 0,
  }
}

function mockList(box: MailBox, content: MessagesResponse[]) {
  server.use(http.get(`${BASE_URL}/api/messages/${box}`, () => HttpResponse.json(pageOf(content))))
}

function renderTable(box: MailBox) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const onOpenDetail = vi.fn()
  const onOpenCompose = vi.fn()
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MessageBoxTable box={box} onOpenDetail={onOpenDetail} onOpenCompose={onOpenCompose} />
    </QueryClientProvider>,
  )
  return { ...utils, onOpenDetail, onOpenCompose, queryClient }
}

describe('MessageBoxTable (F1501) - 받은함 컬럼 렌더', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('발신자·부서·제목·일시를 렌더하고 미읽음은 좌측 강조와 안읽음 점을 보여준다', async () => {
    mockList('received', [makeRow({ senderDeptName: '개발팀', senderName: '김철수' })])
    renderTable('received')

    expect(await screen.findByText('점심 회의 안내')).toBeInTheDocument()
    expect(screen.getByText('개발팀 김철수')).toBeInTheDocument()
    expect(screen.getByText('2026-07-10 09:00')).toBeInTheDocument()
    expect(screen.getByLabelText('읽지 않음')).toBeInTheDocument()
  })

  it('읽은 쪽지는 안읽음 강조 표시를 보여주지 않는다', async () => {
    mockList('received', [makeRow({ isRead: true })])
    renderTable('received')

    await screen.findByText('점심 회의 안내')
    expect(screen.queryByLabelText('읽지 않음')).not.toBeInTheDocument()
  })

  it('첨부가 있으면 개수를 aria-label로 노출하고, 없으면 대시로 표기한다', async () => {
    mockList('received', [makeRow({ fileCount: 2 })])
    renderTable('received')

    await screen.findByText('점심 회의 안내')
    expect(screen.getByLabelText('첨부 2개')).toBeInTheDocument()
  })

  it('빈 목록이면 "받은 쪽지가 없습니다." 안내를 보여준다', async () => {
    mockList('received', [])
    renderTable('received')

    expect(await screen.findByText('받은 쪽지가 없습니다.')).toBeInTheDocument()
  })

  it('조회 실패 시 목록 실패 문구와 에러 토스트를 보여준다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/messages/received`, () =>
        HttpResponse.json(
          { code: 'COMMON_001', name: 'BAD_REQUEST', httpStatus: 400, message: '잘못된 요청입니다' },
          { status: 400 },
        ),
      ),
    )
    renderTable('received')

    expect(await screen.findByText('목록을 불러오지 못했습니다.')).toBeInTheDocument()
    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('잘못된 요청입니다'))
  })
})

describe('MessageBoxTable (F1502) - 보낸함 상대방 표기', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('수신자가 여럿이면 대표 수신자 + "외 N명"으로 표기한다(N=receiverCount-1)', async () => {
    mockList('sent', [
      makeRow({
        isSentByMe: true,
        representativeReceiverName: '이영희',
        receiverCount: 3,
      }),
    ])
    renderTable('sent')

    expect(await screen.findByText('이영희 외 2명')).toBeInTheDocument()
  })

  it('수신자가 1명이면 이름만 표기한다', async () => {
    mockList('sent', [
      makeRow({ isSentByMe: true, representativeReceiverName: '이영희', receiverCount: 1 }),
    ])
    renderTable('sent')

    expect(await screen.findByText('이영희')).toBeInTheDocument()
  })

  it('대표 수신자가 없으면 대시로 표기한다', async () => {
    mockList('sent', [
      makeRow({ isSentByMe: true, representativeReceiverName: null, receiverCount: 0 }),
    ])
    renderTable('sent')

    await screen.findByText('점심 회의 안내')
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('보낸함은 읽음 컬럼을 렌더하지 않는다', async () => {
    mockList('sent', [makeRow({ isSentByMe: true })])
    renderTable('sent')

    await screen.findByText('점심 회의 안내')
    expect(screen.queryByText('읽음')).not.toBeInTheDocument()
  })
})

describe('MessageBoxTable (F1503) - 임시보관함', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('미발송(sentAt null)은 수발신일시를 대시로 표기하고 발송/삭제 액션 버튼을 갖는다', async () => {
    mockList('drafts', [makeRow({ sentAt: null })])
    renderTable('drafts')

    await screen.findByText('점심 회의 안내')
    expect(screen.getByText('-')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '발송' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()
  })

  it('빈 목록이면 "임시보관된 쪽지가 없습니다." 안내를 보여준다', async () => {
    mockList('drafts', [])
    renderTable('drafts')

    expect(await screen.findByText('임시보관된 쪽지가 없습니다.')).toBeInTheDocument()
  })

  it('행 클릭 시 onOpenCompose(messageId, true)로 편집 모드 진입한다', async () => {
    mockList('drafts', [makeRow({ messageId: 7 })])
    const user = userEvent.setup()
    const { onOpenCompose } = renderTable('drafts')

    const row = await screen.findByText('점심 회의 안내')
    await user.click(row)

    expect(onOpenCompose).toHaveBeenCalledWith(7, true)
  })

  it('발송 버튼 클릭 시 PATCH /api/messages/drafts/{id}/send를 호출한다', async () => {
    mockList('drafts', [makeRow({ messageId: 7 })])
    let sendCalled = false
    server.use(
      http.patch(`${BASE_URL}/api/messages/drafts/7/send`, () => {
        sendCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenCompose } = renderTable('drafts')

    await user.click(await screen.findByRole('button', { name: '발송' }))

    await waitFor(() => expect(sendCalled).toBe(true))
    expect(onOpenCompose).not.toHaveBeenCalled()
  })

  it('삭제 버튼은 AlertDialog 확인 후 DELETE /api/messages/drafts/{id}를 호출한다', async () => {
    mockList('drafts', [makeRow({ messageId: 7 })])
    let deleteCalled = false
    server.use(
      http.delete(`${BASE_URL}/api/messages/drafts/7`, () => {
        deleteCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderTable('drafts')

    await user.click(await screen.findByRole('button', { name: '삭제' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: '삭제' }))

    await waitFor(() => expect(deleteCalled).toBe(true))
  })

  it('발송 버튼에서 Enter 키를 눌러도 행 활성화(onOpenCompose)로 전파되지 않는다', async () => {
    mockList('drafts', [makeRow({ messageId: 7 })])
    const { onOpenCompose } = renderTable('drafts')

    const sendButton = await screen.findByRole('button', { name: '발송' })
    fireEvent.keyDown(sendButton, { key: 'Enter', bubbles: true })

    expect(onOpenCompose).not.toHaveBeenCalled()
  })
})

describe('MessageBoxTable (F1504) - 휴지통', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('복구 버튼 클릭 시 isSentByMe에 따라 PATCH /api/messages/{box}/{id}/trash/restoration을 호출한다', async () => {
    mockList('trash', [makeRow({ messageId: 9, isSentByMe: false, trashedAt: '2026-07-10T10:00:00' })])
    let restoreCalled = false
    server.use(
      http.patch(`${BASE_URL}/api/messages/received/9/trash/restoration`, () => {
        restoreCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderTable('trash')

    await user.click(await screen.findByRole('button', { name: '복구' }))

    await waitFor(() => expect(restoreCalled).toBe(true))
    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('쪽지를 복구했습니다'))
  })

  it('완전 삭제는 AlertDialog 확인 후 PATCH /api/messages/{box}/{id}/deletion을 호출한다', async () => {
    mockList('trash', [makeRow({ messageId: 9, isSentByMe: true, trashedAt: '2026-07-10T10:00:00' })])
    let deleteCalled = false
    server.use(
      http.patch(`${BASE_URL}/api/messages/sent/9/deletion`, () => {
        deleteCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderTable('trash')

    await user.click(await screen.findByRole('button', { name: '완전 삭제' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: '삭제' }))

    await waitFor(() => expect(deleteCalled).toBe(true))
  })

  it('빈 목록이면 "휴지통이 비어 있습니다." 안내를 보여준다', async () => {
    mockList('trash', [])
    renderTable('trash')

    expect(await screen.findByText('휴지통이 비어 있습니다.')).toBeInTheDocument()
  })
})

describe('MessageBoxTable (F1512) - 받은함/보낸함 휴지통 이동 액션', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('받은함 휴지통 이동 클릭 시 PATCH /api/messages/received/{id}/trash를 호출하고 성공 토스트를 띄운다', async () => {
    mockList('received', [makeRow({ messageId: 5, isSentByMe: false })])
    let trashCalled = false
    server.use(
      http.patch(`${BASE_URL}/api/messages/received/5/trash`, () => {
        trashCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenDetail } = renderTable('received')

    const trashButton = await screen.findByRole('button', { name: '휴지통 이동' })
    await user.click(trashButton)

    await waitFor(() => expect(trashCalled).toBe(true))
    const { toast } = await import('sonner')
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('쪽지를 휴지통으로 이동했습니다'),
    )
    expect(onOpenDetail).not.toHaveBeenCalled()
  })

  it('휴지통 이동 버튼에서 Enter 키를 눌러도 행 활성화(onOpenDetail)로 전파되지 않는다', async () => {
    mockList('received', [makeRow({ messageId: 5, isSentByMe: false })])
    const { onOpenDetail } = renderTable('received')

    const trashButton = await screen.findByRole('button', { name: '휴지통 이동' })
    fireEvent.keyDown(trashButton, { key: 'Enter', bubbles: true })

    expect(onOpenDetail).not.toHaveBeenCalled()
  })

  it('행 클릭 시 onOpenDetail(messageId)을 호출한다', async () => {
    mockList('received', [makeRow({ messageId: 5 })])
    const user = userEvent.setup()
    const { onOpenDetail } = renderTable('received')

    const row = await screen.findByText('점심 회의 안내')
    await user.click(row)

    expect(onOpenDetail).toHaveBeenCalledWith(5)
  })
})

describe('MessageBoxTable - isPlaceholderData dimming(박스 전환)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('박스 전환 중(새 응답 대기)에는 이전 데이터를 유지한 채 aria-busy로 dimming 처리한다', async () => {
    mockList('received', [makeRow({ title: '받은 쪽지 A' })])
    server.use(
      http.get(`${BASE_URL}/api/messages/sent`, async () => {
        await delay(50)
        return HttpResponse.json(pageOf([makeRow({ title: '보낸 쪽지 B', isSentByMe: true })]))
      }),
    )
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const onOpenDetail = vi.fn()
    const onOpenCompose = vi.fn()
    const { rerender, container } = render(
      <QueryClientProvider client={queryClient}>
        <MessageBoxTable box="received" onOpenDetail={onOpenDetail} onOpenCompose={onOpenCompose} />
      </QueryClientProvider>,
    )

    await screen.findByText('받은 쪽지 A')

    rerender(
      <QueryClientProvider client={queryClient}>
        <MessageBoxTable box="sent" onOpenDetail={onOpenDetail} onOpenCompose={onOpenCompose} />
      </QueryClientProvider>,
    )

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    expect(screen.getByText('받은 쪽지 A')).toBeInTheDocument()

    await waitFor(() => expect(screen.getByText('보낸 쪽지 B')).toBeInTheDocument())
    expect(container.querySelector('[aria-busy="true"]')).not.toBeInTheDocument()
  })
})
