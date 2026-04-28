package com.haruon.groupware.application.franchise.service.dto;

import lombok.Builder;

import java.time.LocalDate;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Builder
public record DailySalesRequest(

        String externalId,

        LocalDate salesDate,

        Double salesAmount,

        Long orderCount
) {

    public DailySalesRequest {
        requireNonNull(externalId);
        requireNonNull(salesDate);
        requireNonNull(salesAmount);
        requireNonNull(orderCount);

        state(!externalId.isBlank(), "외부식별자는 공백이 될 수 없음");
        state(salesAmount >= 0, "신청 인원은 양수여야 함");
        state(orderCount >= 0, "신청 인원은 양수여야 함");
    }
}
