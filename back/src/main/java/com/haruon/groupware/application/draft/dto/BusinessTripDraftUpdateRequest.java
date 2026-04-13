package com.haruon.groupware.application.draft.dto;

import jakarta.validation.constraints.NotBlank;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

import static io.jsonwebtoken.lang.Assert.state;
import static java.util.Objects.requireNonNull;

public record BusinessTripDraftUpdateRequest(

        CommonDraftUpdateRequest param,

        @Nullable
        LocalDateTime startAt,

        @Nullable
        LocalDateTime endAt,

        @Nullable
        @NotBlank
        String destination,

        @Nullable
        @NotBlank
        String purpose

) {
        public BusinessTripDraftUpdateRequest {
                requireNonNull(param, "기안서 기본 정보 필수");
                state(param.isChangeCommonField() ||
                                startAt != null ||
                                endAt != null ||
                                destination != null ||
                                purpose != null,
                        "변경내용이 없음");
        }
}
