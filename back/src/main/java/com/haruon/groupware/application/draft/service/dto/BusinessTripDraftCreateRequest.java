package com.haruon.groupware.application.draft.service.dto;

import jakarta.validation.constraints.NotBlank;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

public record BusinessTripDraftCreateRequest(

        CommonDraftCreateRequest param,

        LocalDateTime startAt,

        LocalDateTime endAt,

        @NotBlank
        String destination,

        @NotBlank
        String purpose,

        @Nullable
        List<Long> participantIds

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
