package com.haruon.groupware.adapter.batch.franchiseSync.itemProcessor.primary;

import com.haruon.groupware.adapter.batch.franchiseSync.itemReader.common.FranchiseSyncBatchItem;
import com.haruon.groupware.application.franchise.service.command.dto.InquiryRequest;
import com.haruon.groupware.application.syncRequest.provided.FranchiseSyncProcessor;
import com.haruon.groupware.application.syncRequest.service.dto.FranchiseSyncCommand;
import com.haruon.groupware.application.syncRequest.service.dto.items.InquirySyncItem;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SyncInquiryItemProcessor
        implements ItemProcessor<FranchiseSyncBatchItem<InquirySyncItem>, FranchiseSyncCommand<InquiryRequest>> {

    private final FranchiseSyncProcessor syncProcessor;

    @Override
    public FranchiseSyncCommand<InquiryRequest> process(FranchiseSyncBatchItem<InquirySyncItem> item) {
        return syncProcessor.processForInquiryData(item.endpointPath(), item.item());
    }
}
