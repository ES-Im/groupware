package com.haruon.groupware.application.draft.service.dto;

import lombok.Builder;
import org.jspecify.annotations.Nullable;
import org.springframework.util.Assert;

import java.time.LocalDateTime;

import static io.jsonwebtoken.lang.Assert.state;
import static java.util.Objects.requireNonNull;

@Builder
public record BusinessTripDraftUpdateRequest(

        CommonDraftUpdateRequest param,

        @Nullable
        LocalDateTime startAt,

        @Nullable
        LocalDateTime endAt,

        @Nullable
        String destination,

        @Nullable
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

                if(destination != null) state(!destination.isBlank(), "목적지는 공백이 될 수 없음");
                if(purpose != null) Assert.state(!purpose.isBlank(), "목적은 공백이 될 수 없음");

        }
}
