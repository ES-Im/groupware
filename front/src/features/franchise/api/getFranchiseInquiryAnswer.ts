import { apiClient } from '@/shared/api/client'
import type { FranchiseInquiryAnswer } from '../model/franchise'

/**
 * 가맹점 문의 답변 조회(`FRANCHISE_INQUIRY_ANSWER_DETAIL`, api-endpoint.md 기능ID
 * `FRANCHISE_INQUIRY_ANSWER_DETAIL` → `GET /api/franchise-inquiries/{inquiryId}/answer`,
 * minRole FRANCHISE 또는 ADMIN).
 *
 * 답변 미작성 시의 응답 형태(Open Q#5)는 스니펫에 문서화돼 있지 않았으나, 실행 단계에서
 * test3456 계정으로 실측한 결과 `204` 빈 바디로 확인됐다(존재하지 않는 inquiryId로도 재현:
 * `GET /api/franchise-inquiries/999999/answer` → 204, FranchiseSalesPage의 204 빈 바디
 * 선례와 동일하게 axios data가 빈 문자열로 온다). 404 케이스는 실측되지 않았지만 방어적으로
 * 함께 처리한다 — 여기서는 응답을 그대로 전달만 하고, 404는 axios가 throw하는 대로 전파해
 * 호출부(소비 훅/컴포넌트)가 두 형태 모두를 "미작성" 빈 상태로 분기 처리한다.
 */
export async function getFranchiseInquiryAnswer(
  inquiryId: number,
): Promise<FranchiseInquiryAnswer> {
  const { data } = await apiClient.get<FranchiseInquiryAnswer>(
    `/api/franchise-inquiries/${inquiryId}/answer`,
  )
  return data
}
