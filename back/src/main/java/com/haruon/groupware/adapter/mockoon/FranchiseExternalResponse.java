package com.haruon.groupware.adapter.mockoon;

//todo 타 포트 externalKey로 들어오는 가맹점 관련 교육신청/매출액일일집계/질의 dummy data만들고 메시지큐로 자동적용토록 구현
public class FranchiseExternalResponse {
}

/* mockoon api server
    문의 등록/import: POST /api/franchises/{franchiseId}/inquiries

    교육 신청 등록: POST /api/franchise-educations/{educationId}/applications
    교육 신청 취소: DELETE /api/franchise-educations/{educationId}/applications/{externalId}?franchiseId=...

    일 매출 등록/import: POST 또는 PUT /api/franchises/{franchiseId}/sales/dates/{date}
 */