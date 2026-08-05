package com.haruon.groupware.adapter.batch.franchiseSync.itemProcessor.retry;

import com.haruon.groupware.application.franchise.service.command.dto.ApplicationRequest;
import com.haruon.groupware.application.syncRequest.required.ExternalFranchiseDataCollector;
import com.haruon.groupware.application.syncRequest.service.dto.FranchiseSyncCommand;
import com.haruon.groupware.application.syncRequest.service.dto.items.EducationApplicationSyncItem;
import com.haruon.groupware.domain.sync.FranchiseSyncTask;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EducationApplicationRetryItemProcessor
        extends FranchiseRetryItemProcessor<FranchiseSyncCommand<ApplicationRequest>> {

    private final ExternalFranchiseDataCollector collector;

    @Override
    public FranchiseSyncCommand<ApplicationRequest> process(FranchiseSyncTask task) {
        EducationApplicationSyncItem item = singleItem(
                collector.collectEducationApplications(task.getExternalId(), task.getItemIdx()),
                task
        );

        return new FranchiseSyncCommand<>(
                task,
                task.getFranchise().getId(),
                item.toRequest(task.getFranchise().getId(), educationId(task))
        );
    }
}
