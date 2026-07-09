import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { clearAccessToken, setAccessToken } from '@/shared/api/tokenStore'
import { employeeKeys } from '@/features/employee/model/queryKeys'
import { server } from '@/test/mocks/server'
import { connectChatStomp, getChatStompClient } from '../lib/stompClient'
import type { ChatMessage, ChatMessagesPage } from '../model/chatMessage'
import { chatKeys } from '../model/queryKeys'
import { CHAT_MESSAGE_MAX_LENGTH, useSendChatMessage } from './useSendChatMessage'

/**
 * useSendChatMessage(ROADMAP(CHAT) T2.4, F905) 검증.
 *
 * stompClient.test.ts/useChatRoomSubscription.test.tsx와 동일하게 @stomp/stompjs가 내부적으로
 * 생성하는 브라우저 WebSocket을 흉내내는 최소 가짜 소켓으로 CONNECT→CONNECTED 왕복을
 * 시뮬레이션한 뒤, 실제로 오가는 SEND 프레임을 확인해 발신을 검증한다. 낙관 렌더는
 * upsertChatMessage(T2.3-b, 별도 유닛테스트 보유)를 그대로 재사용하므로 여기서는 "그 함수가
 * 호출되는 경로"까지만 통합적으로 확인하고 upsert 세부 동작 자체는 재검증하지 않는다.
 */

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

  /** 브로커가 구독 중인 destination으로 MESSAGE 프레임을 push하는 상황을 흉내낸다(echo 시뮬레이션). */
  emitMessage(subscriptionId: string, destination: string, body: string): void {
    this.onmessage?.({
      data: `MESSAGE\nsubscription:${subscriptionId}\ndestination:${destination}\ncontent-type:application/json\n\n${body}\0`,
    })
  }
}

function meFixture() {
  return {
    empBasicInfo: {
      empId: 42,
      empNo: '000000042',
      name: '나',
      loginId: 'test3456',
      email: 'test3456@haruon.com',
      extensionNo: null,
    },
    activeFiles: [],
    currentDepts: [],
  }
}

function emptyMessagesCache(): InfiniteData<ChatMessagesPage> {
  return { pages: [{ messages: [], nextCursor: null, hasNext: false }], pageParams: [undefined] }
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

function mockMeEndpoint() {
  server.use(http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture())))
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

describe('useSendChatMessage 클라 사전 검증', () => {
  it('공백만 있는 입력은 전송하지 않고 false를 반환한다', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useSendChatMessage(1), { wrapper: Wrapper })

    expect(result.current.sendMessage('   ')).toBe(false)
  })

  it(`content가 ${CHAT_MESSAGE_MAX_LENGTH}자를 초과하면 토스트로 안내하고 전송하지 않는다`, async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useSendChatMessage(1), { wrapper: Wrapper })
    const tooLong = 'a'.repeat(CHAT_MESSAGE_MAX_LENGTH + 1)

    const sent = result.current.sendMessage(tooLong)

    expect(sent).toBe(false)
    const { toast } = await import('sonner')
    expect(toast.error).toHaveBeenCalledWith(
      `메시지는 ${CHAT_MESSAGE_MAX_LENGTH}자를 초과할 수 없습니다.`,
    )
  })

  it('STOMP 연결이 끊긴 상태에서 전송을 시도하면 토스트로 안내하고 전송하지 않는다', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useSendChatMessage(1), { wrapper: Wrapper })

    const sent = result.current.sendMessage('안녕하세요')

    expect(sent).toBe(false)
    const { toast } = await import('sonner')
    expect(toast.error).toHaveBeenCalledWith(
      '연결이 끊어져 메시지를 보낼 수 없습니다. 잠시 후 다시 시도해주세요.',
    )
  })
})

describe('useSendChatMessage 낙관 렌더 + SEND', () => {
  it('연결된 상태에서 전송하면 캐시에 낙관 메시지를 즉시 추가하고 SEND 프레임을 보낸다', async () => {
    mockMeEndpoint()
    const client = await connectFakeClient()
    const socket = client.webSocket as unknown as FakeStompSocket
    const { Wrapper, queryClient } = createWrapper()
    queryClient.setQueryData(chatKeys.messages(1), emptyMessagesCache())

    const { result } = renderHook(() => useSendChatMessage(1), { wrapper: Wrapper })
    await waitFor(() => {
      // useMeQuery가 로드될 때까지 대기(로드 전에는 fail-closed로 전송이 차단된다).
      expect(queryClient.getQueryData(employeeKeys.me())).toBeDefined()
    })

    const sent = result.current.sendMessage('  안녕하세요  ')

    expect(sent).toBe(true)
    const cache = queryClient.getQueryData<InfiniteData<ChatMessagesPage>>(chatKeys.messages(1))
    const optimistic = cache?.pages[0]?.messages[0]
    // content는 trim되어 저장된다.
    expect(optimistic?.content).toBe('안녕하세요')
    expect(optimistic?.senderId).toBe(42)
    expect(optimistic?.senderName).toBe('나')
    // 서버 확정 전 임시 id는 항상 음수다(useSendChatMessage.ts 주석 참조).
    expect(optimistic?.id).toBeLessThan(0)
    expect(optimistic?.clientMessageId).toBeTruthy()

    const sendFrame = socket.sentFrames.find((frame) => frame.startsWith('SEND\n'))
    expect(sendFrame).toContain('destination:/app/chat/rooms/1/messages')
    expect(sendFrame).toContain(`"clientMessageId":"${optimistic?.clientMessageId}"`)
    expect(sendFrame).toContain('"content":"안녕하세요"')
  })

  it('SEND 후 동일 clientMessageId로 브로드캐스트 echo가 도착하면 낙관 메시지가 서버 확정값으로 교체된다', async () => {
    mockMeEndpoint()
    await connectFakeClient()
    const { Wrapper, queryClient } = createWrapper()
    queryClient.setQueryData(chatKeys.messages(1), emptyMessagesCache())
    // T2.3-b 수신 처리는 이 훅의 범위가 아니므로, 여기서는 SUBSCRIBE 없이 echo 프레임을 직접
    // 캐시 upsert 경로로 흉내내는 대신, 실제 소비 경로(useChatRoomSubscription)와 동일하게
    // parseChatBroadcastMessage+upsertChatMessage를 그대로 사용해 통합 확인한다.
    const { parseChatBroadcastMessage } = await import('../lib/parseChatBroadcastMessage')
    const { upsertChatMessage } = await import('../lib/upsertChatMessage')

    const { result } = renderHook(() => useSendChatMessage(1), { wrapper: Wrapper })
    await waitFor(() => {
      expect(queryClient.getQueryData(employeeKeys.me())).toBeDefined()
    })

    result.current.sendMessage('안녕하세요')
    const beforeEcho = queryClient.getQueryData<InfiniteData<ChatMessagesPage>>(
      chatKeys.messages(1),
    )
    const clientMessageId = beforeEcho?.pages[0]?.messages[0]?.clientMessageId
    expect(clientMessageId).toBeTruthy()

    // 실측 브로드캐스트 프레임은 평면 ChatMessage가 아니라 이벤트 봉투다(parseChatBroadcastMessage.ts
    // 주석 참조) — 메시지 식별자는 id가 아니라 data.chatId로 온다.
    const confirmedEventBody = JSON.stringify({
      eventId: '827a1d50-210c-47b4-8f5c-f2e7de9bd830',
      eventType: 'MESSAGE_CREATED',
      roomId: 1,
      occurredAt: '2026-07-09T12:00:00.000000000Z',
      data: {
        chatId: 999,
        senderId: 42,
        clientMessageId: clientMessageId as string,
        senderName: '나',
        content: '안녕하세요',
        sentAt: '2026-07-09T12:00:00',
        profileImageUrl: '/api/employees/42/files/1/preview',
      },
    })
    const parsed = parseChatBroadcastMessage(confirmedEventBody)
    expect(parsed).not.toBeNull()
    queryClient.setQueryData<InfiniteData<ChatMessagesPage>>(chatKeys.messages(1), (old) =>
      upsertChatMessage(old, parsed as ChatMessage),
    )

    const afterEcho = queryClient.getQueryData<InfiniteData<ChatMessagesPage>>(chatKeys.messages(1))
    // append가 아니라 교체이므로 여전히 메시지는 1건이고, id가 서버 확정 양수값으로 바뀐다.
    expect(afterEcho?.pages[0]?.messages).toHaveLength(1)
    expect(afterEcho?.pages[0]?.messages[0]?.id).toBe(999)
    expect(afterEcho?.pages[0]?.messages[0]?.clientMessageId).toBe(clientMessageId)
  })
})

describe('useSendChatMessage me 미로딩 fail-closed', () => {
  it('me 조회가 아직 로딩 중이면(캐시 미도착) 전송을 차단하고 안내 토스트를 띄운다', async () => {
    // 응답을 영원히 지연시켜 "아직 로딩 중"인 상태를 고정한다(usePrimaryDeptId.test.tsx와 동일 기법).
    server.use(http.get(`${BASE_URL}/api/employees/me`, () => new Promise(() => {})))
    const client = await connectFakeClient()
    const socket = client.webSocket as unknown as FakeStompSocket
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useSendChatMessage(1), { wrapper: Wrapper })

    const sent = result.current.sendMessage('안녕하세요')

    expect(sent).toBe(false)
    const { toast } = await import('sonner')
    expect(toast.error).toHaveBeenCalledWith(
      '사용자 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.',
    )
    // 발신자 정보 없이는 낙관 메시지를 구성할 수 없으므로 SEND 자체를 시도하지 않는다.
    expect(socket.sentFrames.some((frame) => frame.startsWith('SEND\n'))).toBe(false)
  })
})

describe('useSendChatMessage publish() 동기 예외 롤백', () => {
  it('publish()가 동기 예외를 던지면 방금 넣은 낙관 메시지를 캐시에서 롤백하고 false를 반환한다', async () => {
    mockMeEndpoint()
    const client = await connectFakeClient()
    // SEND 자체가 브로커에 전달되지 못하는 상황(예: stompStatus 미러와 client.connected가 어긋나는
    // 좁은 레이스)을 흉내낸다 — getChatStompClient()는 싱글턴이라 이 스파이가 훅 내부 호출에도 적용된다.
    const publishSpy = vi.spyOn(client, 'publish').mockImplementation(() => {
      throw new Error('일시적 전송 실패')
    })
    const { Wrapper, queryClient } = createWrapper()
    queryClient.setQueryData(chatKeys.messages(1), emptyMessagesCache())

    const { result } = renderHook(() => useSendChatMessage(1), { wrapper: Wrapper })
    await waitFor(() => {
      expect(queryClient.getQueryData(employeeKeys.me())).toBeDefined()
    })

    const sent = result.current.sendMessage('안녕하세요')

    // 다른 실패 경로(2000자 초과·연결 끊김 등)와 동일하게 false를 반환해 입력값을 유지시켜야 한다.
    expect(sent).toBe(false)
    const cache = queryClient.getQueryData<InfiniteData<ChatMessagesPage>>(chatKeys.messages(1))
    // 낙관 메시지가 서버 echo 없이 영구 잔류하지 않도록 롤백되어야 한다.
    expect(cache?.pages[0]?.messages).toHaveLength(0)
    const { toast } = await import('sonner')
    expect(toast.error).toHaveBeenCalledWith('메시지 전송에 실패했습니다. 다시 시도해주세요.')

    // 다음 테스트로 mocked throw가 새지 않도록 원래 구현으로 되돌린다(싱글턴 클라이언트 공유 주의).
    publishSpy.mockRestore()
  })
})
