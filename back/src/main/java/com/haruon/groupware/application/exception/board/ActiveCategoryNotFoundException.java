package com.haruon.groupware.application.exception.board;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class ActiveCategoryNotFoundException extends ApplicationException {
    public ActiveCategoryNotFoundException() {
        super(ApplicationErrorCode.ACTIVE_CATEGORY_NOT_FOUND_EXCEPTION);
    }
}