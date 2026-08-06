import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearAccessToken, setAccessToken } from '@/shared/api/tokenStore'
import { setChatStompStatus } from '../lib/chatConnectionStatus'
import { connectChatStomp, getChatStompClient } from '../lib/stompClient'
import type { ChatMessage } from '../model/chatMessage'
import { chatKeys } from '../model/queryKeys'
import { useChatRoomSubscription } from './useChatRoomSubscription'

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

interface FakeCloseEvent {
  code: number
  reason: string
  wasClean: boolean
}

class FakeStompSocket {
  url: string
  protocols?: string | string[]
  readyState = 0
  binaryType = ''
  onopen: (() => void) | null = null
  onmessage: ((ev: { data: string }) => void) | null = null
  onclose: ((ev: FakeCloseEvent) => void) | null = null
  onerror: (() => void) | null = null
  sentFrames: string[] = []

  constructor(url: string, protocols?: string | string[]) {
    this.url = url
    this.protocols = protocols
    setTimeout(() => {
      this.readyState = 1
      this.onopen?.()
    }, 0)
  }

  send(data: string): void {
    this.sentFrames.push(data)
    if (data.startsWith('CONNECT\n')) {
      setTimeout(() => {
        this.onmessage?.({ data: 'CONNECTED\nversion:1.2\n\n\0' })
      }, 0)
    }
  }

  close(): void {
    this.readyState = 3
  }

  emitMessage(subscriptionId: string, destination: string, body: string): void {
    this.onmessage?.({
      data: `MESSAGE\nsubscription:${subscriptionId}\ndestination:${destination}\ncontent-type:application/json\n\n${body}\0`,
    })
  }

  emitError(message?: string): void {
    const messageHeader = message ? `message:${message}\n` : ''
    this.onmessage?.({ data: `ERROR\n${messageHeader}\n비멤버 또는 종료된 채팅방입니다\0` })
  }
}

function findSubscriptionId(socket: FakeStompSocket, destination: string): string {
  const frame = socket.sentFrames.find(
    (f) => f.startsWith('SUBSCRIBE\n') && f.includes(`destination:${destination}`),
  )
  if (!frame) {
    throw new Error(`SUBSCRIBE frame for ${destination} not found`)
  }
  const match = /id:(\S+)/.exec(frame)
  if (!match) {
    throw new Error('SUBSCRIBE frame has no id header')
  }
  return match[1]
}

function chatMessageBody(overrides: Partial<ChatMessage> = {}): string {
  const { id, ...rest } = {
    id: 100,
    senderId: 2,
    clientMessageId: '550e8400-e29b-41d4-a716-446655440000',
    senderName: '김철수',
    content: '실시간 메시지',
    sentAt: '2026-07-09T11:00:00',
    profileImageUrl: null,
    ...overrides,
  }
  return JSON.stringify({
    eventId: '827a1d50-210c-47b4-8f5c-f2e7de9bd830',
    eventType: 'MESSAGE_CREATED',
    roomId: 1,
    occurredAt: '2026-07-09T11:00:00.000000000Z',
    data: { chatId: id, ...rest },
  })
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { Wrapper, queryClient }
}

async function connectFakeClient() {
  setAccessToken('test-access-token')
  vi.stubGlobal('WebSocket', FakeStompSocket)
  connectChatStomp()
  const client = getChatStompClient()
  await vi.waitFor(() => {
    expect(client.connected).toBe(true)
  })
  return client
}

afterEach(async () => {
  const client = getChatStompClient()
  if (client.active) {
    await client.deactivate({ force: true })
  }
  clearAccessToken()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('useChatRoomSubscription (T2.3-a 방 토픽 SUBSCRIBE/UNSUBSCRIBE lifecycle)', () => {
  it('연결 완료 후 roomId가 주어지면 해당 방 토픽을 SUBSCRIBE한다', async () => {
    const client = await connectFakeClient()

    renderHook(() => useChatRoomSubscription(1), { wrapper: createWrapper().Wrapper })

    await vi.waitFor(() => {
      const socket = client.webSocket as unknown as FakeStompSocket
      const subscribeFrame = socket.sentFrames.find((frame) => frame.startsWith('SUBSCRIBE\n'))
      expect(subscribeFrame).toContain('destination:/topic/chat/rooms/1')
    })
  })

  it('roomId가 바뀌면(방 전환) 이전 방 토픽을 UNSUBSCRIBE하고 새 방 토픽을 SUBSCRIBE한다', async () => {
    const client = await connectFakeClient()
    const socket = client.webSocket as unknown as FakeStompSocket

    const { rerender } = renderHook(({ roomId }) => useChatRoomSubscription(roomId), {
      wrapper: createWrapper().Wrapper,
      initialProps: { roomId: 1 },
    })

    await vi.waitFor(() => {
      expect(socket.sentFrames.some((frame) => frame.startsWith('SUBSCRIBE\n'))).toBe(true)
    })

    rerender({ roomId: 2 })

    const unsubscribeFrame = socket.sentFrames.find((frame) => frame.startsWith('UNSUBSCRIBE\n'))
    expect(unsubscribeFrame).toBeDefined()
    const subscribeFrames = socket.sentFrames.filter((frame) => frame.startsWith('SUBSCRIBE\n'))
    expect(
      subscribeFrames.some((frame) => frame.includes('destination:/topic/chat/rooms/2')),
    ).toBe(true)
  })

  it('언마운트(방 이탈) 시 구독 중이던 방 토픽을 UNSUBSCRIBE한다', async () => {
    const client = await connectFakeClient()
    const socket = client.webSocket as unknown as FakeStompSocket

    const { unmount } = renderHook(() => useChatRoomSubscription(1), {
      wrapper: createWrapper().Wrapper,
    })

    await vi.waitFor(() => {
      expect(socket.sentFrames.some((frame) => frame.startsWith('SUBSCRIBE\n'))).toBe(true)
    })

    unmount()

    expect(socket.sentFrames.some((frame) => frame.startsWith('UNSUBSCRIBE\n'))).toBe(true)
  })

  it('STOMP 연결이 아직 안 됐거나 끊긴 상태에서는 구독을 시도하지 않는다', () => {
    const client = getChatStompClient()
    expect(client.connected).toBe(false)
    const subscribeSpy = vi.spyOn(client, 'subscribe')

    renderHook(() => useChatRoomSubscription(1), { wrapper: createWrapper().Wrapper })

    expect(subscribeSpy).not.toHaveBeenCalled()
  })

  it('roomId가 없으면(잘못된 route param 등) 구독을 시도하지 않는다', async () => {
    const client = await connectFakeClient()
    const subscribeSpy = vi.spyOn(client, 'subscribe')

    renderHook(() => useChatRoomSubscription(undefined), { wrapper: createWrapper().Wrapper })

    expect(subscribeSpy).not.toHaveBeenCalled()
  })

  it('roomId 변경도 언마운트도 아닌, 연결만 끊긴(disconnected 전이) 경우 재구독 없이 UNSUBSCRIBE만 발생한다', async () => {
    const client = await connectFakeClient()
    const socket = client.webSocket as unknown as FakeStompSocket

    renderHook(() => useChatRoomSubscription(1), { wrapper: createWrapper().Wrapper })

    await vi.waitFor(() => {
      expect(socket.sentFrames.some((frame) => frame.startsWith('SUBSCRIBE\n'))).toBe(true)
    })
    const subscribeCountBeforeClose = socket.sentFrames.filter((frame) =>
      frame.startsWith('SUBSCRIBE\n'),
    ).length

    act(() => {
      socket.onclose?.({ code: 1006, reason: 'abnormal closure', wasClean: false })
    })

    expect(client.active).toBe(true)
    expect(client.connected).toBe(false)
    expect(socket.sentFrames.some((frame) => frame.startsWith('UNSUBSCRIBE\n'))).toBe(true)
    const subscribeCountAfterClose = socket.sentFrames.filter((frame) =>
      frame.startsWith('SUBSCRIBE\n'),
    ).length
    expect(subscribeCountAfterClose).toBe(subscribeCountBeforeClose)
  })
})

describe('useChatRoomSubscription (T2.3-b 실시간 수신 append)', () => {
  it('구독 중인 방 토픽으로 MESSAGE 프레임이 도착하면 chatKeys.messages(roomId) 캐시 끝에 append한다', async () => {
    const client = await connectFakeClient()
    const socket = client.webSocket as unknown as FakeStompSocket
    const { Wrapper, queryClient } = createWrapper()
    const existing = { messages: [], nextCursor: null, hasNext: false }
    queryClient.setQueryData(chatKeys.messages(1), { pages: [existing], pageParams: [undefined] })

    renderHook(() => useChatRoomSubscription(1), { wrapper: Wrapper })

    await vi.waitFor(() => {
      expect(socket.sentFrames.some((frame) => frame.startsWith('SUBSCRIBE\n'))).toBe(true)
    })
    const subscriptionId = findSubscriptionId(socket, '/topic/chat/rooms/1')

    act(() => {
      socket.emitMessage(subscriptionId, '/topic/chat/rooms/1', chatMessageBody())
    })

    await vi.waitFor(() => {
      const cache = queryClient.getQueryData<{ pages: { messages: ChatMessage[] }[] }>(
        chatKeys.messages(1),
      )
      expect(cache?.pages[0]?.messages).toHaveLength(1)
    })
    const cache = queryClient.getQueryData<{ pages: { messages: ChatMessage[] }[] }>(
      chatKeys.messages(1),
    )
    expect(cache?.pages[0]?.messages[0]?.content).toBe('실시간 메시지')
  })

  it('동일 clientMessageId를 가진 메시지가 이미 캐시에 있으면 append하지 않고 그 자리를 교체한다(dedup)', async () => {
    const client = await connectFakeClient()
    const socket = client.webSocket as unknown as FakeStompSocket
    const { Wrapper, queryClient } = createWrapper()
    const optimistic: ChatMessage = {
      id: -1,
      senderId: 99,
      clientMessageId: '550e8400-e29b-41d4-a716-446655440000',
      senderName: '나',
      content: '전송 중...',
      sentAt: '2026-07-09T10:59:00',
      profileImageUrl: null,
    }
    queryClient.setQueryData(chatKeys.messages(1), {
      pages: [{ messages: [optimistic], nextCursor: null, hasNext: false }],
      pageParams: [undefined],
    })

    renderHook(() => useChatRoomSubscription(1), { wrapper: Wrapper })

    await vi.waitFor(() => {
      expect(socket.sentFrames.some((frame) => frame.startsWith('SUBSCRIBE\n'))).toBe(true)
    })
    const subscriptionId = findSubscriptionId(socket, '/topic/chat/rooms/1')

    act(() => {
      socket.emitMessage(
        subscriptionId,
        '/topic/chat/rooms/1',
        chatMessageBody({ clientMessageId: '550e8400-e29b-41d4-a716-446655440000', id: 200 }),
      )
    })

    await vi.waitFor(() => {
      const cache = queryClient.getQueryData<{ pages: { messages: ChatMessage[] }[] }>(
        chatKeys.messages(1),
      )
      expect(cache?.pages[0]?.messages[0]?.id).toBe(200)
    })
    const cache = queryClient.getQueryData<{ pages: { messages: ChatMessage[] }[] }>(
      chatKeys.messages(1),
    )
    expect(cache?.pages[0]?.messages).toHaveLength(1)
    expect(cache?.pages[0]?.messages[0]?.content).toBe('실시간 메시지')
  })

  it('스키마 가정에 맞지 않는(파싱 실패) MESSAGE 프레임은 조용히 무시하고 캐시를 건드리지 않는다', async () => {
    const client = await connectFakeClient()
    const socket = client.webSocket as unknown as FakeStompSocket
    const { Wrapper, queryClient } = createWrapper()
    queryClient.setQueryData(chatKeys.messages(1), {
      pages: [{ messages: [], nextCursor: null, hasNext: false }],
      pageParams: [undefined],
    })

    renderHook(() => useChatRoomSubscription(1), { wrapper: Wrapper })

    await vi.waitFor(() => {
      expect(socket.sentFrames.some((frame) => frame.startsWith('SUBSCRIBE\n'))).toBe(true)
    })
    const subscriptionId = findSubscriptionId(socket, '/topic/chat/rooms/1')

    act(() => {
      socket.emitMessage(subscriptionId, '/topic/chat/rooms/1', 'not-json-body')
    })

    const cache = queryClient.getQueryData<{ pages: { messages: ChatMessage[] }[] }>(
      chatKeys.messages(1),
    )
    expect(cache?.pages[0]?.messages).toHaveLength(0)
  })
})

describe('useChatRoomSubscription (T2.3-b 비멤버·종료방 STOMP ERROR 안내 + 재구독 금지)', () => {
  it('구독 중 STOMP ERROR 프레임을 수신하면 안내 토스트를 띄운다', async () => {
    const client = await connectFakeClient()
    const socket = client.webSocket as unknown as FakeStompSocket

    renderHook(() => useChatRoomSubscription(1), { wrapper: createWrapper().Wrapper })

    await vi.waitFor(() => {
      expect(socket.sentFrames.some((frame) => frame.startsWith('SUBSCRIBE\n'))).toBe(true)
    })

    act(() => {
      socket.emitError('채팅방 멤버가 아닙니다')
    })

    const { toast } = await import('sonner')
    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('채팅방 멤버가 아닙니다')
    })
  })

  it('message 헤더가 없는 STOMP ERROR 프레임은 범용 안내 문구로 토스트를 띄운다', async () => {
    const client = await connectFakeClient()
    const socket = client.webSocket as unknown as FakeStompSocket

    renderHook(() => useChatRoomSubscription(1), { wrapper: createWrapper().Wrapper })

    await vi.waitFor(() => {
      expect(socket.sentFrames.some((frame) => frame.startsWith('SUBSCRIBE\n'))).toBe(true)
    })

    act(() => {
      socket.emitError()
    })

    const { toast } = await import('sonner')
    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('채팅방에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.')
    })
  })

  it('STOMP ERROR로 거부된 방은 연결 상태가 다시 connected로 바뀌어도 재구독하지 않는다', async () => {
    const client = await connectFakeClient()
    const socket = client.webSocket as unknown as FakeStompSocket
    const subscribeSpy = vi.spyOn(client, 'subscribe')

    renderHook(() => useChatRoomSubscription(1), { wrapper: createWrapper().Wrapper })

    await vi.waitFor(() => {
      expect(subscribeSpy).toHaveBeenCalledTimes(1)
    })

    act(() => {
      socket.emitError('채팅방 멤버가 아닙니다')
    })
    const { toast } = await import('sonner')
    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('채팅방 멤버가 아닙니다')
    })

    act(() => {
      setChatStompStatus('disconnected')
    })
    act(() => {
      setChatStompStatus('connected')
    })

    expect(subscribeSpy).toHaveBeenCalledTimes(1)
  })
})
