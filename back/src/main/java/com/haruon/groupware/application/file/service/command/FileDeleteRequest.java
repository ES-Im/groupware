package com.haruon.groupware.application.file.service.command;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.jspecify.annotations.Nullable;

public record FileDeleteRequest(
        @Nullable
        Long requesterEmpId,

        @NotNull
        @Positive
        Long domainPkId,

        @NotNull
        @Positive
        Long fileId
) {

    public FileDeleteRequest {
        if(domainPkId == null || fileId == null) throw new RequiredValueMissingException();
    }

    public static FileDeleteRequest toFileDeleteRequest(Long domainPkId, Long fileId) {
        return new FileDeleteRequest(null, domainPkId, fileId);
    }

    public static FileDeleteRequest toFileDeleteRequest(Long requesterEmpId, Long domainPkId, Long fileId) {
        return new FileDeleteRequest(requesterEmpId, domainPkId, fileId);
    }
}
