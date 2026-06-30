package com.haruon.groupware.application.syncRequest.service.dto.items;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record DailySalesSyncItem(
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
        LocalDate salesDate,

        @NotNull
        @PositiveOrZero
        Long salesAmount,

        @NotNull
        @PositiveOrZero
        Long orderCount
) {

}
