package com.haruon.groupware.application.syncRequest.service.dto.items;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;

import java.time.OffsetDateTime;

public record EducationCancellationSyncItem(
        @NotNull
        @PositiveOrZero
        Integer itemIdx,

        @NotBlank
        String externalId,

        @NotBlank
        @Pattern(regexp = "\\d{10}", message = "Mockoon businessNumber는 하이픈 없는 숫자 10자리여야 합니다.")
        String businessNumber,

        @NotBlank
        @Size(max = 50)
        String franchiseName,

        @NotBlank
        @Pattern(regexp = "EDU-\\d{6}-\\d{4}", message = "educationCode는 EDU-yyyyMM-0000 형식이어야 합니다.")
        String educationCode,

        @NotNull
        @JsonFormat(without = JsonFormat.Feature.ADJUST_DATES_TO_CONTEXT_TIME_ZONE)
        OffsetDateTime canceledAt
) {

}
