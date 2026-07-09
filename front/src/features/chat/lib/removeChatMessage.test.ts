import type { InfiniteData } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import type { ChatMessage, ChatMessagesPage } from '../model/chatMessage'
import { removeChatMessage } from './removeChatMessage'

/**
 * removeChatMessage(ROADMAP(CHAT) T2.4) 검증 — upsertChatMessage.test.ts와 동일한 fixture
 * 컨벤션을 따른다.
 */

function message(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: -1,
    senderId: 1,
    clientMessageId: '550e8400-e29b-41d4-a716-446655440000',
    senderName: '홍길동',
    content: '전송 중...',
    sentAt: '2026-07-09T10:30:00',
    profileImageUrl: null,
    ...overrides,
  }
}

function page(messages: ChatMessage[], overrides: Partial<ChatMessagesPage> = {}): ChatMessagesPage {
  return { messages, nextCursor: null, hasNext: false, ...overrides }
}

describe('removeChatMessage', () => {
  it('캐시가 아직 없으면(undefined) 그대로 undefined를 반환한다', () => {
    expect(removeChatMessage(undefined, 'dup-1')).toBeUndefined()
  })

  it('일치하는 clientMessageId가 있으면 그 메시지만 제거한다', () => {
    const target = message({ clientMessageId: 'target-1' })
    const other = message({ id: 5, clientMessageId: 'other-1' })
    const data: InfiniteData<ChatMessagesPage> = {
      pages: [page([other, target])],
      pageParams: [undefined],
    }

    const result = removeChatMessage(data, 'target-1')

    expect(result?.pages[0]?.messages).toEqual([other])
  })

  it('최초 페이지가 아닌 다른 페이지에 있어도 찾아서 제거한다', () => {
    const target = message({ clientMessageId: 'target-2' })
    const data: InfiniteData<ChatMessagesPage> = {
      pages: [page([message({ id: 9, clientMessageId: 'latest-1' })]), page([target])],
      pageParams: [undefined, 9],
    }

    const result = removeChatMessage(data, 'target-2')

    // 대상이 없던 최초 페이지는 참조까지 그대로 유지된다(불필요한 리렌더 방지).
    expect(result?.pages[0]).toBe(data.pages[0])
    expect(result?.pages[1]?.messages).toEqual([])
  })

  it('일치하는 clientMessageId가 없으면 아무것도 지우지 않고 그대로 반환한다', () => {
    const existing = message({ clientMessageId: 'existing-1' })
    const data: InfiniteData<ChatMessagesPage> = {
      pages: [page([existing])],
      pageParams: [undefined],
    }

    const result = removeChatMessage(data, 'not-found')

    expect(result?.pages[0]?.messages).toEqual([existing])
  })
})
