package com.haruon.groupware.adapter.batch.franchiseSync.itemProcessor.retry;

import com.haruon.groupware.adapter.mockapi.FranchiseSyncResponse;
import com.haruon.groupware.domain.sync.FranchiseSyncTask;
import org.springframework.batch.item.ItemProcessor;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.function.Function;

public abstract class FranchiseRetryItemProcessor<R>
        implements ItemProcessor<FranchiseSyncTask, R> {

    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");

    protected <T> T singleItem(
            FranchiseSyncResponse<T> response,
            FranchiseSyncTask task,
            Function<T, String> externalIdReader,
            Function<T, Integer> itemIdxReader
    ) {
        return response.items()
                .stream()
                .filter(item -> task.getExternalId().equals(externalIdReader.apply(item)))
                .filter(item -> task.getItemIdx() == itemIdxReader.apply(item))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "Retry 대상 item을 Mock API 응답에서 찾을 수 없습니다. syncTaskId=%d".formatted(task.getId())
                ));
    }

    protected LocalDateTime toLocalDateTime(OffsetDateTime targetTime) {
        return targetTime.atZoneSameInstant(SEOUL_ZONE).toLocalDateTime();
    }

    protected long educationId(FranchiseSyncTask task) {
        if (task.getEducation() == null) {
            throw new IllegalStateException("교육 신청/취소 retry task는 education이 필요합니다. syncTaskId=%d".formatted(task.getId()));
        }

        return task.getEducation().getId();
    }
}
