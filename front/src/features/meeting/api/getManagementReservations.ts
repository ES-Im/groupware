import { apiClient } from '@/shared/api/client'
import type { MeetingManagementPage, MeetingManagementSearchParams } from '../model/meeting'

/**
 * 회의 예약 관리 목록 조회(`MEETING_RESERVATION_MANAGEMENT`, api-endpoint.md 기능ID
 * `MEETING_RESERVATION_MANAGEMENT` → `GET /api/meetings`, FACILITY 권한 이상).
 *
 * yearMonth/keyword/meetingRoomId/page/size 5개 파라미터 전부 선택값이다(query-parameters.adoc
 * 실측). 값이 없는 파라미터는 쿼리스트링 자체에서 생략되도록 params 객체에 조건부로만 채운다
 * (board getBoardList·meeting getAvailableMeetingRooms와 동일 패턴).
 */
export async function getManagementReservations(
  params?: MeetingManagementSearchParams,
): Promise<MeetingManagementPage> {
  const query: Record<string, string | number> = {}
  if (params?.yearMonth) {
    query.yearMonth = params.yearMonth
  }
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.meetingRoomId != null) {
    query.meetingRoomId = params.meetingRoomId
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<MeetingManagementPage>('/api/meetings', {
    params: query,
  })
  return data
}
