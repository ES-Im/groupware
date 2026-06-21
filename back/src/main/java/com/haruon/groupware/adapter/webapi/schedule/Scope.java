package com.haruon.groupware.adapter.webapi.schedule;

import lombok.Getter;

@Getter
public enum Scope {
    SINGLE(false), SERIES(true);

    private final boolean isForBulkEdit;
    Scope(boolean isForBulkEdit) {
        this.isForBulkEdit = isForBulkEdit;
    }
}
