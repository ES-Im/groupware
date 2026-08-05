package com.haruon.groupware.adapter.batch.franchiseSync.itemProcessor.retry;

import com.haruon.groupware.application.franchise.service.command.dto.DailySalesRequest;
import com.haruon.groupware.application.syncRequest.required.ExternalFranchiseDataCollector;
import com.haruon.groupware.application.syncRequest.service.dto.FranchiseSyncCommand;
import com.haruon.groupware.application.syncRequest.service.dto.items.DailySalesSyncItem;
import com.haruon.groupware.domain.sync.FranchiseSyncTask;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DailySalesRetryItemProcessor
        extends FranchiseRetryItemProcessor<FranchiseSyncCommand<DailySalesRequest>> {

    private final ExternalFranchiseDataCollector collector;

    @Override
    public FranchiseSyncCommand<DailySalesRequest> process(FranchiseSyncTask task) {
        DailySalesSyncItem item = singleItem(
                collector.collectDailySales(task.getExternalId(), task.getItemIdx()),
                task
        );

        return new FranchiseSyncCommand<>(
                task,
                task.getFranchise().getId(),
                item.toRequest()
        );
    }
}
