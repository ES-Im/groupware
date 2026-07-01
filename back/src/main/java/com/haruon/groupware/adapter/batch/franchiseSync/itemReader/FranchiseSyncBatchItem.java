package com.haruon.groupware.adapter.batch.franchiseSync.itemReader;

public record FranchiseSyncBatchItem<T>(
        String endpointPath,
        T item
) {
}
