package com.haruon.groupware.application.syncRequest.service.dto.items;

import com.haruon.groupware.application.franchise.service.command.dto.DailySalesRequest;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

import static com.haruon.groupware.domain.shared.RegexpUtil.BUSINESS_NUMBER_PATTERN;
import static com.haruon.groupware.domain.shared.RegexpUtil.BUSINESS_NUMBER_PATTERN_MESSAGE;

public record DailySalesSyncItem(
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
        LocalDate salesDate,

        @NotNull
        Long salesAmount,

        @NotNull
        Long orderCount
) implements FranchiseSyncItem {

    public DailySalesRequest toRequest() {
        return new DailySalesRequest(externalId, salesDate, salesAmount, orderCount);
    }
}
