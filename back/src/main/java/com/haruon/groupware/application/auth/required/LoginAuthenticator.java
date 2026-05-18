package com.haruon.groupware.application.auth.required;

import com.haruon.groupware.application.auth.dto.AuthenticatedEmp;

/**
 * loginId/password 기반 인증을 수행하여, 인증된 사원의 id와 roles를 반환하는 포트
 */
public interface LoginAuthenticator {

    AuthenticatedEmp authenticate(String loginId, String password);

}
