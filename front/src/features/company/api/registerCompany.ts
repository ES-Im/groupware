import dayjs from 'dayjs'
import { apiClient } from '@/shared/api/client'
import type { CompanyRegisterFormValues } from '../model/companyRegisterSchema'

/**
 * 회사 정보 최초 등록(`COMPANY_REGISTER`, api-endpoint.md 기능ID `COMPANY_REGISTER` →
 * `POST /api/companies/new`, minRole ADMIN).
 *
 * `editedAt`은 companyRegisterSchema에 없는 필드다(폼 입력값이 아님) — 이 함수가 호출 시점의
 * 클라이언트 현재 시각을 `dayjs().format('YYYY-MM-DDTHH:mm:ss')`(오프셋 없는 로컬 wall-clock)로
 * 합성해 요청 바디에 동봉한다. 서버가 `LocalDateTime`으로 파싱하므로 `toISOString()`(UTC `...Z`)을
 * 쓰면 안 된다(updateAttendanceSchema.ts의 동일 컨벤션 참조).
 *
 * 성공 시 `204 No Content`(response-body.adoc 실측, 응답 본문 없음).
 */
export async function registerCompany(payload: CompanyRegisterFormValues): Promise<void> {
  await apiClient.post('/api/companies/new', {
    ...payload,
    editedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
  })
}
