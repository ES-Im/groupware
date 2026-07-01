package com.haruon.groupware.adapter.batch.franchiseSync.itemReader;

import com.haruon.groupware.adapter.mockapi.FranchiseSyncResponse;
import com.haruon.groupware.application.syncRequest.required.ExternalFranchiseDataCollector;
import com.haruon.groupware.application.syncRequest.service.dto.items.EducationApplicationSyncItem;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.stereotype.Component;

@StepScope
@Component
@RequiredArgsConstructor
public class EducationApplicationItemReader extends FranchiseSyncItemReader<EducationApplicationSyncItem> {

    private final ExternalFranchiseDataCollector collector;

    @Override
    protected FranchiseSyncResponse<EducationApplicationSyncItem> collect() {
        return collector.collectEducationApplications();
    }
}
