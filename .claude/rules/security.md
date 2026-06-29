## 인증 (JWT 기반)
- access token은 `/login` 으로 issue하며, 이후 HTTP Request 마다 `Authorization: Bearer `로 전달된다
- access token은 `/logout` 으로 만료한다.
- access token은 30분의 유효시간을 가지며, `/reissue`으로 재발급을 요청할 수 있다.

## 인가 (2Layer-구조)

| Layer     | 권한                                   | 의미                        | Security에서의 역할                           |
|-----------|--------------------------------------|---------------------------|------------------------------------------|
| 시스템 권한    | `EMPLOYEE`, `DEPT_MANAGER`, `ADMIN`  | 계정의 기본 시스템 권한과 전사 관리자 권한  | 로그인 가능 사용자, 관리자, 같은 부서 관리자 같은 큰 단위 접근 제어 |
| 부서별/업무 권한 | `FRANCHISE`, `IT`, `HR`, `FACILITY`  | 특정 업무 도메인을 관리할 수 있는 권한    | HR, 가맹점, 시설, IT 같은 업무 API 접근 제어          |
