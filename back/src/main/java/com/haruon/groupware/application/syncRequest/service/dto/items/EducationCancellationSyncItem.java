package com.haruon.groupware.application.syncRequest.service.dto.items;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.haruon.groupware.application.franchise.service.command.dto.CancellationRequest;
import jakarta.validation.constraints.*;

import java.time.OffsetDateTime;

import static com.haruon.groupware.domain.shared.RegexpUtil.BUSINESS_NUMBER_PATTERN;
import static com.haruon.groupware.domain.shared.RegexpUtil.BUSINESS_NUMBER_PATTERN_MESSAGE;

public record EducationCancellationSyncItem(
        @NotNull
        @PositiveOrZero
        Integer itemIdx,

        @NotBlank
        String externalId,

        @NotBlank
        @Pattern(regexp = BUSINESS_NUMBER_PATTERN, message = BUSINESS_NUMBER_PATTERN_MESSAGE)
        String businessNumber,

        @NotBlank
        @Size(max = 50)
        String franchiseName,

        @NotBlank
        @Pattern(regexp = "EDU-\\d{6}-\\d{4}", message = "educationCode는 EDU-yyyyMM-0000 형식")
        String educationCode,

        @NotNull
        @JsonFormat(without = JsonFormat.Feature.ADJUST_DATES_TO_CONTEXT_TIME_ZONE)
        OffsetDateTime canceledAt
) implements FranchiseSyncItem {

    public CancellationRequest toRequest(long franchiseId, long educationId) {
        return new CancellationRequest(franchiseId, educationId, externalId);
    }
}
