import { apiClient } from '@/shared/api/client'
import type { AvailableMeetingRoomsPage, AvailableMeetingRoomsSearchParams } from '../model/meeting'

/**
 * 예약 가능 회의실 검색(`AVAILABLE_MEETING_ROOMS`, api-endpoint.md 기능ID `AVAILABLE_MEETING_ROOMS` →
 * `GET /api/meeting-rooms/available`, 권한 EMPLOYEE).
 *
 * date/startAt/endAt/capacity/page/size 모두 선택값이다 — 사용자가 입력한 조건만 필터로 걸도록,
 * 값이 있는 파라미터만 쿼리스트링에 채운다(미입력 항목은 생략 → 서버는 null로 받아 해당 필터를
 * 적용하지 않음). 시각은 PRD Open Q#5 확정대로 `HH:mm`로 전송한다. capacity는 0도 유효한 값이라
 * `!= null`로 판별해 falsy(0) 오탈락을 막는다.
 */
export async function getAvailableMeetingRooms(
  params: AvailableMeetingRoomsSearchParams,
): Promise<AvailableMeetingRoomsPage> {
  const query: Record<string, string | number> = {}
  if (params.date) {
    query.date = params.date
  }
  if (params.startAt) {
    query.startAt = params.startAt
  }
  if (params.endAt) {
    query.endAt = params.endAt
  }
  if (params.capacity != null) {
    query.capacity = params.capacity
  }
  if (params.page != null) {
    query.page = params.page
  }
  if (params.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<AvailableMeetingRoomsPage>('/api/meeting-rooms/available', {
    params: query,
  })
  return data
}
