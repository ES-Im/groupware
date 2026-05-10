package com.haruon.groupware.application.franchise.service.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.PositiveValueRequiredException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record ApplicationRequest(

        String externalId,

        Long franchiseId,

        Long appliedCount,

        LocalDateTime appliedAt
) {

    public ApplicationRequest {
        if(externalId == null || franchiseId == null || appliedCount == null || appliedAt == null) throw new RequiredValueMissingException();

        if(externalId.isBlank()) throw new BlankValueNotAllowedException();
        if(appliedCount <= 0) throw new PositiveValueRequiredException();
    }
}
