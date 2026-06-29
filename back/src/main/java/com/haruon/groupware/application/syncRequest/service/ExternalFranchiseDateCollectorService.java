package com.haruon.groupware.application.syncRequest.service;

import com.haruon.groupware.application.syncRequest.provided.ExternalFranchiseDataCollector;
import com.haruon.groupware.application.syncRequest.service.dto.*;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDateTime;

//todo
@Validated
public class ExternalFranchiseDateCollectorService implements ExternalFranchiseDataCollector {
    @Override
    public FranchiseSyncResponse<FranchiseExternalDailySalesRequest> collectDailySales() {
        return null;
    }

    @Override
    public FranchiseSyncResponse<FranchiseInquiryRequest> collectInquiries() {
        return null;
    }

    @Override
    public FranchiseSyncResponse<EducationApplicationRequest> collectEducationApplications() {
        return null;
    }

    @Override
    public FranchiseSyncResponse<EducationApplyCancellationRequest> collectEducationApplicationCancellations() {
        return null;
    }

    @Override
    public void start(Long syncRequestId, LocalDateTime startedAt) {

    }

    @Override
    public void complete(Long syncRequestId, LocalDateTime completedAt) {

    }

    @Override
    public void fail(Long syncRequestId, LocalDateTime failedAt, String errorMessage, int maxFailureCount) {

    }

    @Override
    public void expireProcessing(LocalDateTime current, int maxFailureCount) {

    }
}
