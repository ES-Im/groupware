import type { InfiniteData } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import type { ChatMessage, ChatMessagesPage } from '../model/chatMessage'
import { upsertChatMessage } from './upsertChatMessage'

function message(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 1,
    senderId: 1,
    clientMessageId: '550e8400-e29b-41d4-a716-446655440000',
    senderName: '홍길동',
    content: '안녕하세요',
    sentAt: '2026-07-09T10:30:00',
    profileImageUrl: null,
    ...overrides,
  }
}

function page(messages: ChatMessage[], overrides: Partial<ChatMessagesPage> = {}): ChatMessagesPage {
  return { messages, nextCursor: null, hasNext: false, ...overrides }
}

describe('upsertChatMessage', () => {
  it('캐시가 아직 없으면(undefined) 그대로 undefined를 반환한다', () => {
    expect(upsertChatMessage(undefined, message())).toBeUndefined()
  })

  it('캐시에 페이지가 하나도 없으면 그대로 반환한다(임의로 페이지를 만들지 않음)', () => {
    const data: InfiniteData<ChatMessagesPage> = { pages: [], pageParams: [] }
    expect(upsertChatMessage(data, message())).toBe(data)
  })

  it('일치하는 clientMessageId가 없으면 최초 페이지(pages[0])의 끝에 새 메시지를 추가한다', () => {
    const existing = message({ id: 1, clientMessageId: 'existing-1' })
    const data: InfiniteData<ChatMessagesPage> = {
      pages: [page([existing]), page([message({ id: 0, clientMessageId: 'older-1' })])],
      pageParams: [undefined, 5],
    }
    const incoming = message({ id: 2, clientMessageId: 'new-1', content: '새 메시지' })

    const result = upsertChatMessage(data, incoming)

    expect(result?.pages[0]?.messages).toEqual([existing, incoming])
    expect(result?.pages[1]).toBe(data.pages[1])
    expect(result?.pageParams).toEqual([undefined, 5])
  })

  it('동일 clientMessageId가 최초 페이지에 있으면 append하지 않고 그 자리를 새 값으로 교체한다', () => {
    const optimistic = message({ id: -1, clientMessageId: 'dup-1', content: '전송 중...' })
    const other = message({ id: 5, clientMessageId: 'other-1' })
    const data: InfiniteData<ChatMessagesPage> = {
      pages: [page([other, optimistic])],
      pageParams: [undefined],
    }
    const confirmed = message({ id: 42, clientMessageId: 'dup-1', content: '전송 중...' })

    const result = upsertChatMessage(data, confirmed)

    expect(result?.pages[0]?.messages).toEqual([other, confirmed])
    expect(result?.pages[0]?.messages.length).toBe(2)
  })

  it('동일 clientMessageId가 최초 페이지가 아닌 다른 페이지에 있어도 그 자리를 찾아 교체한다', () => {
    const inOlderPage = message({ id: 3, clientMessageId: 'dup-2' })
    const data: InfiniteData<ChatMessagesPage> = {
      pages: [page([message({ id: 9, clientMessageId: 'latest-1' })]), page([inOlderPage])],
      pageParams: [undefined, 9],
    }
    const confirmed = message({ id: 3, clientMessageId: 'dup-2', content: '수정된 확정값' })

    const result = upsertChatMessage(data, confirmed)

    expect(result?.pages[0]?.messages).toEqual(data.pages[0]?.messages)
    expect(result?.pages[1]?.messages).toEqual([confirmed])
  })

  it('서버 확정 순서(id)와 다른 순서로 브로드캐스트가 도착해도 id 오름차순으로 재정렬한다(실사용 재현: 두 사용자 화면 메시지 순서 엇갈림 버그)', () => {
    const first = message({ id: 10, clientMessageId: 'first' })
    const data: InfiniteData<ChatMessagesPage> = { pages: [page([first])], pageParams: [undefined] }

    const laterButArrivedSecond = message({ id: 12, clientMessageId: 'later' })
    const step1 = upsertChatMessage(data, laterButArrivedSecond)
    const earlierButArrivedFirst = message({ id: 11, clientMessageId: 'earlier' })
    const result = upsertChatMessage(step1, earlierButArrivedFirst)

    expect(result?.pages[0]?.messages.map((m) => m.id)).toEqual([10, 11, 12])
  })

  it('미확정(낙관) 메시지는 도착 순서와 무관하게 항상 확정 메시지들보다 뒤에 위치한다', () => {
    const confirmed = message({ id: 5, clientMessageId: 'confirmed-1' })
    const pending = message({ id: -1, clientMessageId: 'pending-1', content: '전송 중...' })
    const data: InfiniteData<ChatMessagesPage> = {
      pages: [page([pending])],
      pageParams: [undefined],
    }

    const result = upsertChatMessage(data, confirmed)

    expect(result?.pages[0]?.messages).toEqual([confirmed, pending])
  })

  it('미확정(낙관) 메시지끼리는 생성 순서(먼저 만든 쪽이 0에 더 가까운 id)를 유지한다', () => {
    const firstPending = message({ id: -1, clientMessageId: 'pending-first' })
    const data: InfiniteData<ChatMessagesPage> = {
      pages: [page([firstPending])],
      pageParams: [undefined],
    }
    const secondPending = message({ id: -2, clientMessageId: 'pending-second' })

    const result = upsertChatMessage(data, secondPending)

    expect(result?.pages[0]?.messages.map((m) => m.clientMessageId)).toEqual([
      'pending-first',
      'pending-second',
    ])
  })
})
