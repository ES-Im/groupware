package com.haruon.groupware.adapter.batch.franchiseSync.itemWriter;

import com.haruon.groupware.application.franchise.service.command.dto.InquiryRequest;
import com.haruon.groupware.application.syncRequest.provided.FranchiseSyncWriter;
import com.haruon.groupware.application.syncRequest.service.dto.FranchiseSyncCommand;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.item.Chunk;
import org.springframework.batch.item.ItemWriter;
import org.springframework.stereotype.Component;

import static com.haruon.groupware.adapter.batch.franchiseSync.common.FranchiseSyncBatchProperties.MAX_TRY_COUNT;

@Component
@RequiredArgsConstructor
public class SyncInquiryItemWriter implements ItemWriter<FranchiseSyncCommand<InquiryRequest>> {

    private final FranchiseSyncWriter syncWriter;

    @Override
    public void write(Chunk<? extends FranchiseSyncCommand<InquiryRequest>> chunk) {
        for (FranchiseSyncCommand<InquiryRequest> command : chunk) {
            syncWriter.writeInquiry(command, MAX_TRY_COUNT);
        }
    }
}
