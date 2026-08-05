package com.haruon.groupware.adapter.batch.franchiseSync.itemProcessor.retry;

import com.haruon.groupware.application.franchise.service.command.dto.CancellationRequest;
import com.haruon.groupware.application.syncRequest.required.ExternalFranchiseDataCollector;
import com.haruon.groupware.application.syncRequest.service.dto.FranchiseSyncCommand;
import com.haruon.groupware.application.syncRequest.service.dto.items.EducationCancellationSyncItem;
import com.haruon.groupware.domain.sync.FranchiseSyncTask;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EducationCancellationRetryItemProcessor
        extends FranchiseRetryItemProcessor<FranchiseSyncCommand<CancellationRequest>> {

    private final ExternalFranchiseDataCollector collector;

    @Override
    public FranchiseSyncCommand<CancellationRequest> process(FranchiseSyncTask task) {
        EducationCancellationSyncItem item = singleItem(
                collector.collectEducationApplicationCancellations(task.getExternalId(), task.getItemIdx()),
                task
        );

        return new FranchiseSyncCommand<>(
                task,
                task.getFranchise().getId(),
                item.toRequest(task.getFranchise().getId(), educationId(task))
        );
    }
}
