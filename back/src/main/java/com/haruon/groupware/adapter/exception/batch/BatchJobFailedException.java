package com.haruon.groupware.adapter.exception.batch;

import com.haruon.groupware.adapter.exception.AdapterErrorCode;
import com.haruon.groupware.adapter.exception.AdapterException;

public class BatchJobFailedException extends AdapterException {

    public BatchJobFailedException(String detail) {
        super(AdapterErrorCode.BATCH_JOB_FAILED_EXCEPTION, detail);
    }

}
