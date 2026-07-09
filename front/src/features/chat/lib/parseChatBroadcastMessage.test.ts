import { describe, expect, it } from 'vitest'
import { parseChatBroadcastMessage } from './parseChatBroadcastMessage'

/**
 * parseChatBroadcastMessage(ROADMAP(CHAT) T2.3-b) 검증.
 *
 * PRD Open Q#5(브로드캐스트 프레임 스키마)는 T2.4 실제 백엔드 연동 검증 중 실측으로 확정됐다
 * (parseChatBroadcastMessage.ts 상단 주석 참조) — 이벤트 봉투(`eventType: 'MESSAGE_CREATED'`,
 * 메시지 필드는 `data`, 식별자는 `chatId`) 구조를 기준으로 검증한다.
 */

/** 실측 프레임 형태(2026-07-09 dev 서버 관찰)를 흉내내는 envelope 빌더. */
function envelope(
  data: Record<string, unknown>,
  overrides: { eventType?: string } = {},
) {
  return {
    eventId: '827a1d50-210c-47b4-8f5c-f2e7de9bd830',
    eventType: overrides.eventType ?? 'MESSAGE_CREATED',
    roomId: 1,
    occurredAt: '2026-07-09T10:00:40.309435300Z',
    data,
  }
}

describe('parseChatBroadcastMessage', () => {
  it('MESSAGE_CREATED 이벤트 봉투의 data를 ChatMessage로 파싱한다(chatId→id 매핑 포함)', () => {
    const body = JSON.stringify(
      envelope({
        chatId: 10,
        senderId: 1,
        clientMessageId: '550e8400-e29b-41d4-a716-446655440000',
        senderName: '홍길동',
        content: '안녕하세요',
        sentAt: '2026-07-09T10:30:00.1234567',
        profileImageUrl: '/api/employees/1/files/7/preview',
      }),
    )

    expect(parseChatBroadcastMessage(body)).toEqual({
      id: 10,
      senderId: 1,
      clientMessageId: '550e8400-e29b-41d4-a716-446655440000',
      senderName: '홍길동',
      content: '안녕하세요',
      sentAt: '2026-07-09T10:30:00.1234567',
      profileImageUrl: '/api/employees/1/files/7/preview',
    })
  })

  it('profileImageUrl이 없으면 null로 채운다(실측 프레임에도 이 필드는 없었다)', () => {
    const body = JSON.stringify(
      envelope({
        chatId: 10,
        senderId: 1,
        clientMessageId: '550e8400-e29b-41d4-a716-446655440000',
        senderName: '홍길동',
        content: '안녕하세요',
        sentAt: '2026-07-09T10:30:00',
      }),
    )

    expect(parseChatBroadcastMessage(body)?.profileImageUrl).toBeNull()
  })

  it('eventType이 MESSAGE_CREATED가 아니면 null을 반환한다(같은 토픽의 다른 이벤트 종류 무시)', () => {
    const body = JSON.stringify(
      envelope(
        {
          chatId: 10,
          senderId: 1,
          clientMessageId: '550e8400-e29b-41d4-a716-446655440000',
          senderName: '홍길동',
          content: '안녕하세요',
          sentAt: '2026-07-09T10:30:00',
        },
        { eventType: 'READ_POSITION_UPDATED' },
      ),
    )

    expect(parseChatBroadcastMessage(body)).toBeNull()
  })

  it('JSON 파싱 자체가 실패하면 null을 반환한다', () => {
    expect(parseChatBroadcastMessage('not-json')).toBeNull()
  })

  it('data가 없으면(object 아님) null을 반환한다', () => {
    const body = JSON.stringify({
      eventId: '827a1d50-210c-47b4-8f5c-f2e7de9bd830',
      eventType: 'MESSAGE_CREATED',
      roomId: 1,
      occurredAt: '2026-07-09T10:00:40.309435300Z',
    })

    expect(parseChatBroadcastMessage(body)).toBeNull()
  })

  it('data 안의 필수 필드(content)가 없으면 null을 반환한다', () => {
    const body = JSON.stringify(
      envelope({
        chatId: 10,
        senderId: 1,
        clientMessageId: '550e8400-e29b-41d4-a716-446655440000',
        senderName: '홍길동',
        sentAt: '2026-07-09T10:30:00',
      }),
    )

    expect(parseChatBroadcastMessage(body)).toBeNull()
  })

  it('배열/원시값 등 object가 아닌 body는 null을 반환한다', () => {
    expect(parseChatBroadcastMessage('[]')).toBeNull()
    expect(parseChatBroadcastMessage('"hello"')).toBeNull()
    expect(parseChatBroadcastMessage('null')).toBeNull()
  })
})
