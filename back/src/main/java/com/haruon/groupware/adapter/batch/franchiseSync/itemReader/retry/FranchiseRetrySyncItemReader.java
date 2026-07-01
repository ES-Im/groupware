package com.haruon.groupware.adapter.batch.franchiseSync.itemReader.retry;

import com.haruon.groupware.application.syncRequest.required.FranchiseSyncRequestRepository;
import com.haruon.groupware.domain.sync.FranchiseSyncTask;
import com.haruon.groupware.domain.sync.SyncStatus;
import com.haruon.groupware.domain.sync.SyncType;
import org.springframework.batch.item.ItemReader;

import java.util.Iterator;

public abstract class FranchiseRetrySyncItemReader implements ItemReader<FranchiseSyncTask> {

    private final FranchiseSyncRequestRepository repository;
    private Iterator<FranchiseSyncTask> iterator;

    protected FranchiseRetrySyncItemReader(FranchiseSyncRequestRepository repository) {
        this.repository = repository;
    }

    @Override
    public FranchiseSyncTask read() {
        if (iterator == null) {
            this.iterator = repository
                    .findByStatusAndTypeOrderByIdAsc(SyncStatus.RETRY, syncType())
                    .iterator();
        }

        if (!iterator.hasNext()) {
            return null;
        }

        return iterator.next();
    }

    protected abstract SyncType syncType();
}
