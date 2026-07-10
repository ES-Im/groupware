import { apiClient } from '@/shared/api/client'

/**
 * 회의실 첨부파일 다운로드(`MEETING_ROOM_FILE_DOWNLOAD`, api-endpoint.md 기능ID
 * `MEETING_ROOM_FILE_DOWNLOAD` → `GET /api/meeting-rooms/{meetingRoomId}/files/{fileId}/download`,
 * 200 Binary, `Content-Disposition: attachment`).
 *
 * 상태 없는 단발성 유틸(훅 아님) — 이미지 첨부 클릭 핸들러(T2.4-a)에서 직접 호출한다.
 * board 도메인의 downloadBoardFile(T11.2)과 동형: blob 조회 후 임시 `<a>` 태그로 브라우저 저장
 * 다운로드를 트리거하고, objectURL은 트리거 직후 즉시 revoke한다(메모리에 blob이 남지 않도록).
 * fileName은 호출부가 MEETING_ROOM_FILES(T2.2)에서 받은 `originalName`을 그대로 넘겨 브라우저
 * 저장 대화상자에 원본 파일명이 노출되게 한다.
 *
 * 실패 시(네트워크 오류 등) 예외를 그대로 던진다 — 이 유틸 자체는 UI 폴백을 갖지 않으며,
 * 호출부가 토스트 등으로 처리한다.
 */
export async function downloadMeetingRoomFile(
  meetingRoomId: number,
  fileId: number,
  fileName: string,
): Promise<void> {
  const { data } = await apiClient.get<Blob>(
    `/api/meeting-rooms/${meetingRoomId}/files/${fileId}/download`,
    { responseType: 'blob' },
  )

  const objectUrl = URL.createObjectURL(data)
  try {
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
