package com.haruon.groupware.application.syncRequest.service.dto.items;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.haruon.groupware.application.franchise.service.command.dto.InquiryRequest;
import com.haruon.groupware.domain.franchise.InquiryType;
import jakarta.validation.constraints.*;

import java.time.OffsetDateTime;
import java.time.ZoneId;

import static com.haruon.groupware.domain.shared.RegexpUtil.BUSINESS_NUMBER_PATTERN;
import static com.haruon.groupware.domain.shared.RegexpUtil.BUSINESS_NUMBER_PATTERN_MESSAGE;

public record InquirySyncItem(
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
) implements FranchiseSyncItem {

    public InquiryRequest toRequest() {
        return new InquiryRequest(
                externalId,
                inquirerContact,
                inquiryAt.atZoneSameInstant(ZoneId.of("Asia/Seoul")).toLocalDateTime(),
                inquiryTitle,
                inquiryContent,
                type
        );
    }
}
