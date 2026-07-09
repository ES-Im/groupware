import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { ChatMessage } from '../model/chatMessage'
import { useReadPositionSync } from './useReadPositionSync'

/**
 * useReadPositionSync(F911, ROADMAP(CHAT) T2.5) 실동작 검증.
 *
 * "방 진입 시"·"새 메시지 도달 시" 두 트리거를 별도 분기 없이 "보유한 messages의 서버 확정
 * (id>0) 최대 id 변화"로 통합했다는 설계를 실제 PATCH 호출 횟수/body로 검증한다.
 */

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
    // 백엔드 ChatMember.changeLastMessage()가 GREATEST 없이 단순 SET이므로, 두 PATCH가 동시에
    // in-flight 상태가 됐다가 완료 순서가 역전되면(더 큰 id 요청이 먼저 끝남) 읽음 위치가 더
    // 작은 id로 후퇴할 수 있다(code-reviewer 지적). 이 테스트는 항상 요청이 하나씩만 나가고,
    // 중간값(7)을 건너뛰더라도 최종적으로 가장 최신 id(9)가 반영됨을 검증한다.
    const bodies: unknown[] = []
    let resolveFirstRequest: (() => void) | undefined
    let requestCount = 0
    server.use(
      http.patch(`${BASE_URL}/api/chat/rooms/1/read-position`, async ({ request }) => {
        bodies.push(await request.json())
        requestCount += 1
        if (requestCount === 1) {
          // 첫 요청은 테스트가 명시적으로 resolveFirstRequest()를 호출하기 전까지 응답하지
          // 않는다 — 그동안 최대 id가 연속으로 증가하는 상황을 재현한다.
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

    // 첫 요청(5)이 나갈 때까지 대기한다 — 아직 완료시키지 않아 in-flight 상태를 유지한다.
    await waitFor(() => expect(bodies).toEqual([{ lastReadMessageId: 5 }]))

    // in-flight 도중 최대 id가 7 → 9로 연속 증가해도 새 요청이 즉시 나가지 않아야 한다(코얼레싱).
    rerender({ roomId: 1, messages: [message(5), message(7)] })
    rerender({ roomId: 1, messages: [message(5), message(7), message(9)] })
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(bodies).toEqual([{ lastReadMessageId: 5 }])

    // 첫 요청을 완료시키면, 중간값(7)을 건너뛰고 가장 최신 목표(9)로 딱 한 번만 이어서 나간다.
    resolveFirstRequest?.()
    await waitFor(() =>
      expect(bodies).toEqual([{ lastReadMessageId: 5 }, { lastReadMessageId: 9 }]),
    )
    // 정확히 두 번만 나가야 한다(7에 대한 별도 요청이 없어야 함).
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

    // 리렌더는 발생하지만(동일 배열 참조가 아니어도) 최대 id는 그대로다.
    rerender({ roomId: 1, messages: [message(5)] })
    rerender({ roomId: 1, messages: [message(5)] })

    // 마이크로태스크가 돌 시간을 준 뒤에도 여전히 1회 호출이어야 한다.
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

    // 방 전환: 새 방(roomId=2)의 최신 메시지 id(10)가 이전 방(roomId=1)의 마지막 동기화 id(50)보다
    // 작다 — roomId 비교 없이 id만 비교했다면 "감소"로 오인해 스킵됐을 상황이다.
    rerender({ roomId: 2, messages: [message(10)] })

    await waitFor(() => expect(room2Bodies).toEqual([{ lastReadMessageId: 10 }]))
    // 방 1의 read-position 요청 횟수는 방 전환 후에도 그대로여야 한다.
    expect(room1Bodies).toEqual([{ lastReadMessageId: 50 }])
  })

  it('in-flight 요청이 남아있는 채로 방을 전환하면, 이전 방에 적재됐던 목표는 새 방으로 새지 않고 새 방 자신의 목표만 새 방으로 전달된다', async () => {
    // code-reviewer 권고(재리뷰): fireSync/onSettled의 roomId 가드(pending.roomId !== roomIdRef.current)를
    // 직접 겨냥한 회귀 테스트 — 위 코얼레싱 테스트는 단일 방 내부만 검증하고, 이 테스트는 "in-flight
    // 요청이 살아있는 채로 방이 전환됐을 때" 경로를 검증한다.
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
    // 방 1의 첫 요청(5)이 나간 채 아직 완료되지 않은(in-flight) 상태를 만든다.
    await waitFor(() => expect(room1Bodies).toEqual([{ lastReadMessageId: 5 }]))

    // 방 1이 in-flight인 동안 방 1에 새 메시지가 도착해 목표가 큐잉된다(pendingRef = {room:1, id:7}).
    rerender({ roomId: 1, messages: [message(5), message(7)] })
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(room1Bodies).toEqual([{ lastReadMessageId: 5 }])

    // 방 1의 요청이 여전히 in-flight인 채로 방 2로 전환한다. 방 2의 effect가 실행되며
    // inFlightRef가 아직 true라 즉시 발사하지 못하고 pendingRef를 {room:2, id:20}으로 덮어쓴다
    // (직전의 {room:1, id:7}은 소실 — 재진입 시 자가 치유되는 의도된 트레이드오프).
    rerender({ roomId: 2, messages: [message(20)] })
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(room2Bodies).toEqual([])

    // 방 1의 원래 요청(5)을 완료시킨다. onSettled가 pending({room:2, id:20})을 발견하고,
    // roomId 가드(pending.roomId === roomIdRef.current(=2))를 통과해 "방 2"의 mutate로 이어
    // 보낸다 — 방 1로 새거나(오배송) 소실된 {room:1, id:7}이 뒤늦게 나가서는 안 된다.
    resolveRoom1Request?.()
    await waitFor(() => expect(room2Bodies).toEqual([{ lastReadMessageId: 20 }]))
    // 방 1은 최초 요청(5) 단 한 번만 받아야 한다 — 큐잉됐던 7은 끝내 방 1로도, 다른 어떤
    // 형태로도 발송되지 않는다.
    expect(room1Bodies).toEqual([{ lastReadMessageId: 5 }])
  })
})
