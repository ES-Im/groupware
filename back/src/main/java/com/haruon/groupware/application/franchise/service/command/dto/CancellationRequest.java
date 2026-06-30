package com.haruon.groupware.application.franchise.service.command.dto;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;

public record CancellationRequest(
        Long franchiseId,
        Long educationId,
        String externalId
) {
    public CancellationRequest {
        if(externalId == null || franchiseId == null || educationId == null) throw new RequiredValueMissingException();
    }
}
