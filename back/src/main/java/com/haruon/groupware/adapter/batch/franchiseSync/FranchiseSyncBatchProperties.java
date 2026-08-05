package com.haruon.groupware.adapter.batch.franchiseSync;

/**
 * - 청크 + 커서 기반으로 진행
 * 1. read -> ExternalFranchiseDataCollector
 * 2. process -> FranchiseSyncProcessor
 * 3. write -> FranchiseSyncWriter
 */
public final class FranchiseSyncBatchProperties {

    public static final int MAX_TRY_COUNT = 3;

    public static final int CHUNK_SIZE = 10;

    private FranchiseSyncBatchProperties() {
    }

}
