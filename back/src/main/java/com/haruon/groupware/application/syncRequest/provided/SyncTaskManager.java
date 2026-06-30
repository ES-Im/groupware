package com.haruon.groupware.application.syncRequest.provided;

import com.haruon.groupware.domain.franchise.Education;
import com.haruon.groupware.domain.franchise.Franchise;
import com.haruon.groupware.domain.sync.FranchiseSyncTask;
import com.haruon.groupware.domain.sync.SyncType;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

/**
 * FranchiseSyncTask(외부 API 데이터 저장 로그성 엔티티) 생성과 상태 전이를 처리하는 Port.
 */
public interface SyncTaskManager {

    FranchiseSyncTask create(
            SyncType type,
            String externalId,
            int itemIdx,
            String endpointPath,
            Franchise franchise,
            @Nullable Education education
    );

    void start(FranchiseSyncTask request, LocalDateTime startedAt);

    void complete(FranchiseSyncTask request, LocalDateTime completedAt);

    void fail(
            FranchiseSyncTask request,
            LocalDateTime failedAt,
            String errorMessage,
            int maxFailureCount
    );

    void expireProcessing(FranchiseSyncTask request, LocalDateTime current, int maxFailureCount);
}
