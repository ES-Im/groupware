package com.haruon.groupware.application.syncRequest.service.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.haruon.groupware.domain.sync.SyncType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.List;

public record FranchiseSyncResponse<T>(
        @NotBlank
        String requestId,

        @NotBlank
        String source,

        @NotNull
        SyncType syncType,

        @NotBlank
        String endpointPath,

        @NotNull
        @JsonFormat(without = JsonFormat.Feature.ADJUST_DATES_TO_CONTEXT_TIME_ZONE)
        OffsetDateTime generatedAt,

        @NotEmpty
        List<@Valid T> items
) {
}
