package com.haruon.groupware.application.syncRequest.required;

import com.haruon.groupware.domain.sync.FranchiseSyncTask;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface FranchiseSyncRequestRepository extends Repository<FranchiseSyncTask, Long> {

    FranchiseSyncTask save(FranchiseSyncTask franchiseSyncTask);

    Optional<FranchiseSyncTask> findById(Long id);
}
