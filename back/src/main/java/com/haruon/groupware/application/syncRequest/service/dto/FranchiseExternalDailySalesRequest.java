package com.haruon.groupware.application.syncRequest.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record FranchiseExternalDailySalesRequest(
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
        Long salesAmount,

        @NotNull
        Long orderCount
) {

}
