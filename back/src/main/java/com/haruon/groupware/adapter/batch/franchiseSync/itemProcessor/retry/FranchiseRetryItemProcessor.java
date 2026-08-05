package com.haruon.groupware.adapter.batch.franchiseSync.itemProcessor.retry;

import com.haruon.groupware.adapter.mockapi.FranchiseSyncResponse;
import com.haruon.groupware.application.syncRequest.service.dto.items.FranchiseSyncItem;
import com.haruon.groupware.domain.sync.FranchiseSyncTask;
import org.springframework.batch.item.ItemProcessor;

public abstract class FranchiseRetryItemProcessor<R>
        implements ItemProcessor<FranchiseSyncTask, R> {

    protected <T extends FranchiseSyncItem> T singleItem(
            FranchiseSyncResponse<T> response,
            FranchiseSyncTask task
    ) {
        return response.items()
                .stream()
                .filter(item -> task.getExternalId().equals(item.externalId()))
                .filter(item -> task.getItemIdx() == item.itemIdx())
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "Retry 대상 item을 Mock API 응답에서 찾을 수 없습니다. syncTaskId=%d".formatted(task.getId())
                ));
    }

    protected long educationId(FranchiseSyncTask task) {
        if (task.getEducation() == null) {
            throw new IllegalStateException("교육 신청/취소 retry task는 education이 필요합니다. syncTaskId=%d".formatted(task.getId()));
        }

        return task.getEducation().getId();
    }
}
