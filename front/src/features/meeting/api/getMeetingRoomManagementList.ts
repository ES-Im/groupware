import { apiClient } from '@/shared/api/client'
import type { MeetingRoomManagementPage, MeetingRoomManagementSearchParams } from '../model/meeting'

/**
 * 회의실 관리 목록 조회(`MEETING_ROOM_MANAGEMENT`, api-endpoint.md 기능ID
 * `MEETING_ROOM_MANAGEMENT` → `GET /api/meeting-rooms/management`, FACILITY 권한 이상).
 *
 * available/bookedInFuture/page/size 4개 파라미터 전부 선택값이다(query-parameters.adoc
 * 실측). available/bookedInFuture는 false도 유효한 값이므로 `!= null`로 판별해 값이 없는
 * 파라미터만 쿼리스트링에서 생략한다(department getDepartments의 isActive와 동일 패턴).
 */
export async function getMeetingRoomManagementList(
  params?: MeetingRoomManagementSearchParams,
): Promise<MeetingRoomManagementPage> {
  const query: Record<string, number | boolean> = {}
  if (params?.available != null) {
    query.available = params.available
  }
  if (params?.bookedInFuture != null) {
    query.bookedInFuture = params.bookedInFuture
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<MeetingRoomManagementPage>('/api/meeting-rooms/management', {
    params: query,
  })
  return data
}
