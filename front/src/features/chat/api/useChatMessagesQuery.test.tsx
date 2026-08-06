import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { ChatMessagesPage } from '../model/chatMessage'
import { useChatMessagesQuery } from './useChatMessagesQuery'

function messagesPage(hasNext: boolean, nextCursor: number | null, ids: number[]): ChatMessagesPage {
  return {
    messages: ids.map((id) => ({
      id,
      senderId: 1,
      clientMessageId: `550e8400-e29b-41d4-a716-44665544${id}`,
      senderName: '홍길동',
      content: `메시지 ${id}`,
      sentAt: '2026-06-24T10:30:00',
      profileImageUrl: '/api/employees/1/files/7/preview',
    })),
    nextCursor,
    hasNext,
  }
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useChatMessagesQuery', () => {
  it('cursor 없이 최초 페이지를 조회해 그대로 반환한다', async () => {
    let receivedCursor: string | null = null
    let receivedSize: string | null = null
    server.use(
      http.get(`${BASE_URL}/api/chat/rooms/3/messages`, ({ request }) => {
        const url = new URL(request.url)
        receivedCursor = url.searchParams.get('cursor')
        receivedSize = url.searchParams.get('size')
        return HttpResponse.json(messagesPage(true, 99, [100, 99]))
      }),
    )

    const { result } = renderHook(() => useChatMessagesQuery(3), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(receivedCursor).toBeNull()
    expect(receivedSize).toBe('50')
    expect(result.current.data?.pages).toEqual([messagesPage(true, 99, [100, 99])])
    expect(result.current.hasNextPage).toBe(true)
  })

  it('fetchNextPage 호출 시 이전 페이지의 nextCursor를 cursor로 실어 요청한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/chat/rooms/3/messages`, ({ request }) => {
        const url = new URL(request.url)
        const cursor = url.searchParams.get('cursor')
        if (cursor === null) {
          return HttpResponse.json(messagesPage(true, 99, [100, 99]))
        }
        expect(cursor).toBe('99')
        return HttpResponse.json(messagesPage(false, null, [98, 97]))
      }),
    )

    const { result } = renderHook(() => useChatMessagesQuery(3), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.hasNextPage).toBe(true))

    await result.current.fetchNextPage()

    await waitFor(() => expect(result.current.data?.pages.length).toBe(2))
    expect(result.current.data?.pages[1]).toEqual(messagesPage(false, null, [98, 97]))
    expect(result.current.hasNextPage).toBe(false)
  })

  it('roomId가 undefined이면 요청을 보내지 않는다(enabled:false)', async () => {
    const handler = vi.fn(() => HttpResponse.json(messagesPage(false, null, [])))
    server.use(http.get(`${BASE_URL}/api/chat/rooms/3/messages`, handler))

    const { result } = renderHook(() => useChatMessagesQuery(undefined), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe('idle')
    expect(handler).not.toHaveBeenCalled()
  })
})
