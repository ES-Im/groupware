package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class WorkTimeRangeRequiredException extends ApplicationException {
    public WorkTimeRangeRequiredException() {
        super(ErrorCode.WORK_TIME_RANGE_REQUIRED_EXCEPTION);
    }
}