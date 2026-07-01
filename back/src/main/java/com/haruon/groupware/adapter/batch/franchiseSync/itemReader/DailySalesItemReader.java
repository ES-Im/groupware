package com.haruon.groupware.adapter.batch.franchiseSync.itemReader;

import com.haruon.groupware.adapter.mockapi.FranchiseSyncResponse;
import com.haruon.groupware.application.syncRequest.required.ExternalFranchiseDataCollector;
import com.haruon.groupware.application.syncRequest.service.dto.items.DailySalesSyncItem;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.stereotype.Component;

@StepScope
@Component
@RequiredArgsConstructor
public class DailySalesItemReader extends FranchiseSyncItemReader<DailySalesSyncItem> {

    private final ExternalFranchiseDataCollector collector;

    @Override
    protected FranchiseSyncResponse<DailySalesSyncItem> collect() {
        return collector.collectDailySales();
    }
}
