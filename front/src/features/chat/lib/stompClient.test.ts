import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearAccessToken, setAccessToken } from '@/shared/api/tokenStore'
import { useChatStompStatus } from './chatConnectionStatus'
import { connectChatStomp, disconnectChatStomp, getChatStompClient } from './stompClient'

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
}

afterEach(async () => {
  const client = getChatStompClient()
  if (client.active) {
    await client.deactivate({ force: true })
  }
  clearAccessToken()
  vi.unstubAllGlobals()
})

describe('chatStompClient (T0.4-a STOMP CONNECT 인프라)', () => {
  it('인증 완료(accessToken 보유) 후 connectChatStomp를 호출하면 ws://localhost:8080/ws-chat에 Authorization 네이티브 헤더로 CONNECT해 CONNECTED 프레임을 수신한다', async () => {
    setAccessToken('test-access-token')
    vi.stubGlobal('WebSocket', FakeStompSocket)

    connectChatStomp()
    const client = getChatStompClient()

    expect(client.brokerURL).toBe('ws://localhost:8080/ws-chat')
    expect(client.active).toBe(true)

    await vi.waitFor(() => {
      expect(client.connected).toBe(true)
    })

    const socket = client.webSocket as unknown as FakeStompSocket
    const connectFrame = socket.sentFrames.find((frame) => frame.startsWith('CONNECT\n'))
    expect(connectFrame).toContain('Authorization:Bearer test-access-token')
  })

  it('getChatStompClient는 여러 번 호출해도 동일한 단일 인스턴스를 반환한다(모듈 스코프 싱글턴)', () => {
    const first = getChatStompClient()
    const second = getChatStompClient()

    expect(first).toBe(second)
  })
})

describe('chatStompClient 연결 상태 노출/종료 정리 (T0.4-b)', () => {
  it('connectChatStomp 호출 시 연결 상태가 connecting을 거쳐 connected로 전이된다', async () => {
    setAccessToken('test-access-token')
    vi.stubGlobal('WebSocket', FakeStompSocket)
    const { result } = renderHook(() => useChatStompStatus())

    act(() => {
      connectChatStomp()
    })
    expect(result.current).toBe('connecting')

    await vi.waitFor(() => {
      expect(result.current).toBe('connected')
    })
  })

  it('이미 연결된 클라이언트에 connectChatStomp를 다시 호출해도 상태가 connecting으로 되돌아가지 않는다', async () => {
    setAccessToken('test-access-token')
    vi.stubGlobal('WebSocket', FakeStompSocket)
    const { result } = renderHook(() => useChatStompStatus())

    connectChatStomp()
    await vi.waitFor(() => {
      expect(result.current).toBe('connected')
    })

    act(() => {
      connectChatStomp()
    })
    expect(result.current).toBe('connected')
  })

  it('disconnectChatStomp 호출 시 연결이 종료되고 상태가 disconnected로 갱신된다', async () => {
    setAccessToken('test-access-token')
    vi.stubGlobal('WebSocket', FakeStompSocket)
    const { result } = renderHook(() => useChatStompStatus())

    connectChatStomp()
    await vi.waitFor(() => {
      expect(result.current).toBe('connected')
    })

    act(() => {
      disconnectChatStomp()
    })

    expect(result.current).toBe('disconnected')
    expect(getChatStompClient().active).toBe(false)
  })

  it('클라이언트가 아직 생성된 적 없으면 disconnectChatStomp는 아무 것도 하지 않는다', async () => {
    vi.resetModules()
    const freshStompClientModule = await import('./stompClient')

    expect(() => freshStompClientModule.disconnectChatStomp()).not.toThrow()
  })

  it('force disconnect 직후 재연결해도 새 연결이 정상적으로 CONNECTED 상태에 도달한다(오버레이 재오픈 시나리오)', async () => {
    setAccessToken('test-access-token')
    vi.stubGlobal('WebSocket', FakeStompSocket)
    const { result } = renderHook(() => useChatStompStatus())

    connectChatStomp()
    await vi.waitFor(() => {
      expect(result.current).toBe('connected')
    })

    act(() => {
      disconnectChatStomp()
    })
    expect(result.current).toBe('disconnected')

    connectChatStomp()
    await vi.waitFor(() => {
      expect(result.current).toBe('connected')
    })
    expect(getChatStompClient().active).toBe(true)
  })

  it('연결 종료 후 accessToken이 바뀐 상태로 재연결하면 새 토큰으로 CONNECT한다(계정 전환 시나리오)', async () => {
    setAccessToken('user-a-token')
    vi.stubGlobal('WebSocket', FakeStompSocket)
    const { result } = renderHook(() => useChatStompStatus())

    connectChatStomp()
    await vi.waitFor(() => {
      expect(result.current).toBe('connected')
    })
    const firstSocket = getChatStompClient().webSocket as unknown as FakeStompSocket
    const firstConnectFrame = firstSocket.sentFrames.find((frame) => frame.startsWith('CONNECT\n'))
    expect(firstConnectFrame).toContain('Authorization:Bearer user-a-token')

    act(() => {
      disconnectChatStomp()
    })
    expect(result.current).toBe('disconnected')

    setAccessToken('user-b-token')

    connectChatStomp()
    await vi.waitFor(() => {
      expect(result.current).toBe('connected')
    })
    const secondSocket = getChatStompClient().webSocket as unknown as FakeStompSocket
    const secondConnectFrame = secondSocket.sentFrames.find((frame) => frame.startsWith('CONNECT\n'))
    expect(secondConnectFrame).toContain('Authorization:Bearer user-b-token')
  })
})
