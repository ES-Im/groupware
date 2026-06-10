package com.haruon.groupware.application.draft.service.command.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import jakarta.validation.constraints.NotBlank;

public record DraftRejectRequest(
        @NotBlank String reason
) {
    public DraftRejectRequest {
        if (reason == null) throw new RequiredValueMissingException();
        if (reason.isBlank()) throw new BlankValueNotAllowedException();
    }
}
