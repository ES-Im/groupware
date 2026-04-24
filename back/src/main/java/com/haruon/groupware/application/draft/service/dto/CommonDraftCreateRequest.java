package com.haruon.groupware.application.draft.service.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Builder
public record CommonDraftCreateRequest(
        Long empId,

        @NotBlank
        @Max(100)
        String title,

        @NotBlank
        @Max(500)
        String content,

        @Nullable List<ApproversRequest> approvers,

        @Nullable LocalDateTime submittedAt
) {

    public CommonDraftCreateRequest {
        requireNonNull(empId);
        requireNonNull(title);
        requireNonNull(content);

        if(submittedAt != null) {
            state(approvers != null && !approvers.isEmpty(),
                    "상신시, 결제선 설정 필수");
        }
    }



}
