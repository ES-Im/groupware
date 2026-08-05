package com.haruon.groupware.application.syncRequest.service;

import com.haruon.groupware.application.syncRequest.provided.SyncTaskManager;
import com.haruon.groupware.application.syncRequest.required.FranchiseSyncRequestRepository;
import com.haruon.groupware.domain.sync.FranchiseSyncTask;
import com.haruon.groupware.domain.sync.SyncType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class SyncTaskManagerService implements SyncTaskManager {

    private final FranchiseSyncRequestRepository franchiseSyncRequestRepository;

    @Override
    @Transactional(readOnly = true)
    public Optional<FranchiseSyncTask> find(SyncType type, String externalId, int itemIdx) {
        return franchiseSyncRequestRepository.findByTypeAndExternalIdAndItemIdx(type, externalId, itemIdx);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void start(FranchiseSyncTask request, LocalDateTime startedAt) {
        request.start(startedAt);
        franchiseSyncRequestRepository.save(request);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void complete(FranchiseSyncTask request, LocalDateTime completedAt) {
        request.complete(completedAt);
        franchiseSyncRequestRepository.save(request);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void fail(FranchiseSyncTask request, LocalDateTime failedAt, String errorMessage, int maxFailureCount) {
        request.fail(failedAt, errorMessage, maxFailureCount);
        franchiseSyncRequestRepository.save(request);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void expireProcessing(FranchiseSyncTask request, LocalDateTime current, int maxFailureCount) {
        request.expireProcessing(current, maxFailureCount);
        franchiseSyncRequestRepository.save(request);
    }


}
