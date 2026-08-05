package com.haruon.groupware.application.syncRequest.service.dto.items;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.haruon.groupware.application.franchise.service.command.dto.ApplicationRequest;
import jakarta.validation.constraints.*;

import java.time.OffsetDateTime;
import java.time.ZoneId;

import static com.haruon.groupware.domain.shared.RegexpUtil.BUSINESS_NUMBER_PATTERN;
import static com.haruon.groupware.domain.shared.RegexpUtil.BUSINESS_NUMBER_PATTERN_MESSAGE;

public record EducationApplicationSyncItem(
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
        @Positive
        Long appliedCount,

        @NotNull
        @JsonFormat(without = JsonFormat.Feature.ADJUST_DATES_TO_CONTEXT_TIME_ZONE)
        OffsetDateTime appliedAt
) implements FranchiseSyncItem {

    public ApplicationRequest toRequest(long franchiseId, long educationId) {
        return new ApplicationRequest(
                externalId,
                franchiseId,
                educationId,
                appliedCount,
                appliedAt.atZoneSameInstant(ZoneId.of("Asia/Seoul")).toLocalDateTime()
        );
    }
}
