package com.haruon.groupware.domain.sync;

import lombok.Getter;

@Getter
public enum SyncStatus {
    PENDING,
    PROCESSING,
    RETRY,
    DONE,
    FAILED
}
