import dayjs from 'dayjs'
import { apiClient } from '@/shared/api/client'
import type { CompanyHomePageUpdateFormValues } from '../model/companyHomePageUpdateSchema'

/**
 * 회사 홈페이지 URL 수정(`COMPANY_UPDATE_HOME_PAGE_URL`, `POST /api/companies/home-page-url`, ADMIN 전용).
 *
 * editedAt은 폼 입력값이 아니라 제출 시점 현재 시각을 `yyyy-MM-dd'T'HH:mm:ss`로 이 함수 내부에서
 * 자동 주입한다(§ROADMAP "editedAt 자동 주입" 결정 — 호출부는 homePageURL만 전달).
 * 성공 시 `204 No Content`(응답 본문 없음) — 호출부(useUpdateCompanyHomePageURLMutation)가
 * companyKeys.all을 invalidate해 조회 화면을 재조회한다.
 */
export async function updateCompanyHomePageURL(
  payload: CompanyHomePageUpdateFormValues,
): Promise<void> {
  await apiClient.post('/api/companies/home-page-url', {
    ...payload,
    editedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
  })
}
