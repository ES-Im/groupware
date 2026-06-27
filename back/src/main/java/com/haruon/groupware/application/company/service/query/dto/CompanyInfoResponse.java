package com.haruon.groupware.application.company.service.query.dto;

import com.haruon.groupware.domain.Company;

import java.time.LocalDateTime;

public record CompanyInfoResponse(
        Long companyId,
        String companyName,
        String location,
        String presentedEmail,
        String presentedExternalNo,
        String ownerName,
        String homePageURL,
        LocalDateTime editedAt
) {

    public static CompanyInfoResponse of(Company company) {
        return new CompanyInfoResponse(
                company.getId(),
                company.getCompanyName(),
                company.getLocation(),
                company.getPresentedEmail().email(),
                company.getPresentedExternalNo(),
                company.getOwnerName(),
                company.getHomePageURL(),
                company.getEditedAt()
        );
    }
}
