# HARUON Auth Walking Skeleton (EMP 대표 슬라이스) Frontend MVP PRD

> 이 PRD는 단일 도메인 명세가 아니라, **auth 세로 슬라이스로 프론트 아키텍처 배관을 확정하는 최초 골격(Walking Skeleton)** 문서다.
> login → axios 인터셉터(JWT 부착 / 401·`ROLE_002` → reissue → 원요청 재시도) → protected route → 레이아웃 셸의 배관을, 대표 도메인 **사원(EMP)** 으로 실제 작동을 증명한다.
> 이후 모든 도메인 PRD/구현이 복제할 **"정답 템플릿"** 역할을 하며, 아래 §A(아키텍처 배관 확정)·§B(공통 레이아웃 셸)는 그 목적상 표준 템플릿에 **추가된** 섹션이다.

---

## 🎯 핵심 정보

- **목적**: 로그인·세션복원·인터셉터·보호 라우트·레이아웃 셸 배관을 사원(EMP) 대표 슬라이스(목록/상세/생성/mutation 1개)로 검증하는 프론트 최초 골격 구축.
- **사용자**: 로그인한 모든 사원(`EMPLOYEE` 최소 등급 공통). 회원가입/승인 대기 화면은 비인증·미승인 가입자 대상. Layer 2/상위 role 전용 기능은 이번 스코프에 없음.

---

## 🚶 사용자 여정

```
[비인증 사용자]
  └ 보호 페이지 직접 진입 → 로그인 페이지 (자동 리디렉션)

[로그인 페이지]
  ├ 로그인 성공 → 홈(대시보드 셸)
  ├ 로그인 실패(AUTH_001) → 로그인 페이지(폼 에러 유지)
  └ "회원가입" 링크 → 회원가입 페이지

[회원가입 페이지]
  └ 가입 성공(204, 미승인 상태) → 승인 대기 안내 화면

[승인 대기 안내 화면]
  └ HR 승인 전: 이용 가능 범위는 도메인모델 정책을 따름(안내만) → "로그인으로" 링크

[홈(대시보드 셸)] — 레이아웃 셸(사이드바+헤더+푸터) 최초 진입점
  ├ 사이드바 "부서 멤버 목록" → 부서 멤버 목록 페이지
  ├ 헤더 사용자명 클릭 → 내 정보 조회 페이지
  └ 헤더 "로그아웃" → 로그인 페이지

[부서 멤버 목록 페이지]
  └ 멤버 행 클릭 → 사원 상세 페이지

[사원 상세 페이지]
  └ (본인 상세는 "내 정보 조회"로, 타 사원은 사원 상세로 분기)

[내 정보 조회 페이지]
  └ "수정" 버튼 → 내 정보 수정 페이지

[내 정보 수정 페이지]
  ├ 저장 성공(204) → 내 정보 조회 페이지(재조회)
  └ 서버 검증 실패(VALIDATION_ERROR/COMMON_00x) → 해당 폼 필드 에러

[세션 복원 흐름 — 앱 부팅/새로고침]
  access token 인메모리 소실 → reissue 1회
    ├ 성공 → RETRIEVE_ME_INFO로 사용자 복원 → 원래 페이지 유지
    └ 실패(ROLE_002) → 로그인 페이지(리디렉션)
```

**권한 분기점**

- 라우트 가드(Layer 1): 미인증 → 로그인 리디렉션. 이번 스코프 페이지는 전부 최소 요구 role `EMPLOYEE`.
- 서버 최종 판단: 프론트 role은 게이팅 힌트일 뿐, 401/403이 최종. 이번 스코프엔 부서 불일치(`ROLE_003`) 유발 기능은 없으나, 인터셉터 배관 증명을 위해 403 처리 경로는 구현·표준화한다.

---

## ⚡ 기능 명세

### 1. MVP 핵심 기능 (EMP 대표 슬라이스)

| ID | 기능명 | 설명 | 근거 기능ID | 관련 페이지 |
|---|---|---|---|---|
| **[F001]** | 부서 멤버 목록 | 특정 부서 멤버 조회(페이징 파라미터 존재하나 1페이지만 사용, 페이징 UI 제외) | `DEPT_MEMBERS` | 부서 멤버 목록 페이지 |
| **[F002]** | 사원 상세(타 사원) | 사원 단건 정보 조회 | `RETRIEVE_EMP_INFO` | 사원 상세 페이지 |
| **[F003]** | 내 정보 조회(본인 상세) | 로그인 사용자 본인 정보 조회 | `RETRIEVE_ME_INFO` | 내 정보 조회 페이지, 홈, (세션 복원) |
| **[F004]** | EMP 생성(회원가입 겸용) | 회원가입으로 사원 생성. 관리자용 별도 create API 미존재 → 회원가입을 대표 create로 겸용. 가입 직후 미승인 | `REGISTER` | 회원가입 페이지, 승인 대기 안내 화면 |
| **[F005]** | 내 정보 수정(대표 mutation) | 본인 개인정보 수정. RHF+zod+서버검증 에러매핑 증명용 대표 mutation | `UPDATE_SELF_INFO` | 내 정보 수정 페이지 |

### 2. MVP 필수 지원 기능 (auth 배관)

| ID | 기능명 | 설명 | 근거 기능ID | 관련 페이지 |
|---|---|---|---|---|
| **[F010]** | 로그인 | loginId/password 로그인, accessToken 인메모리 저장 | `LOGIN` | 로그인 페이지 |
| **[F011]** | 세션 복원(부팅 reissue 1회) | 앱 부팅/새로고침 시 reissue 1회로 access token 재획득, 사용자 정보는 `RETRIEVE_ME_INFO`로 복원 | `REISSUE_TOKEN` | 전 페이지(전역 부팅 훅), 홈 |
| **[F012]** | 로그아웃 | 로그아웃 + refreshToken 쿠키 만료 + 인메모리 상태 clear | `LOGOUT` | 헤더(전 페이지 셸) |
| **[F013]** | 회원가입 + 승인 대기 | F004와 동일 기능(`REGISTER`)의 auth 관점 표현. 가입 후 미승인 상태 안내 | `REGISTER` | 회원가입 페이지, 승인 대기 안내 화면 |

> ⚠️ **F013과 F004는 동일 기능ID `REGISTER`의 두 관점**이다. 실 구현·라우팅은 **하나의 회원가입 흐름**으로 관리하며 중복 정의하지 않는다(EMP create = auth 회원가입).

### 3. MVP 이후 기능 (이번 PRD 명시적 제외)

- 사원 수정(HR: `HR_UPDATE_EMP_INFO` / 부서매니저: `DEPT_MANAGER_UPDATE_EMP_INFO`)
- 사원 삭제/퇴직/정직/활성화(`HR_RESIGN_EMP`, `HR_SUSPEND_EMP`, `HR_ACTIVATE_EMP` 등)
- 사원 검색·필터(`EMPS_FOR_MANAGEMENT`의 keyword/status), **페이징 UI**
- 파일 업로드(프로필/전자서명: `EMP_FILE_UPLOAD` 등) — 도메인 정책 상이, `@../docs/도메인모델.md` 참조
- 테마/다크모드, 다국어(i18n), 프로필 커스터마이징, 브라우저 푸시 알림
- auth 외 전 도메인(근태·전자결재·일정·게시판·쪽지·채팅·가맹점 등)

---

## 📱 메뉴 구조

```
📱 HARUON 내비게이션 (EMPLOYEE 공통 · 최소 요구 role 표기)
├── 🏠 홈 — 대시보드 셸 진입 (F003·F011)
├── 👥 부서 멤버 목록 — F001 (→ 사원 상세 F002 진입)
└── 🙍 내 정보 — 내 정보 조회 F003 (→ 내 정보 수정 F005 진입)

(헤더 전역) 로그인 사용자 표시 — F003 / 로그아웃 — F012

(비인증 전용, 메뉴 밖 라우트)
├── 로그인 — F010
├── 회원가입 — F004/F013
└── 승인 대기 안내 — F004/F013
```

- 이번 스코프의 **모든 메뉴 항목 최소 요구 role = `EMPLOYEE`**. Layer 2(HR/FRANCHISE/FACILITY/IT) 전용 메뉴는 이번 골격에 없음.
- Layer 1은 라우트 가드, Layer 2는 메뉴/버튼 노출에 사용(이번엔 노출 대상 없음). 상위 role은 RoleHierarchy로 자동 통과 → 별도 병기 불필요.
- DEPT_MANAGER "같은 부서" 등 서버 최종 판단 조건 기능은 이번 스코프에 없음(있다면 `ROLE_003` 403 UX가 최종).

---

## 🔧 §A. 아키텍처 배관 확정 (Walking Skeleton) — 이후 도메인 복제 표준

> 이 섹션은 전역 계약을 **재서술하지 않는다.** 계약을 **프론트 코드 구조로 어떻게 배선할지 확정(decision)** 한다. 필드 설계는 하지 않는다.

### A-1. axios 인스턴스 + 인터셉터 배관

- **인스턴스 결정**: `shared/api/client.ts`에 단일 axios 인스턴스. `baseURL = http://localhost:8080`, **`withCredentials: true` 전역**(refreshToken 쿠키 송수신 필수).
- **요청 인터셉터**: zustand 인메모리 accessToken 존재 시 `Authorization: Bearer <token>` 자동 부착. 토큰 없으면 헤더 미부착(공개 엔드포인트 대응).
- **응답 인터셉터(401 처리) — 재발급 대상은 `code === 'ROLE_002'` 한정**:
  1. 응답 401 && `code === 'ROLE_002'` && (원요청이 아직 재시도 안 됨) && (원요청이 reissue 자체가 아님) → `POST /api/auth/reissue` **1회**(`REISSUE_TOKEN`).
  2. reissue 성공(`200 { accessToken }`) → 인메모리 토큰 교체 → **원요청 1회 재시도**(재시도 플래그 부착).
  3. reissue 실패(401, `ROLE_002`) 또는 reissue 요청 자체 401 → **재귀 금지**, 인메모리 상태 clear + 로그인 페이지 이동.
- **무한 루프 방지 결정**: 원요청에 `_retried` 마킹, reissue 요청 URL은 재발급 경로 진입 제외. 이미 재시도된 요청 재투입 금지.
- **분기 결정(재발급 아닌 401/403)**:
  - `AUTH_001`(401) → reissue 미진입, **로그인 폼 에러**로 처리(로그인 mutation 레벨).
  - `ROLE_003`(403) → reissue 미진입, **권한 부족 UX**(권한 안내/토스트).
- 동시 다발 401 시 reissue 중복 방지를 위해 **단일 in-flight reissue 프라미스 공유** 패턴을 표준으로 채택(구현 세부는 클라이언트 모듈에 캡슐화).

### A-2. 에러코드 → UI 매핑 표 (전역 표준)

| code | httpStatus | 프론트 처리 결정 |
|---|---|---|
| `VALIDATION_ERROR`, `COMMON_001~007` | 400 | RHF `setError`로 **해당 폼 필드 에러** 매핑(`message` 그대로) |
| `AUTH_001` | 401 | 로그인 **폼 에러**(재발급 대상 아님) |
| `ROLE_002` | 401 | 인터셉터가 reissue 시도 → 실패 시 **로그인 이동** |
| `ROLE_003` | 403 | **권한 부족 UX**(재발급 금지) |
| `*_NOT_FOUND_*` (예: `EMP_001`) | 404 | **not-found UX**(페이지 내 빈/오류 상태) |
| (핸들러 미처리) | 500 | **일반 오류 토스트(sonner)** |

- ApiError 파싱은 `shared/api`의 공통 에러 정규화 유틸에 캡슐화(구조는 `error-response.md` 계약 그대로). 폼/토스트/이동 분기는 **호출부가 아니라 표준 헬퍼**가 담당.

### A-3. QueryClient + queryKey 컨벤션 + 훅 래핑

- **QueryClient 기본 방침**:
  - `retry`: 기본 재시도 최소화(예: 0~1). **401 재시도는 인터셉터 관할**이므로 react-query `retry`와 명확히 구분(react-query가 401을 다시 태우지 않게).
  - `staleTime`: 조회형 기본 짧게 설정(정확 값은 구현 시 결정), 정적 성향 데이터는 개별 상향.
- **queryKey 팩토리 컨벤션(결정)**: feature별 `xxxKeys` 팩토리 export.
  - 예: `employeeKeys.me()`, `employeeKeys.detail(empId)`, `departmentKeys.members(deptId, params)`.
- **mutation 성공 시 invalidate 규칙(결정)**: 변경 대상과 겹치는 조회 key를 invalidate.
  - 내 정보 수정(F005) 성공 → `employeeKeys.me()` invalidate(내 정보 조회 재검증).
- **EMP 슬라이스 실제 적용 예시**:
  - `useMeQuery()` → `employeeKeys.me()` / `RETRIEVE_ME_INFO`
  - `useEmployeeQuery(empId)` → `employeeKeys.detail(empId)` / `RETRIEVE_EMP_INFO`
  - `useDepartmentMembersQuery(deptId)` → `departmentKeys.members(deptId)` / `DEPT_MEMBERS`
  - `useUpdateMeMutation()` → onSuccess에서 `employeeKeys.me()` invalidate / `UPDATE_SELF_INFO`

### A-4. Zustand auth 스토어 패턴

- **위치**: `features/auth/store/authStore.ts`.
- **상태**: `accessToken`(인메모리만, 영속화 금지) · `user`(RETRIEVE_ME_INFO 결과, 이름 수준) · `roles`(정규화 배열) · `status`(`idle | authenticating | authenticated | unauthenticated`).
- **액션 결정**: `setToken(token)` · `setUser(user)` · `clear()` · `bootstrap()`(부팅 시 reissue→me 복원).
- **roles 정규화 결정**: JWT `roles`는 `ROLE_` 접두어 포함 → **접두어 제거 후 저장**. Layer 1/Layer 2가 **한 배열에 혼재**됨(Layer 구분 필드 없음).
- **원칙**: JWT roles는 **UI 게이팅 힌트일 뿐**, 서버 401/403이 최종. 게이팅은 **최소 요구 role + 계층 전개 헬퍼**로 판정.

### A-5. RHF + zod resolver + 서버 검증 에러 매핑

- **폼 표준 패턴(결정)**: `react-hook-form` + `@hookform/resolvers/zod`.
  1. zod 스키마로 **클라 사전 검증**(필드 이름 수준만 정의, 상세 필드 설계는 구현 단계/스니펫 확인 후).
  2. 제출 → 서버 400(`VALIDATION_ERROR`/`COMMON_00x`) 시 `message`를 **해당 필드로 `setError` 매핑**.
  3. 필드 특정 불가한 서버 에러는 폼 전역 에러 or 토스트로 폴백.
- **적용 폼**: 로그인(F010) · 회원가입(F004/F013) · 내 정보 수정(F005).

### A-6. Router 구조

- **결정**: `createBrowserRouter`(React Router 7) 단일 라우트 트리.
- **가드**: `ProtectedRoute`(미인증 → 로그인 리디렉션, 부팅 복원 중이면 로딩 표시). Layer 1 = **라우트 가드**, Layer 2 = **메뉴/버튼 노출**.
- **중첩 구조**: **레이아웃 셸(§B)을 부모 라우트**로 두고 보호 페이지들을 자식 라우트로 중첩. 로그인/회원가입/승인 대기는 셸 밖(비인증) 라우트.
- **role 판정 헬퍼(결정)**: 계층 전개 헬퍼 `hasRequiredRole(userRoles, minRole)` — RoleHierarchy(ADMIN⊇전부, DEPT_MANAGER⊇EMPLOYEE, Layer2⊇EMPLOYEE)를 전개해 최소 요구 role 충족 판정.

### A-7. 폴더 / 피처 컨벤션 (이후 도메인 복제 표준)

```
src/
├── app/                 # 앱 진입: router, providers(QueryClient), bootstrap
├── features/
│   ├── auth/            # 로그인/회원가입/세션복원/로그아웃, authStore
│   └── employee/        # me/detail/members 조회, 내 정보 수정 (EMP 슬라이스)
│       ├── api/         # 엔드포인트 호출 + 훅(useXxxQuery/useXxxMutation)
│       ├── components/
│       ├── pages/
│       └── model/       # zod 스키마, 타입(이름 수준)
└── shared/
    ├── api/             # axios client, 인터셉터, 에러 정규화, queryKeys 규약
    ├── lib/             # role 전개 헬퍼, 공통 유틸
    ├── components/      # 레이아웃 셸(Sidebar/Header/Footer), 공통 UI
    └── ui/              # shadcn/ui 컴포넌트
```

- **네이밍**: 컴포넌트 `PascalCase`, 그 외 `camelCase`, **들여쓰기 2칸**.
- 신규 도메인은 `features/<domain>/{api,components,pages,model}` 구조를 **그대로 복제**한다.

---

## 🖼️ §B. 공통 레이아웃 셸

> 스크린샷 없이 텍스트 스펙으로 진행하며, **추후 디자인 조정 여지**를 남긴다. 3영역(사이드바+헤더+푸터).

- **사이드바**: §메뉴 구조와 **1:1 일치**. 각 항목은 **최소 요구 role** 기준 노출(이번 스코프 전부 `EMPLOYEE` → 로그인 사용자 전원 노출). 항목: 홈 / 부서 멤버 목록 / 내 정보.
- **헤더**: 로그인 사용자 표시(이름 등 — `RETRIEVE_ME_INFO`/F003) + **로그아웃 버튼**(F012). 사용자명 클릭 → 내 정보 조회.
- **푸터**: 기본 골격(회사명/카피라이트 수준 placeholder). 추후 조정.
- **디자인 토큰**: **shadcn 기본값 사용, 커스텀 팔레트 없음.**

---

## 📄 페이지별 상세 기능

### 로그인 페이지

> **구현 기능:** `F010` | **메뉴 위치:** 비인증 라우트(메뉴 밖)

| 항목 | 내용 |
|---|---|
| **역할** | loginId/password로 인증, accessToken 인메모리 저장 후 진입 |
| **진입 경로** | 앱 시작 시 미인증, 보호 페이지 접근 시 자동 리디렉션, 승인 대기 화면 "로그인으로" |
| **접근 권한** | 공개(비인증). 서버 최종 판단: 없음 |
| **사용자 행동** | 아이디/비밀번호 입력, 로그인 제출, "회원가입" 링크 이동 |
| **주요 기능** | • 로그인 폼(RHF+zod) (F010) • **로그인** 버튼 |
| **다음 이동** | 성공 → 홈, 실패(`AUTH_001`) → 폼 에러 유지, 회원가입 링크 → 회원가입 페이지 |

### 회원가입 페이지

> **구현 기능:** `F004`, `F013` | **메뉴 위치:** 비인증 라우트(메뉴 밖)

| 항목 | 내용 |
|---|---|
| **역할** | 사원(EMP) 생성. 회원가입을 EMP 대표 create로 겸용, 가입 직후 미승인 |
| **진입 경로** | 로그인 페이지 "회원가입" 링크 |
| **접근 권한** | 공개(비인증, `POST /api/employees` permitAll). 서버 최종 판단: 없음 |
| **사용자 행동** | 가입 정보 입력(필드 이름 수준), 가입 제출 |
| **주요 기능** | • 회원가입 폼(RHF+zod, 서버검증 에러매핑) (F004/F013) • **가입하기** 버튼 |
| **다음 이동** | 성공(204) → 승인 대기 안내 화면, 검증 실패(`VALIDATION_ERROR`/`COMMON_00x`) → 폼 필드 에러, 그 외 → 에러 토스트(sonner) |

### 승인 대기 안내 화면

> **구현 기능:** `F004`, `F013` | **메뉴 위치:** 비인증 라우트(메뉴 밖)

| 항목 | 내용 |
|---|---|
| **역할** | 가입 완료 후 **HR 승인 대기** 상태 안내(미승인 UX 필수) |
| **진입 경로** | 회원가입 성공 직후 |
| **접근 권한** | 공개(비인증). 서버 최종 판단: 없음 |
| **사용자 행동** | 안내 확인, "로그인으로" 이동 |
| **주요 기능** | • 승인 대기 안내 메시지 • 승인 전 이용 가능 범위 표기(`@../docs/도메인모델.md` 참조) • **로그인으로** 링크 |
| **다음 이동** | 로그인으로 → 로그인 페이지 |

### 홈 (대시보드 셸)

> **구현 기능:** `F003`, `F011` | **메뉴 위치:** 🏠 홈

| 항목 | 내용 |
|---|---|
| **역할** | 레이아웃 셸(사이드바+헤더+푸터) 최초 진입점, 세션 복원 검증 지점 |
| **진입 경로** | 로그인 성공 후, 부팅 시 세션 복원 성공 후 |
| **접근 권한** | 최소 요구 role: `EMPLOYEE` / 서버 최종 판단: 없음 |
| **사용자 행동** | 사이드바로 부서 멤버 목록/내 정보 이동, 헤더에서 로그아웃 |
| **주요 기능** | • 세션 복원(부팅 reissue→me) (F011) • 헤더 사용자 표시 (F003) • 셸 내비게이션 |
| **다음 이동** | 부서 멤버 목록 / 내 정보 조회로 이동, 로그아웃 → 로그인 페이지 |

### 부서 멤버 목록 페이지

> **구현 기능:** `F001` | **메뉴 위치:** 👥 부서 멤버 목록

| 항목 | 내용 |
|---|---|
| **역할** | 특정 부서 멤버 목록 표시(@tanstack/react-table 활용, **1페이지만·페이징 UI 제외**) |
| **진입 경로** | 사이드바 "부서 멤버 목록" |
| **접근 권한** | 최소 요구 role: `EMPLOYEE` (`DEPT_MEMBERS`는 인증 사원 조회) / 서버 최종 판단: 없음 |
| **사용자 행동** | 멤버 목록 확인, 멤버 행 클릭 |
| **주요 기능** | • 부서 멤버 목록 조회 (F001) • 멤버 행 → 상세 이동 |
| **다음 이동** | 행 클릭 → 사원 상세 페이지, 조회 실패 → 에러 토스트(sonner)/not-found UX(`*_NOT_FOUND_*`) |

### 사원 상세 페이지

> **구현 기능:** `F002` | **메뉴 위치:** 부서 멤버 목록에서 진입(직접 메뉴 없음)

| 항목 | 내용 |
|---|---|
| **역할** | 타 사원 단건 정보 조회 |
| **진입 경로** | 부서 멤버 목록 행 클릭 |
| **접근 권한** | 최소 요구 role: `EMPLOYEE` (`RETRIEVE_EMP_INFO`) / 서버 최종 판단: 없음 |
| **사용자 행동** | 사원 상세 정보 확인 |
| **주요 기능** | • 사원 단건 조회 (F002) |
| **다음 이동** | 목록으로 복귀, 미존재(`EMP_001` 등 `*_NOT_FOUND_*`) → not-found UX, 403 → 권한 부족 UX |

### 내 정보 조회 페이지

> **구현 기능:** `F003` | **메뉴 위치:** 🙍 내 정보

| 항목 | 내용 |
|---|---|
| **역할** | 로그인 사용자 본인 상세 조회(본인 상세는 `RETRIEVE_ME_INFO` 사용) |
| **진입 경로** | 사이드바 "내 정보", 헤더 사용자명 클릭 |
| **접근 권한** | 최소 요구 role: `EMPLOYEE`(본인) / 서버 최종 판단: 없음 |
| **사용자 행동** | 본인 정보 확인, "수정" 이동 |
| **주요 기능** | • 본인 정보 조회 (F003) • **수정** 버튼 |
| **다음 이동** | 수정 → 내 정보 수정 페이지, 조회 실패 → 에러 토스트(sonner) |

### 내 정보 수정 페이지

> **구현 기능:** `F005` | **메뉴 위치:** 내 정보 조회에서 진입(직접 메뉴 없음)

| 항목 | 내용 |
|---|---|
| **역할** | 본인 개인정보 수정 — RHF+zod+**서버 검증 에러매핑 증명용 대표 mutation** |
| **진입 경로** | 내 정보 조회 "수정" 버튼 |
| **접근 권한** | 최소 요구 role: `EMPLOYEE`(본인) (`UPDATE_SELF_INFO`) / 서버 최종 판단: 없음 |
| **사용자 행동** | 수정 폼 입력(필드 이름 수준), 저장 제출 |
| **주요 기능** | • 내 정보 수정 폼(RHF+zod) (F005) • 성공 시 `employeeKeys.me()` invalidate • **저장** 버튼 |
| **다음 이동** | 성공(204) → 내 정보 조회 페이지(재조회), 검증 실패(`VALIDATION_ERROR`/`COMMON_00x`) → 폼 필드 에러, 그 외 → 에러 토스트(sonner) |

---

## 🗂️ 참조 계약 매핑

> 아래 필드는 `back/build/generated-snippets/<기능ID>/`의 request-fields·response-fields 스니펫을 **직접 대조**해 기술했다(추측 아님). TS 타입명은 프론트 네이밍 제안이며, 필드명·타입·제약은 스니펫 원천을 따른다.
> 참조 원천 경로: `../back/build/generated-snippets/<기능ID>/` (예: `LOGIN/request-fields.adoc`).

| 페이지 | 도메인 스킬 | 근거 기능ID | 핵심 DTO/타입 · 필드(스니펫 실측) | 비고 |
|---|---|---|---|---|
| 로그인 | auth | `LOGIN` | `LoginRequest { loginId: string; password: string }` / `LoginResponse { accessToken: string }` | 성공 200 + `Set-Cookie: refreshToken`. 두 필드 모두 required |
| (전역 세션 복원) | auth | `REISSUE_TOKEN` | `ReissueResponse { accessToken: string }` | 요청 body 없음·refreshToken 쿠키 기반. 사용자 복원은 `RETRIEVE_ME_INFO` |
| (헤더/전역) | auth | `LOGOUT` | 요청·응답 body 없음 | 204 + refreshToken 쿠키 만료. Authorization 헤더 필요 |
| 회원가입 / 승인 대기 | auth · employee | `REGISTER` | `RegisterRequest { empNo: string; name: string; loginId: string; password: string }` | 204·공개(응답 body 없음). **제약: empNo 9자리(입사연월+3자리), loginId 8~20자 영·숫자, name 20자 이하, password 8자+ 영문·숫자·특수문자** → zod 스키마 근거. 미승인→승인 대기 UX, 승인 전 범위 `@../docs/도메인모델.md` |
| 부서 멤버 목록 | employee · org | `DEPT_MEMBERS` | `DeptMemberResponse[]` in Spring `Page`: `content[] { empId: number; empNo: string; empName: string; extensionNo: string; email: string; position: string }` + 페이징 메타(`totalElements/totalPages/number/size/numberOfElements/first/last/empty`) | path `deptId`, query `keyword·isEmpActive·page·size`(전부 optional). **1페이지만·페이징 UI 제외**(메타는 응답에 존재) |
| 사원 상세 | employee | `RETRIEVE_EMP_INFO` | `EmployeeInfoResponse { empBasicInfo{ empNo, name, loginId, email, extensionNo }; activeFiles[]{ file{ fileId, originalName, extension, fileSize }, type, isActive }; currentDepts[]{ deptId, deptCode, deptName, positionName, isPrimary, startAt, endAt } }` | path `empId`. `RETRIEVE_ME_INFO`와 **동일 응답 스키마**. 미존재 시 `*_NOT_FOUND_*`(EMP_001 등) → not-found UX |
| 내 정보 조회 | employee | `RETRIEVE_ME_INFO` | `EmployeeInfoResponse` (사원 상세와 동일 구조 — 상단 참조) | 본인 상세 전용(`/api/auth/me` 미존재). 파일 목록은 활성(True)만 출력 |
| 내 정보 수정 | employee | `UPDATE_SELF_INFO` | `UpdateSelfInfoRequest { extensionNo: string; newRawPassword: string }` | 204·응답 body 없음. **제약: extensionNo `NNN-NNNN` 형식, newRawPassword 8자+ 영문·숫자·특수문자**(둘 다 required) → zod 스키마 근거. 서버검증 에러 → 폼 필드 매핑 |

> ⚠️ 스니펫 실측 주의: `RETRIEVE_EMP_INFO`와 `RETRIEVE_ME_INFO`는 **같은 응답 스키마**를 공유하므로 조회 컴포넌트·타입을 재사용한다. `activeFiles`가 응답에 포함되나 이번 스코프는 **파일 표시/업로드 UI 제외**(필드는 존재하되 렌더링 최소화). TS 타입명은 제안값이며 실제 필드명은 스니펫을 따른다.

---

## 🛠️ 기술 스택

CLAUDE.md §6 스택 그대로 사용(React 19+Vite / React Router 7 / axios / @tanstack/react-query / zustand / react-hook-form+zod / @tanstack/react-table / shadcn·Tailwind / sonner / dayjs). **추가 라이브러리 도입 금지 — 필요 시 사용자와 논의.**

---

## ✅ 정합성 검증 체크리스트 (실행 결과 — 전 단계 통과)

**🔍 1단계: 기능 명세 → 페이지 연결**
- F001→부서 멤버 목록 ✅ / F002→사원 상세 ✅ / F003→내 정보 조회·홈·세션복원 ✅ / F004→회원가입·승인 대기 ✅ / F005→내 정보 수정 ✅ / F010→로그인 ✅ / F011→홈·전역부팅 ✅ / F012→헤더(전역 셸) ✅ / F013→회원가입·승인 대기 ✅. 모든 관련 페이지 실존.

**🔍 2단계: 메뉴 → 페이지**
- 홈/부서 멤버 목록/내 정보 3개 메뉴 모두 대응 페이지 존재 ✅. 헤더 사용자표시(F003)·로그아웃(F012)·비인증 라우트(F010/F004/F013) 전부 기능 명세에 정의 ✅.

**🔍 3단계: 페이지 → 역참조**
- 8개 페이지의 모든 F ID가 기능 명세에 정의됨 ✅. 모든 페이지 접근 가능(진입 경로 명시) ✅. 접근 권한 항목 전 페이지 존재 ✅.

**🔍 4단계: 계약 근거**
- 근거 기능ID 전부 `api-endpoint.md` 실존 확인: `LOGIN`·`LOGOUT`·`REISSUE_TOKEN`(AUTH), `REGISTER`·`RETRIEVE_EMP_INFO`·`RETRIEVE_ME_INFO`·`UPDATE_SELF_INFO`(EMP_ACCOUNT), `DEPT_MEMBERS`(DEPT) ✅. 근거 없는 발명 기능 없음 ✅.

**🔍 5단계: 누락/고아**
- F004(EMP create)와 F013(auth 회원가입)은 **동일 `REGISTER`의 두 관점**임을 명시, 실 구현은 단일 흐름으로 중복 방지 ✅. 고아 메뉴/페이지/기능 없음 ✅.

**결과: 5단계 전부 통과.**
