package com.haruon.groupware.application.syncRequest.service.dto.items;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.haruon.groupware.domain.franchise.InquiryType;
import jakarta.validation.constraints.*;

import java.time.OffsetDateTime;

public record InquirySyncItem(
        @NotNull
        @PositiveOrZero
        Integer itemIdx,

        @NotBlank
        String externalId,

        @NotBlank
        @Pattern(regexp = "\\d{10}", message = "외부 businessNumber는 하이픈 없는 숫자 10자리여야 합니다.")
        String businessNumber,

        @NotBlank
        @Size(max = 50)
        String franchiseName,

        @NotNull
        @JsonFormat(without = JsonFormat.Feature.ADJUST_DATES_TO_CONTEXT_TIME_ZONE)
        OffsetDateTime inquiryAt,

        @NotBlank
        @Size(max = 50)
        String inquirerContact,

        @NotBlank
        @Size(max = 200)
        String inquiryTitle,

        @NotBlank
        @Size(max = 1000)
        String inquiryContent,

        @NotNull
        @JsonProperty("type")
        InquiryType type
) {



}
