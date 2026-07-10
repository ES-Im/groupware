/**
 * 회사 정보 조회(`COMPANY_INFO`, GET /api/companies) 응답 타입.
 * 스니펫 부재(back/build/generated-snippets에 COMPANY_INFO 없음)로
 * back/src/main/java/com/haruon/groupware/application/company/service/query/dto/CompanyInfoResponse.java
 * 소스 대조 기준(추측 금지).
 */
export interface CompanyInfoResponse {
  companyId: number
  companyName: string
  location: string
  presentedEmail: string
  presentedExternalNo: string
  ownerName: string
  homePageURL: string
  editedAt: string
}
