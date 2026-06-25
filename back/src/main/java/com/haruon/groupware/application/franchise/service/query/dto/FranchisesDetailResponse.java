package com.haruon.groupware.application.franchise.service.query.dto;

import com.haruon.groupware.domain.franchise.BusinessStatus;

public record FranchisesDetailResponse(
        Long id,
        String name,
        String address,
        String ownerName,
        String businessNumber,
        String contactNumber,
        String contactEmail,
        String BusinessStatus,
        String memo,
        Long managerEmpId,
        String managerEmpName
) {

    public FranchisesDetailResponse(
            Long id,
            String name,
            String address,
            String ownerName,
            String businessNumber,
            String contactNumber,
            String contactEmail,
            BusinessStatus status,
            String memo,
            Long managerEmpId,
            String managerEmpName) {
        this(
                id, name, address, ownerName, businessNumber, contactNumber, contactEmail,
                status.getDescription(), memo, managerEmpId, managerEmpName
        );
    }
}
