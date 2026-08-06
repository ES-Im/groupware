import { describe, expect, it } from 'vitest'
import { resolveChatRoomDisplayName } from './resolveChatRoomDisplayName'

describe('resolveChatRoomDisplayName', () => {
  it('roomName이 있으면 그대로 반환한다(참여자 이름 무시)', () => {
    expect(resolveChatRoomDisplayName('업무방', ['김영희', '김철수'])).toBe('업무방')
  })

  it('roomName이 공백뿐이면 참여자 이름으로 폴백한다', () => {
    expect(resolveChatRoomDisplayName('   ', ['김영희'])).toBe('김영희')
  })

  it('roomName이 null이고 참여자가 maxNames 이하면 전부 나열한다', () => {
    expect(resolveChatRoomDisplayName(null, ['김영희', '김철수'])).toBe('김영희, 김철수')
  })

  it('roomName이 null이고 참여자가 많으면 앞 N명 + 외 M명으로 축약한다', () => {
    expect(
      resolveChatRoomDisplayName(null, ['김영희', '김철수', '박지민', '강민서', '이수']),
    ).toBe('김영희, 김철수 외 3명')
  })

  it('maxNames를 조정하면 나열 인원수가 바뀐다', () => {
    expect(
      resolveChatRoomDisplayName(null, ['김영희', '김철수', '박지민', '강민서'], 3),
    ).toBe('김영희, 김철수, 박지민 외 1명')
  })

  it('참여자 이름이 하나도 없으면 최종 폴백 문구를 반환한다', () => {
    expect(resolveChatRoomDisplayName(null, [])).toBe('이름 없는 채팅방')
  })

  it('participantNames가 undefined/null이어도(서버 미반영 등) 안전하게 최종 폴백한다', () => {
    expect(resolveChatRoomDisplayName(null, undefined)).toBe('이름 없는 채팅방')
    expect(resolveChatRoomDisplayName(null, null)).toBe('이름 없는 채팅방')
    expect(resolveChatRoomDisplayName('업무방', undefined)).toBe('업무방')
  })
})
