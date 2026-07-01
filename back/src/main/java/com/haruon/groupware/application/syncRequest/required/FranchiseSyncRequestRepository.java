package com.haruon.groupware.application.syncRequest.required;

import com.haruon.groupware.domain.sync.FranchiseSyncTask;
import com.haruon.groupware.domain.sync.SyncStatus;
import com.haruon.groupware.domain.sync.SyncType;
import org.springframework.data.repository.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface FranchiseSyncRequestRepository extends Repository<FranchiseSyncTask, Long> {

    FranchiseSyncTask save(FranchiseSyncTask franchiseSyncTask);

    Optional<FranchiseSyncTask> findById(Long id);

    List<FranchiseSyncTask> findByStatusAndTypeOrderByIdAsc(SyncStatus status, SyncType type);

    List<FranchiseSyncTask> findByStatusAndTypeAndStartedAtLessThanEqualOrderByIdAsc(
            SyncStatus status,
            SyncType type,
            LocalDateTime startedAt
    );
}
