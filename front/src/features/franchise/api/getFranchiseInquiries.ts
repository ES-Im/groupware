import { apiClient } from '@/shared/api/client'
import type { FranchiseInquiriesPage } from '../model/franchise'

/**
 * 문의 목록 조회(`FRANCHISE_INQUIRY_LIST`, api-endpoint.md →
 * `GET /api/franchise-inquiries`, minRole FRANCHISE 또는 ADMIN).
 *
 * isAnswered/assignedManagerId/keyword/from/to/page/size 쿼리 파라미터는 모두 선택값이다
 * (query-parameters.adoc 실측). from/to는 `yyyy-MM-dd` 문자열. 값이 없는 파라미터는
 * 쿼리스트링 자체에서 생략되도록 params 객체에 조건부로만 채운다(`getFranchises` 동형).
 * isAnswered는 boolean이라 false도 유효한 필터 값이므로 truthy가 아닌 `!= null`로 판별한다.
 */
export async function getFranchiseInquiries(params?: {
  isAnswered?: boolean
  assignedManagerId?: number
  keyword?: string
  from?: string
  to?: string
  page?: number
  size?: number
}): Promise<FranchiseInquiriesPage> {
  const query: Record<string, string | number | boolean> = {}
  if (params?.isAnswered != null) {
    query.isAnswered = params.isAnswered
  }
  if (params?.assignedManagerId != null) {
    query.assignedManagerId = params.assignedManagerId
  }
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.from) {
    query.from = params.from
  }
  if (params?.to) {
    query.to = params.to
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<FranchiseInquiriesPage>('/api/franchise-inquiries', {
    params: query,
  })
  return data
}
