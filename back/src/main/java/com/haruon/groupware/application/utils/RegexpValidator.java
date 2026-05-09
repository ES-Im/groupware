package com.haruon.groupware.application.utils;

import com.haruon.groupware.domain.shared.RegexpUtil;

import static org.springframework.util.Assert.state;

/**
 * application dto에서 들어온 값이 정규식에 맞는지 확인하는 정적 메서드 집합
 */
public class RegexpValidator {

    public static void passwordCheck(String password) {
        state(password.matches(RegexpUtil.PASSWORD_PATTERN), RegexpUtil.PASSWORD_PATTERN_MESSAGE);
    }

    public static void emailCheck(String email) {
        state(email.matches(RegexpUtil.EMAIL_PATTERN), RegexpUtil.EMAIL_PATTERN_MESSAGE);
    }

    public static void extensionNoCheck(String extensionNo) {
        state(extensionNo.matches(RegexpUtil.EXTENSION_NO_PATTERN), RegexpUtil.EXTENSION_NO_PATTERN_MESSAGE);
    }

    public static void empNoCheck(String empNo) {
        state(empNo.matches(RegexpUtil.EMP_NO_PATTERN), RegexpUtil.EMP_NO_PATTERN_MESSAGE);
    }

    public static void empIdCheck(String empId) {
        state(empId.matches(RegexpUtil.EMP_ID_PATTERN), RegexpUtil.EMP_ID_PATTERN_MESSAGE);
    }

    public static void deptCodeCheck(String deptCode) {
        state(deptCode.matches(RegexpUtil.DEPT_CODE_PATTERN), RegexpUtil.DEPT_CODE_PATTERN_MESSAGE);
    }

    public static void businessNumberCheck(String businessNumber) {
        state(businessNumber.matches(RegexpUtil.BUSINESS_NUMBER_PATTERN), RegexpUtil.BUSINESS_NUMBER_PATTERN_MESSAGE);
    }

    public static void contactNumberCheck(String contactNumber) {
        state(contactNumber.matches(RegexpUtil.CONTACT_NUMBER_PATTERN), RegexpUtil.CONTACT_NUMBER_PATTERN_MESSAGE);
    }

}
