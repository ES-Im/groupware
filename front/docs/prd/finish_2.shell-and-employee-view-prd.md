# HARUON 공통 레이아웃 셸 개선 + EMP 도메인 뷰 재정비 Frontend MVP PRD

> 이 PRD는 신규 업무 도메인(근태·전자결재 등) 기능 추가가 **아니다.** 이미 완성된 auth 워킹 스켈레톤(M0~M3, `docs/prd/auth-walking-skeleton-prd.md`) 위에 얹는 **① 공통 레이아웃 셸(사이드바·헤더·푸터) UX 개선**과 **② Employee 도메인 뷰 구성 정리 및 로직 연결**만 다룬다.
> 목적은 이 문서와 결과물이 **다른 도메인 뷰가 그대로 참고·복제할 시각적·구조적 레퍼런스 템플릿**이 되는 것이다.
> auth 배관(§A: axios 인터셉터 / 401·`ROLE_002` reissue / 에러매핑 / QueryClient / authStore / RHF+zod / Router / 폴더 컨벤션)은 **재서술하지 않고 `auth-walking-skeleton-prd.md` §A를 참조**한다. 전역 계약(인증·에러·페이징·파일·STOMP)은 CLAUDE.md §7 `BACK-END 계약 문서` 관할이다.

---

## 🎯 핵심 정보

- **목적**: 공통 레이아웃 셸(사이드바·헤더·푸터)의 시각·구조를 정비하고(회사 로고·프로필 아바타·알림/채팅 진입점·정적 푸터, 2-Layer 권한 기반 사이드바 렌더링), 기존 EMP 뷰(부서 멤버 목록/사원 상세/내 정보 조회·수정)에 프로필사진 표시를 얹어 **다른 도메인이 복제할 레퍼런스 뷰**를 확정한다.
- **사용자**: 로그인한 모든 사원(`EMPLOYEE` 최소 등급 공통). 사이드바는 2-Layer role에 따라 항목 노출을 분기하나, 이번 스코프의 실제 항목은 전부 `EMPLOYEE` 공통이다(Layer 2 업무 도메인 페이지는 미구현 — 각 도메인 PRD 담당).

---

## 🚶 사용자 여정

```
[비인증/세션복원 흐름] — auth-walking-skeleton-prd.md 관할(재서술 안 함)
  비인증 → 로그인 페이지 / 부팅 시 reissue 1회 → RETRIEVE_ME_INFO 복원

[홈(대시보드 셸)] — 공통 레이아웃 셸 진입점(이 PRD 개선 대상)
  ├ 헤더: 회사 로고(정적) · 프로필 아바타 · 사용자명 · 알림 벨(셸 placeholder) · 채팅 버튼(셸 placeholder) · 로그아웃
  ├ 사이드바(2-Layer 권한 렌더링): 홈 / 부서 멤버 목록 / 내 정보
  └ 푸터: 정적 회사 정보(하드코딩)

[사이드바 "부서 멤버 목록"] → 부서 멤버 목록 페이지
  └ 멤버 행 클릭 → 사원 상세 페이지(프로필사진 표시)

[헤더 프로필 아바타 / 사용자명 / 사이드바 "내 정보"] → 내 정보 조회 페이지(프로필사진 표시)
  └ "수정" 버튼 → 내 정보 수정 페이지(기존 유지) → 저장 성공 → 내 정보 조회 재조회

[헤더 알림 벨] → (클릭 동작 없음 — 셸 placeholder, //todo)
[헤더 채팅 버튼] → (클릭해도 아무 것도 열리지 않음 — 순수 셸 placeholder, //todo)
[헤더 로그아웃] → 로그인 페이지
```

**권한 분기점**

- 라우트 가드(Layer 1): 미인증 → 로그인 리디렉션(auth PRD 관할). 이번 스코프 페이지는 전부 최소 요구 role `EMPLOYEE`.
- 사이드바 항목 노출(Layer 2): `hasRequiredRole(userRoles, minRole)` 계층 전개로 판정. 이번 스코프 항목은 전부 `EMPLOYEE`라 실제 분기 대상은 없으나, **노출 규칙 자체를 레퍼런스로 확정**한다(향후 Layer 2 도메인 메뉴가 이 규칙으로 슬롯에 들어온다).
- 서버 최종 판단: 프론트 role은 게이팅 힌트일 뿐 401/403이 최종. 이번 스코프엔 `ROLE_003`(부서 불일치) 유발 기능 없음.

---

## ⚡ 기능 명세

> 이 PRD는 **셸 UX + EMP 뷰 재정비**라, 기능을 두 성격으로 나눈다.
> **(1) API 기반 기능**(근거 기능ID 필수) / **(2) 셸 구조 요소**(API 없음 — 사용자 확정 결정. 근거 기능ID 없음이 정상이며, 발명이 아니라 "API 미연결 UI"임을 명시).

### 1. MVP 핵심 기능 — API 기반 (EMP 뷰 재정비 + 프로필사진 표시)

| ID | 기능명 | 설명 | 근거 기능ID | 관련 페이지 |
|---|---|---|---|---|
| **[F101]** | 헤더 프로필 아바타(본인) | 로그인 사용자의 활성 프로필사진(`type==='PROFILE_PICTURE' && isActive`)을 헤더에 작은 원형 아바타로 표시. `useMeQuery`가 이미 보유한 `RETRIEVE_ME_INFO`의 `activeFiles[]`를 우선 재사용(추가 호출 없음), 미보유 시 `RETRIEVE_FILES_INFOS`로 대체. 없으면 이니셜 폴백 | `RETRIEVE_ME_INFO`(우선), `RETRIEVE_FILES_INFOS`(대체), `EMP_FILE_PREVIEW` | 공통 레이아웃 셸(헤더) |
| **[F102]** | 헤더 사용자명 표시 | 로그인 사용자 이름 표시(아바타 옆), 클릭 → 내 정보 조회 | `RETRIEVE_ME_INFO` | 공통 레이아웃 셸(헤더) |
| **[F103]** | EMP 뷰 프로필사진 표시 | 사원 상세·내 정보 조회 뷰 상단에 활성 프로필사진 표시. `activeFiles` 중 `PROFILE_PICTURE`만 노출(SIGNATURE는 계속 숨김) | `RETRIEVE_EMP_INFO`, `RETRIEVE_ME_INFO`, `EMP_FILE_PREVIEW` | 사원 상세 페이지, 내 정보 조회 페이지 |
| **[F104]** | 부서 멤버 목록(재정비) | 기존 목록 뷰를 셸 사이드바 구조에 맞춰 유지. 페이징 UI 제외(1페이지) | `DEPT_MEMBERS` | 부서 멤버 목록 페이지 |
| **[F105]** | 사원 상세(재정비) | 타 사원 단건 조회 + 프로필사진(F103). `EmployeeInfoView` 재사용 | `RETRIEVE_EMP_INFO` | 사원 상세 페이지 |
| **[F106]** | 내 정보 조회(재정비) | 본인 상세 조회 + 프로필사진(F103). `EmployeeInfoView` 재사용 | `RETRIEVE_ME_INFO` | 내 정보 조회 페이지 |

### 2. MVP 필수 지원 기능 — 기존 셸 배관 재사용(auth PRD 완료분, 참조만)

| ID | 기능명 | 설명 | 근거 기능ID | 관련 페이지 |
|---|---|---|---|---|
| **[F110]** | 로그아웃 | 헤더 로그아웃 버튼. 기존 `LayoutShell.handleLogout` 유지 | `LOGOUT` | 공통 레이아웃 셸(헤더) |
| **[F111]** | 세션 복원 | 부팅 reissue 1회 + `RETRIEVE_ME_INFO` 복원(전역 부팅 훅). 재서술 안 함 | `REISSUE_TOKEN` | 전역 |
| **[F112]** | 내 정보 수정 | 본인 개인정보 수정(대표 mutation, RHF+zod). 기존 `UpdateMePage`/`UpdateMeForm` 유지 | `UPDATE_SELF_INFO` | 내 정보 수정 페이지 |

### 3. 셸 구조 요소 — API 없음(사용자 확정 결정, 발명 아님)

| ID | 요소명 | 결정 | 근거 기능ID |
|---|---|---|---|
| **[S1]** | 회사 로고(헤더) | 정적 이미지 asset(프론트 번들 내). 클릭 → 홈 이동 | 없음(정적 asset) |
| **[S2]** | 사이드바 2-Layer 권한 렌더링 | `hasRequiredRole` 계층 전개로 최소 요구 role 기준 항목 노출. 이번 항목은 전부 `EMPLOYEE`. 향후 Layer 2 메뉴 슬롯 규칙 확정 | 없음(게이팅 헬퍼) |
| **[S3]** | 알림 벨 아이콘 | 헤더에 아이콘만 배치. 뱃지/드롭다운 데이터 **없음**. 클릭 무동작. 향후 알림 계약 확정 시 연결 `//todo` | 없음(알림 API 부재) |
| **[S4]** | 채팅 App 버튼 | 헤더에 버튼만 배치. 클릭해도 아무 것도 열리지 않음(순수 placeholder). 향후 채팅 도메인 PRD `//todo` | 없음(이번 스코프 제외) |
| **[S5]** | 푸터 정적 회사 정보 | 회사명/카피라이트 등 하드코딩 텍스트. API 의존 없음(회사 정보 조회 기능ID 부재) | 없음(정적 텍스트) |

### 4. MVP 이후 기능 (이번 PRD 명시적 제외)

- **알림(notification) 실기능** — `api-endpoint.md`에 대응 기능ID 부재. 계약 확정 시 별도 PRD.
- **채팅 전체(방 목록·실시간 송수신)** — `CHAT_ROOM_LIST`/`CHAT_MESSAGES`/STOMP 등. **방 목록 조회 UI 포함 이번 PRD에서 완전 제외** → 별도 채팅 도메인 PRD.
- **프로필/전자서명 파일 업로드·활성화·삭제** — `EMP_FILE_UPLOAD`, `ACTIVATE_ME_FILE`, `EMP_FILE_DELETE`, `HR_UPDATE_ONES_FILE_STATUS`. 파일 정책 `@../docs/도메인모델.md` + `@docs/backend-contract/file-upload.md`.
- **전자서명(SIGNATURE) 파일 표시** — 프로필사진만 표시, 서명은 계속 숨김.
- **회사 정보 동적 조회/수정** — `GET /api/companies` 공개 라우트 자체는 존재하나(`security.md` 공개 경로 표), 기능ID·응답 필드 계약이 REST Docs로 문서화되지 않아 `api-endpoint.md` 인덱스에 없고 필드 스펙을 확정할 수 없음(추측 금지 원칙). 정적 placeholder 유지.
- **Layer 2 업무 도메인 페이지(HR/FRANCHISE/FACILITY/IT)** — 각 도메인 PRD 담당. 사이드바 노출 규칙만 이 PRD가 확정.
- 테마/다크모드, 다국어(i18n), 브라우저 푸시 알림.

---

## 📱 메뉴 구조

```
📱 HARUON 내비게이션 (EMPLOYEE 공통 · 최소 요구 role 표기)
├── 🏠 홈 — 대시보드 셸 진입 (F102·F111)
├── 👥 부서 멤버 목록 — F104 (→ 사원 상세 F105 진입)
└── 🙍 내 정보 — 내 정보 조회 F106 (→ 내 정보 수정 F112 진입)

(헤더 전역)
├── 회사 로고 — S1 (→ 홈)
├── 프로필 아바타 — F101 (→ 내 정보 조회)
├── 사용자명 — F102 (→ 내 정보 조회)
├── 🔔 알림 벨 — S3 (셸 placeholder, 무동작)
├── 💬 채팅 App — S4 (셸 placeholder, 무동작)
└── 로그아웃 — F110

👥 Layer 2 업무 메뉴 (보유 role만 표시 · ADMIN 자동 포함)
└── (이번 스코프 미구현 — 사이드바 노출 규칙 S2만 확정. HR/FRANCHISE/FACILITY/IT
    도메인 메뉴는 각 도메인 PRD가 이 규칙의 슬롯으로 추가한다. 고아 메뉴 방지를 위해
    실 항목은 배치하지 않는다.)
```

- 이번 스코프 **모든 실 메뉴 항목 최소 요구 role = `EMPLOYEE`**. RoleHierarchy상 상위 role(`DEPT_MANAGER`/`ADMIN`/Layer 2)은 자동 통과 → 상위 role 병기 불필요.
- Layer 1(EMPLOYEE/DEPT_MANAGER/ADMIN)은 라우트 가드, Layer 2(HR/FRANCHISE/FACILITY/IT)는 메뉴·버튼 노출에 사용(S2). 판정은 `hasRequiredRole` 단일 헬퍼로 통일한다.
- ADMIN은 위 전 메뉴에 접근 가능(RoleHierarchy 자동 포함) — 별도 ADMIN 전용 섹션 불필요.

---

## 🖼️ §B. 공통 레이아웃 셸 상세 스펙 (이 PRD의 핵심 산출물 · 이후 도메인 복제 표준)

> 기존 `src/shared/components/LayoutShell.tsx`(헤더=텍스트 로고+사용자명+로그아웃, 사이드바 3항목, 푸터 `© HARUON` placeholder)를 아래로 개선한다. shadcn 기본 토큰 사용, 커스텀 팔레트 없음.

### B-1. 헤더 (좌 → 우 배치)

1. **회사 로고(S1)** — 정적 이미지 asset. 클릭 시 홈(`/`) 이동. 텍스트 "HARUON" 병기 가능.
2. (스페이서)
3. **알림 벨(S3)** — 아이콘만. `aria-label` 부여, `disabled`/무동작 상태. `//todo: 알림 계약 확정 시 뱃지·드롭다운 연결`.
4. **채팅 App 버튼(S4)** — 아이콘/버튼만. 클릭 무동작(빈 상태). `//todo: 채팅 도메인 PRD에서 팝업/패널 연결`.
5. **프로필 아바타(F101)** — 작은 원형. 활성 `PROFILE_PICTURE` 있으면 이미지, 없으면 이름 이니셜 폴백. 클릭 → 내 정보 조회.
6. **사용자명(F102)** — `RETRIEVE_ME_INFO`의 `empBasicInfo.name`. 클릭 → 내 정보 조회.
7. **로그아웃(F110)** — 기존 `handleLogout` 유지(서버 실패해도 인메모리 clear + `/login`).

### B-2. 사이드바 (S2 — 2-Layer 권한 렌더링)

- 메뉴 정의를 **선언적 배열**(각 항목 `{ label, to, minRole, icon }`)로 두고, `hasRequiredRole(userRoles, item.minRole)` 참인 항목만 렌더 → 향후 도메인이 배열에 항목만 추가하면 노출 규칙이 자동 적용되는 **복제 표준**.
- 이번 항목: 홈 / 부서 멤버 목록 / 내 정보 (전부 `minRole: EMPLOYEE`).
- Layer 1/Layer 2 혼재 배열 그대로 지원(role 정규화는 authStore가 `ROLE_` 접두어 제거 후 단일 배열 제공 — auth PRD §A-4).

### B-3. 푸터 (S5)

- 정적 하드코딩: 회사명("하루온 그룹" 수준), 카피라이트, 필요 시 주소/대표 정적 문구. **API 의존 없음**(회사 정보 조회 기능ID 부재로 동적 연결 불가 — 정적 유지가 계약 정합).

### B-4. 프로필사진 로직 연결 (F101·F103 — 이후 이미지 뷰 복제 표준)

- **파일 식별**: 헤더 아바타(F101)는 `useMeQuery`가 이미 보유한 `RETRIEVE_ME_INFO`의 `activeFiles[]`를 우선 재사용(추가 호출 없음)해 `type === 'PROFILE_PICTURE'` 1건의 `file.fileId`를 사용한다. `RETRIEVE_FILES_INFOS`는 비활성 파일도 포함해 반환하므로, 이를 대체로 쓸 경우 `isActive === true` 필터가 필수다. 대상이 없으면 이니셜 폴백.
- **미지 type 방어**: 스니펫 response-fields는 `type`을 `String`으로만 기술하고 `PROFILE_PICTURE`/`SIGNATURE` 리터럴은 예시 응답에서만 확인된다. TS 유니온으로 타입화하되, 정의되지 않은 type 값은 안전하게 숨김 처리(방어적 폴백)한다.
- **바이너리 로딩(중요)**: `EMP_FILE_PREVIEW`는 경로에 `{empId}`·`{fileId}`를 요구하고 `Authorization: Bearer` 헤더가 필수 → **일반 `<img src>`로 직접 로드 불가**. axios(`withCredentials` 전역 인스턴스)로 `responseType: 'blob'` 조회 후 `URL.createObjectURL`로 `<img>`에 바인딩하고, 언마운트 시 `revokeObjectURL`로 해제한다. 이 blob-avatar 패턴을 **이후 모든 인증 필요 이미지 표시의 복제 표준**으로 삼는다.
- **타 사원 상세(F103)**: `RETRIEVE_EMP_INFO` 호출에 쓰는 `empId`가 이미 있으므로 `EMP_FILE_PREVIEW` 경로 구성에 문제 없음.
- **⚠️ 본인(F101·내 정보 F103) empId 공백 — 열린 항목**: `RETRIEVE_ME_INFO`/`RETRIEVE_FILES_INFOS` 응답에는 **numeric `empId`가 없고**(`empBasicInfo`에 `empNo` 문자열만 존재), 본인(me) 전용 preview 별칭 기능ID도 스니펫에 없다. 따라서 `EMP_FILE_PREVIEW`가 요구하는 `{empId}`를 본인 케이스에서는 확정 소스에서 얻을 수 없다.
  - **이번 스코프 처리**: 본인 아바타/내 정보 프로필사진은 **이니셜 폴백을 기본**으로 하고, empId 소스가 확정되면 이미지로 승격한다. 코드에 `//todo: 본인 preview용 numeric empId 소스 확정(서버가 me 전용 preview 기능 제공 or me 응답에 empId 추가) 필요` 플래그.
  - **추측 금지 원칙 준수**: 본인 전용 preview 기능ID·경로를 임의 발명하지 않는다. 확정 필요 시 사용자·백엔드와 논의.

---

## 📄 페이지별 상세 기능

### 공통 레이아웃 셸 (헤더/사이드바/푸터)

> **구현 기능:** `F101`, `F102`, `F110`, `S1`, `S2`, `S3`, `S4`, `S5` | **메뉴 위치:** 전역 프레임(모든 보호 페이지의 부모 라우트)

| 항목 | 내용 |
|---|---|
| **역할** | 모든 보호 페이지를 감싸는 지속 프레임. 이 PRD 핵심 개선 대상. 이후 도메인 뷰가 그대로 얹히는 레퍼런스 셸 |
| **진입 경로** | 로그인/세션복원 성공 후 모든 보호 라우트에서 상시 렌더(부모 라우트) |
| **접근 권한** | 최소 요구 role: `EMPLOYEE` / 서버 최종 판단: 없음 |
| **사용자 행동** | 로고·아바타·사용자명·사이드바로 이동, 알림 벨/채팅 버튼 인지(무동작), 로그아웃 |
| **주요 기능** | • 회사 로고(S1) • 사이드바 권한 렌더링(S2) • 알림 벨 placeholder(S3) • 채팅 버튼 placeholder(S4) • 프로필 아바타(F101) • 사용자명(F102) • 정적 푸터(S5) • **로그아웃** 버튼(F110) |
| **다음 이동** | 로고/아바타/사용자명 → 홈·내 정보 조회, 사이드바 → 해당 페이지, 로그아웃 → 로그인 페이지. 아바타 조회 실패 → 이니셜 폴백(오류 토스트 없음) |

### 홈 (대시보드 셸)

> **구현 기능:** `F102`, `F111` | **메뉴 위치:** 🏠 홈

| 항목 | 내용 |
|---|---|
| **역할** | 셸 최초 진입점 겸 세션 복원 검증 지점. 대시보드 콘텐츠 자체는 이번 스코프에서 최소(셸 시연 위주) |
| **진입 경로** | 로그인 성공 후, 부팅 세션 복원 성공 후, 헤더 로고 클릭 |
| **접근 권한** | 최소 요구 role: `EMPLOYEE` / 서버 최종 판단: 없음 |
| **사용자 행동** | 셸 내비게이션 확인, 사이드바로 각 페이지 이동 |
| **주요 기능** | • 헤더 사용자 표시(F102) • 세션 복원(F111, auth PRD 관할 · 참조) • 셸 내비게이션 |
| **다음 이동** | 사이드바 항목 → 각 페이지, 로그아웃 → 로그인 페이지 |

### 부서 멤버 목록 페이지

> **구현 기능:** `F104` | **메뉴 위치:** 👥 부서 멤버 목록

| 항목 | 내용 |
|---|---|
| **역할** | 특정 부서 멤버 목록 표시(`@tanstack/react-table`, 1페이지·페이징 UI 제외). 재정비: 셸 구조에 맞춘 위치·여백 정리 |
| **진입 경로** | 사이드바 "부서 멤버 목록" |
| **접근 권한** | 최소 요구 role: `EMPLOYEE`(`DEPT_MEMBERS`는 인증 사원 조회) / 서버 최종 판단: 없음 |
| **사용자 행동** | 멤버 목록 확인, 멤버 행 클릭 |
| **주요 기능** | • 부서 멤버 목록 조회(F104) • 멤버 행 → 상세 이동 |
| **다음 이동** | 행 클릭 → 사원 상세 페이지, 조회 실패 → 에러 토스트(sonner)/not-found UX(`*_NOT_FOUND_*`) |

### 사원 상세 페이지

> **구현 기능:** `F105`, `F103` | **메뉴 위치:** 부서 멤버 목록에서 진입(직접 메뉴 없음)

| 항목 | 내용 |
|---|---|
| **역할** | 타 사원 단건 조회 + **프로필사진 표시**(재정비 핵심). `EmployeeInfoView` 상단에 아바타 영역 추가 |
| **진입 경로** | 부서 멤버 목록 행 클릭 |
| **접근 권한** | 최소 요구 role: `EMPLOYEE`(`RETRIEVE_EMP_INFO`) / 서버 최종 판단: 없음 |
| **사용자 행동** | 사원 기본정보·소속정보·프로필사진 확인 |
| **주요 기능** | • 사원 단건 조회(F105) • 프로필사진 표시(F103, `activeFiles`의 `PROFILE_PICTURE`만, blob-avatar 패턴) |
| **다음 이동** | 목록 복귀, 미존재(`EMP_001` 등 `*_NOT_FOUND_*`) → not-found UX, 403 → 권한 부족 UX, 사진 조회 실패 → 이니셜 폴백 |

### 내 정보 조회 페이지

> **구현 기능:** `F106`, `F103` | **메뉴 위치:** 🙍 내 정보

| 항목 | 내용 |
|---|---|
| **역할** | 본인 상세 조회 + **프로필사진 표시**(재정비). 본인 상세는 `RETRIEVE_ME_INFO` 사용 |
| **진입 경로** | 사이드바 "내 정보", 헤더 프로필 아바타/사용자명 클릭 |
| **접근 권한** | 최소 요구 role: `EMPLOYEE`(본인) / 서버 최종 판단: 없음 |
| **사용자 행동** | 본인 정보·프로필사진 확인, "수정" 이동 |
| **주요 기능** | • 본인 정보 조회(F106) • 프로필사진 표시(F103 · **본인 empId 공백 열린 항목** §B-4 → 확정 전 이니셜 폴백) • **수정** 버튼 |
| **다음 이동** | 수정 → 내 정보 수정 페이지, 조회 실패 → 에러 토스트(sonner), 사진 조회 실패/empId 미확정 → 이니셜 폴백 |

### 내 정보 수정 페이지

> **구현 기능:** `F112` | **메뉴 위치:** 내 정보 조회에서 진입(직접 메뉴 없음)

| 항목 | 내용 |
|---|---|
| **역할** | 본인 개인정보 수정(대표 mutation). 기존 `UpdateMePage`/`UpdateMeForm` 유지 — 재정비 스코프에서 로직 변경 없음(셸 정합만) |
| **진입 경로** | 내 정보 조회 "수정" 버튼 |
| **접근 권한** | 최소 요구 role: `EMPLOYEE`(본인)(`UPDATE_SELF_INFO`) / 서버 최종 판단: 없음 |
| **사용자 행동** | 수정 폼 입력, 저장 제출 |
| **주요 기능** | • 내 정보 수정 폼(RHF+zod)(F112) • 성공 시 `employeeKeys.me()` invalidate • **저장** 버튼 |
| **다음 이동** | 성공(204) → 내 정보 조회 재조회, 검증 실패(`VALIDATION_ERROR`/`COMMON_00x`) → 폼 필드 에러, 그 외 → 에러 토스트(sonner) |

> **참고**: 로그인/회원가입/승인 대기 페이지는 auth 스코프(`auth-walking-skeleton-prd.md`) 관할이며 이 PRD에서 재정의하지 않는다(셸 밖 비인증 라우트로 그대로 유지).

---

## 🗂️ 참조 계약 매핑

> 필드는 `back/build/generated-snippets/<기능ID>/`의 response-fields·response-body를 **직접 대조**해 기술(추측 아님). TS 타입명은 프론트 네이밍 제안이며 필드명·타입·제약은 스니펫 원천을 따른다.

| 페이지 | 도메인 스킬 | 근거 기능ID | 핵심 DTO/타입 · 필드(스니펫 실측) | 비고 |
|---|---|---|---|---|
| 공통 셸(헤더 아바타) | employee · file | `RETRIEVE_ME_INFO`(우선), `RETRIEVE_FILES_INFOS`(대체), `EMP_FILE_PREVIEW` | `EmpFileInfo[] { file{ fileId:number, originalName, extension, fileSize:number }, type:('PROFILE_PICTURE'\|'SIGNATURE'), isActive:boolean }` / preview는 `image/*` **바이너리**(`Content-Disposition: inline`) | 프로필사진 = `type==='PROFILE_PICTURE' && isActive`(`RETRIEVE_ME_INFO.activeFiles`는 이미 활성만 반환, `RETRIEVE_FILES_INFOS`는 비활성 포함이라 대체 시 필터 필수). preview는 Bearer 필수 → **blob+objectURL**(§B-4). **본인 empId 소스 공백 = 열린 항목** |
| 공통 셸(사용자명) | employee | `RETRIEVE_ME_INFO` | `EmployeeInfoResponse { empBasicInfo{ empNo, name, loginId, email, extensionNo(nullable) }, activeFiles[], currentDepts[] }` | `empBasicInfo.name` 사용. **numeric empId 없음**(§B-4 열린 항목 근거) |
| 부서 멤버 목록 | employee · org | `DEPT_MEMBERS` | Spring `Page<DeptMemberResponse>`: `content[]{ empId:number, empNo, empName, extensionNo, email, position }` + 페이징 메타 | path `deptId`, query 전부 optional. 1페이지만·페이징 UI 제외 |
| 사원 상세 | employee · file | `RETRIEVE_EMP_INFO`, `EMP_FILE_PREVIEW` | `EmployeeInfoResponse`(me와 동일 스키마). `activeFiles[].type` = `PROFILE_PICTURE`/`SIGNATURE` | path `empId` 보유 → preview 경로 구성 가능. **SIGNATURE는 숨김**, PROFILE_PICTURE만 표시 |
| 내 정보 조회 | employee · file | `RETRIEVE_ME_INFO`, `EMP_FILE_PREVIEW` | `EmployeeInfoResponse`(사원 상세와 동일 구조) | 본인 전용(전용 auth 조회 기능ID 미존재, `RETRIEVE_ME_INFO` 사용). **본인 empId 공백 열린 항목**(§B-4) |
| 내 정보 수정 | employee | `UPDATE_SELF_INFO` | `UpdateSelfInfoRequest { extensionNo:string; newRawPassword:string }`(둘 다 required, 서버 제약은 스니펫·기존 `updateMeSchema` 준수) | 204·응답 body 없음. 기존 구현 유지 |
| 푸터 / 알림 / 채팅 | — | **없음** | — | S3(알림 API 부재)·S4(채팅 이번 제외)·S5(회사 정보 GET 라우트는 존재하나 기능ID·필드 계약 미문서화) 모두 **API 미연결 셸 요소**. 파일 정책 필요 시 `@../docs/도메인모델.md` + `@docs/backend-contract/file-upload.md` |

---

## 🛠️ 기술 스택

CLAUDE.md §6 스택 그대로 사용(React 19+Vite / React Router 7 / axios / @tanstack/react-query / zustand / react-hook-form+zod / @tanstack/react-table / shadcn·Tailwind / sonner / dayjs). 아바타/아이콘은 shadcn(Avatar 등) + lucide 아이콘 범위 내. **추가 라이브러리 도입 금지 — 필요 시 사용자와 논의.**

---

## ✅ 정합성 검증 체크리스트 (실행 결과)

**🔍 1단계: 기능 명세 → 페이지 연결**
- F101→공통 셸(헤더) ✅ / F102→공통 셸·홈 ✅ / F103→사원 상세·내 정보 조회 ✅ / F104→부서 멤버 목록 ✅ / F105→사원 상세 ✅ / F106→내 정보 조회 ✅ / F110→공통 셸(헤더) ✅ / F111→홈·전역(auth 참조) ✅ / F112→내 정보 수정 ✅. S1~S5→공통 셸 ✅. 모든 관련 페이지 실존.

**🔍 2단계: 메뉴 → 페이지**
- 홈(F102/F111)·부서 멤버 목록(F104)·내 정보(F106) 3개 사이드바 항목 모두 대응 페이지 존재 ✅. 헤더 로고(S1)/아바타(F101)/사용자명(F102)/알림(S3)/채팅(S4)/로그아웃(F110) 전부 기능 명세에 정의 ✅. Layer 2 자리표시는 **실 메뉴 항목을 배치하지 않아 고아 메뉴 없음** ✅.

**🔍 3단계: 페이지 → 역참조**
- 5개 상세 페이지(공통 셸/홈/부서 멤버 목록/사원 상세/내 정보 조회/내 정보 수정)의 모든 F·S ID가 기능 명세에 정의 ✅. 모든 페이지 진입 경로 명시·접근 가능 ✅. 접근 권한 항목 전 페이지 존재 ✅.

**🔍 4단계: 계약 근거**
- API 기반 기능 근거 기능ID 전부 `api-endpoint.md`/스니펫 실존 확인: `RETRIEVE_FILES_INFOS`·`EMP_FILE_PREVIEW`·`RETRIEVE_ME_INFO`·`RETRIEVE_EMP_INFO`·`DEPT_MEMBERS`·`UPDATE_SELF_INFO`·`LOGOUT`·`REISSUE_TOKEN` ✅. 근거 없는 발명 기능 없음 ✅.
- S1~S5는 **의도적으로 API 없음**(사용자 확정 결정): 알림 API 부재(S3)·채팅 스코프 제외(S4)·회사 정보 GET 라우트는 존재하나 기능ID·필드 계약 미문서화(S5)·정적 asset/헬퍼(S1/S2). 발명이 아니라 "API 미연결 셸 요소"로 명시 ✅.

**🔍 5단계: 누락/고아**
- 고아 기능·페이지·메뉴 없음 ✅. 프로필사진 표시(F103)는 사원 상세·내 정보 조회 두 뷰에서 `EmployeeInfoView` 단일 컴포넌트로 구현(분산 방지) ✅.
- **열린 항목(고아 아님, 명시적 리스크)**: 본인 프로필사진 preview용 numeric empId 소스 공백(§B-4) — 확정 전 이니셜 폴백, `//todo` 플래그. 타 사원 상세는 정상. 추측 경로 발명 금지.

**결과: 5단계 전부 통과(열린 항목 1건 명시).**
```
