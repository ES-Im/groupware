package com.haruon.groupware.application.franchise.service.query.dto;

import com.haruon.groupware.domain.franchise.BusinessStatus;

public record FranchisesResponse(
        Long id,
        String name,
        String address,
        String ownerName,
        String BusinessStatus,
        Long managerEmpId,
        String managerEmpName
) {

    public FranchisesResponse(
            Long id,
            String name,
            String address,
            String ownerName,
            BusinessStatus status,
            Long managerEmpId,
            String managerEmpName) {
        this(
                id, name, address, ownerName,
                status.getDescription(), managerEmpId, managerEmpName
        );
    }
}
