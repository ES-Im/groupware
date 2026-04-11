package com.haruon.groupware.application.draft.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

public record BusinessTripDraftCreateRequest(

        CommonDraftCreateRequest param,

        LocalDateTime startAt,

        LocalDateTime endAt,

        @NotBlank
        String destination,

        @NotBlank
        String purpose

) {
        public BusinessTripDraftCreateRequest {
                requireNonNull(param);
                requireNonNull(startAt);
                requireNonNull(endAt);
                requireNonNull(destination);
                requireNonNull(purpose);
                state(!endAt.isBefore(startAt), "종료시간은 시작시간보다 이를 수 없음");
        }
}
