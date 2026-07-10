import dayjs from 'dayjs'
import { apiClient } from '@/shared/api/client'
import type { CompanyContactUpdateFormValues } from '../model/companyContactUpdateSchema'

/**
 * 회사 대표 연락처 수정(`COMPANY_UPDATE_CONTACT`, `POST /api/companies/contact`, minRole ADMIN).
 *
 * editedAt(필수, `yyyy-MM-dd'T'HH:mm:ss`)은 폼 입력 필드가 아니라 제출 시점 현재 시각을
 * `dayjs().format('YYYY-MM-DDTHH:mm:ss')`로 합성해 자동 주입한다(updateAttendance.ts와 동일 WHY —
 * 서버가 `LocalDateTime`으로 오프셋 없는 로컬 wall-clock을 기대하므로 `toISOString()`은 실제
 * 시각보다 9시간 이전 값을 기록시켜 금지).
 *
 * presentedEmail/presentedExternalNo는 미입력 시 스키마에서 빈 문자열(`''`)로 남을 수 있어
 * (companyContactUpdateSchema는 값을 변형하지 않음), updateAttendance.ts와 동일하게 값이 있을
 * 때만(falsy가 아닐 때만) 요청 바디에 포함한다 — 빈 문자열을 그대로 보내 기존 값을 의도치 않게
 * 지우지 않도록 한다.
 *
 * 성공 시 `204 No Content`(응답 본문 없음) — 호출부가 companyKeys.all을 invalidate해 재조회한다.
 */
export async function updateCompanyContact(values: CompanyContactUpdateFormValues): Promise<void> {
  const body: Record<string, unknown> = {
    editedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
  }
  if (values.presentedEmail) {
    body.presentedEmail = values.presentedEmail
  }
  if (values.presentedExternalNo) {
    body.presentedExternalNo = values.presentedExternalNo
  }
  await apiClient.post('/api/companies/contact', body)
}
