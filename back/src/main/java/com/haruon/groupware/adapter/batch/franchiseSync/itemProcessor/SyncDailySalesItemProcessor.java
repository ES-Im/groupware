package com.haruon.groupware.adapter.batch.franchiseSync.itemProcessor;

import com.haruon.groupware.adapter.batch.franchiseSync.itemReader.FranchiseSyncBatchItem;
import com.haruon.groupware.application.franchise.service.command.dto.DailySalesRequest;
import com.haruon.groupware.application.syncRequest.provided.FranchiseSyncProcessor;
import com.haruon.groupware.application.syncRequest.service.dto.FranchiseSyncCommand;
import com.haruon.groupware.application.syncRequest.service.dto.items.DailySalesSyncItem;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SyncDailySalesItemProcessor
        implements ItemProcessor<FranchiseSyncBatchItem<DailySalesSyncItem>, FranchiseSyncCommand<DailySalesRequest>> {

    private final FranchiseSyncProcessor syncProcessor;

    @Override
    public FranchiseSyncCommand<DailySalesRequest> process(FranchiseSyncBatchItem<DailySalesSyncItem> item) {
        return syncProcessor.processForDailySalesData(item.endpointPath(), item.item());
    }
}
