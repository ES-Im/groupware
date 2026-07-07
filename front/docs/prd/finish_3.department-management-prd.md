# 부서(조직) 관리 Frontend MVP PRD

> 이 PRD는 `api-endpoint.md`의 **"EMP LEAVE / DEPT API"** 섹션 중 `DEPTS`/`DEPT_INFO`/`DEPT_MEMBERS`/`DEPT_REGISTER`/`DEPT_ACTIVATE`/`DEPT_DEACTIVATE`/`DEPT_UPDATE_NAME`/`DEPT_UPDATE_PARENT`/`DEPT_APPOINT_LEADER`/`DEPT_END_LEADER` 9개 기능ID(부서 자체의 CRUD·계층·부서장 관리)만 다룬다.
> 같은 섹션의 `DEPT_ATTENDANCE_*`/`DEPT_LEAVE_REQUEST_HISTORY`/`DEPT_BUSINESS_TRIP_REQUEST_HISTORY`/`DEPT_EMP_LEAVE_*`는 부서를 조회 축으로 쓸 뿐 실제로는 근태/휴가 도메인 기능이라(기존 `sidebarMenuItems.ts`도 이들을 "근태"·"휴가 관리" 그룹에 배치) 이 PRD 범위에서 제외하고 해당 도메인 PRD가 담당한다.
> 공통 레이아웃 셸(헤더·사이드바·푸터)과 인증 배관은 `2.shell-and-employee-view-prd.md` / `finish_1.auth-walking-skeleton-prd.md`를 참조하며 재서술하지 않는다. 전역 계약(인증·에러·페이징·날짜)은 CLAUDE.md §7 `BACK-END 계약 문서` 관할이다.

---

## 🎯 핵심 정보

- **목적**: 전사 부서 목록·상세(부서장·멤버)를 열람하고, `ADMIN`이 부서 등록·활성화/비활성화·부서명/상위부서 변경·부서장 지정/종료를 수행하는 조직 관리 화면을 구성한다.
- **사용자**: 열람은 `EMPLOYEE` 최소 등급 전체 공통. 관리 액션(등록/활성화/비활성화/이름변경/상위부서변경/부서장 지정·종료)은 `ADMIN` 전용.

---

## 🚶 사용자 여정

```
[비인증/세션복원 흐름] — auth-walking-skeleton-prd.md 관할(재서술 안 함)

[사이드바 "조직도"] → 부서 목록 페이지
  ├ 검색(부서명 keyword) / 활성상태 필터 / 페이징
  ├ (ADMIN만 노출) "부서 등록" 버튼 → 등록 다이얼로그 제출 → 성공 → 목록 재조회
  └ 부서 행 클릭 → 부서 상세 페이지
        ├ 부서 기본정보 · 부서장 정보 · 부서 멤버 목록 확인
        ├ 멤버 행 클릭 → 사원 상세 페이지(EMP 도메인, 기존 화면 그대로 재사용)
        └ (ADMIN만 노출) 관리 액션
              ├ 활성화 ↔ 비활성화 토글 → 성공 → 상세 재조회
              ├ 부서명 변경 다이얼로그 → 성공 → 상세 재조회
              ├ 상위 부서 변경 다이얼로그 → 성공 → 상세 재조회
              ├ 부서장 지정 다이얼로그 → 성공 → 상세 재조회
              └ 현재 부서장 종료 → 성공 → 상세 재조회
```

**권한 분기점**

- 라우트 가드(Layer 1): 미인증 → 로그인 리디렉션(auth PRD 관할). 부서 목록·부서 상세 **열람**은 최소 요구 role `EMPLOYEE`.
- 관리 액션 노출(Layer 1): `hasRequiredRole(userRoles, 'ADMIN')` 참일 때만 등록 버튼·관리 액션 UI를 렌더(`EMPLOYEE`/`DEPT_MANAGER`는 열람 전용, 관리 UI 자체가 보이지 않음).
- 서버 최종 판단: 관리 액션 엔드포인트는 전부 `ADMIN` 단일 role 판정이며(같은 부서 조건 없음), UI 우회 호출 시 403은 일반 권한 부족 UX로 처리한다. 이 도메인엔 `ROLE_003`(부서 불일치) 유발 기능이 없다.

---

## ⚡ 기능 명세

### 1. MVP 핵심 기능

| ID | 기능명 | 설명 | 근거 기능ID | 관련 페이지 |
|---|---|---|---|---|
| **[F201]** | 부서 목록 조회 | 전체 부서 목록(부서 기본정보+부서장 요약) 조회. keyword/isActive 필터 + 페이징 | `DEPTS` | 부서 목록 페이지 |
| **[F202]** | 부서 기본정보 조회 | 단일 부서 기본정보(코드/이름/활성여부/상위부서ID) + 부서장 정보 조회. **부서장 미지정 시 서버가 `deptLeader`를 JSON null이 아니라 전 필드 null 객체로 반환**(실측, §계약 매핑 비고) → 프론트는 `empName` 존재 여부로 공석을 판별해 "부서장 미지정" 빈 상태로 표시 | `DEPT_INFO` | 부서 상세 페이지 |
| **[F203]** | 부서 멤버 목록 조회 | 특정 부서 소속 멤버 목록 조회(keyword/isEmpActive 필터). 멤버 행 클릭 → 사원 상세 이동 | `DEPT_MEMBERS` | 부서 상세 페이지 |
| **[F204]** | 부서 등록 | 신규 부서 등록(부서코드 3자리 숫자, 부서명 20자 이하). ADMIN 전용 | `DEPT_REGISTER` | 부서 목록 페이지 |
| **[F205]** | 부서 활성화/비활성화 | 부서 활성·비활성 토글. ADMIN 전용. 하드 삭제 기능은 계약에 없음(비활성화로 대체) | `DEPT_ACTIVATE`, `DEPT_DEACTIVATE` | 부서 상세 페이지 |
| **[F206]** | 부서명 변경 | 부서명 수정. ADMIN 전용 | `DEPT_UPDATE_NAME` | 부서 상세 페이지 |
| **[F207]** | 상위 부서 변경 | 부서 계층상 상위 부서 재지정(활성 부서 목록에서 선택, 자기 자신은 후보에서 제외) 또는 **선택 해제 시 최상위 부서로 이동**(`parentDeptId`는 계약상 optional — 미입력 시 서버가 최상위로 전환). 순환 참조 등 심화 검증은 서버 위임. ADMIN 전용 | `DEPT_UPDATE_PARENT` | 부서 상세 페이지 |
| **[F208]** | 부서장 지정 | 부서 멤버 중 1인을 부서장으로 지정(지정일 포함). ADMIN 전용 | `DEPT_APPOINT_LEADER` | 부서 상세 페이지 |
| **[F209]** | 현재 부서장 종료 | 현재 부서장 임기 종료(종료일 포함). ADMIN 전용 | `DEPT_END_LEADER` | 부서 상세 페이지 |

### 2. MVP 필수 지원 기능 — 신규 기능ID 없음(기존 셸/인증 재사용, 참조만)

이 PRD의 두 페이지는 기존 공통 레이아웃 셸(`2.shell-and-employee-view-prd.md`)의 보호 라우트 하위에 얹힌다. 로그인·세션복원·로그아웃은 재서술하지 않는다.

### 3. MVP 이후 기능 (이번 PRD 명시적 제외)

- **조직도 트리/그래프 시각화** — 계약은 `parentDeptId` 평면 필드만 제공. 트리 렌더링 컴포넌트는 현재 스택(§6 CLAUDE.md)에 없어 별도 논의 필요. MVP는 목록(표) + 상위부서ID 텍스트 표기로 대체.
- **부서 하드 삭제** — 계약에 존재하지 않음(`DEPT_ACTIVATE`/`DEPT_DEACTIVATE`만 존재).
- **사원의 소속 부서 변경(전보)** — `employee` 도메인 기능(`DEPT_MANAGER_UPDATE_EMP_INFO`)이며 `DEPT API` 그룹에 속하지 않아 이 PRD 범위 밖.
- **부서 근태/휴가 관련 조회**(`DEPT_ATTENDANCE_*`, `DEPT_LEAVE_REQUEST_HISTORY`, `DEPT_BUSINESS_TRIP_REQUEST_HISTORY`, `DEPT_EMP_LEAVE_*`) — 근태/휴가 도메인 PRD 담당.
- 테마/다크모드, 다국어(i18n), 프로필 커스터마이징.

---

## 📱 메뉴 구조

```
📱 HARUON 내비게이션 (EMPLOYEE 공통 · 최소 요구 role 표기)
├── 🏠 홈
├── 🏢 조직도 — F201 (→ 부서 상세 F202·F203 진입)
├── 👥 부서 멤버 목록 (기존, PRD §2 — 본인 소속 부서 바로가기, 변경 없음)
└── 🙍 내 정보

📊 부서 상세 페이지 내 ADMIN 전용 관리 액션(별도 메뉴 항목 아님)
└── 부서 등록(F204) · 활성화/비활성화(F205) · 이름변경(F206) · 상위부서변경(F207) · 부서장 지정(F208) · 부서장 종료(F209)
```

- 신규 메뉴 "조직도"는 Layer 1 공통 배열에 `minRole: EMPLOYEE`로 추가한다(기존 "부서 멤버 목록"과 별개 — 후자는 본인 소속 부서만 자동 표시하는 개인 바로가기, "조직도"는 전사 부서를 열람·탐색하는 디렉터리다. 동일 `DEPT_MEMBERS` 기능ID를 두 화면이 각기 다른 deptId 출처로 재사용하는 것은 의도된 설계이며 기능 발명이 아니다).
- 관리 액션은 별도 사이드바 항목이 아니라 부서 상세 페이지 안에서 `hasRequiredRole(roles, 'ADMIN')` 조건부 렌더로 노출한다(S2 표준과 동일 헬퍼, 페이지 내부 버튼 단위 게이팅).
- ADMIN은 RoleHierarchy상 전 메뉴 자동 접근(별도 표기 불필요).

---

## 📄 페이지별 상세 기능

### 부서 목록 페이지

> **구현 기능:** `F201`, `F204` | **메뉴 위치:** 🏢 조직도

| 항목 | 내용 |
|---|---|
| **역할** | 전사 부서 목록 열람(부서코드/부서명/활성여부/부서장 요약). ADMIN에게는 신규 부서 등록 진입점 제공 |
| **진입 경로** | 사이드바 "조직도" |
| **접근 권한** | 최소 요구 role: `EMPLOYEE`(열람, `DEPTS`) / 관리: `ADMIN`(등록 버튼 노출, `DEPT_REGISTER`) / 서버 최종 판단: 없음 |
| **사용자 행동** | 부서명 검색, 활성상태 필터, 페이지 이동, 부서 행 클릭, (ADMIN) "부서 등록" 버튼 클릭 → 다이얼로그 입력·제출 |
| **주요 기능** | • 부서 목록 조회(F201, keyword/isActive/page/size) • 목록의 부서장 요약 열도 F202와 동일한 공석 판별 규칙 적용(`deptLeader.empName` 없으면 "미지정" 표시, all-null 객체를 그대로 렌더하지 않음) • (ADMIN) 부서 등록 다이얼로그(F204, RHF+zod: 부서코드 3자리 숫자·부서명 20자 이하) |
| **다음 이동** | 행 클릭 → 부서 상세 페이지, 등록 성공(204) → 다이얼로그 닫힘 + 목록 invalidate + 성공 토스트, 등록 검증 실패 → 폼 필드 에러, 조회 실패 → 에러 토스트(sonner) |

### 부서 상세 페이지

> **구현 기능:** `F202`, `F203`, `F205`, `F206`, `F207`, `F208`, `F209` | **메뉴 위치:** 부서 목록에서 진입(직접 메뉴 없음)

| 항목 | 내용 |
|---|---|
| **역할** | 단일 부서의 기본정보·부서장·멤버 목록 열람. ADMIN에게는 부서 자체의 상태·계층·부서장을 관리하는 액션 제공 |
| **진입 경로** | 부서 목록 페이지 행 클릭 |
| **접근 권한** | 최소 요구 role: `EMPLOYEE`(열람, `DEPT_INFO`/`DEPT_MEMBERS`) / 관리: `ADMIN`(그 외 전 액션) / 서버 최종 판단: 없음(부서 불일치 조건 없는 순수 role 판정) |
| **사용자 행동** | 기본정보·부서장(또는 "부서장 미지정" 빈 상태)·멤버 목록 확인, 멤버 검색/페이지 이동, 멤버 행 클릭, (ADMIN) 활성화/비활성화 토글·이름변경 다이얼로그·상위부서변경 다이얼로그·부서장 지정 다이얼로그·부서장 종료 버튼 |
| **주요 기능** | • 부서 기본정보 조회(F202, 부서장 공석 빈 상태 포함) • 부서 멤버 목록 조회(F203, 기존 `useDepartmentMembersQuery`/`DepartmentMembersTable` 재사용, deptId는 라우트 파라미터) — **F202/F203은 독립된 쿼리**이므로 멤버 검색·페이지 이동이 좌측 부서 기본정보 카드의 재로딩·깜빡임을 유발해서는 안 됨(멤버 목록 영역만 자체 로딩 상태 표시) • (ADMIN) 활성화/비활성화(F205) • (ADMIN) 부서명 변경(F206) • (ADMIN) 상위 부서 변경(F207) • (ADMIN) 부서장 지정(F208) • (ADMIN) 부서장 종료(F209) |
| **다음 이동** | 멤버 행 클릭 → 사원 상세 페이지(EMP 도메인 재사용), 관리 액션 성공(204) → 부서 상세 재조회(invalidate) + 성공 토스트, 관리 액션 검증 실패 → 폼 필드 에러, 존재하지 않는 deptId(`*_NOT_FOUND_*`) → not-found UX, 부서 기본정보 미도착 상태에서는 화면을 렌더하지 않고 로딩 유지(데이터 없이 하위 필드 접근 금지), 그 외 실패 → 에러 토스트(sonner) |

> **참고**: 로그인/회원가입/승인 대기, 공통 셸(헤더·사이드바·푸터), 부서 멤버 목록(본인 바로가기)/사원 상세/내 정보는 각각 `finish_1.auth-walking-skeleton-prd.md`/`2.shell-and-employee-view-prd.md` 관할이며 이 PRD에서 재정의하지 않는다.

---

## 🗂️ 참조 계약 매핑

> 필드는 `back/build/generated-snippets/<기능ID>/`의 response-fields·request-fields를 직접 대조해 기술(추측 아님).

| 페이지 | 도메인 스킬 | 근거 기능ID | 핵심 DTO/타입 · 필드(스니펫 실측) | 비고 |
|---|---|---|---|---|
| 부서 목록 페이지 | org | `DEPTS` | `Page<DeptSummary>{ content[]{ deptInfoResponse{deptId:number, deptCode, deptName, isActive:boolean, parentDeptId:number\|null}, deptLeader:DeptLeaderWire } }` + 페이징 메타 | query: keyword/isActive/page/size 전부 optional. `deptLeader` 필드는 아래 "부서장 공석 wire 계약" 참조 |
| 부서 목록 페이지(등록) | org | `DEPT_REGISTER` | `DeptRegisterRequest{ deptCode:string(3자리 숫자, required), deptName:string(20자 이하, required) }` | `204` Empty |
| 부서 상세 페이지(기본정보) | org | `DEPT_INFO` | `DeptDetail{ deptInfoResponse{deptId, deptCode, deptName, isActive, parentDeptId}, deptLeader:DeptLeaderWire }` | path `deptId`. `deptLeader` 필드는 아래 "부서장 공석 wire 계약" 참조 |
| 부서 상세 페이지(멤버 목록) | org | `DEPT_MEMBERS` | `Page<DeptMemberResponse>{ content[]{empId:number, empNo, empName, extensionNo, email, position} }` + 페이징 메타 | path `deptId` + query keyword/isEmpActive/page/size optional. 기존 `useDepartmentMembersQuery` 훅 재사용(deptId 출처만 route param으로 교체). **`DEPT_INFO`와 별개 쿼리로 관리**(쿼리키에 keyword/page/size 포함) — 검색·페이징 변경이 `DEPT_INFO` 쿼리를 재요청/재로딩시켜서는 안 됨 |
| 부서 상세 페이지(활성화/비활성화) | org | `DEPT_ACTIVATE`, `DEPT_DEACTIVATE` | 요청/응답 body 없음(path `deptId`만) | `204` Empty |
| 부서 상세 페이지(이름변경) | org | `DEPT_UPDATE_NAME` | query `newName:string` | `204` Empty |
| 부서 상세 페이지(상위부서변경) | org | `DEPT_UPDATE_PARENT` | query `parentDeptId:number`(**optional** — 미전달 시 서버가 최상위로 전환) | `204` Empty. 후보 목록은 F201(`DEPTS`, isActive=true) 재조회로 구성 + "최상위로 이동" 옵션(선택 해제) 포함 |
| 부서 상세 페이지(부서장 지정) | org | `DEPT_APPOINT_LEADER` | query `leaderEmpId:number`, `appointedAt:string`(**`yyyy-MM-dd`**, 스니펫 실측) | `204` Empty |
| 부서 상세 페이지(부서장 종료) | org | `DEPT_END_LEADER` | query `endAt:string`(**`yyyy-MM-dd`**, 스니펫 실측) | `204` Empty |

**부서장 공석 wire 계약 (`DeptLeaderWire`, `DEPTS`/`DEPT_INFO` 공통 — 실측 확정 사항)**

- 스니펫 response-fields는 `deptLeader.empId`(Number)·`empName`(String) 등을 표면상 non-null 필드로만 기술하지만, **실측(`GET /api/departments/{deptId}` 응답) 결과 부서장 미지정 부서는 `deptLeader` 자체가 JSON `null`이 아니라 모든 필드가 `null`인 객체**(`{empId:null, empNo:null, empName:null, extensionNo:null, email:null, position:null}`)로 내려온다.
- 따라서 타입은 `DeptLeaderWire = { empId: number|null; empNo: string|null; empName: string|null; extensionNo: string|null; email: string|null; position: string|null }`처럼 **wire 그대로 전 필드 nullable**로 선언하고, `empName`(또는 `empId`) 유무로 공석을 판별해 화면 전용 타입(`DeptLeader | null`)으로 정규화한 뒤에만 non-null로 좁힌다. `deptId===null`만으로 판별하지 않는다.
- 공석 판별 결과는 부서 목록(F201, 부서장 요약 열)·부서 상세(F202, 부서장 섹션) 양쪽에서 "부서장 미지정" 빈 상태로 표시하며, all-null 객체의 필드 값을 그대로 렌더하지 않는다(빈 문자열/“null” 텍스트 노출 금지).
- F209(현재 부서장 종료) 성공 직후 재조회되는 부서 상세도 이 규칙을 그대로 따른다.

---

## 🛠️ 기술 스택

CLAUDE.md §6 스택 그대로 사용(React 19+Vite / React Router 7 / axios / @tanstack/react-query / zustand / react-hook-form+zod / @tanstack/react-table / shadcn Dialog·Table·Switch·Combobox 등 + Tailwind / sonner / dayjs). **추가 라이브러리 도입 금지 — 필요 시 사용자와 논의.**

---

## ✅ 정합성 검증 체크리스트 (실행 결과)

**🔍 1단계: 기능 명세 → 페이지 연결**
F201→부서 목록 페이지 ✅ / F202·F203→부서 상세 페이지 ✅ / F204→부서 목록 페이지 ✅ / F205~F209→부서 상세 페이지 ✅. 모든 관련 페이지 실존.

**🔍 2단계: 메뉴 → 페이지**
"조직도"(F201) → 부서 목록 페이지 존재 ✅. 부서 상세 페이지는 직접 메뉴가 없고 부서 목록에서만 진입하도록 명시(고아 메뉴 아님) ✅.

**🔍 3단계: 페이지 → 역참조**
부서 목록 페이지(F201, F204)·부서 상세 페이지(F202, F203, F205~F209) 전부 기능 명세에 정의됨 ✅. 두 페이지 모두 진입 경로·접근 권한 항목 존재 ✅.

**🔍 4단계: 계약 근거**
9개 기능 전부 `api-endpoint.md` "EMP LEAVE / DEPT API" 섹션에 실존 확인(`DEPTS`/`DEPT_INFO`/`DEPT_MEMBERS`/`DEPT_REGISTER`/`DEPT_ACTIVATE`/`DEPT_DEACTIVATE`/`DEPT_UPDATE_NAME`/`DEPT_UPDATE_PARENT`/`DEPT_APPOINT_LEADER`/`DEPT_END_LEADER`) ✅. 근거 없는 발명 기능 없음 ✅.

**🔍 5단계: 누락/고아**
고아 기능·페이지·메뉴 없음 ✅. `DEPT_MEMBERS`가 이 PRD(F203)와 §2 PRD(F104, 부서 멤버 목록)에 중복 등장하는 것은 **의도된 1:N 재사용**(서로 다른 화면 목적·deptId 출처)이며 분산이 아님을 명시 ✅. 근태/휴가 관련 DEPT API는 고의 제외로 명시(누락 아님) ✅.

**결과: 5단계 전부 통과.**

---

## 🔧 개정 이력 — 검증/리뷰 피드백 반영

`groupware-prd-validator` 문서 검증(조건부 통과: Major 1건 + Minor 3건)과, 선구현된 부서 상세 화면 코드에 대한 `code-reviewer` 리뷰에서 나온 지적을 계약 관점으로 반영했다.

- **F202/F201 + 참조 계약 매핑**: `deptLeader` 공석 시 all-null 객체로 오는 실측 wire 계약과 정규화 지침("부서장 공석 wire 계약" 절)을 명시(validator Major, code-reviewer 타입 안전성 지적의 공통 근본 원인).
- **F207 + 참조 계약 매핑**: `DEPT_UPDATE_PARENT`의 `parentDeptId`가 optional(미입력 시 최상위 이동)임을 반영, "최상위로 이동" 옵션을 UX에 포함(validator Minor #1).
- **참조 계약 매핑(부서장 지정/종료)**: `appointedAt`/`endAt` 날짜 포맷을 스니펫 실측치 `yyyy-MM-dd`로 직접 명시(validator Minor #2).
- **MVP 이후 기능 제외 목록**: 전보 기능 참조를 라우트(`PATCH /api/employees/*/dept-managed-info`)에서 기능ID(`DEPT_MANAGER_UPDATE_EMP_INFO`)로 교체(validator Minor #3, URL 노출 금지 원칙 준수).
- **부서 상세 페이지 상세**: `DEPT_INFO`(F202)와 `DEPT_MEMBERS`(F203)가 독립 쿼리이며, 멤버 검색·페이징이 부서 기본정보 카드를 재로딩시켜서는 안 된다는 점과, 부서 기본정보 미도착 상태에서 하위 필드에 접근하지 않는다는 점을 명시(code-reviewer: 로딩 게이트 전체 언마운트·`data!` non-null 단언 지적의 스펙 근거).
