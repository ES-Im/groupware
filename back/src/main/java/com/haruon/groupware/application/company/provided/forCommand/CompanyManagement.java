package com.haruon.groupware.application.company.provided.forCommand;

import com.haruon.groupware.application.company.service.command.dto.CompanyContactUpdateRequest;
import com.haruon.groupware.application.company.service.command.dto.CompanyHomePageUpdateRequest;
import com.haruon.groupware.application.company.service.command.dto.CompanyInfoUpdateRequest;
import com.haruon.groupware.application.company.service.command.dto.CompanyRegisterRequest;

/**
 * 회사 정보 등록, 수정
 */
public interface CompanyManagement {

    long registerCompany(Long adminId, CompanyRegisterRequest request);

    void updateCompanyInfo(Long adminId, CompanyInfoUpdateRequest request);

    void updatePresentedContact(Long adminId, CompanyContactUpdateRequest request);

    void updateHomePageURL(Long adminId, CompanyHomePageUpdateRequest request);
}
