package com.haruon.groupware.adapter.batch.franchiseSync.itemReader.retry;

import com.haruon.groupware.application.syncRequest.required.FranchiseSyncRequestRepository;
import com.haruon.groupware.domain.sync.SyncType;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.stereotype.Component;

@StepScope
@Component
public class DailySalesRetryItemReader extends FranchiseRetrySyncItemReader {

    public DailySalesRetryItemReader(FranchiseSyncRequestRepository repository) {
        super(repository);
    }

    @Override
    protected SyncType syncType() {
        return SyncType.DAILY_SALES;
    }
}
