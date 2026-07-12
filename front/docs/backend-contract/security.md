## 권한 모델 (2-Layer)

백엔드 인가는 성격이 다른 **두 층의 권한**으로 나뉜다. 프론트는 이 둘을 **하나의 role 배열로 뭉쳐서** 다루되, 게이팅 의미는 아래와 같다.


| Layer                | 역할 코드                               | 의미                      | 프론트에서의 쓰임                                       |
| -------------------- | ----------------------------------- | ----------------------- | ----------------------------------------------- |
| **Layer 1 — 시스템 권한** | `EMPLOYEE`, `DEPT_MANAGER`, `ADMIN` | 계정 기본 등급 + 조직/전사 관리자 등급 | 로그인 가능 여부, 관리자 메뉴, "같은 부서 관리" 같은 **큰 단위 접근 제어** |
| **Layer 2 — 업무 권한**  | `HR`, `FRANCHISE`, `FACILITY`, `IT` | 특정 업무 도메인 관리 권한         | HR/가맹점/시설/IT 등 **업무 메뉴·기능 노출 제어**               |


> 한 사원은 두 층에서 여러 역할을 동시에 가질 수 있다 (예: ["EMPLOYEE", "HR"]).



#### **RoleHierarchy**

- `ADMIN` → `EMPLOYEE`·`DEPT_MANAGER`·`HR`·`FACILITY`·`FRANCHISE`·`IT` **전부 포함** (ADMIN은 모든 메뉴 접근 가능)
- `DEPT_MANAGER` → `EMPLOYEE` 포함
- `HR`/`IT`/`FACILITY`/`FRANCHISE` → 각각 `EMPLOYEE` 포함



### 경로별 접근 매핑 (SecurityConfig 기준)


| 구분    | 경로 패턴                                                                                                                             | 요구 권한(최소)                                                                   |
| ----- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 공개    | `/api/auth/login`, `/api/auth/reissue`, `POST /api/employees`(회원가입), `GET /api/companies`                                         | permitAll                                                                   |
| 인증만   | `/api/departments/**`(GET), `/api/employees/attendances/me/**`, `/api/employees/me/leaves/summary`(GET)                           | authenticated                                                               |
| 사원    | `/api/employees/**`, `/api/drafts/**`, `/api/messages/**`, `/api/schedules/**`, `/api/chat/rooms/**`, `/api/document-boxes/me/**` | `EMPLOYEE`                                                                  |
| HR    | `PATCH /api/employees/*/registration-approval`·`/resignation`·`/hr-managed-info`·`/status/**`·`/belongings`, `GET /api/employees/new` | `HR`                                                                        |
| 부서매니저 | `PATCH /api/employees/*/dept-managed-info`, `/api/employees/attendances/**`(me 제외), `/api/leaves/departments/*/request-history`   | `DEPT_MANAGER`                                                              |
| 관리자   | `/api/departments/**`(PATCH/POST/DELETE), `/api/employees/leaves/**`, `/api/employees/*/leaves/*-grant-days`                      | `ADMIN`                                                                     |
| 가맹점   | `/api/franchises/**`, `/api/franchise-educations/**`, `/api/franchise-inquiries/**`, `/api/drafts/sales/**`                       | `FRANCHISE`                                                                 |
| 시설    | `GET /api/meetings`·`/api/meeting-rooms/management`, `/api/meeting-rooms/**`(POST/PATCH/DELETE)                                   | `FACILITY`                                                                  |
| 웹소켓   | `/ws-chat`, `/ws-chat/**`                                                                                                         | permitAll (실제 인증은 STOMP CONNECT에서 — `@docs/backend-contract/chat-stomp.md`) |


> ⚠️ **이 표는 권한 판정 전용이다. 기능 존재 근거로 사용하지 말 것.** 기능 존재 여부는 `api-endpoint.md`의 기능ID로 확인한다.
> 전체 세부 매핑은 `docs/api-endpoint.md`와 `../back/src/main/adapter/security/SecurityConfig.java`가 원천. 위 표는 프론트 라우팅 가드용 요약이며, 계층상 상위 role은 자동 통과한다.

---

## 토큰 구조 (JWT)


| 토큰구조          | 유효기간 | 전달 방식                                                                                                                        |
| ------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------- |
| Access Token  | 30 분 | - `Authorization: Bearer <token>` 헤더로 매 요청 전달. - 페이로드 claim: `sub`(loginId), `roles`(문자열 배열), `type: "access"`, `iat`, `exp` |
| Refresh Token | 14일  | - `refreshToken` 이름의 HttpOnly 쿠키로 서버가 내려주며, 프론트는 직접 읽을 수 없다.- **프론트는 refreshToken을 JS로 저장/전송하지 않는다.**                       |


- 쿠키 속성: `HttpOnly=true`, `Path=/`, `Secure=false`(현재 dev 기준. HTTPS 배포 시 true 예정)



#### JWT roles는 로그인 시점 스냅샷이다

- 프론트는 JWT roles를 **UI 게이팅 힌트**로만 쓰고, 서버의 401/403을 최종 진실로 삼는다.
  > `DEPT_MANAGER`**의 "같은 부서" 여부는 프론트에서 검증 불가**하여 서버 **403(**`ROLE_003`**)** 이 최종 판단한다.
- 권한 게이팅은 **최소 요구 role** 기준 + 계층 전개 헬퍼로 판정한다.



#### JWT `roles` claim

- JWT `roles` claim에는 두 층의 역할이 **한 배열에 섞여** 온다 (Layer 구분 필드 없음). 
- **JWT** `roles` **claim은** `ROLE_` **접두어를 포함한다.**  
디코드 시 `roles: ["ROLE_EMPLOYEE", "ROLE_HR", ...]` 형태 → 역할 비교 전 `ROLE_` **접두어를 제거해 정규화**필요



## **Access Token 저장 위치**

- 백엔드는 강제하지 않는다(응답 body로만 주며 저장 방식에 관여 안 함). 
- **메모리(zustand 등 인메모리 상태)에 보관.** 
- **앱 부팅, 새로고침 등** access token 소실 시, `POST /api/auth/reissue`(쿠키 기반)로 곧바로 재획득

---

## 인증 엔드포인트 요약


| 기능     | Method | Path                | 요청                             | 성공 응답                                                |
| ------ | ------ | ------------------- | ------------------------------ | ---------------------------------------------------- |
| 로그인    | `POST` | `/api/auth/login`   | body `{ loginId, password }`   | `200` `{ accessToken }` + `Set-Cookie: refreshToken` |
| 로그아웃   | `POST` | `/api/auth/logout`  | (Access Token 필요)              | `204` + refreshToken 쿠키 만료                           |
| 토큰 재발급 | `POST` | `/api/auth/reissue` | (refreshToken 쿠키만 사용, body 없음) | `200` `{ accessToken }`                              |


- `/api/auth/login`, `/api/auth/reissue`는 **인증 불필요(permitAll)**.
- `/api/auth/logout`은 `EMPLOYEE` 권한(=로그인 상태) 필요.
- `/api/auth/me`**는 존재하지 않는다.** 로그인 사용자 본인 정보는 `GET /api/employees/me`로 조회한다.



### CORS / 인증 전송

- access token은 `/login` 으로 issue하며, 이후 HTTP Request 마다 `Authorization: Bearer` 로 전달된다
- access token은 `/logout` 으로 만료한다.
- access token은 30분의 유효시간을 가지며, `/reissue`으로 재발급을 요청할 수 있다.

---

## 401 처리 & 재발급 규칙 (전역 인터셉터로 구현)

백엔드는 **성공 시에도, 재발급 시에도 응답 래퍼 없이** access token만 반환하므로 인터셉터는 아래를 전제로 짠다.

1. 모든 API 요청에 `Authorization: Bearer <accessToken>` 자동 첨부.
2. 응답이 **401**이면(만료/누락 access token) → `POST /api/auth/reissue` 1회 호출(body 없음, 쿠키 자동 동봉).
  - 재발급 성공(`200 { accessToken }`): 새 access token으로 교체 후 **원요청 1회 재시도**.
  - 재발급 실패(`401`, `ROLE_002`): refreshToken 없음/만료/무효 → **로그인 페이지 이동** + 보관 중 access token 폐기.
3. 무한 재시도 방지: 재발급 요청 자체가 401이면 재귀 재발급 금지. 이미 재시도한 요청은 재발급 루프에 재투입 금지.
4. **재발급 대상은** `code === 'ROLE_002'`**로 한정한다.** 401이라고 무조건 reissue를 태우지 말 것.
  - `AUTH_001`(로그인 실패, 401)은 재발급 대상이 아님 → 로그인 폼 에러로 처리.
  - `ROLE_003`(부서 불일치)은 **403**이므로 재발급 경로에 들어오지 않음 → 권한 부족 UX.
5. **403(Forbidden)** 은 인증은 됐으나 권한이 부족한 경우다 → 재발급하지 말고 권한 부족 UX로 처리.

(401=재발급 대상, 403=권한 문제로 명확히 구분)