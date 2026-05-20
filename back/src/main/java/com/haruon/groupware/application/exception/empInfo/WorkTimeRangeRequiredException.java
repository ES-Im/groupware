package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class WorkTimeRangeRequiredException extends ApplicationException {
    public WorkTimeRangeRequiredException() {
        super(ApplicationErrorCode.WORK_TIME_RANGE_REQUIRED_EXCEPTION);
    }
}