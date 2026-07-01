package com.haruon.groupware.adapter.batch.franchiseSync.itemReader;

import com.haruon.groupware.adapter.mockapi.FranchiseSyncResponse;
import com.haruon.groupware.application.syncRequest.required.ExternalFranchiseDataCollector;
import com.haruon.groupware.application.syncRequest.service.dto.items.InquirySyncItem;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.stereotype.Component;

@StepScope
@Component
@RequiredArgsConstructor
public class InquiryItemReader extends FranchiseSyncItemReader<InquirySyncItem> {

    private final ExternalFranchiseDataCollector collector;

    @Override
    protected FranchiseSyncResponse<InquirySyncItem> collect() {
        return collector.collectInquiries();
    }
}
