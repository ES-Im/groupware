import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { ChatMessage } from '../model/chatMessage'
import { useReadPositionSync } from './useReadPositionSync'

function message(id: number): ChatMessage {
  return {
    id,
    senderId: 1,
    clientMessageId: `msg-${id}`,
    senderName: '김철수',
    content: `메시지 ${id}`,
    sentAt: '2026-07-09T10:00:00',
    profileImageUrl: null,
  }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return Wrapper
}

function mockReadPositionEndpoint(roomId: number) {
  const bodies: unknown[] = []
  server.use(
    http.patch(`${BASE_URL}/api/chat/rooms/${roomId}/read-position`, async ({ request }) => {
      bodies.push(await request.json())
      return new HttpResponse(null, { status: 204 })
    }),
  )
  return bodies
}

describe('useReadPositionSync', () => {
  it('방 진입 시(초기 messages) 서버 확정 메시지 중 최대 id로 갱신한다', async () => {
    const bodies = mockReadPositionEndpoint(1)

    renderHook(({ roomId, messages }) => useReadPositionSync(roomId, messages), {
      wrapper: createWrapper(),
      initialProps: { roomId: 1, messages: [message(3), message(5), message(1)] },
    })

    await waitFor(() => expect(bodies).toEqual([{ lastReadMessageId: 5 }]))
  })

  it('실시간 수신으로 최대 id가 늘어나면 다시 갱신한다', async () => {
    const bodies = mockReadPositionEndpoint(1)

    const { rerender } = renderHook(
      ({ roomId, messages }) => useReadPositionSync(roomId, messages),
      {
        wrapper: createWrapper(),
        initialProps: { roomId: 1, messages: [message(5)] },
      },
    )
    await waitFor(() => expect(bodies).toEqual([{ lastReadMessageId: 5 }]))

    rerender({ roomId: 1, messages: [message(5), message(7)] })

    await waitFor(() => expect(bodies).toEqual([{ lastReadMessageId: 5 }, { lastReadMessageId: 7 }]))
  })

  it('in-flight 요청 도중 최대 id가 연속으로 증가해도 한 번에 하나씩만 순차 반영하고, 완료 순서 역전으로 인한 읽음 위치 후퇴가 없다', async () => {
    const bodies: unknown[] = []
    let resolveFirstRequest: (() => void) | undefined
    let requestCount = 0
    server.use(
      http.patch(`${BASE_URL}/api/chat/rooms/1/read-position`, async ({ request }) => {
        bodies.push(await request.json())
        requestCount += 1
        if (requestCount === 1) {
          await new Promise<void>((resolve) => {
            resolveFirstRequest = resolve
          })
        }
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { rerender } = renderHook(
      ({ roomId, messages }) => useReadPositionSync(roomId, messages),
      {
        wrapper: createWrapper(),
        initialProps: { roomId: 1, messages: [message(5)] },
      },
    )

    await waitFor(() => expect(bodies).toEqual([{ lastReadMessageId: 5 }]))

    rerender({ roomId: 1, messages: [message(5), message(7)] })
    rerender({ roomId: 1, messages: [message(5), message(7), message(9)] })
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(bodies).toEqual([{ lastReadMessageId: 5 }])

    resolveFirstRequest?.()
    await waitFor(() =>
      expect(bodies).toEqual([{ lastReadMessageId: 5 }, { lastReadMessageId: 9 }]),
    )
    expect(requestCount).toBe(2)
  })

  it('최대 id가 그대로면 다시 갱신하지 않는다(과도한 API 호출 방지)', async () => {
    const bodies = mockReadPositionEndpoint(1)

    const { rerender } = renderHook(
      ({ roomId, messages }) => useReadPositionSync(roomId, messages),
      {
        wrapper: createWrapper(),
        initialProps: { roomId: 1, messages: [message(5)] },
      },
    )
    await waitFor(() => expect(bodies).toEqual([{ lastReadMessageId: 5 }]))

    rerender({ roomId: 1, messages: [message(5)] })
    rerender({ roomId: 1, messages: [message(5)] })

    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(bodies).toEqual([{ lastReadMessageId: 5 }])
  })

  it('T2.4 낙관 메시지(음수 id)는 서버 미확정이라 최대 id 계산에서 제외한다', async () => {
    const bodies = mockReadPositionEndpoint(1)

    renderHook(({ roomId, messages }) => useReadPositionSync(roomId, messages), {
      wrapper: createWrapper(),
      initialProps: { roomId: 1, messages: [message(5), message(-1)] },
    })

    await waitFor(() => expect(bodies).toEqual([{ lastReadMessageId: 5 }]))
  })

  it('서버 확정 메시지가 없으면(전부 낙관/빈 배열) 갱신하지 않는다', async () => {
    const bodies = mockReadPositionEndpoint(1)

    renderHook(({ roomId, messages }) => useReadPositionSync(roomId, messages), {
      wrapper: createWrapper(),
      initialProps: { roomId: 1, messages: [message(-1)] },
    })

    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(bodies).toEqual([])
  })

  it('방 전환 시 이전 방의 마지막 동기화 id에 오염되지 않고, 더 낮은 id라도 새 방 기준으로 갱신한다', async () => {
    const room1Bodies = mockReadPositionEndpoint(1)
    const room2Bodies = mockReadPositionEndpoint(2)

    const { rerender } = renderHook(
      ({ roomId, messages }) => useReadPositionSync(roomId, messages),
      {
        wrapper: createWrapper(),
        initialProps: { roomId: 1, messages: [message(50)] },
      },
    )
    await waitFor(() => expect(room1Bodies).toEqual([{ lastReadMessageId: 50 }]))

    rerender({ roomId: 2, messages: [message(10)] })

    await waitFor(() => expect(room2Bodies).toEqual([{ lastReadMessageId: 10 }]))
    expect(room1Bodies).toEqual([{ lastReadMessageId: 50 }])
  })

  it('in-flight 요청이 남아있는 채로 방을 전환하면, 이전 방에 적재됐던 목표는 새 방으로 새지 않고 새 방 자신의 목표만 새 방으로 전달된다', async () => {
    const room1Bodies: unknown[] = []
    let resolveRoom1Request: (() => void) | undefined
    server.use(
      http.patch(`${BASE_URL}/api/chat/rooms/1/read-position`, async ({ request }) => {
        room1Bodies.push(await request.json())
        await new Promise<void>((resolve) => {
          resolveRoom1Request = resolve
        })
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const room2Bodies = mockReadPositionEndpoint(2)

    const { rerender } = renderHook(
      ({ roomId, messages }) => useReadPositionSync(roomId, messages),
      {
        wrapper: createWrapper(),
        initialProps: { roomId: 1, messages: [message(5)] },
      },
    )
    await waitFor(() => expect(room1Bodies).toEqual([{ lastReadMessageId: 5 }]))

    rerender({ roomId: 1, messages: [message(5), message(7)] })
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(room1Bodies).toEqual([{ lastReadMessageId: 5 }])

    rerender({ roomId: 2, messages: [message(20)] })
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(room2Bodies).toEqual([])

    resolveRoom1Request?.()
    await waitFor(() => expect(room2Bodies).toEqual([{ lastReadMessageId: 20 }]))
    expect(room1Bodies).toEqual([{ lastReadMessageId: 5 }])
  })
})
