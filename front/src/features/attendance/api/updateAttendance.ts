import { apiClient } from '@/shared/api/client'
import type { UpdateAttendanceFormValues } from '../model/updateAttendanceSchema'

/**
 * 부서 근태 수정 요청 바디(`DEPT_ATTENDANCE_UPDATE`, ROADMAP T4.2, F307).
 * request-fields.adoc 실측: targetEmpId(필수)·startAt/endAt(선택, HH:mm:ss, 최소 1개)·
 * editedAt(필수, ISO DATE_TIME)·editReason(필수, 100자 이하).
 *
 * T4.1 스키마(UpdateAttendanceFormValues)에는 editedAt이 없다(제출 시각에 결정되는 값이라
 * 폼 입력 필드가 아님 — updateAttendanceSchema.ts 주석 참조). 제출 핸들러(T4.3)가
 * `dayjs().format('YYYY-MM-DDTHH:mm:ss')`로 합성해 이 타입에 동봉해 전달한다.
 *
 * WHY format()이고 toISOString()이 아닌가(contract-conformance-reviewer 지적, T4.4에서 발견 후
 * 이 주석도 함께 정정): 서버는 editedAt을 `@DateTimeFormat(iso = ISO.DATE_TIME) LocalDateTime`으로
 * 파싱해(오프셋 없는 로컬 wall-clock 기대) `dayjs().toISOString()`(UTC `...Z`)을 쓰면 실제 제출
 * 시각보다 9시간 이전 값이 기록된다 — T4.3 구현 시 이 형식을 그대로 따라야 한다.
 */
export type UpdateAttendanceRequest = UpdateAttendanceFormValues & { editedAt: string }

/**
 * 부서 근태 수정(`DEPT_ATTENDANCE_UPDATE`, api-endpoint.md 기능ID `DEPT_ATTENDANCE_UPDATE` →
 * `PATCH /api/employees/attendances/{attendanceId}`, minRole DEPT_MANAGER).
 *
 * attendanceId는 부서 근태 목록 조회(F305/F306, T3.3) 응답의 `attendanceInfo[].attendanceId`
 * (또는 단건 `attendanceInfo.attendanceId`)를 그대로 사용한다 — 별도 조회를 신설하지 않는다
 * (Open Q#1 해결 전제, PRD §참조 계약 매핑).
 *
 * startAt/endAt은 T4.1 zod 스키마가 미입력 시 빈 문자열(`''`)로 남길 수 있어(스키마 자체는
 * 이를 걸러내지 않음), 여기서 값이 있을 때만(falsy가 아닐 때만) 요청 바디에 포함한다 — 빈
 * 문자열을 그대로 서버에 보내지 않는다(getDeptAttendanceMonthly의 조건부 쿼리 파라미터 조립과
 * 동일 패턴).
 *
 * 성공 시 `204 No Content`(response-body.adoc 실측, 응답 본문 없음).
 */
export async function updateAttendance(
  attendanceId: number,
  payload: UpdateAttendanceRequest,
): Promise<void> {
  const body: Record<string, unknown> = {
    targetEmpId: payload.targetEmpId,
    editedAt: payload.editedAt,
    editReason: payload.editReason,
  }
  if (payload.startAt) {
    body.startAt = payload.startAt
  }
  if (payload.endAt) {
    body.endAt = payload.endAt
  }
  await apiClient.patch(`/api/employees/attendances/${attendanceId}`, body)
}
