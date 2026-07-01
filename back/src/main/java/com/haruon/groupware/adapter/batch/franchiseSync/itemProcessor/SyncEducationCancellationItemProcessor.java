package com.haruon.groupware.adapter.batch.franchiseSync.itemProcessor;

import com.haruon.groupware.adapter.batch.franchiseSync.itemReader.FranchiseSyncBatchItem;
import com.haruon.groupware.application.franchise.service.command.dto.CancellationRequest;
import com.haruon.groupware.application.syncRequest.provided.FranchiseSyncProcessor;
import com.haruon.groupware.application.syncRequest.service.dto.FranchiseSyncCommand;
import com.haruon.groupware.application.syncRequest.service.dto.items.EducationCancellationSyncItem;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SyncEducationCancellationItemProcessor
        implements ItemProcessor<FranchiseSyncBatchItem<EducationCancellationSyncItem>, FranchiseSyncCommand<CancellationRequest>> {

    private final FranchiseSyncProcessor syncProcessor;

    @Override
    public FranchiseSyncCommand<CancellationRequest> process(FranchiseSyncBatchItem<EducationCancellationSyncItem> item) {
        return syncProcessor.processEducationCancelData(item.endpointPath(), item.item());
    }
}
