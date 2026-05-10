package com.haruon.groupware.application.exception.franchise;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class FranchiseInquiryNotFoundException extends ApplicationException {
    public FranchiseInquiryNotFoundException() {
        super(ErrorCode.FRANCHISE_INQUIRY_NOT_FOUND_EXCEPTION);
    }
}
