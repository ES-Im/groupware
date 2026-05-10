package com.haruon.groupware.application.exception.franchise;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class FranchiseDailySalesNotFoundException extends ApplicationException {
    public FranchiseDailySalesNotFoundException() {
        super(ErrorCode.FRANCHISE_DAILY_SALES_NOT_FOUND_EXCEPTION);
    }
}