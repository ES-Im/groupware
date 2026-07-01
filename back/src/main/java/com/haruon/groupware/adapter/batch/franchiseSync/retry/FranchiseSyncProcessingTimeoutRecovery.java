package com.haruon.groupware.adapter.batch.franchiseSync.retry;

import com.haruon.groupware.application.syncRequest.provided.SyncTaskManager;
import com.haruon.groupware.application.syncRequest.required.FranchiseSyncRequestRepository;
import com.haruon.groupware.domain.sync.FranchiseSyncTask;
import com.haruon.groupware.domain.sync.SyncStatus;
import com.haruon.groupware.domain.sync.SyncTask;
import com.haruon.groupware.domain.sync.SyncType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static com.haruon.groupware.adapter.batch.franchiseSync.common.FranchiseSyncBatchProperties.MAX_TRY_COUNT;

@Component
@RequiredArgsConstructor
public class FranchiseSyncProcessingTimeoutRecovery {

    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");

    private final FranchiseSyncRequestRepository repository;
    private final SyncTaskManager syncTaskManager;

    public int expireProcessingTasks(SyncType type) {
        LocalDateTime now = LocalDateTime.now(SEOUL_ZONE);
        LocalDateTime expiredStartedAt = now.minusMinutes(SyncTask.PROCESSING_TIMEOUT_MINUTES);
        List<FranchiseSyncTask> expiredTasks = repository
                .findByStatusAndTypeAndStartedAtLessThanEqualOrderByIdAsc(
                        SyncStatus.PROCESSING,
                        type,
                        expiredStartedAt
                );

        expiredTasks.forEach(task -> syncTaskManager.expireProcessing(task, now, MAX_TRY_COUNT));

        return expiredTasks.size();
    }
}
