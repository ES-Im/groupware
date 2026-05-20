package com.haruon.groupware.application.exception.franchise;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class FranchiseDailySalesNotFoundException extends ApplicationException {
    public FranchiseDailySalesNotFoundException() {
        super(ApplicationErrorCode.FRANCHISE_DAILY_SALES_NOT_FOUND_EXCEPTION);
    }
}