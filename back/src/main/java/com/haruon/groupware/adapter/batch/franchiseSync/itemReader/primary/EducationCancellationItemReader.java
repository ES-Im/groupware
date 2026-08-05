package com.haruon.groupware.adapter.batch.franchiseSync.itemReader.primary;

import com.haruon.groupware.adapter.batch.franchiseSync.itemReader.common.FranchiseSyncItemReader;
import com.haruon.groupware.adapter.mockapi.FranchiseSyncResponse;
import com.haruon.groupware.application.syncRequest.required.ExternalFranchiseDataCollector;
import com.haruon.groupware.application.syncRequest.service.dto.items.EducationCancellationSyncItem;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.time.ZoneId;

@StepScope
@Component
@RequiredArgsConstructor
public class EducationCancellationItemReader extends FranchiseSyncItemReader<EducationCancellationSyncItem> {

    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");

    private final ExternalFranchiseDataCollector collector;

    @Override
    protected FranchiseSyncResponse<EducationCancellationSyncItem> collect() {
        return collector.collectEducationApplicationCancellations();
    }

    @Override
    protected boolean shouldRead(EducationCancellationSyncItem item) {
        OffsetDateTime now = OffsetDateTime.now(SEOUL_ZONE);
        return !item.canceledAt().isBefore(now.minusHours(48));
    }
}
