package com.haruon.groupware.adapter.batch.franchiseSync.itemReader.common;

public record FranchiseSyncBatchItem<T>(
        String endpointPath,
        T item
) {
}
