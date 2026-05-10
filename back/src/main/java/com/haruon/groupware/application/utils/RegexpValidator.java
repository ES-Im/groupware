package com.haruon.groupware.application.utils;

import com.haruon.groupware.application.exception.common.InvalidFormatException;
import com.haruon.groupware.domain.shared.RegexpUtil;

import static com.haruon.groupware.application.exception.ErrorCode.INVALID_FORMAT_EXCEPTION;
import static org.springframework.util.Assert.state;

/**
 * application dto에서 들어온 값이 정규식에 맞는지 확인하는 정적 메서드 집합
 */
public class RegexpValidator {

    public static void passwordCheck(String password) {
        if(!password.matches(RegexpUtil.PASSWORD_PATTERN)) throw new InvalidFormatException(INVALID_FORMAT_EXCEPTION, RegexpUtil.PASSWORD_PATTERN_MESSAGE);
    }

    public static void emailCheck(String email) {
        if(!email.matches(RegexpUtil.EMAIL_PATTERN)) throw new InvalidFormatException(INVALID_FORMAT_EXCEPTION, RegexpUtil.PASSWORD_PATTERN_MESSAGE);
    }

    public static void extensionNoCheck(String extensionNo) {
        if(!extensionNo.matches(RegexpUtil.EXTENSION_NO_PATTERN)) throw new InvalidFormatException(INVALID_FORMAT_EXCEPTION, RegexpUtil.PASSWORD_PATTERN_MESSAGE);
    }

    public static void empNoCheck(String empNo) {
        if(!empNo.matches(RegexpUtil.EMP_NO_PATTERN)) throw new InvalidFormatException(INVALID_FORMAT_EXCEPTION, RegexpUtil.PASSWORD_PATTERN_MESSAGE);
    }

    public static void empIdCheck(String empId) {
        if(!empId.matches(RegexpUtil.EMP_ID_PATTERN)) throw new InvalidFormatException(INVALID_FORMAT_EXCEPTION, RegexpUtil.PASSWORD_PATTERN_MESSAGE);
    }

    public static void deptCodeCheck(String deptCode) {
        if(!deptCode.matches(RegexpUtil.DEPT_CODE_PATTERN)) throw new InvalidFormatException(INVALID_FORMAT_EXCEPTION, RegexpUtil.PASSWORD_PATTERN_MESSAGE);
    }

    public static void businessNumberCheck(String businessNumber) {
        state(businessNumber.matches(RegexpUtil.BUSINESS_NUMBER_PATTERN), RegexpUtil.BUSINESS_NUMBER_PATTERN_MESSAGE);
    }

    public static void contactNumberCheck(String contactNumber) {
        state(contactNumber.matches(RegexpUtil.CONTACT_NUMBER_PATTERN), RegexpUtil.CONTACT_NUMBER_PATTERN_MESSAGE);
    }

}
