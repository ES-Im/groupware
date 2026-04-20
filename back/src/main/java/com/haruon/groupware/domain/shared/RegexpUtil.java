package com.haruon.groupware.domain.shared;

public class RegexpUtil {

    public final static String PASSWORD_PATTERN = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$";
    public final static String PASSWORD_PATTERN_MESSAGE = "비밀번호는 8자이상, 영문+숫자+특수문자 조합을 해야합니다.";

    public final static String EXTENSION_NO_PATTERN = "^\\d{3}-\\d{4}$";
    public final static String EXTENSION_NO_PATTERN_MESSAGE = "내선번호는 `3자리 숫자 - 4자리 숫자 형식`이어야 합니다.";

    public final static String EMAIL_PATTERN = "^[a-zA-Z0-9]{8,20}@haruon.com$";
    public final static String EMAIL_PATTERN_MESSAGE = "이메일 형식이 올바르지 않습니다.";

    public final static String EMP_ID_PATTERN = "^[a-zA-Z0-9]{8,20}$";
    public final static String EMP_ID_PATTERN_MESSAGE = "아이디는 8자-20자 이하 영어, 숫자만 허용합니다.";

    public final static String EMP_NO_PATTERN = "^[0-9]{9}$";
    public final static String EMP_NO_PATTERN_MESSAGE = "사원번호는 9자리[입사연월+3자리번호 조합]여야 합니다.";

    public final static String DEPT_CODE_PATTERN = "^[0-9]{3}$";
    public final static String DEPT_CODE_PATTERN_MESSAGE = "부서코드는 숫자 3자리여야 합니다.";
}
