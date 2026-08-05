package com.haruon.groupware.adapter.batch.franchiseSync.itemReader.primary;

import com.haruon.groupware.adapter.batch.franchiseSync.itemReader.common.FranchiseSyncItemReader;
import com.haruon.groupware.adapter.mockapi.FranchiseSyncResponse;
import com.haruon.groupware.application.syncRequest.required.ExternalFranchiseDataCollector;
import com.haruon.groupware.application.syncRequest.service.dto.items.DailySalesSyncItem;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;

@StepScope
@Component
@RequiredArgsConstructor
public class DailySalesItemReader extends FranchiseSyncItemReader<DailySalesSyncItem> {

    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");

    private final ExternalFranchiseDataCollector collector;

    @Override
    protected FranchiseSyncResponse<DailySalesSyncItem> collect() {
        return collector.collectDailySales();
    }

    @Override
    protected boolean shouldRead(DailySalesSyncItem item) {
        LocalDate today = LocalDate.now(SEOUL_ZONE);
        return !item.salesDate().isBefore(today.minusDays(7));
    }
}
