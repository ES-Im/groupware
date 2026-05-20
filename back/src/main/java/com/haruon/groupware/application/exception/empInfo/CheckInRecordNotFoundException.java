package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class CheckInRecordNotFoundException extends ApplicationException {
    public CheckInRecordNotFoundException() {
        super(ApplicationErrorCode.CHECKIN_RECORD_NOT_FOUND_EXCEPTION);
    }
}