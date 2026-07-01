package com.haruon.groupware.adapter.batch.franchiseSync.itemProcessor.retry;

import com.haruon.groupware.application.franchise.service.command.dto.InquiryRequest;
import com.haruon.groupware.application.syncRequest.required.ExternalFranchiseDataCollector;
import com.haruon.groupware.application.syncRequest.service.dto.FranchiseSyncCommand;
import com.haruon.groupware.application.syncRequest.service.dto.items.InquirySyncItem;
import com.haruon.groupware.domain.sync.FranchiseSyncTask;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class InquiryRetryItemProcessor
        extends FranchiseRetryItemProcessor<FranchiseSyncCommand<InquiryRequest>> {

    private final ExternalFranchiseDataCollector collector;

    @Override
    public FranchiseSyncCommand<InquiryRequest> process(FranchiseSyncTask task) {
        InquirySyncItem item = singleItem(
                collector.collectInquiries(task.getExternalId(), task.getItemIdx()),
                task,
                InquirySyncItem::externalId,
                InquirySyncItem::itemIdx
        );

        return new FranchiseSyncCommand<>(
                task,
                task.getFranchise().getId(),
                new InquiryRequest(
                        item.externalId(),
                        item.inquirerContact(),
                        toLocalDateTime(item.inquiryAt()),
                        item.inquiryTitle(),
                        item.inquiryContent(),
                        item.type()
                )
        );
    }
}
