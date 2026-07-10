import { apiClient } from '@/shared/api/client'
import type { CompanyInfoUpdateFormValues } from '../model/companyInfoUpdateSchema'

/**
 * 회사 기본정보 수정 요청 바디(`COMPANY_UPDATE_INFO`, ROADMAP-COMPANY T3.1-a, F1403).
 * request-fields.adoc 실측: companyName/location/ownerName(전부 선택) · editedAt(필수, ISO DATE_TIME).
 *
 * T3.1-a 스키마(CompanyInfoUpdateFormValues)에는 editedAt이 없다(제출 시각에 결정되는 값이라
 * 폼 입력 필드가 아님 — companyInfoUpdateSchema.ts 주석 참조). 호출부(mutation 훅)가
 * `dayjs().format('YYYY-MM-DDTHH:mm:ss')`로 합성해 이 타입에 동봉해 전달한다.
 *
 * WHY format()이고 toISOString()이 아닌가(updateAttendance/approveAttendance와 동일 이유): 서버는
 * editedAt을 오프셋 없는 로컬 wall-clock `LocalDateTime`으로 파싱하므로 UTC `...Z`를 만드는
 * toISOString()을 쓰면 실제 제출 시각보다 9시간 이전 값이 기록된다.
 */
export type UpdateCompanyInfoRequest = CompanyInfoUpdateFormValues & { editedAt: string }

/**
 * 회사 기본정보 수정(`COMPANY_UPDATE_INFO`, api-endpoint.md 기능ID `COMPANY_UPDATE_INFO` →
 * `POST /api/companies/info`, ADMIN 전용).
 *
 * companyName/location/ownerName은 T3.1-a zod 스키마가 미입력 시 undefined로 남길 수 있어,
 * 여기서 값이 있을 때만(falsy가 아닐 때만) 요청 바디에 포함한다 — 빈 값을 그대로 서버에 보내
 * "빈 문자열로 변경"되는 것을 막는다(updateAttendance의 조건부 필드 조립과 동일 패턴).
 *
 * 성공 시 `204 No Content`(response-body.adoc 실측, 응답 본문 없음).
 */
export async function updateCompanyInfo(payload: UpdateCompanyInfoRequest): Promise<void> {
  const body: Record<string, unknown> = { editedAt: payload.editedAt }
  if (payload.companyName) {
    body.companyName = payload.companyName
  }
  if (payload.location) {
    body.location = payload.location
  }
  if (payload.ownerName) {
    body.ownerName = payload.ownerName
  }
  await apiClient.post('/api/companies/info', body)
}
