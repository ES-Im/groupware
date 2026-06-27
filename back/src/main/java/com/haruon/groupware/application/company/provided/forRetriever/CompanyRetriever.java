package com.haruon.groupware.application.company.provided.forRetriever;

import com.haruon.groupware.application.company.service.query.dto.CompanyInfoResponse;

/**
 * 회사 정보 조회
 */
public interface CompanyRetriever {

    CompanyInfoResponse retrieveCompanyInfo();
}
