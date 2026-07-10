import { apiClient } from '@/shared/api/client'
import type { AvailableMeetingRoomsPage, AvailableMeetingRoomsSearchParams } from '../model/meeting'

/**
 * 예약 가능 회의실 검색(`AVAILABLE_MEETING_ROOMS`, api-endpoint.md 기능ID `AVAILABLE_MEETING_ROOMS` →
 * `GET /api/meeting-rooms/available`, 권한 EMPLOYEE).
 *
 * date/startAt/endAt/capacity 4개는 계약상 전부 필수 파라미터다(query-parameters.adoc 실측).
 * 시각은 PRD Open Q#5 확정대로 `HH:mm`로 전송한다. page/size는 선택값이라 값이 있을 때만
 * 쿼리스트링에 채운다(board getBoardList와 동일 패턴).
 */
export async function getAvailableMeetingRooms(
  params: AvailableMeetingRoomsSearchParams,
): Promise<AvailableMeetingRoomsPage> {
  const query: Record<string, string | number> = {
    date: params.date,
    startAt: params.startAt,
    endAt: params.endAt,
    capacity: params.capacity,
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
