package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class CheckInRecordNotFoundException extends ApplicationException {
    public CheckInRecordNotFoundException() {
        super(ErrorCode.CHECKIN_RECORD_NOT_FOUND_EXCEPTION);
    }
}