package com.haruon.groupware.application.draft.service.command.dto;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record AddCirculationsRequest(
        @NotEmpty List<Long> empIds
) {
    public AddCirculationsRequest {
        if (empIds == null || empIds.isEmpty()) throw new RequiredValueMissingException();
    }
}
