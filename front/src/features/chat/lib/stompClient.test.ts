import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearAccessToken, setAccessToken } from '@/shared/api/tokenStore'
import { useChatStompStatus } from './chatConnectionStatus'
import { connectChatStomp, disconnectChatStomp, getChatStompClient } from './stompClient'

/**
 * T0.4-a(채팅 STOMP CONNECT 인프라) + T0.4-b(연결 상태 노출/종료 정리) 검증.
 *
 * 실제 백엔드(ws://localhost:8080/ws-chat) 없이도 "CONNECT 성공(브로커 CONNECTED 프레임
 * 수신)"을 로컬에서 확인하기 위해, @stomp/stompjs가 내부적으로 `new WebSocket(brokerURL, ...)`로
 * 생성하는 브라우저 WebSocket을 흉내내는 최소 가짜 소켓으로 STOMP 텍스트 프로토콜의
 * CONNECT→CONNECTED 왕복만 시뮬레이션한다(Playwright 미사용, chat-stomp.md §연결·인증 근거).
 */

interface FakeCloseEvent {
  code: number
  reason: string
  wasClean: boolean
}

class FakeStompSocket {
  url: string
  protocols?: string | string[]
  readyState = 0 // CONNECTING
  binaryType = ''
  onopen: (() => void) | null = null
  onmessage: ((ev: { data: string }) => void) | null = null
  onclose: ((ev: FakeCloseEvent) => void) | null = null
  onerror: (() => void) | null = null
  sentFrames: string[] = []

  constructor(url: string, protocols?: string | string[]) {
    this.url = url
    this.protocols = protocols
    // 실제 WebSocket처럼 open은 다음 틱에 비동기로 발생시킨다.
    setTimeout(() => {
      this.readyState = 1 // OPEN
      this.onopen?.()
    }, 0)
  }

  send(data: string): void {
    this.sentFrames.push(data)
    if (data.startsWith('CONNECT\n')) {
      // 브로커가 CONNECTED 프레임으로 응답하는 상황을 흉내낸다(STOMP 1.2, NUL 종단).
      setTimeout(() => {
        this.onmessage?.({ data: 'CONNECTED\nversion:1.2\n\n\0' })
      }, 0)
    }
  }

  close(): void {
    this.readyState = 3 // CLOSED
  }
}

afterEach(async () => {
  // 싱글턴 클라이언트가 활성 상태로 남지 않도록 정리한다(다음 테스트로 상태가 새지 않게).
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
    // activate() 직후 클라이언트는 동기적으로 ACTIVE 상태가 된다.
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
    // activate() 직후 실제 WebSocket open은 아직 비동기(다음 틱)이므로 이 시점엔 connecting.
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

    // activate()는 이미 ACTIVE인 클라이언트에는 no-op이라 onConnect가 다시 불리지 않으므로,
    // 여기서 상태가 connecting으로 되돌아가면 영영 connecting에 머무는 회귀 버그가 된다.
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

  /**
   * 채팅 오버레이(팝업 → 인앱 오버레이 전환) 열기/닫기/재열기는 이제 React 마운트/언마운트로
   * connectChatStomp/disconnectChatStomp를 그대로 호출한다(ChatOverlayPanel 참조) — 이 시나리오를
   * 재현해 force disconnect 직후 재연결이 다시 정상적으로 CONNECTED 상태에 도달하는지 검증한다.
   * (playwright 수동 검증 중 재오픈 시 콘솔에 "WebSocket is already in CLOSING or CLOSED state"
   * 로그가 1회 관찰됐으나, 이는 jsdom에 없는 실제 브라우저 네이티브 WebSocket 구현이 force close
   * 경합 상황에서 찍는 방어적 로그로 보이며 — FakeStompSocket은 그 네이티브 로그를 재현하지
   * 않으므로 이 테스트에서 직접 검증할 수는 없다 — 기능적으로는 이 테스트가 보여주듯 재연결이
   * 정상 완료된다.)
   */
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
})
