package com.haruon.groupware.application.utils;

import com.haruon.groupware.application.exception.common.InvalidFormatException;

import static com.haruon.groupware.application.exception.ApplicationErrorCode.INVALID_FORMAT_EXCEPTION;
import static com.haruon.groupware.domain.shared.RegexpUtil.*;

/**
 * application dto에서 들어온 값이 정규식에 맞는지 확인하는 정적 메서드 집합
 */
public class RegexpValidator {

    public static void passwordCheck(String password) {
        if(!password.matches(PASSWORD_PATTERN))
            throw new InvalidFormatException(
                    INVALID_FORMAT_EXCEPTION,
                    PASSWORD_PATTERN_MESSAGE
            );
    }

    public static void emailCheck(String email) {
        if(!email.matches(EMAIL_PATTERN))
            throw new InvalidFormatException(
                    INVALID_FORMAT_EXCEPTION,
                    EMAIL_PATTERN_MESSAGE
            );
    }

    public static void extensionNoCheck(String extensionNo) {
        if(!extensionNo.matches(EXTENSION_NO_PATTERN))
            throw new InvalidFormatException(
                    INVALID_FORMAT_EXCEPTION,
                    EXTENSION_NO_PATTERN_MESSAGE
            );
    }

    public static void empNoCheck(String empNo) {
        if(!empNo.matches(EMP_NO_PATTERN))
            throw new InvalidFormatException(
                    INVALID_FORMAT_EXCEPTION,
                    EMP_NO_PATTERN_MESSAGE
            );
    }

    public static void empIdCheck(String empId) {
        if(!empId.matches(EMP_ID_PATTERN))
            throw new InvalidFormatException(
                    INVALID_FORMAT_EXCEPTION,
                    EMP_ID_PATTERN_MESSAGE
            );
    }

    public static void deptCodeCheck(String deptCode) {
        if(!deptCode.matches(DEPT_CODE_PATTERN))
            throw new InvalidFormatException(
                    INVALID_FORMAT_EXCEPTION,
                    DEPT_CODE_PATTERN_MESSAGE
            );
    }

    public static void businessNumberCheck(String businessNumber) {
        if(!businessNumber.matches(BUSINESS_NUMBER_PATTERN)) {
            throw new InvalidFormatException(
                    INVALID_FORMAT_EXCEPTION,
                    BUSINESS_NUMBER_PATTERN_MESSAGE
            );
        }
    }

    public static void contactNumberCheck(String contactNumber) {
        if(!contactNumber.matches(CONTACT_NUMBER_PATTERN))
            throw new InvalidFormatException(
                    INVALID_FORMAT_EXCEPTION,
                    CONTACT_NUMBER_PATTERN_MESSAGE
            );
    }

}
