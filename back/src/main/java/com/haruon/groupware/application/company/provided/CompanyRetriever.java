package com.haruon.groupware.application.company.provided;

import com.haruon.groupware.application.company.companyService.dto.response.CompanyInfoResponse;

/**
 * 회사 정보 조회
 */
public interface CompanyRetriever {

    CompanyInfoResponse retrieveCompanyInfo();
}
