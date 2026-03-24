package com.haruon.groupware.domain.shared;

public class RegexpUtil {

    public final static String PASSWORD_PATTERN = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$";
    public final static String PASSWORD_PATTERN_MESSAGE = "비밀번호는 8자이상, 영문+숫자+특수문자 조합을 해야합니다.";

    public final static String EXTENSION_NO_PATTERN = "^\\d{3}-\\d{4}$";
    public final static String EXTENSION_NO_PATTERN_MESSAGE = "내선번호는 `3자리 숫자 - 4자리 숫자 형식`이어야 합니다.";

    public final static String EMAIL_PATTERN = "^[a-zA-Z0-9_+&*-]+(?:\\\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\\\.)+[a-zA-Z]{2,7}$";
    public final static String EMAIL_PATTERN_MESSAGE = "이메일 형식이 올바르지 않습니다.";
}
