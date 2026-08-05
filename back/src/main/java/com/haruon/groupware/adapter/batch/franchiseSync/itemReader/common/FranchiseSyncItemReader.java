package com.haruon.groupware.adapter.batch.franchiseSync.itemReader.common;

import com.haruon.groupware.adapter.mockapi.FranchiseSyncResponse;
import org.springframework.batch.item.ItemReader;

import java.util.Iterator;

public abstract class FranchiseSyncItemReader<T> implements ItemReader<FranchiseSyncBatchItem<T>> {

    private Iterator<T> iterator;
    private String endpointPath;

    @Override
    public FranchiseSyncBatchItem<T> read() {
        if (iterator == null) {
            FranchiseSyncResponse<T> response = collect();
            this.endpointPath = response.endpointPath();
            this.iterator = response.items().stream()
                    .filter(this::shouldRead)
                    .iterator();
        }

        if (!iterator.hasNext()) {
            return null;
        }

        return new FranchiseSyncBatchItem<T>(endpointPath, iterator.next());
    }

    protected abstract FranchiseSyncResponse<T> collect();

    protected boolean shouldRead(T item) {
        return true;
    }

}
