package com.haruon.groupware.adapter.batch.franchiseSync.itemProcessor.primary;

import com.haruon.groupware.adapter.batch.franchiseSync.itemReader.common.FranchiseSyncBatchItem;
import com.haruon.groupware.application.franchise.service.command.dto.ApplicationRequest;
import com.haruon.groupware.application.syncRequest.provided.FranchiseSyncProcessor;
import com.haruon.groupware.application.syncRequest.service.dto.FranchiseSyncCommand;
import com.haruon.groupware.application.syncRequest.service.dto.items.EducationApplicationSyncItem;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SyncEducationApplicationItemProcessor
        implements ItemProcessor<FranchiseSyncBatchItem<EducationApplicationSyncItem>, FranchiseSyncCommand<ApplicationRequest>> {

    private final FranchiseSyncProcessor syncProcessor;

    @Override
    public FranchiseSyncCommand<ApplicationRequest> process(FranchiseSyncBatchItem<EducationApplicationSyncItem> item) {
        return syncProcessor.processEducationApplyData(item.endpointPath(), item.item());
    }
}
