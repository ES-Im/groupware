package com.haruon.groupware.application.draft.service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.Set;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Builder
public record BusinessTripDraftCreateRequest(

        CommonDraftCreateRequest param,

        LocalDateTime startAt,

        LocalDateTime endAt,

        @NotBlank
        String destination,

        @NotBlank
        String purpose,

        @Nullable
        Set<Long> participantIds

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
