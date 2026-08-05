package com.haruon.groupware.adapter.batch.franchiseSync.itemReader.primary;

import com.haruon.groupware.adapter.batch.franchiseSync.itemReader.common.FranchiseSyncItemReader;
import com.haruon.groupware.adapter.mockapi.FranchiseSyncResponse;
import com.haruon.groupware.application.syncRequest.required.ExternalFranchiseDataCollector;
import com.haruon.groupware.application.syncRequest.service.dto.items.EducationApplicationSyncItem;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.time.ZoneId;

@StepScope
@Component
@RequiredArgsConstructor
public class EducationApplicationItemReader extends FranchiseSyncItemReader<EducationApplicationSyncItem> {

    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");

    private final ExternalFranchiseDataCollector collector;

    @Override
    protected FranchiseSyncResponse<EducationApplicationSyncItem> collect() {
        return collector.collectEducationApplications();
    }

    @Override
    protected boolean shouldRead(EducationApplicationSyncItem item) {
        OffsetDateTime now = OffsetDateTime.now(SEOUL_ZONE);
        return !item.appliedAt().isBefore(now.minusHours(48));
    }
}
