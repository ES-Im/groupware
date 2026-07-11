import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { messageKeys } from '../model/messageKeys'
import type { MailBox } from '../model/messageTypes'
import { getMessages, type MessageListQueryParams } from './getMessages'

/**
 * 쪽지함 4박스 목록 조회 훅(ROADMAP(MESSAGE) T2.1, F1501~F1504).
 *
 * box+params가 모두 queryKey(messageKeys.list(box, params))에 포함되어 박스 전환·검색·페이지
 * 변경 시마다 재요청된다. placeholderData: keepPreviousData(approval/board 목록 훅과 동일)로
 * 새 응답 도착 전까지 이전 목록을 유지해 표가 매번 전면 교체되며 깜빡이는 것을 막는다.
 */
export function useMessagesQuery(box: MailBox, params?: MessageListQueryParams) {
  return useQuery({
    queryKey: messageKeys.list(box, params),
    queryFn: () => getMessages(box, params),
    // box 전환 시에도 keepPreviousData가 걸려 이전 박스 목록이 placeholder로 잠깐 유지된다
    // (queryKey에 box가 포함된 데 따른 정상 동작). 훅에서 box 전환만 골라 끄지 않고 유지하되,
    // 소비 UI(T2.2-b)가 isPlaceholderData로 dimming 처리하기로 확정(2026-07-10 사용자 결정).
    placeholderData: keepPreviousData,
  })
}
