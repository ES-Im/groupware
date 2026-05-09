package com.haruon.groupware.application.franchise.service.dto;

import lombok.Builder;

import java.time.LocalDateTime;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Builder
public record ApplicationRequest(

        String externalId,

        Long franchiseId,

        Long appliedCount,

        LocalDateTime appliedAt
) {

    public ApplicationRequest {
        requireNonNull(externalId);
        requireNonNull(appliedCount);
        requireNonNull(appliedAt);
        requireNonNull(franchiseId);

        state(!externalId.isBlank(), "외부식별자는 공백이 될 수 없음");
        state(appliedCount > 0, "신청 인원은 양수여야 함");
    }
}
