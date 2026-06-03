package com.haruon.groupware.application.company.provided;

import com.haruon.groupware.application.company.companyService.dto.request.CompanyContactUpdateRequest;
import com.haruon.groupware.application.company.companyService.dto.request.CompanyHomePageUpdateRequest;
import com.haruon.groupware.application.company.companyService.dto.request.CompanyInfoUpdateRequest;
import com.haruon.groupware.application.company.companyService.dto.request.CompanyRegisterRequest;

/**
 * 회사 정보 등록, 수정
 */
public interface CompanyManagement {

    long registerCompany(Long adminId, CompanyRegisterRequest request);

    void updateCompanyInfo(Long adminId, CompanyInfoUpdateRequest request);

    void updatePresentedContact(Long adminId, CompanyContactUpdateRequest request);

    void updateHomePageURL(Long adminId, CompanyHomePageUpdateRequest request);
}
