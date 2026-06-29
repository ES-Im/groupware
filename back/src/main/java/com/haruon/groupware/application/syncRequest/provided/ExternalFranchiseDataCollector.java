package com.haruon.groupware.application.syncRequest.provided;

import com.haruon.groupware.application.syncRequest.service.dto.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDateTime;

@Validated
public interface ExternalFranchiseDataCollector {

    @NotNull @Valid
    FranchiseSyncResponse<FranchiseExternalDailySalesRequest> collectDailySales();

    @NotNull @Valid
    FranchiseSyncResponse<FranchiseInquiryRequest> collectInquiries();

    @NotNull @Valid
    FranchiseSyncResponse<EducationApplicationRequest> collectEducationApplications();

    @NotNull @Valid
    FranchiseSyncResponse<EducationApplyCancellationRequest> collectEducationApplicationCancellations();

    void start(@NotNull @Positive Long syncRequestId, @NotNull LocalDateTime startedAt);

    void complete(@NotNull @Positive Long syncRequestId, @NotNull LocalDateTime completedAt);

    void fail(
            @NotNull @Positive Long syncRequestId,
            @NotNull LocalDateTime failedAt,
            @NotBlank String errorMessage,
            @Positive int maxFailureCount
    );

    void expireProcessing(@NotNull LocalDateTime current, @Positive int maxFailureCount);

}
