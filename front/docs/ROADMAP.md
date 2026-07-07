# HARUON Auth Walking Skeleton (EMP 대표 슬라이스) Frontend 개발 ROADMAP

> 출처 PRD: `docs/prd/finish_1.auth-walking-skeleton-prd.md`(M0~M3) · `docs/prd/2.shell-and-employee-view-prd.md`(M4~M5, 공통 셸 재정비 + EMP 뷰 프로필사진) · `docs/prd/3.department-management-prd.md`(M6~M9, 부서(조직) 관리 — 목록/상세 열람 + ADMIN 관리 액션) · `docs/prd/4.board-slice-prd.md`(M10~M15, 게시판 세로 슬라이스 — 목록/상세/작성/수정/댓글/임시저장함 + 페이징·파일 첨부 표준 확정)
> 이 로드맵은 PRD를 **실행 순서·의존성·태스크**로 전개한 것이다. 기능/계약의 사실 원천은 PRD와 백엔드 계약 문서이며, 여기서는 **무엇을 어떤 순서로 만들지**만 다룬다.
> 계약·전역 규칙(reissue 로직, dayjs, 페이징 +1, ApiError 구조, withCredentials, 에러코드→UI 매핑)과 필드/DTO 상세는 재서술하지 않는다 — PRD 본문·§참조 계약 매핑·`generated-snippets`를 가리킨다.

---

## 🗺️ 개요

**📅 최종 업데이트**: 2026-07-07
**📊 진행 상황**: 51/51 Tasks 완료 (게시판 슬라이스까지) — M0 ✅ / M1 ✅ / M2 ✅ / M3 ✅ / M4 ✅ / M5 ✅ / M6 ✅ / M7 ✅ / M8 ✅ / M9 ✅ (부서 관리 완료) · **M10 ✅ / M11 ✅ / M12 ✅ / M13 ✅ / M14 ✅ / M15 ✅ (17/17, 게시판 슬라이스 완료)**
> M0~M3(auth 워킹 스켈레톤, 17/17)은 완료됐다. M4~M5는 그 완료된 배관 위에 얹는 **공통 셸 재정비 + EMP 뷰 프로필사진**(2번째 PRD) 스코프로, 배관을 재작업하지 않는다.
> **M6~M9는 3번째 PRD(부서 관리) 스코프**다. §아키텍처 배관 섹션이 없는 PRD이므로(배관은 M0에서 확정) **배관 마일스톤 없이 곧바로 도메인 세로 슬라이스로 시작**한다 — 목록 조회(M6) → 상세 열람(M7) → 등록 mutation(M8) → 관리 mutation(M9). 완료된 M0~M5 배관·셸·EMP 뷰(react-table·`departmentKeys`·`DepartmentDetailView`·`hasRequiredRole`·blob-avatar)를 재작업 없이 소비·복제한다.
> **M10~M15는 4번째 PRD(게시판 세로 슬라이스) 스코프**다. 역시 §아키텍처 배관 섹션이 없는 PRD(배관은 M0 확정)이므로 **별도 배관 마일스톤 없이 도메인 세로 슬라이스로 시작**하되, 이 PRD는 **이후 모든 목록형·파일 첨부 도메인이 복제할 두 표준을 최초 확정**하는 점이 특수하다 — (흡수①) **재사용 페이징 표준**(Spring `Page` 메타 기반 컨트롤·`DepartmentDetailView`의 인라인 페이징을 공유 훅/컴포넌트로 승격), (흡수②) **파일 업로드/다운로드/인라인 미리보기 표준**(M5 objectURL 생명주기 표준 재사용). 두 표준은 walking-skeleton 원칙에 따라 **별도 배관 마일스톤에 모아두지 않고 각 표준의 최초 소비처(페이징=M10 목록, 다운로드/미리보기=M11 상세, 업로드=M13 수정)에서 확립**한다(M5가 blob-avatar 표준을 T5.1 첫 소비처에서 세운 것과 동일 관행). 여정 순서: 목록(M10) → 상세(M11) → 작성+임시저장글 불러오기(M12) → 수정+첨부(M13) → 댓글(M14) → 내 임시저장함(M15). `boardKeys`·`categoryKeys` 팩토리 신설이 선행 배관 태스크다.
> **복잡도·중요도·split 판단은 development-planner 산출물에 포함하지 않는다** — M6~M15 표의 `중요도`/`복잡도` 칸은 태스크 착수 시 `task-planner`(Shrimp)가 채운다(M0와 동일 관행). M10~M15는 아직 미착수라 값이 비어 있고 `완료 여부`는 ☐다.

- **전략**: walking-skeleton-first — 이 PRD 자체가 "정답 템플릿" 골격이므로, 배관(M0)을 먼저 세우고 그 위에 인증(M1)·조회(M2)·mutation(M3) 세로 슬라이스를 순서대로 관통시킨다.
- **핵심 목표(PRD 재확인)**: login → 인터셉터(JWT 부착 / 401·`ROLE_002` → reissue → 원요청 재시도) → protected route → 레이아웃 셸 배관을, 대표 도메인 EMP(목록/상세/생성/mutation 1개)로 **실제 작동 증명**.
- **범위 경계**: PRD "MVP 이후 기능(제외)"은 로드맵 범위 밖 → §📦 백로그 참조로만 표기(태스크화 금지).
- **완료 게이트(전 마일스톤 공통)**: `npm run check-all` 통과 + `npm run build` 성공 (CLAUDE.md §9 체크리스트).
- **F004/F013 처리**: 동일 기능ID `REGISTER`의 두 관점 → **단일 회원가입 흐름**으로 한 번만 태스크화(중복 금지). 로드맵에서는 T1.5 하나로 관리.

---

## 🧩 의존성 개요

```
M0 아키텍처 배관 (Walking Skeleton, §A·§B)
  │  (A-1·A-3·A-7 병렬 착수 → A-2/A-4 → A-6 → §B 셸)
  └→ M1 인증 슬라이스 (로그인·me 조회·세션복원·셸+로그아웃·회원가입/승인대기)
        └→ M2 EMP 조회 슬라이스 (부서 멤버 목록 → 사원 상세 → 내 정보 조회)
              └→ M3 대표 mutation 슬라이스 (내 정보 수정 + 서버검증 에러매핑 + invalidate)
                    └─ (여기까지 auth 워킹 스켈레톤 완료 · 이하 2번째 PRD 스코프) ─┐
                                                                              ▼
M4 공통 레이아웃 셸 재정비 (S2 선언적 권한 사이드바 표준 · S1 로고 · S3/S4 placeholder · S5 푸터)
  └→ M5 프로필사진 표시 슬라이스 (§B-4 blob-avatar 복제 표준 → F101 헤더 아바타 · F103 EMP 뷰 · F104 목록 정합)
        └─ (여기까지 2번째 PRD · 이하 3번째 PRD: 부서(조직) 관리 스코프) ─┐
                                                                        ▼
M6 부서 목록 조회 슬라이스 (T6.1 부서장 wire 정합화 → DEPTS 조회 → "조직도" 메뉴·목록 페이지·상세로 이동)  [F201]
  ├→ M7 부서 상세 열람 슬라이스 (route param deptId 신규 컨테이너 · 기존 F202/F203 조회 훅·DepartmentDetailView 재사용)
  │     └→ M9 부서 관리 mutation 슬라이스 (F205~F209, 상세 페이지 ADMIN 액션: 3개 placeholder 실동작화 + F207/F209 신설)
  └→ M8 부서 등록 mutation (F204, 목록 페이지 ADMIN 진입점)

        └─ (M0~M9 완료 · 이하 4번째 PRD: 게시판 세로 슬라이스 스코프) ─┐
                                                                       ▼
M10 게시판 목록 슬라이스 (배관: boardKeys·categoryKeys 팩토리 · 페이징 표준 흡수① · F301/F302 · "게시판" 메뉴)
  └→ M11 게시글 상세 슬라이스 (파일 다운로드/미리보기 표준 흡수② · F303/F304/F310/F311 · F306 발행 · likeCount 읽기표시)
        ├→ M12 게시글 작성 슬라이스 (F305 텍스트전용 · 임시저장/발행 분기 · F308 "임시저장글 불러오기" 재사용)
        │     └→ M13 게시글 수정+첨부 슬라이스 (파일 업로드 표준 흡수② · F307/F304/F309/F312)
        │           └→ M15 내 임시저장함 슬라이스 (F308/F306 재사용)
        └→ M14 댓글 슬라이스 (F313~F317 · 페이징 표준 재사용 · soft delete)
```

- **M6~M9 원칙**: 배관/셸(M0~M5)은 재작업하지 않고 소비한다. 조회 계층(F202/F203: `useDepartmentInfoQuery`/`useDepartmentMembersQuery`/`DepartmentDetailView`)은 **이미 존재해 재사용**하되, 실측 wire와 어긋난 `DeptLeader` 타입 정합화(T6.1)가 선행이다. F201(목록)·F204(등록)·F205~F209(관리)는 API 함수·훅·화면이 **아직 없어 신규 구현**이다.
- **기존 `DepartmentMembersPage`(§2 PRD F104, `/department-members`, 본인 소속 부서 고정 도출)는 이 3번째 PRD의 태스크 대상이 아니다.** M7의 "부서 상세" 컨테이너는 **라우트 파라미터 `deptId` 기반의 새 페이지**이며, 기존 본인 전용 페이지와 라우트·파일명이 겹치지 않게 분리한다(혼동·중복 배치 금지).

- 원칙: **배관이 모든 도메인에 선행**한다. 각 도메인 마일스톤은 화면·훅·상태·에러를 관통하는 **작동하는 얇은 슬라이스** 하나를 완성한다.
- me 조회 훅(F003)은 세션 복원(M1)에서 먼저 필요하므로 M1에 선행 배치하고, M2·M3가 이를 재소비한다.
- **M4~M5는 완료된 M0~M3 배관(axios 인터셉터·QueryClient·authStore·Router·셸)을 재작업하지 않고 그대로 소비**한다. M4는 셸의 시각·구조 재정비와 **선언적 권한 사이드바 복제 표준(S2)**을, M5는 **인증 필요 이미지 blob-avatar 복제 표준(§B-4)**을 확정해 이후 도메인 뷰가 그대로 복제하도록 한다.
- M5 두 복제 표준의 관계: **먼저 blob-avatar 프리미티브(T5.1)를 세우고** F101(헤더)·F103(EMP 뷰)이 이를 소비한다. 실제로 이미지가 끝까지 로드되는 경로는 empId를 보유한 **타 사원 상세(F103)**가 먼저 증명하며, 본인(me) 케이스(F101·내 정보 F103)는 numeric empId 소스 공백으로 **이니셜 폴백**에 머문다(§리스크 7).

---

## 🚩 마일스톤 & 태스크

### M0 — 아키텍처 배관 (Walking Skeleton) ✅ · 근거: PRD §A, §A-7

> 목표: 이후 모든 도메인이 **그대로 복제**할 배관 확정(PRD가 명시한 "정답 템플릿").
> 완료 정의: 빈 보호 라우트 하나가 인터셉터·가드·(가짜)토큰·셸을 실제로 통과해 렌더된다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| **T0.1** | `shared/api/client.ts` 단일 axios 인스턴스 + 인터셉터 배선(요청: 인메모리 토큰 시 `Authorization` 부착 / 응답: 401 && `ROLE_002` && 미재시도 && 비-reissue → reissue 1회 → 원요청 재시도, `_retried` 마킹, 단일 in-flight reissue 프라미스 공유) | §A-1 | — | 401·`ROLE_002`→reissue→원요청 재시도 경로 및 재귀 금지가 동작 | | | ☑ |
| **T0.2** | 에러 정규화 유틸 + 에러코드→UI 매핑 표준 헬퍼(폼 `setError` / 토스트 / 이동 분기를 호출부가 아닌 헬퍼가 담당) | §A-2 | T0.1 | `error-response.md` 구조 그대로 파싱, 표의 6개 분기 헬퍼 존재 | | | ☑ |
| **T0.3** | `QueryClient` 기본 방침(retry 최소화·401은 인터셉터 관할, staleTime 짧게) + feature별 `xxxKeys` queryKey 팩토리 컨벤션 | §A-3 | — (T0.1과 병렬) | QueryClient 프로바이더 마운트, `employeeKeys`/`departmentKeys` 팩토리 export | | | ☑ |
| **T0.4** | `features/auth/store/authStore.ts` zustand 스토어(`accessToken` 인메모리·영속 금지 / `user`·`roles`(ROLE_ 접두어 제거)·`status`) + 액션 `setToken/setUser/clear/bootstrap` | §A-4 | T0.1 | 토큰 인메모리 저장·clear·roles 정규화 동작(bootstrap 본체는 T1.4에서 완성) | | | ☑ |
| **T0.5** | Router 트리(`createBrowserRouter`) + `ProtectedRoute`(미인증→로그인 리디렉션, 복원 중 로딩) + role 전개 헬퍼 `hasRequiredRole(userRoles, minRole)` | §A-6 | T0.4 | 미인증 상태에서 보호 라우트 접근 시 로그인으로 리디렉션 | | | ☑ |
| **T0.6** | 폴더/피처 컨벤션 스캐폴딩(`app/`·`features/{auth,employee}/{api,components,pages,model}`·`shared/{api,lib,components,ui}`) | §A-7 | — (병렬) | PRD §A-7 트리 그대로 생성, 들여쓰기 2칸·네이밍 규약 적용 | | | ☑ |
| **T0.7** | 공통 레이아웃 셸(Sidebar/Header/Footer 3영역, shadcn 기본 토큰·커스텀 팔레트 없음)을 부모 라우트로 배치, 보호 페이지를 자식 라우트로 중첩 | §B, §A-6 | T0.5, T0.6 | 셸이 부모 라우트로 렌더, 빈 자식 라우트가 셸 안에 표시(사이드바 항목은 M1에서 실데이터로 연결) | | | ☑ |

> M0 병렬 지점: **T0.1 · T0.3 · T0.6** 은 상호 독립 → 동시 착수 가능.

---

### M1 — 인증 슬라이스 (auth 배관 실작동 증명) ✅ · 근거: PRD F010/F011/F012/F004/F013, §A-5

> 목표: 로그인으로 실제 토큰을 획득해 보호 라우트·셸을 관통시키고, 부팅 세션 복원과 로그아웃까지 인증 생애주기를 닫는다. 여정 진입 순서(로그인 → 홈 셸)를 그대로 따른다.
> 완료 정의: 로그인 → 홈 셸 진입 → 새로고침 후 세션 복원 → 로그아웃까지 왕복이 동작한다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| **T1.1** | RHF + `@hookform/resolvers/zod` 폼 표준 패턴 확립(클라 사전검증 → 서버 400 `VALIDATION_ERROR`/`COMMON_00x` `message`를 해당 필드 `setError` 매핑 → 특정 불가 시 폼 전역/토스트 폴백). 최초 소비처는 로그인 폼 | §A-5 | T0.2 | 표준 폼 훅/에러매핑 유틸이 로그인 폼에 적용됨 | 8 | 4 | ☑ |
| **T1.2** | 로그인 페이지: 로그인 폼(RHF+zod) + 로그인 mutation(`LOGIN`) → accessToken 인메모리 저장, 성공 시 홈 이동, `AUTH_001`(401) → **폼 에러**(reissue 미진입) | F010, 로그인 페이지 | T0.4, T1.1 | 성공→홈 리디렉션, `AUTH_001`→폼 에러 유지, "회원가입" 링크 노출 | 7 | 5 | ☑ |
| **T1.3** | 내 정보(me) 조회 훅 `useMeQuery()` → `employeeKeys.me()` / `RETRIEVE_ME_INFO`. 헤더 사용자 표시·세션 복원·M2 내 정보 조회가 공유하는 기반 훅 | F003, §A-3 | T0.3 | `RETRIEVE_ME_INFO` 호출로 본인 정보 반환, `employeeKeys.me()` 키 사용 | 9 | 3 | ☑ |
| **T1.4** | 세션 복원 완성: `authStore.bootstrap()` = 부팅/새로고침 시 reissue 1회(`REISSUE_TOKEN`) → 성공 시 `useMeQuery`로 사용자 복원·원래 페이지 유지 / 실패(`ROLE_002`) → 로그인 리디렉션. 앱 부팅 훅으로 전역 배선 | F011, §A-4, §A-6 | T0.4, T0.5, T1.3 | 새로고침 후 인메모리 토큰 소실 → reissue 1회로 복원, 실패 시 로그인 이동 | 7 | 6 | ☑ |
| **T1.5** | 회원가입 흐름(**단일 `REGISTER`** = F004 EMP create ≡ F013 auth 회원가입): 회원가입 페이지(RHF+zod, 서버검증 에러매핑) → 성공(204, 미승인) → 승인 대기 안내 화면(승인 전 이용 범위는 `@../docs/도메인모델.md` 참조, "로그인으로" 링크). 비인증 라우트(셸 밖) | F004/F013, 회원가입·승인 대기 페이지 | T0.5, T1.1 | 가입 성공→승인 대기 화면, 검증 실패→폼 필드 에러, 그 외→에러 토스트 | 3 | 5 | ☑ |
| **T1.6** | 셸 헤더 실연결: 로그인 사용자 표시(`useMeQuery`, 클릭→내 정보 조회) + **로그아웃 버튼**(`LOGOUT` → refreshToken 쿠키 만료 + 인메모리 clear → 로그인 이동). 홈(대시보드 셸) 진입점을 세션 복원 검증 지점으로 확정 | F012, F003, F011, §B, 홈 페이지 | T0.7, T1.3, T1.4 | 헤더에 사용자명·로그아웃 표시, 로그아웃 시 상태 clear+로그인 이동, 홈 렌더 | 6 | 5 | ☑ |

> M1 병렬 지점: **T1.5(회원가입, 비인증 라우트)** 는 T1.1 위에서 T1.2~T1.4(인증 라우트 체인)와 **독립 병렬** 가능.
>
> **M1 split 판단(복잡도·중요도)**: 전 태스크 복잡도 < 7 → **split 없음(전부 단일 task 유지)**. 근거는 각 태스크의 연관 기능ID 1개 이하(LOGIN·RETRIEVE_ME_INFO·REISSUE_TOKEN·REGISTER·LOGOUT)·auth 단일 도메인·실시간/파일 업로드 미포함.
> **실행 순서(의존성 위상 + 중요도 우선순위)**: T1.3(중요도9) → T1.1(8) → T1.2(로그인) → T1.4(세션복원) → T1.6(헤더) → T1.5(회원가입, 리프·병렬 허용). T1.3·T1.1은 M0 배관 위에서 선착수, T1.5는 T1.1 이후 인증 체인과 병렬 착수 가능.

---

### M2 — EMP 조회 슬라이스 ✅ · 근거: PRD F001/F002/F003, §A-3

> 목표: 인증된 셸 위에서 목록→상세 조회 세로 슬라이스를 완성한다. 여정 순서(부서 멤버 목록 → 사원 상세 → 내 정보 조회)를 따른다.
> 완료 정의: 사이드바 목록 → 행 클릭 상세 → 내 정보 조회까지 조회 동선이 동작한다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| **T2.1** | 부서 멤버 목록 페이지: `useDepartmentMembersQuery(deptId)` → `departmentKeys.members(deptId)` / `DEPT_MEMBERS`. **deptId는 본인 소속 부서 자동 진입**(`useMeQuery`의 `currentDepts`에서 도출, 별도 선택 UI 없음 — §⚠️ 리스크 5번 확정). `@tanstack/react-table`로 목록 렌더(**1페이지만·페이징 UI 제외**, 메타는 응답에 존재), 행 클릭→사원 상세, 조회 실패→토스트/`*_NOT_FOUND_*` not-found UX | F001, 부서 멤버 목록 페이지 | T0.3, T0.7, T1.6 | 부서 멤버 목록 렌더, 행 클릭 시 상세 라우트 이동 | 8 | 7 | ☑ |
| T2.1-a | (데이터 계층) `departmentKeys` 팩토리·`getDepartmentMembers`·`useDepartmentMembersQuery` 신설 + `getPrimaryDeptId(currentDepts)`로 본인 소속 deptId 자동 도출(isPrimary 우선, 없으면 첫 항목 폴백) | F001, §A-3 | T0.3, T1.3 | 훅 호출 시 `DEPT_MEMBERS` 응답이 `departmentKeys.members(deptId)`에 캐시, deptId 도출 규칙 동작 | 7 | 4 | ☑ |
| T2.1-b | (UI 계층) 목록 페이지(react-table 최초 도입) + router.tsx 라우트 신설(목록/`employees/:empId` placeholder) + `LayoutShell` 사이드바 3항목(홈/부서 멤버 목록/내 정보) 실배선 + 행 클릭 이동 + not-found/토스트 분기 | F001, §B | T2.1-a, T0.7, T1.6 | 목록 자동 렌더, 행 클릭 이동, 사이드바 3항목 동작, 에러 분기 노출 | 8 | 6 | ☑ |
| **T2.2** | 사원 상세 페이지(타 사원): `useEmployeeQuery(empId)` → `employeeKeys.detail(empId)`(기존) / `RETRIEVE_EMP_INFO`. `RETRIEVE_ME_INFO`와 **동일 응답 스키마**(스니펫 실측 확인) → `model/me.ts`를 `EmployeeInfoResponse`로 일반화 후 공유 컴포넌트 `EmployeeInfoView` 신설. 미존재(`EMP_001` 등 `*_NOT_FOUND_*`)→not-found UX, 403→권한 부족 UX. `activeFiles`는 필드만 존재·렌더링 완전 숨김(파일 UI 제외) | F002, 사원 상세 페이지 | T2.1-b | 상세 단건 조회 렌더, not-found·403 분기 UX 존재, me와 컴포넌트 재사용 | 6 | 5 | ☑ |
| **T2.3** | 내 정보 조회 페이지(본인 상세): `useMeQuery`(T1.3, 완료) + T2.2의 `EmployeeInfoView` 재사용으로 본인 상세 렌더, `/me` 라우트 실연결(사이드바·헤더 링크는 T2.1-b에서 배선 완료), "수정" 버튼 노출(→ M3, 페이지는 미구현). 본인 상세는 `RETRIEVE_ME_INFO` 사용(`/api/auth/me` 미존재) | F003, 내 정보 조회 페이지 | T1.3, T2.2 | 본인 정보 렌더(상세와 동일 컴포넌트 재사용), "수정" 버튼 노출 | 7 | 3 | ☑ |

> **M2 split 판단(복잡도·중요도)**: T2.1은 신규 department 도메인 슬라이스 신설 + `@tanstack/react-table` 최초 도입 + `LayoutShell`(공유 셸) 사이드바 실배선 + `router.tsx` 라우트 신설이 겹쳐 복잡도 7로 판정 → **의존성 순서 축(데이터 계층 → UI 계층)으로 split**(T2.1-a/T2.1-b). T2.2·T2.3은 각각 연관 기능ID 1개(`RETRIEVE_EMP_INFO`/`RETRIEVE_ME_INFO`)·단일 도메인(employee)·실시간·파일 업로드 미포함이며 기존 훅/타입(`employeeKeys.detail`, `useMeQuery`) 재사용 비중이 커 복잡도 < 7 → **split 없음(단일 task 유지)**.
> **실행 순서(의존성 위상 우선, 동순위 내 중요도)**: T2.1-a → T2.1-b → T2.2 → T2.3(단일 선형 체인이라 전 구간 위상 순서가 곧 실행 순서). T2.1-b(중요도8)가 T2.2·T2.3의 라우팅/셸 인프라를 함께 확정하므로 M2 내 최고 중요도.
> M2 병렬 지점: 위 split로 인해 T2.1 내부는 직렬(a→b)로 확정되며, T2.2의 상세 조회 컴포넌트 코어를 목록과 완전 독립 개발하는 기존 병렬안은 T2.1-b가 라우트/셸 배선까지 겸하므로 채택하지 않는다(직렬 진행).

---

### M3 — 대표 mutation 슬라이스 ✅ · 근거: PRD F005, §A-3, §A-5

> 목표: RHF+zod+**서버 검증 에러매핑**과 mutation 성공 invalidate를 관통 증명하는 대표 mutation 하나를 완성한다. 여정상 마지막(내 정보 조회 → 수정 → 재조회).
> 완료 정의: 내 정보 수정 저장(204) → `employeeKeys.me()` invalidate → 내 정보 조회 재검증까지 동작한다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| **T3.1** | 내 정보 수정 페이지 + `useUpdateMeMutation()`(`UPDATE_SELF_INFO`): RHF+zod 폼, 저장 성공(204) → `onSuccess`에서 `employeeKeys.me()` invalidate → 내 정보 조회 재조회, 검증 실패(`VALIDATION_ERROR`/`COMMON_00x`)→폼 필드 에러, 그 외→에러 토스트 | F005, 내 정보 수정 페이지 | T1.1, T2.3 | 저장→204→me invalidate→조회 재검증, 서버 검증 에러가 해당 필드로 매핑 | 4 | 4 | ☑ |

> **M3 split 판단(복잡도·중요도)**: T3.1은 연관 기능ID 1개(`UPDATE_SELF_INFO`, `generated-snippets/UPDATE_SELF_INFO/request-fields.adoc` 실측상 `extensionNo`·`newRawPassword` 2필드뿐)·단일 도메인(employee)·실시간(STOMP)/파일 업로드 미포함이며, 신규 산출물(zod 스키마·mutation 함수·폼 컴포넌트·페이지·라우트)이 전부 기존 인프라(T1.1의 `useZodForm`/`submitWithErrorMapping`, T0.2의 `handleApiError`, T0.3·T1.3의 `employeeKeys.me()`/`useMeQuery`, T1.5 `RegisterPage` 컨테이너+폼 분리 패턴, T2.2 `EmployeeInfoView`)를 얕게 복제하는 수준이라 복잡도 4(<7) → **split 없음(단일 task 유지)**. 중요도는 이 태스크를 Depends-on으로 참조하는 후행 태스크가 로드맵에 없는(§역참조 체크리스트상 최종 리프) 점을 근거로 4로 산정한다 — "여정상 마지막"이라는 서술은 Done 조건의 근거일 뿐 중요도(후행 의존) 산정 기준과는 별개다.
> **실행 순서**: M3는 T3.1 단일 태스크. 선행(T1.1·T2.3) 완료 후 즉시 착수한다.
>
> 필드 상세(`UpdateSelfInfoRequest`의 `extensionNo` `NNN-NNNN`·`newRawPassword` 제약 등)는 PRD §참조 계약 매핑 및 `generated-snippets/UPDATE_SELF_INFO/`를 zod 스키마 근거로 사용(이 로드맵에서 재설계하지 않음).

---

### M4 — 공통 레이아웃 셸 재정비 (Shell 복제 표준) ✅ · 근거: 2번째 PRD §B-1·§B-2·§B-3, S1/S2/S3/S4/S5, F102

> 목표: 기존 `LayoutShell`(텍스트 로고 + 사용자명 + 로그아웃 + 사이드바 3항목 + `© HARUON` 푸터)을 **이후 도메인 뷰가 그대로 얹히는 레퍼런스 셸**로 정비한다. 핵심 산출물은 **선언적 권한 사이드바 복제 표준(S2)** — 향후 도메인이 배열에 항목만 추가하면 노출 규칙이 자동 적용된다.
> 완료 정의: 개선된 헤더(로고·아바타 슬롯·사용자명·알림/채팅 placeholder·로그아웃)·선언적 사이드바·정적 푸터가 모든 보호 페이지에서 렌더된다. 이 마일스톤은 **API 신규 연결이 없다**(F102/F110은 기존 배관 재사용, S1~S5는 API 미연결 셸 요소).

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| **T4.1** | 사이드바 **선언적 권한 렌더링 복제 표준(S2)**: 메뉴를 선언적 배열(`{ label, to, minRole, icon }`)로 추출하고 `hasRequiredRole(userRoles, item.minRole)`(T0.5 헬퍼) 참인 항목만 렌더. 이번 3항목(홈/부서 멤버 목록/내 정보)은 전부 `minRole: EMPLOYEE`. Layer 1/Layer 2 혼재 배열을 그대로 지원(역할 정규화는 authStore가 담당). **향후 도메인이 배열에 항목만 추가하면 되는 표준 확정** | §B-2, S2, 메뉴 구조 | T0.5, T0.7 | 선언적 배열 기반 렌더, 기존 3항목 동작 유지, 배열에 상위 role 항목 추가 시 자동 게이팅(향후 슬롯) | 7 | 4 | ☑ |
| **T4.2** | 헤더 재정비: **회사 로고(S1)** 정적 asset(프론트 번들, 클릭→홈) + **알림 벨(S3)** 아이콘만(`aria-label`, 무동작, `//todo` 알림 계약 확정 시 연결) + **채팅 버튼(S4)** 아이콘만(클릭 무동작, `//todo` 채팅 도메인 PRD) + **사용자명(F102)** 기존 `RETRIEVE_ME_INFO` 재사용·클릭→내 정보 + **로그아웃(F110)** 기존 `handleLogout` 유지. **프로필 아바타 슬롯(F101) 배치만 하고 채움은 M5(T5.3)** | §B-1, S1/S3/S4, F102, F110 | T4.1, T1.6 | 로고 클릭→홈, 벨/채팅 아이콘 렌더·무동작·`//todo` 플래그, 사용자명 클릭→내 정보, 로그아웃 동작, 아바타 슬롯 자리 존재 | 6 | 4 | ☑ |
| **T4.3** | 푸터 정적 회사 정보(S5): 회사명/카피라이트 등 **하드코딩 텍스트**. 회사 정보 조회 기능ID·필드 계약이 미문서화(`api-endpoint.md` 인덱스 부재)이므로 동적 연결 없이 정적 유지가 계약 정합 | §B-3, S5 | T0.7 | 정적 회사 정보 텍스트 렌더, API 호출 없음 | 3 | 2 | ☑ |

> **M4 split 판단(복잡도·중요도)**: 전 태스크 복잡도 < 7 → **split 없음**. 근거는 모두 셸 단일 컴포넌트(`LayoutShell`) 내부 재정비이며 **신규 API 연결 0건**(S1~S5는 API 미연결, F102/F110은 기존 배관 재사용). T4.1(중요도7)이 이후 도메인이 복제할 **선언적 사이드바 표준**을 확정하므로 M4 내 최고 중요도이자 T4.2의 선행.
> **실행 순서(의존성 위상 + 중요도)**: T4.1(선언적 사이드바 표준) → T4.2(헤더, 아바타 슬롯 포함) → T4.3(푸터). T4.3은 T4.1/T4.2와 독립이라 병렬 착수 가능(§병렬화 참조).

---

### M5 — 프로필사진 표시 슬라이스 (§B-4 blob-avatar 복제 표준 + EMP 뷰 재정비) ✅ · 근거: 2번째 PRD §B-4, F101/F103/F104/F105/F106

> 목표: **인증 필요 이미지 blob-avatar 복제 표준(§B-4)**을 먼저 세우고, 헤더 아바타(F101)·EMP 뷰 프로필사진(F103)에 배선한다. 여정 순서(부서 멤버 목록 → 사원 상세 → 내 정보 조회)를 따라 EMP 뷰(F104~F106)를 개선된 셸에 정합시킨다.
> 완료 정의: 타 사원 상세에서 **실제 프로필사진(blob+objectURL)**이 표시되고, 본인(헤더 아바타·내 정보 조회)은 **numeric empId 소스 공백으로 이니셜 폴백**되며(§리스크 7 `//todo`), `SIGNATURE`는 계속 숨김이다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| **T5.1** | **blob-avatar 공유 프리미티브(§B-4, 이후 모든 인증 필요 이미지 복제 표준)**: `EMP_FILE_PREVIEW`(path `{empId}`/`{fileId}`, `Authorization: Bearer` 필수 → `<img src>` 직접 로드 불가)를 axios(전역 `withCredentials` 인스턴스, T0.1)로 `responseType: 'blob'` 조회 → `URL.createObjectURL`로 `<img>` 바인딩 → 언마운트 시 `revokeObjectURL` 해제. 활성 `PROFILE_PICTURE` 파일 식별 헬퍼(`type === 'PROFILE_PICTURE' && isActive`) + 미지 `type` 방어(TS 유니온, 정의되지 않은 값 안전 숨김). empId·fileId 미확정/조회 실패 시 이니셜 폴백 | §B-4, `EMP_FILE_PREVIEW` | T0.1 | empId+fileId 주면 이미지 렌더·언마운트 revoke 동작, 대상/empId 부재·조회 실패 시 이니셜 폴백, 미지 type 숨김 | 9 | 6 | ☑ |
| **T5.2** | **F103 EMP 뷰 프로필사진(사원 상세·내 정보 조회)**: `EmployeeInfoView` 상단에 아바타 영역 추가, `activeFiles` 중 **`PROFILE_PICTURE`만 노출(`SIGNATURE`는 계속 숨김)**. 호출부가 `empId` 주입 — `EmployeeDetailPage`(라우트 `empId` 보유 → **실 프로필사진** blob) / `MyInfoPage`(**empId 공백 → 이니셜 폴백**, §리스크 7 `//todo`). 기존 "완전 숨김" 로직을 `PROFILE_PICTURE` 노출로 완화 | F103, F105, F106, §B-4 | T5.1, T2.2, T2.3 | 타 사원 상세는 실 프로필사진 표시, 내 정보 조회는 empId 미확정 이니셜 폴백, `SIGNATURE` 미표시 | 7 | 5 | ☑ |
| **T5.3** | **F101 헤더 프로필 아바타(본인)**: T4.2 아바타 슬롯을 채운다. `useMeQuery`가 이미 보유한 `RETRIEVE_ME_INFO.activeFiles`를 **우선 재사용(추가 호출 없음)**, 미보유 시 `RETRIEVE_FILES_INFOS`로 대체(비활성 포함 반환 → `isActive === true` 필터 필수)해 `PROFILE_PICTURE` fileId 식별 + T5.1 프리미티브로 로드. **본인 numeric empId 소스 공백 → 현재는 이니셜 폴백 + `//todo`**(§리스크 7). 클릭 → 내 정보 조회 | F101, §B-1·§B-4, `RETRIEVE_ME_INFO`(우선)/`RETRIEVE_FILES_INFOS`(대체) | T5.1, T4.2 | 아바타 렌더(현재 empId 공백으로 **이니셜 폴백**), 클릭→내 정보 이동, `RETRIEVE_FILES_INFOS` 대체 시 `isActive` 필터 적용, empId 소스 확정 시 이미지 승격 경로·`//todo` 존재 | 6 | 5 | ☑ |
| **T5.4** | **F104 부서 멤버 목록 셸 정합 재정비**: 기존 `@tanstack/react-table` 목록 뷰를 개선된 셸 구조(위치·여백)에 맞춰 정리. **1페이지만·페이징 UI 제외**(응답 메타 존재하나 미노출) 유지, 행 클릭→사원 상세, 조회 실패→토스트/`*_NOT_FOUND_*` not-found UX 유지 | F104, 부서 멤버 목록 페이지 | T4.1, T5.2 | 목록이 개선된 셸 구조에 정합, 페이징 UI 미노출 유지, 행 클릭 이동·에러 분기 동작 | 4 | 2 | ☑ |

> **M5 split 판단(복잡도·중요도)**: 전 태스크 복잡도 < 7 → **split 없음**. T5.1은 신규 공유 프리미티브(blob 로딩·objectURL 생명주기·type 유니온 방어)를 세우나 연관 기능ID 1개(`EMP_FILE_PREVIEW`)·단일 관심사라 복잡도 6. T5.2~T5.4는 기존 산출물(`EmployeeInfoView` T2.2, `EmployeeDetailPage`/`MyInfoPage` T2.2·T2.3, 목록 T2.1-b)에 T5.1 프리미티브를 얕게 배선하는 수준. T5.1(중요도9)이 이후 모든 인증 이미지가 복제할 표준이라 M5 내 최고 중요도이자 T5.2·T5.3의 선행.
> **실행 순서(의존성 위상 + 중요도)**: T5.1(blob 표준) → T5.2(F103 EMP 뷰, empId 보유 타 사원 상세가 표준을 먼저 실증) → T5.3(F101 헤더 아바타, 본인 empId 공백 폴백) → T5.4(F104 목록 정합). T5.2와 T5.3은 T5.1 완료 후 서로 독립이라 병렬 가능(§병렬화 참조).
>
> 필드 상세(`EmpFileInfo`의 `file.fileId`·`type`·`isActive`, `EmployeeInfoResponse.activeFiles[]`)는 2번째 PRD §참조 계약 매핑 및 `generated-snippets/{RETRIEVE_FILES_INFOS,EMP_FILE_PREVIEW,RETRIEVE_EMP_INFO,RETRIEVE_ME_INFO}/`를 근거로 사용(이 로드맵에서 재설계하지 않음).

---

### M6 — 부서 목록 조회 슬라이스 (조직도 진입 + 부서장 wire 정합화) ✅ · 근거: 3번째 PRD F201, §부서장 공석 wire 계약, 부서 목록 페이지

> 목표: 사이드바 "조직도" 신규 메뉴 → 전사 부서 목록(부서장 요약 포함) 열람 → 부서 행 클릭으로 상세 라우트 진입까지 **읽기 세로 슬라이스**를 완성한다. 여정 진입점(조직도 메뉴)을 그대로 따른다. 이 과정에서 목록·상세가 공유하는 부서장 공석 판별의 근본(타입 정합화)을 먼저 세운다.
> 완료 정의: "조직도" 메뉴 → 목록 렌더(검색·활성필터·페이징) → 행 클릭 시 `/departments/:deptId` 이동. 부서장 미지정 부서가 "미지정" 빈 상태로 표시된다(all-null 필드 미노출).

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| **T6.1** | **부서장 wire 타입 정합화(선행 기반)**: 기존 `model/deptInfo.ts`의 `DeptLeader`가 non-null로 선언돼 실측 wire(부서장 공석 시 **전 필드 null인 객체**)와 불일치(`deptInfo.ts:15` `//todo`). **전 필드 nullable `DeptLeaderWire` 타입 신설 + `empName`(또는 `empId`) 유무로 공석 판별해 화면용 `DeptLeader \| null`로 정규화하는 헬퍼**를 데이터 계층에 배선하고, 기존 `getDepartmentInfo`의 타입 우회(`deptLeader.empId == null` 비교) 제거. **기존 F202/F203 조회 훅은 재사용하되 이 정합화가 선행**이며 목록(F201)·상세(F202) 양쪽 공석 렌더의 공통 근본 | F202, §부서장 공석 wire 계약 | — (M0 배관 완료) | 공석 부서가 정규화 후 `deptLeader===null`로 좁혀지고, 목록·상세 어디서도 all-null 필드(빈 문자열/"null")를 렌더하지 않음 | 8 | 4 | ☑ |
| **T6.2** | (데이터 계층) **`DEPTS` 조회 신규**: `getDepartments` + `useDepartmentsQuery` + `departmentKeys.list(params)` 확장. query `keyword/isActive/page/size`(전부 optional). 응답 `Page<DeptSummary>`의 `deptLeader` 요약은 **T6.1 정규화 재사용**(공석 판별). 신규(기존 API/훅 없음) | F201, §참조 계약 매핑(DEPTS) | T6.1 | `DEPTS` 응답이 `departmentKeys.list`에 캐시, 부서장 요약 공석 판별 적용 | 7 | 4 | ☑ |
| **T6.3** | (UI 계층) **부서 목록 페이지·"조직도" 메뉴·라우트 신규**: 목록 페이지(부서코드/부서명/활성여부/부서장 요약, `@tanstack/react-table` 재사용) + `router.tsx`에 `/departments` **신설**(현재 부재) + `sidebarMenuItems.ts`에 "조직도" 항목 **신설**(minRole `EMPLOYEE`, 기존 "부서 멤버 목록"과 별개 항목) + 부서명 검색·활성상태 필터·**페이징 UI 포함**(F201은 M2 목록과 달리 페이징 명시) + 행 클릭 → `/departments/:deptId` 이동, 조회 실패 → 토스트/`*_NOT_FOUND_*` not-found UX | F201, 부서 목록 페이지, 메뉴 구조 | T6.2, T4.1(선언적 사이드바 표준) | 조직도 메뉴→목록 렌더·검색/필터/페이징 동작, 행 클릭 시 상세 라우트 이동 | 8 | 6 | ☑ |

> **M6 split 판단(복잡도·중요도)**: 전 태스크 복잡도 < 7 → **split 없음(전부 단일 task 유지)**. T6.1은 연관 기능ID 1개(`DEPT_INFO`)·단일 도메인(department)·실시간/파일 미포함이며 기존 `//todo` workaround(`deptInfo.ts:15`, `getDepartmentInfo.ts`의 `empId==null` 타입 우회)를 정식 타입·헬퍼로 정식화하는 국소 리팩터링이라 복잡도 4. T6.2는 연관 기능ID 1개(`DEPTS`)·단일 도메인·실시간/파일 미포함이며 신규 산출물(`getDepartments`/`useDepartmentsQuery`/`departmentKeys.list`)이 기존 `getDepartmentMembers`/`departmentKeys.members`와 동일한 "신규 조회 훅 1개" 규모(T2.1-a와 동형)라 복잡도 4. T6.3은 새 페이지+새 라우트+새 사이드바 항목+새 필터(`isActive`)+새 테이블 컬럼이 동시에 얽혀 T2.1-b(react-table+라우트+셸 최초 배선)와 동일한 복합 신규 배선 규모이나, react-table 컬럼 헬퍼 패턴(`DepartmentMembersTable`)·페이징 UI 패턴(`DepartmentDetailView`의 `PAGE_SIZE_OPTIONS`)·선언적 사이드바 표준(T4.1)을 그대로 재사용해 복잡도 6(<7). 중요도는 T6.1=8(T6.2·M7 T7.1·M9 T9.3까지 이어지는 공석 판별 계약의 공통 기반), T6.2=7(T6.3 직접 의존 + M9 T9.3이 `DEPTS` 재사용을 명시), T6.3=8(M7 T7.1·M8 T8.1이 이 태스크를 Depends-on으로 명시한 후행 두 마일스톤의 진입점)로 산정.
> **실행 순서(의존성 위상 + 중요도)**: T6.1(정합화·기반, 중요도8) → T6.2(DEPTS 데이터, 중요도7) → T6.3(페이지·메뉴·라우트, 중요도8). 선형 의존 체인이라 위상 순서가 곧 실행 순서(T6.1은 기존 상세 조회 계층(M7이 재사용)에도 영향을 미치므로 최선행).

---

### M7 — 부서 상세 열람 슬라이스 (route param 컨테이너 신규) ✅ · 근거: 3번째 PRD F202/F203, 부서 상세 페이지

> 목표: 목록에서 넘어온 **임의 deptId**를 라우트 파라미터로 받아 부서 기본정보·부서장·멤버 목록을 열람하는 **읽기 슬라이스**를 완성한다. 기존 조회 훅·프레젠테이션 컴포넌트를 재사용하고, **컨테이너만 신규**로 만든다.
> 완료 정의: `/departments/:deptId`로 임의 부서 상세가 열리고, 멤버 검색·페이징이 좌측 기본정보 카드를 재로딩·깜빡이지 않으며, 존재하지 않는 deptId는 not-found로 분기한다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| **T7.1** | **부서 상세 컨테이너 페이지 신규(route param `deptId`)**: 새 컨테이너 페이지 + 라우트 `/departments/:deptId` **신설**. `useParams`의 `deptId`로 **기존 `useDepartmentInfoQuery`(F202)·`useDepartmentMembersQuery`(F203) 재사용**(deptId 출처만 route param으로 교체) + **기존 프레젠테이션 `DepartmentDetailView` 재사용**(props가 이미 `deptInfo/deptLeader/members/pageInfo/canManageDept` 등으로 파라미터화). **기존 `DepartmentMembersPage`(§2 F104, `/department-members`, 본인 소속 고정)는 대상 아님 — 그대로 유지, 라우트·파일명 분리**. F202/F203 **독립 쿼리 유지**(멤버 검색·페이징이 좌측 기본정보 카드 재로딩·깜빡임을 유발하지 않도록 `keepPreviousData` 또는 초기 로딩만 게이트) + 기본정보 미도착 시 하위 필드 접근 금지(렌더 직전 data 가드, `data!` 단언 지양). 멤버 행 클릭 → 사원 상세(기존 재사용), 존재하지 않는 deptId(`*_NOT_FOUND_*`) → not-found UX | F202, F203, 부서 상세 페이지 | T6.1, T6.3 | 임의 deptId 라우트로 상세 열람, 멤버 검색/페이징 시 좌측 카드 미깜빡임, not-found 분기 동작 | 9 | 6 | ☑ |

> **M7 split 판단(복잡도·중요도)**: T7.1은 연관 기능ID 2개(`DEPT_INFO`/F202, `DEPT_MEMBERS`/F203)이나 **둘 다 M6에서 완성된 조회 훅(`useDepartmentInfoQuery`/`useDepartmentMembersQuery`)·프레젠테이션(`DepartmentDetailView`)을 그대로 재사용**하고(신규 API·훅 없음), 단일 도메인(department)·실시간/파일 업로드 미포함이라 신규 산출물은 라우트 1개 + 컨테이너 페이지 1개뿐이다. 다만 기존 `DepartmentMembersPage`에 실측된 두 결함(멤버 검색·페이징 시 좌측 카드 전면 깜빡임, `deptInfoQuery.data!` 단언의 크래시 위험)을 그대로 복제하지 않고 `keepPreviousData`·렌더 직전 data 가드로 재설계해야 해 순수 복제보다 난이도가 소폭 높다. 사이드바 항목 신설·`react-table` 신규 도입·새 필터가 없어 T2.1-b/T6.3(복합 신규 배선, 복잡도 6)을 상회하지는 않는다 → 종합 복잡도 6(<7) → **split 없음(단일 task 유지)**. 중요도는 M9의 **T9.1·T9.2·T9.3 전부가 이 컨테이너를 Depends-on으로 명시**해(M9 전체 착수 전제) T6.3(중요도8, 후행 2개 마일스톤 진입점)보다 후행 의존 태스크 수가 많은 점을 근거로 9로 산정.
> **실행 순서**: M7은 T7.1 단일 태스크. 선행(T6.1·T6.3) 완료 후 즉시 착수한다.
>
> M7 주의: 기존 상세 조회 계층(훅·`DepartmentDetailView`)은 재사용 가능하나 **컨테이너 배선은 신규**다. 본인 전용 페이지와의 중복/혼동을 피하기 위해 새 컨테이너는 별도 파일·별도 라우트로 둔다.

---

### M8 — 부서 등록 mutation 슬라이스 (ADMIN) ✅ · 근거: 3번째 PRD F204, 부서 목록 페이지

> 목표: 목록 페이지에서 ADMIN이 신규 부서를 등록하는 mutation 슬라이스를 완성한다(RHF+zod+서버검증 에러매핑+성공 invalidate). 여정상 목록 위 ADMIN 진입점.
> 완료 정의: ADMIN에게만 "부서 등록" 버튼 노출 → 다이얼로그 제출(204) → 목록 invalidate + 성공 토스트, 검증 실패 → 폼 필드 에러.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| **T8.1** | **부서 등록 신규**: 등록 다이얼로그 + `useRegisterDepartmentMutation`(`DEPT_REGISTER`). RHF+zod(부서코드 3자리 숫자·부서명 20자 이하, 필드 상세는 `generated-snippets/DEPT_REGISTER/` 실측 근거). **ADMIN 전용 노출**(`hasRequiredRole(roles,'ADMIN')`, 페이지 내 버튼 게이팅) + 성공(204) → 목록 `invalidate` + 성공 토스트, 검증 실패 → 폼 필드 에러(T0.2/T1.1 표준), 그 외 → 토스트. **부서 목록 페이지(M6)에 "부서 등록" 버튼 배선**. API 함수·훅 신규(기존 없음) | F204, 부서 목록 페이지 | T6.3, T1.1 | ADMIN에게만 버튼 노출, 등록 성공 시 다이얼로그 닫힘 + 목록 재조회 + 토스트 | 4 | 5 | ☑ |

> **M8 split 판단(복잡도·중요도)**: T8.1은 연관 기능ID 1개(`DEPT_REGISTER`)·단일 도메인(department)·실시간(STOMP)/파일 업로드 미포함이라는 SKILL.md 저복잡도 조건에 해당하나, 신규 API 함수+mutation 훅·신규 zod 스키마·이 저장소 최초의 다이얼로그 UI 도입 가능성(기존 T3.1 `UpdateMePage`는 다이얼로그가 아닌 풀페이지 폼)·`hasRequiredRole` 기반 ADMIN 버튼 게이팅·기존 `DepartmentsPage`/`departmentKeys.list` 배선까지 5가지 신규/배선 산출물이 겹쳐 T3.1(복잡도4)보다 근소히 높고 T1.2(복잡도5, 신규 페이지+mutation+토큰저장+리디렉션)와 동등한 규모라 복잡도 5(<7) → **split 없음(단일 task 유지)**. 중요도는 로드맵 전체에서 T8.1을 Depends-on으로 명시하는 후행 태스크가 없어(M9 T9.1~T9.3은 T7.1·T6.2만 참조, M8은 M6에서 갈라진 리프 마일스톤) T3.1과 동일 근거로 4로 산정한다.
> **실행 순서**: M8은 T8.1 단일 태스크. 선행(T6.3·T1.1) 완료 후 즉시 착수하며, M7(T7.1)과 서로 독립이라 병렬 착수 가능하다(§병렬화 참조).

---

### M9 — 부서 관리 mutation 슬라이스 (ADMIN, F205~F209) ✅ · 근거: 3번째 PRD F205/F206/F207/F208/F209, 부서 상세 페이지

> 목표: 부서 상세 페이지의 ADMIN 관리 액션 5종을 완성한다. **기존 `DepartmentDetailView`의 3개 disabled placeholder(F205/F206/F208)를 실동작으로 전환**하고, **placeholder조차 없는 F207/F209를 신설**한다. 여정상 마지막(상세 열람 → 관리 → 재조회).
> 완료 정의: 각 관리 액션 성공(204) → 부서 상세 재조회(invalidate) + 성공 토스트, 검증 실패 → 폼 필드 에러, 부서장 종료 후 공석 정규화 규칙(T6.1) 그대로 적용.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| **T9.1** | (데이터 계층) **관리 mutation 훅 6종 신규**: `DEPT_ACTIVATE`/`DEPT_DEACTIVATE`(body 없음)·`DEPT_UPDATE_NAME`(query `newName`)·`DEPT_UPDATE_PARENT`(query `parentDeptId` **optional**)·`DEPT_APPOINT_LEADER`(query `leaderEmpId`, `appointedAt` **`yyyy-MM-dd`**)·`DEPT_END_LEADER`(query `endAt` **`yyyy-MM-dd`**). 전부 204. 성공 시 상세 `invalidate`(`departmentKeys`). **기존 placeholder는 서버 호출이 전혀 연동돼 있지 않으므로**(disabled) 이 훅들이 실동작의 데이터 계층. 필드/포맷은 §참조 계약 매핑·스니펫 근거(재설계 금지) | F205, F206, F207, F208, F209, §참조 계약 매핑 | T7.1 | 6종 훅 호출 시 각 엔드포인트 204 처리 및 상세 invalidate 동작 | 7 | 8 | ☑ |
| T9.1-a | (데이터 계층) `DEPT_ACTIVATE`/`DEPT_DEACTIVATE`(body 없음)·`DEPT_UPDATE_NAME`(query `newName`)·`DEPT_APPOINT_LEADER`(query `leaderEmpId`, `appointedAt` `yyyy-MM-dd`) mutation 훅 4종 신규. F205/F206/F208 소비용. 성공 시 상세 invalidate(`departmentKeys`) | F205, F206, F208, §참조 계약 매핑 | T7.1 | 4종 훅 호출 시 각 엔드포인트 204 처리 및 상세 invalidate 동작 | 6 | 5 | ☑ |
| T9.1-b | (데이터 계층) `DEPT_UPDATE_PARENT`(query `parentDeptId` optional)·`DEPT_END_LEADER`(query `endAt` `yyyy-MM-dd`) mutation 훅 2종 신규. F207/F209 소비용. 성공 시 상세 invalidate(`departmentKeys`), 종료 후 공석 정규화는 T6.1이 재조회 시 자동 적용 | F207, F209, §참조 계약 매핑 | T7.1 | 2종 훅 호출 시 각 엔드포인트 204 처리 및 상세 invalidate 동작 | 5 | 4 | ☑ |
| **T9.2** | **F205/F206/F208 placeholder → 실동작 전환**: `DepartmentDetailView`의 **기존 disabled placeholder 3개**("부서장 지정"·"활성화·비활성화 전환"·"부서명 변경", 현재 클릭 무동작)를 실 mutation UI로 전환 — 활성화/비활성화 토글(F205), 부서명 변경 다이얼로그(F206, RHF+zod), 부서장 지정 다이얼로그(F208, 멤버 중 1인 선택 + `appointedAt` `yyyy-MM-dd`). ADMIN 전용(기존 `canManageDept` prop). 성공 → 상세 재조회 + 토스트, 검증 실패 → 폼 에러 | F205, F206, F208, 부서 상세 페이지 | T9.1-a, T7.1 | 3개 액션이 실제 서버 호출로 동작, 성공 후 상세 재조회 + 토스트 | 4 | 6 | ☑ |
| **T9.3** | **F207/F209 신규 UI 추가**: placeholder조차 없던 2개 액션 **신설** — 상위 부서 변경 다이얼로그(F207, 후보 목록 = `DEPTS` `isActive=true` 재조회(**T6.2 재사용**)·자기 자신 제외·**"최상위로 이동" 옵션**=`parentDeptId` 미전달, 순환 참조 등 심화 검증은 서버 위임), 현재 부서장 종료 버튼(F209, `endAt` `yyyy-MM-dd`, 종료 후 공석 정규화 T6.1 따름). ADMIN 전용. 성공 → 상세 재조회 + 토스트 | F207, F209, 부서 상세 페이지, §참조 계약 매핑 | T9.1-b, T7.1, T6.2 | 상위부서 변경(최상위 옵션 포함)·부서장 종료 동작, 성공 후 상세 재조회 + 토스트 | 4 | 6 | ☑ |

> **M9 split 판단(복잡도·중요도)**: T9.1은 mutation 훅 6종·기능ID 5개(F205~F209)를 한 태스크에 결합해 로드맵 전체에서 가장 넓은 기능ID span을 가져 복잡도 8(≥7) → **의존성 순서(소비처) 축으로 split**: T9.1-a(F205/F206/F208 소비용 4종: activate/deactivate/updateName/appointLeader, 복잡도5)·T9.1-b(F207/F209 소비용 2종: updateParent/endLeader, 복잡도4). 코드 실측상 `DepartmentDetailPage.tsx`(T7.1 산출물)가 이미 존재하고 `DepartmentDetailView.tsx`의 "부서 관리" 섹션엔 disabled placeholder 3개(부서장 지정/활성화·비활성화 전환/부서명 변경, `DeptManagePlaceholderButton`)만 있어 서버 mutation과 전혀 연동돼 있지 않음을 확인했다(§리스크 9). T9.2(F205/F206/F208 실동작 전환)·T9.3(F207/F209 신설)은 각각 기능ID 2~3개·단일 도메인(department)·실시간/파일 업로드 미포함이며 T9.1-a/T9.1-b·T1.1(zod 폼 표준)·T0.2(에러매핑)·T6.2(`DEPTS` 후보 목록)를 재사용하는 수준이라 복잡도 6(<7) → **split 없음(단일 task 유지)**. 중요도는 후행 참조 여부만으로 산정: T9.1-a=6(T9.2 1개 후행), T9.1-b=5(T9.3 1개 후행, T9.3은 T6.2도 별도 참조), T9.2·T9.3=4(이 두 태스크를 Depends-on으로 참조하는 후행 태스크가 로드맵에 없는 리프 — T3.1·T8.1과 동일 근거).
> **실행 순서(의존성 위상 + 중요도)**: T9.1-a → T9.1-b(서로 독립, 병렬 착수 가능) → T9.2·T9.3(T9.1-a/T9.1-b 완료 후 서로 독립, 병렬 착수 가능). T9.1-a(중요도6)가 T9.1-b(5)보다 근소히 우선하나 실질적으로 동시 착수 가능.
>
> Shrimp task-id: T9.1-a=`9cf37907-b420-4b2d-8301-064dbf713d72` · T9.1-b=`35e12bb4-0a6e-4d1c-9aad-3c6c26e387dc` · T9.2=`6664e372-11ac-4776-8f52-e9ca386304d9` · T9.3=`92c97d13-bd21-462f-a797-fe08c3f52a64`

---

### M10 — 게시판 목록 조회 슬라이스 (배관: boardKeys·categoryKeys·페이징 표준 흡수① + F301/F302) · 근거: 4번째 PRD F301/F302, §MVP 필수 지원(흡수①), 게시판 목록 페이지

> 목표: 게시판 읽기 경로 배관(`boardKeys`·`categoryKeys` 팩토리 + **재사용 페이징 표준**)을 세우고, 카테고리별 **발행 글** 목록(제목 검색·페이징) 열람 → 행 클릭 상세 진입까지 읽기 세로 슬라이스를 완성한다. 사이드바 "게시판" 메뉴를 신설한다.
> 완료 정의: "게시판" 메뉴 → 카테고리 셀렉트(첫 항목 기본 선택)·제목 keyword 검색·**표준 페이징 컨트롤(이전/다음·페이지번호·total)**이 동작하는 목록 렌더 → 행 클릭 시 `/boards/:boardId` 이동. 첨부 아이콘(`isFileAttached`)·조회/좋아요/댓글 수가 표시된다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| **T10.1** | **재사용 페이징 표준 확립(흡수①, 이후 모든 목록형 도메인이 복제)**: Spring `Page` 메타(`number`0-base·`size`·`totalElements`·`totalPages`·`first`·`last`)로 이전/다음·페이지번호·total 컨트롤을 구성하는 **공유 페이지네이션 컴포넌트 + 페이지 상태 훅**을 확립한다. 현재 `DepartmentDetailView`에 **인라인**으로만 존재하는 페이징 UI(`PAGE_SIZE_OPTIONS`·`이전/다음`·`pageInfo`)를 재사용 가능한 표준으로 승격(추출/치환, 기존 동작 회귀 없이). queryKey에 `page`/`size` 포함 규약 고정. **BOARD_LIST(T10.3)·BOARD_COMMENTS(M14)가 최초 소비처** | §MVP 필수 지원(흡수①) | — (M0~M9 완료) | Page 메타 기반 공유 페이징 훅/컴포넌트 존재, 기존 부서 상세 멤버 페이징이 표준으로 치환돼도 회귀 없음 | 8 | 5 | ☑ |
| **T10.2** | (데이터 계층) **`boardKeys`·`categoryKeys` 팩토리 신설 + 목록/카테고리 조회 훅**: `boardKeys{ list(categoryId,keyword,page,size)·detail(boardId)·comments(boardId,page,size)·files(boardId)·drafts() }` + `categoryKeys.list()` 팩토리 신설(`departmentKeys` 동형) + `getCategories`/`useCategoriesQuery`(F302 `CATEGORY_LIST`, 노출 카테고리) + `getBoardList`/`useBoardListQuery`(F301 `BOARD_LIST`, path `categoryId` **필수**·query keyword/page/size optional·발행 글만). 필드는 §참조 계약 매핑·`generated-snippets/{BOARD_LIST,CATEGORY_LIST}/` 근거(재설계 금지) | F301, F302, §참조 계약 매핑, §기술 스택(boardKeys) | T0.3 | `BOARD_LIST`가 `boardKeys.list(...)`에, `CATEGORY_LIST`가 `categoryKeys.list()`에 캐시, categoryId 필수 파라미터 동작 | 9 | 5 | ☑ |
| **T10.3** | (UI 계층) **게시판 목록 페이지·"게시판" 메뉴·라우트 신규**: 목록 페이지(`@tanstack/react-table` 재사용, 제목·작성자·발행시각·조회/좋아요/댓글 수·첨부 아이콘) + 카테고리 셀렉트(F302, 첫 항목 기본 선택) + 제목 keyword 검색 + **표준 페이징 컨트롤(T10.1)** + `sidebarMenuItems.ts`에 "게시판"(minRole `EMPLOYEE`, 선언적 사이드바 표준 T4.1) 신설 + `router.tsx`에 `/boards` 신설 + **"글쓰기"(→M12)·"임시저장함"(→M15) 진입 버튼** + 행 클릭 → `/boards/:boardId`, 조회 실패 → 토스트/`*_NOT_FOUND_*` not-found UX | F301, F302, 게시판 목록 페이지, 메뉴 구조 | T10.1, T10.2, T4.1 | 게시판 메뉴→목록 렌더·카테고리/검색/페이징 동작, 행 클릭 시 상세 라우트 이동, 글쓰기/임시저장함 진입점 노출 | 8 | 6 | ☑ |

> M10 병렬 지점: **T10.1(페이징 표준)** 과 **T10.2(데이터 조회 훅)** 는 상호 독립 → 동시 착수 가능. T10.3은 둘 다 완료 후 착수(UI가 표준·데이터를 함께 소비).
> **M10 split 판단(복잡도·중요도)**: 전 태스크 복잡도 < 7 → **split 없음(development-planner의 데이터/UI 축 1차 분리를 그대로 유지, 추가 split 불필요)**. T10.1은 연관 기능ID 0개(신규 API 없음, `DepartmentDetailView.tsx` 408~437행의 기존 인라인 페이징 UI를 추출하는 순수 리팩터링)·단일 관심사(페이징)·실시간/파일 미포함이나 정상 동작 중인 화면의 회귀 위험이 있어 T4.1(복잡도4) 대비 근소 상회 → 복잡도 5. T10.2는 연관 기능ID 2개(`BOARD_LIST`, `CATEGORY_LIST`)·board/category 밀접 연관 도메인·실시간/파일 미포함이며 `departmentKeys` 동형 팩토리 2개(`boardKeys`/`categoryKeys`) 동시 신설이 T6.2(기능ID1개, 복잡도4)보다 근소 상회 → 복잡도 5. T10.3은 새 페이지+새 라우트+기존 placeholder 사이드바 항목 전환(`sidebarMenuItems.ts`의 '게시판' 항목은 이미 선언돼 있고 `implemented:false`만 해제하는 것)+새 카테고리 셀렉트+검색+T10.1 페이징 소비+`react-table`이 겹쳐 T6.3(복잡도6, 동일 규모의 복합 신규 배선)과 동형 → 복잡도 6. 중요도는 ROADMAP 실측 Depends-on 참조 횟수 기준: T10.2=9(T10.3·T11.1·T12.1·T13.1 4개 후행 태스크가 이미 Depends-on에 명시, 로드맵 전체 최다 공식 참조), T10.3=8(T11.3·T12.2·T15.1 3개 후행 태스크가 Depends-on에 명시, T6.3과 동형 근거), T10.1=8(이번 배치 공식 참조는 T10.3 1건뿐이나 M10 서두 서술상 '이후 모든 목록형 도메인이 복제'·M14 BOARD_COMMENTS 재사용이 예정돼 있어 T4.1의 7보다 상회).
> **실행 순서(의존성 위상 + 중요도)**: T10.2(중요도9) → T10.1(중요도8, T10.2와 상호 독립·동순위라 병렬 착수도 가능) → T10.3(둘 다 완료 후 착수).
>
> Shrimp task-id: T10.1=`ecd2c3cd-cc8f-4ea1-8b5e-e3ec9ca187aa` · T10.2=`17dd09c3-3880-431d-b224-249fbfc41446` · T10.3=`8f1b413d-ea44-41c4-807f-44f5805ca9bd`

---

### M11 — 게시글 상세 열람 슬라이스 (파일 다운로드/미리보기 표준 흡수② + likeCount 읽기표시) · 근거: 4번째 PRD F303/F304/F306/F310/F311, §MVP 필수 지원(흡수②), 게시글 상세 페이지

> 목표: 목록에서 넘어온 **임의 boardId** 상세(본문·메타·첨부·좋아요수 **읽기 표시**) 열람 + **첨부 파일 다운로드/이미지 인라인 미리보기 표준(흡수②)** 확립 + (작성자·ADMIN) "수정" 진입·(임시저장 글) "발행"까지 완성한다. 댓글은 M14(별도 슬라이스). 여정 진입 순서(목록 → 상세)를 따른다.
> 완료 정의: `/boards/:boardId` 상세 렌더(진입 시 서버 조회수 증가를 재조회로 반영), 이미지 확장자 첨부는 인라인 미리보기·그 외는 다운로드가 동작, `likeCount`가 읽기 표시되고, 작성자/ADMIN에게 "수정" 버튼이 노출된다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| **T11.1** | (데이터 계층) **상세·첨부 조회 훅 신규**: `getBoardDetail`/`useBoardDetailQuery`(F303 `BOARD_DETAIL`, path `boardId`, **진입 시 서버가 조회수 증가** → 응답 신뢰·재조회로 반영) + `getBoardFiles`/`useBoardFilesQuery`(F304 `BOARD_FILES`, fileId/originalName/extension/fileSize). 응답의 `empId`(작성자)로 작성자 액션 게이팅 소스 확보. 필드는 §참조 계약 매핑·`generated-snippets/{BOARD_DETAIL,BOARD_FILES}/` 근거 | F303, F304, §참조 계약 매핑 | T10.2 | 상세·첨부 목록이 `boardKeys.detail`/`boardKeys.files`에 캐시, 작성자 `empId` 노출 | 9 | 5 | ☑ |
| **T11.2** | **파일 다운로드/미리보기 표준 확립(흡수②, 이후 파일 첨부 도메인이 복제)**: (a) **다운로드 표준** — `BOARD_FILE_DOWNLOAD`(F310, GET blob, `Content-Disposition: attachment`)를 blob으로 저장 다운로드하는 공유 유틸. (b) **인라인 미리보기 표준** — `BOARD_FILE_PREVIEW`(F311, path `boardId`/`fileId`, `inline`)를 **M5 objectURL 생명주기 표준(`useEmpFilePreviewUrl` T5.1)을 재사용/일반화**해 인라인 이미지 렌더(create/revoke·언마운트 해제·조회 실패 폴백). `extension`으로 이미지 판별(png/jpg/jpeg/gif) → 미리보기 vs 다운로드 분기. **주의**: `useEmpFilePreviewUrl`은 EMP 경로 하드코딩이므로 경로 파라미터화 또는 board 전용 병렬 훅으로 objectURL 생명주기 표준만 재사용(신규 발명 아님) | F310, F311, §MVP 필수 지원(흡수②) | T5.1, T11.1 | fileId 이미지 첨부는 인라인 blob 미리보기(언마운트 revoke), 비이미지는 attachment 다운로드, 조회 실패 시 폴백 | 7 | 8 | ☑ |
| T11.2-a | (a) **다운로드 표준**: `downloadBoardFile`(F310 `BOARD_FILE_DOWNLOAD`, GET blob, `Content-Disposition: attachment`) — 상태 없는 공유 유틸로 blob 조회 후 브라우저 저장 다운로드 트리거. T11.3의 비이미지 첨부 클릭이 소비 | F310 | T11.1 | 비이미지 첨부 다운로드 클릭 시 blob이 원본 파일명으로 저장 트리거, objectURL 즉시 revoke | 5 | 3 | ☑ |
| T11.2-b | (b) **인라인 미리보기 표준 일반화**: `BOARD_FILE_PREVIEW`(F311, path `boardId`/`fileId`, `inline`)를 M5 `useEmpFilePreviewUrl`(T5.1, EMP 경로 하드코딩 실측 확인)의 objectURL 생명주기 로직(create/revoke/cancelled 가드)만 재사용해 경로 파라미터화 또는 board 전용 병렬 훅으로 일반화. 기존 EMP 소비처(`BlobAvatar`) 회귀 없어야 함. extension 기반 이미지 판별 헬퍼 함께 제공 | F311 | T11.1 | 이미지 첨부 fileId로 objectURL 생성·인라인 렌더·언마운트 revoke, 조회 실패 시 폴백, 기존 EMP 프로필사진 표시 회귀 없음 | 6 | 6 | ☑ |
| **T11.3** | (UI 계층) **게시글 상세 페이지·라우트 `/boards/:boardId` 신규**: 상세 조회(F303, longtext 본문 렌더·조회/좋아요/댓글 수 표시 — **좋아요는 읽기 표시만, 토글 버튼 없음**(§열린항목1)) + 첨부 목록(F304, T11.1) → 이미지 인라인 미리보기(F311)·기타 다운로드(F310)(T11.2) + (작성자·ADMIN) **"수정"** 버튼(→ 수정 페이지 M13, `empId`/roles 비교 게이팅·서버 403 최종) + (임시저장 글) **"발행"** 버튼(F306, T11.4) + 없는 boardId `*_NOT_FOUND_*` not-found·403 권한부족 UX. 댓글 영역은 M14에서 이 페이지에 얹음 | F303, F304, F310, F311, 게시글 상세 페이지 | T11.1, T11.2-a, T11.2-b, T10.3 | 임의 boardId 상세 열람(조회수 반영), 이미지 미리보기·기타 다운로드 동작, likeCount 읽기표시(토글 없음), 작성자/ADMIN "수정" 노출, not-found/403 분기 | 8 | 6 | ☑ |
| **T11.4** | **게시글 발행 mutation(F306) + 상세 배선**: `useBoardPublishMutation`(`BOARD_PUBLISH`, path `boardId`, `204`, 작성자 또는 ADMIN) 신규 + 상세 페이지 "발행" 버튼 배선 → 성공 시 상세 `invalidate` + 토스트, 403 권한부족 UX. **M15 내 임시저장함이 동일 mutation 재사용**(중복 생성 금지) | F306, 게시글 상세 페이지 | T11.3, T1.1 | 임시저장 글 "발행"(204) → 상세 재조회 + 토스트, 발행 mutation이 M15에서 재사용 가능하게 분리 | 5 | 4 | ☑ |

> **M11 split 판단(복잡도·중요도)**: T11.1은 연관 기능ID 2개(`BOARD_DETAIL`/`BOARD_FILES`)·단일 도메인(board)·실시간/파일 업로드 미포함이며 `boardKeys`(T10.2 기완성) 팩토리에 키 2개만 확장하는 수준이라 T10.2와 동형 → 복잡도5. T11.2는 연관 기능ID 2개(`BOARD_FILE_DOWNLOAD`/`BOARD_FILE_PREVIEW`)에 더해 **M5에서 이미 완료된 공유 코드(`useEmpFilePreviewUrl`/`BlobAvatar`)를 회귀 없이 일반화해야 하는 리스크**가 겹쳐 복잡도8(≥7) → **의존성 독립적인 두 하위 표준 축으로 split**(태스크 원문의 (a)/(b) 구분을 그대로 사용): T11.2-a(다운로드, 상태 없는 단발 유틸, 복잡도3)·T11.2-b(미리보기, 기존 완료 공유 훅 일반화 리스크가 T5.1 원표준 수립과 동급, 복잡도6). T11.3은 기능ID 4개(F303/F304/F310/F311) span이나 전부 T11.1/T11.2 소비 조립(신규 API 통합 없음)이라 T2.1-b/T6.3과 동형 → 복잡도6. T11.4는 연관 기능ID 1개(`BOARD_PUBLISH`)·단일 mutation+버튼 배선이라 T3.1/T8.1과 동형 → 복잡도4. 중요도는 ROADMAP 실측 Depends-on 참조 횟수 기준: T11.1=9(T11.2·T11.3·T13.1·T14.1 4개 후행 태스크가 Depends-on에 명시, T10.2와 동형 최다 참조), T11.3=8(T11.4·T13.3·T14.2 3개 후행 참조, T10.3과 동형), T11.2(부모)=7·T11.2-b=6·T11.2-a=5(명시적 후행 참조는 T11.3 1건뿐이나 "이후 파일 첨부 도메인이 복제"할 표준 성격상 T10.1과 동형 가점, 미리보기 쪽이 재사용 표준 성격이 더 강해 다운로드보다 근소 상회), T11.4=5(T15.1 1건 참조 + M15 완료 정의 자체가 "발행 mutation 재사용"을 명시해 순수 리프보다 근소 상회).
> **실행 순서(의존성 위상 + 중요도)**: T11.1(9) → T11.2-a(5)·T11.2-b(6) 상호 독립 병렬 착수 가능 → T11.3(8) → T11.4(5).
> M11 병렬 지점: **T11.2-a·T11.2-b**는 T11.1 완료 후 상호 독립 → 병렬 착수 가능하며, 둘 다 T11.3(상세 UI)과도 부분 병렬 개발 가능(미리보기/다운로드 프리미티브는 상세 컨테이너와 독립). T11.4는 T11.3(상세 컨테이너) 완료 후.
> **주의(§열린항목1)**: 좋아요 토글 엔드포인트가 `api-endpoint.md`에 부재하므로 **토글 버튼/mutation을 만들지 않는다** — `likeCount` 읽기 표시만. 엔드포인트 확정 시 별도 태스크화(추측 구현 금지).
>
> Shrimp task-id: T11.1=`109d120b-d1d2-4423-8220-443fc3807f4c` · T11.2-a=`4a4e308c-44fc-4eff-9b84-bc484dd2c3c4` · T11.2-b=`c99080e2-03d2-4633-9aba-d654a70165d0` · T11.3=`99cf5628-7544-4214-8b02-9708758f9714` · T11.4=`9a87f6ae-d0b8-40f2-86ed-2f2413b49d48`

---

### M12 — 게시글 작성 슬라이스 (텍스트 전용 + 임시저장글 불러오기 F308 재사용) · 근거: 4번째 PRD F305/F308, 게시글 작성 페이지

> 목표: **텍스트 전용** 신규 게시글 작성(카테고리·제목·본문) + 임시저장/발행 분기 슬라이스를 완성한다. **첨부는 이 단계에서 다루지 않는다**(`BOARD_REGISTER`가 boardId 미반환) — 첨부가 필요하면 "임시저장글 불러오기" 토글(F308 재사용)에서 **사용자가 직접** 방금 저장한 글을 선택해 수정 페이지(M13)로 이어간다(자동 추정/휴리스틱 금지).
> 완료 정의: 글쓰기 폼(RHF+zod) 제출 → 임시저장(`publishedAt` 미포함)/발행(포함) 분기 성공, "임시저장글 불러오기" 토글에서 항목 선택 시 `/boards/:boardId/edit` 이동.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| **T12.1** | (데이터 계층) **작성·임시저장목록 조회/등록 신규**: `getBoardDrafts`/`useBoardDraftsQuery`(F308 `BOARD_DRAFTS`, **본인만** 조회, boardId/title/updatedAt → `boardKeys.drafts()`) + `registerBoard`/`useBoardRegisterMutation`(F305 `BOARD_REGISTER`, `categoryId`/`title`/`content`/`publishedAt?` — `201` **Empty(boardId 미반환)**). 필드는 §참조 계약 매핑·`generated-snippets/{BOARD_REGISTER,BOARD_DRAFTS}/` 근거. **drafts 조회는 M15 임시저장함이 재사용** | F305, F308, §참조 계약 매핑 | T10.2 | `BOARD_DRAFTS`가 `boardKeys.drafts()`에 캐시, `BOARD_REGISTER` 임시저장/발행 분기 요청 동작(publishedAt 유무) | 7 | 5 | ☑ |
| **T12.2** | (UI 계층) **게시글 작성 페이지·라우트 `/boards/new` 신규**: 작성 폼(RHF+zod: 제목≤50·공백불가, 본문 공백불가, 카테고리 required — 카테고리 소스 T10.2 재사용) + **임시저장/발행 분기 버튼**(`publishedAt` 포함 여부) + **"임시저장글 불러오기" 토글(F308 재사용)**: `BOARD_DRAFTS` 목록을 펼쳐 **사용자가 boardId를 직접 선택**해 확정(자동 추정/휴리스틱 금지 — 다건 임시저장 오배치 방지) → 선택 시 `/boards/:boardId/edit` 이동 + 목록 "글쓰기" 진입점(T10.3) 연결 + 검증 실패 폼 에러·활성 사원 위반 403 UX | F305, F308, 게시글 작성 페이지 | T12.1, T1.1, T10.3 | 발행/임시저장 분기 성공→상세·목록 이동+토스트, "임시저장글 불러오기"에서 사용자가 항목 직접 선택 시 수정 페이지 이동, 검증 실패 폼 에러 | 6 | 6 | ☑ |

> **M12 split 판단(복잡도·중요도)**: 전 태스크 복잡도 < 7 → **split 없음**(M10과 동일 관행). T12.1은 연관 기능ID 2개(`BOARD_REGISTER`, `BOARD_DRAFTS`)·단일 board 도메인·실시간/파일 미포함이며, T10.2가 이미 신설한 `boardKeys` 팩토리의 `drafts()` 슬롯을 그대로 소비해 새 키 팩토리 신설 부담이 없어 T10.2(신규 팩토리 2개 신설, 복잡도5)보다 가벼운 수준 → 복잡도 5. T12.2는 신규 페이지+라우트+zod 폼+분기 버튼+임시저장 토글+목록 진입점 연결+403/폼에러 UX가 겹쳐 T10.3(복잡도6, 동일 규모의 복합 신규 배선)과 동형 → 복잡도 6. 중요도는 ROADMAP 실측 Depends-on 참조 횟수 기준: T12.1=7(T12.2·T15.1 2개 후행 태스크가 Depends-on에 명시), T12.2=6(T13.3 1개 후행 태스크가 Depends-on에 명시).
> **실행 순서(의존성 위상 + 중요도)**: T12.1 → T12.2(데이터 계층 완료 후 UI 착수, 의존성상 순차 진행).
>
> Shrimp task-id: T12.1=`96d458e6-4e4a-426c-abe3-5ba2c7355321` · T12.2=`a6f5c037-ecf1-4a5b-a65a-86e54ca578aa`
>
> M12 병렬 지점: T12.1(데이터) 완료 후 T12.2(UI). M11(상세)과는 상세 컨테이너 존재만 전제(T10.3)이며 작성 자체는 독립. **주의**: 첨부 자동 판별 태스크를 만들지 않는다(설계 확정 — 사용자 직접 선택).

---

### M13 — 게시글 수정 + 첨부 업로드/삭제 슬라이스 (파일 업로드 표준 흡수②) · 근거: 4번째 PRD F307/F304/F309/F312, §MVP 필수 지원(흡수②), 게시글 수정 페이지

> 목표: 편집 초기값 로드 → 수정(`modifiedAt` 갱신) + 첨부 추가 업로드/개별 삭제 슬라이스를 완성하고, 이 과정에서 **파일 업로드 표준(흡수②, PATCH multipart part명 `file`)**을 확립한다. 여정상 상세/작성/임시저장함에서 수렴하는 편집 지점.
> 완료 정의: `/boards/:boardId/edit` 편집 초기값 로드 → 저장(204) → 상세 재조회, 첨부 추가 업로드/개별 삭제 동작(프론트 사전검증: 게시글당 최대 10개·총 10MB·허용확장자).

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| **T13.1** | (데이터 계층) **편집초기값·저장 신규**: `getBoardEditMode`/`useBoardEditModeQuery`(F307 `BOARD_EDIT_MODE`, `{boardId,categoryId,title,content}`, 권한=작성자) + `updateBoard`/`useBoardUpdateMutation`(F307 `BOARD_UPDATE`, 변경 필드 optional·`modifiedAt` **required**, `204`). 성공 시 상세 `invalidate`. 필드는 §참조 계약 매핑·`generated-snippets/{BOARD_EDIT_MODE,BOARD_UPDATE}/` 근거 | F307, §참조 계약 매핑 | T10.2, T11.1 | 편집 초기값 조회·저장(204·modifiedAt 필수) 동작, 저장 성공 시 상세 invalidate | 5 | 5 | ☑ |
| **T13.2** | **파일 업로드/삭제 표준 확립(흡수②)**: `useBoardFileUploadMutation`(F309 `BOARD_FILE_UPLOAD`, **PATCH multipart part명 `file`(단수)**, path `boardId`, `204`) + `useBoardFileDeleteMutation`(F312 `BOARD_FILE_DELETE`, path `boardId`/`fileId`, `204`). **프론트 사전검증은 `@../docs/도메인모델.md` 기준(게시글당 최대 10개·총 10MB)**, 허용확장자 pdf·doc·docx·xls·xlsx·ppt·pptx·txt·csv·png·jpg·jpeg·gif·zip, 위반코드 FILE_001~004. 성공 시 첨부 목록(T11.1) `invalidate`. **다중 첨부는 파일별 순차 PATCH를 기본안**으로 삼되, 다중 part 일괄 전송 가능 여부는 실측/논의 전까지 순차 PATCH로 진행(§열린항목3 `//todo`) | F309, F312, §MVP 필수 지원(흡수②), §참조 계약 매핑 | T11.1 | 단수 `file` PATCH 업로드·개별 삭제(204) 동작, 사전검증(개수/총량/확장자) 위반 차단, 성공 후 첨부 목록 재조회 | 6 | 6 | ☑ |
| **T13.3** | (UI 계층) **게시글 수정 페이지·라우트 `/boards/:boardId/edit` 신규**: 편집 초기값 로드(T13.1) → 수정 폼(RHF+zod, 변경 필드만 전송) 저장 + 첨부 목록(F304, T11.1 재사용)·추가 업로드(F309, T13.2)·개별 삭제(F312, T13.2) UI + **상세 "수정"·작성 "임시저장글 불러오기"·임시저장함 "이어쓰기" 세 진입점 수렴** + 저장 성공(204)→상세 재조회+토스트, 소유권 위반 403·없는 boardId not-found UX | F307, F304, F309, F312, 게시글 수정 페이지 | T13.1, T13.2, T11.3, T12.2 | 편집 초기값 로드→저장→상세 재조회, 첨부 추가/삭제 동작, 세 진입점에서 동일 페이지 도달, 403/not-found 분기 | 6 | 7 | ☑ |
| T13.3-a | (UI 계층) **편집 페이지 골격(폼+저장)**: `/boards/:boardId/edit` 라우트 신규 + T13.1 초기값 로드 → RHF+zod 수정 폼(변경 필드만 전송) → 저장(204) → 상세 재조회+토스트, 소유권 위반 403·없는 boardId not-found UX. 첨부 UI는 T13.3-b가 이어서 얹음 | F307, 게시글 수정 페이지 | T13.1, T11.3, T12.2 | 편집 초기값 로드→변경 필드만+modifiedAt 저장(204)→상세 재조회+토스트, 403/not-found 분기 | 5 | 5 | ☑ |
| T13.3-b | (UI 계층) **첨부 UI 배선 + 세 진입점 수렴 확인**: T13.3-a 페이지에 첨부 목록(F304, T11.1 재사용)·추가 업로드(F309, T13.2)·개별 삭제(F312, T13.2) UI 배선 + 사전검증 위반 차단 UI + 상세 "수정"·작성 "임시저장글 불러오기"·임시저장함 "이어쓰기"(향후 M15) 세 진입점이 동일 페이지로 수렴하는지 확인 | F304, F309, F312, 게시글 수정 페이지 | T13.3-a, T13.2 | 첨부 목록 렌더·추가 업로드/개별 삭제(204)→목록 재조회, 사전검증 위반 차단 UI, 세 진입점에서 동일 페이지 도달 확인 | 6 | 6 | ☑ |

> **M13 split 판단(복잡도·중요도)**: T13.1은 연관 기능ID 2개(`BOARD_EDIT_MODE`/`BOARD_UPDATE`)·단일 board 도메인·실시간/파일 미포함이며 T10.2가 신설한 `boardKeys` 팩토리에 슬롯만 확장하는 수준이라 T10.2/T11.1/T12.1(기능ID2개 데이터계층, 복잡도5)과 동형 → 복잡도5(<7) → **split 없음**. T13.2는 연관 기능ID 2개(`BOARD_FILE_UPLOAD`/`BOARD_FILE_DELETE`)·단일 도메인이나 **파일 업로드 포함**(SKILL.md 복잡도 상향 요인)에 프론트 사전검증 로직(개수10·총량10MB·확장자 화이트리스트·위반코드 4종)이 겹쳐 순수 데이터계층(5)보다 상회하되, T11.2(복잡도8)가 겪은 "기존 공유코드 일반화 회귀 리스크"는 신규 mutation이라 해당 없어 8에는 못 미침 → 복잡도6(<7) → **split 없음**. T13.3은 기능ID span 4개(F307/F304/F309/F312)로 T11.3(기능ID4개 span, 순수 조회조립, 복잡도6)과 동일 span이나 실제로 수정·업로드·삭제 3종 mutation 폼/버튼을 소비측에서 배선해야 해 범위가 더 넓어 복잡도7(≥7) → **의존성 순서 축으로 split**: T13.3-a(편집 폼 골격 — 라우트 신설+초기값 로드+저장+403/not-found, T3.1 동형에 라우트·not-found 추가로 근소 상회 → 복잡도5)가 먼저 서고, 그 위에 T13.3-b(첨부 UI 배선+세 진입점 수렴 확인 — T11.2-b 동형: 목록재사용+업로드+삭제+사전검증 피드백 → 복잡도6)가 얹힌다. 세 진입점 중 상세 "수정"(T11.3)·작성 "임시저장글 불러오기"(T12.2)의 네비게이션은 이미 해당 태스크에서 구현되므로 T13.3은 목적지 라우트만 정확히 완성하면 자연 수렴한다(진입점별 특화 로직 발명 금지). 중요도는 ROADMAP 실측 Depends-on 참조 횟수 기준: T13.1·T13.2 모두 후행 참조 1건(T13.3)뿐이나, T13.2는 "표준 확립(흡수②)" 성격이라 T11.2-b(참조1건→6)와 동형 가점 적용 → T13.1=5(T11.4와 동형, 순수 데이터 소비)·T13.2=6. T13.3(부모, 사실상 T13.3-b가 최종 출구)은 M15 T15.1 1건 참조로 T12.2(참조1건→6)와 동형 → 6, T13.3-a는 내부 전제(후행 T13.3-b 1건 참조)로 5.
> **실행 순서(의존성 위상 + 중요도)**: T13.1(5)·T13.2(6) 상호 독립 → 병렬 착수 가능 → T13.3-a(둘 다 완료 후 착수, 5) → T13.3-b(T13.3-a 완료 후, 6).
>
> Shrimp task-id: T13.1=`856f8516-473c-4ccf-b782-939f3da40caa` · T13.2=`86fd955e-6d0d-443a-a09a-886a4a40e82e` · T13.3-a=`5d77597f-a0e9-4f0c-9211-cc36054bb75c` · T13.3-b=`fbd1b2e6-423f-4042-9839-e5ede906fc86`

> M13 병렬 지점: T13.1(편집 데이터)·T13.2(파일 표준)는 상호 독립 → 병렬 착수 가능. T13.3(→T13.3-a·T13.3-b)은 둘 다 완료 후.
> **주의(§열린항목3)**: `BOARD_FILE_UPLOAD` request-parts는 단수 `file`만 문서화 → 파일별 순차 PATCH 기본안. 다중 part 일괄 방식은 실측/백엔드 논의로 확정(`//todo`).

---

### M14 — 댓글 슬라이스 (F313~F317, 페이징 표준 재사용) · 근거: 4번째 PRD F313/F314/F315/F316/F317, 게시글 상세 페이지(댓글 영역)

> 목표: 상세 페이지 하단 댓글 세로 슬라이스 — 목록(1-depth 대댓글·**페이징 표준 T10.1 재사용**)·등록·대댓글·수정·삭제(soft)를 완성한다. 상세 컨테이너(M11) 위에 얹으며, 작성/수정(M12/M13)과는 독립이다.
> 완료 정의: 상세 페이지에서 댓글 목록(페이징) 렌더, 등록/대댓글/수정/삭제 성공 → 댓글목록·`commentCount` 재조회, `isDeleted` 댓글은 "삭제된 댓글입니다." 표시, `isEdited` 표기.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| **T14.1** | (데이터 계층) **댓글 조회 + mutation 4종 신규**: `getBoardComments`/`useBoardCommentsQuery`(F313 `BOARD_COMMENTS`, `Page<Comment>`·query page/size → `boardKeys.comments`) + `COMMENT_REGISTER`(F314)·`COMMENT_REPLY`(F315)·`COMMENT_UPDATE`(F316)·`COMMENT_DELETE`(F317, soft) mutation. 성공 시 댓글목록 + 상세(`commentCount`) `invalidate`. 필드는 §참조 계약 매핑·`generated-snippets/{BOARD_COMMENTS,COMMENT_*}/` 근거 | F313, F314, F315, F316, F317, §참조 계약 매핑 | T11.1 | 댓글 목록이 `boardKeys.comments`에 캐시(페이징), 4종 mutation 각 201/204 처리 + 목록·commentCount invalidate | 6 | 6 | ☑ |
| **T14.2** | (UI 계층) **상세 페이지 댓글 영역 배선**: 댓글 목록(F313, `parentCommentId`로 1-depth 그룹핑·`isDeleted` "삭제된 댓글입니다."·`isEdited` 표기·**표준 페이징 T10.1 재사용**) + 등록 폼(F314, ≤300·공백불가) + 대댓글(F315, **대댓글엔 답글 버튼 미노출**=재대댓글 금지) + (본인 댓글) 수정(F316)/삭제(F317, soft). **삭제/수정 버튼은 댓글 작성자(`writerEmpId`===본인)에게만 노출** + 활성 사원/권한 위반 403 UX. **각주: ADMIN 삭제 허용 여부는 계약("댓글 작성자")과 도메인모델("작성자 또는 관리자")이 달라 서버 403 응답 확인 후 반영**(§열린항목2, `//todo`) | F313, F314, F315, F316, F317, 게시글 상세 페이지 | T14.1, T11.3 | 댓글 목록(페이징·1-depth·soft delete·isEdited) 렌더, 등록/대댓글/수정/삭제 성공→재조회, 대댓글에 답글 버튼 미노출, 작성자에게만 수정/삭제 버튼 | 4 | 6 | ☑ |

> **M14 split 판단(복잡도·중요도)**: T14.1은 연관 기능ID 5개(`BOARD_COMMENTS`+`COMMENT_REGISTER`/`REPLY`/`UPDATE`/`DELETE`)로 로드맵 전체에서 T9.1(5개 기능ID·6개 mutation, 파라미터 형태 이질적→복잡도8→split)과 기능ID 수는 동일하나, 실측(`generated-snippets/COMMENT_*/request-fields.adoc`) 결과 `COMMENT_REGISTER`/`REPLY`/`UPDATE` 3종의 요청 바디가 `content`(300자 이하·공백불가) 단일 필드로 **완전히 동일**하고 `COMMENT_DELETE`는 바디 자체가 없어, 4개 mutation이 공유 invalidate 콜백(댓글목록+상세 `commentCount`) 하나로 커버되는 동형 구조다. 또한 `boardKeys.comments()` 슬롯은 T10.2/T11.1에서 이미 팩토리에 예약돼 있어 신규 키 팩토리 신설 부담도 없다 — T9.1-a(3개 기능ID·4 mutation, 파라미터 이질적, 복잡도5)보다 기능ID span은 넓으나 mutation 동형성으로 상쇄돼 복잡도 6(<7) → **split 없음**. T14.2는 신규 라우트/페이지 없이(T11.3 상세 페이지 내부에 영역만 추가) 리스트 렌더+1-depth 그룹핑+등록/대댓글 폼 2종+소유권 게이팅+표준 페이징 소비가 겹쳐 T9.2/T9.3/T11.3(복잡도6, 동일 규모의 복합 신규 배선)과 동형 → 복잡도 6(<7) → **split 없음**. 중요도는 ROADMAP 실측 Depends-on 참조 횟수 기준: T14.1=6(T14.2 1개 후행 태스크만 참조, T9.1-a가 동일하게 1개 후행 참조로 중요도6을 받은 것과 동형 근거), T14.2=4(로드맵 전체에서 T14.2를 Depends-on으로 명시하는 후행 태스크가 없는 리프 — T8.1/T9.2/T9.3과 동일 근거).
> **실행 순서(의존성 위상 + 중요도)**: T14.1(6) → T14.2(4, 데이터 계층 완료 후 UI 착수, 의존성상 순차 진행).
> M14 병렬 지점: T14.1(데이터) 완료 후 T14.2(UI). 마일스톤 자체는 M11(상세 컨테이너) 완료 후 **M12/M13(작성·수정)과 독립 병렬** 가능(§병렬화 참조).
> **주의(§열린항목2)**: 삭제 권한은 프론트에서 **작성자에게만 버튼 노출**하고 ADMIN 허용 여부는 서버 응답으로 확인 후 반영(임의 확장 금지).
>
> Shrimp task-id: T14.1=`76a8e922-e62a-41f7-bd56-88b5f87ba21c` · T14.2=`18fb9d19-6ac3-41b6-83fe-f498617d9369`

---

### M15 — 내 임시저장함 슬라이스 (F308/F306 재사용) · 근거: 4번째 PRD F308/F306, 내 임시저장함 페이지

> 목표: 본인 임시저장 게시글 목록 열람 + 이어쓰기(수정)/발행 슬라이스를 완성한다. **F308 drafts 조회(T12.1)·F306 발행 mutation(T11.4)을 재사용**하는 순수 조립 슬라이스다. 여정상 마지막.
> 완료 정의: "임시저장함" → 본인 임시저장 목록(제목·최근수정시각) → 항목 클릭 시 수정 페이지 이어쓰기 / "발행"(204) → 목록·임시저장함 invalidate + 토스트.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| **T15.1** | **내 임시저장함 페이지·라우트 `/boards/drafts` 신규**: 임시저장 목록(F308, **T12.1 `useBoardDraftsQuery` 재사용**, boardId/title/updatedAt) + 항목 클릭 → 게시글 수정 페이지(T13.3) 이어쓰기 + **"발행" 버튼(F306, T11.4 발행 mutation 재사용)** → 목록/임시저장함 `invalidate` + 토스트 + 목록 페이지 "임시저장함" 진입점(T10.3) 연결. **본인만 조회**(서버 not-found/403 → 해당 UX). 신규 API·훅 없음(재사용 조립) | F308, F306, 내 임시저장함 페이지 | T12.1, T11.4, T13.3, T10.3 | 임시저장함 진입→본인 목록 렌더, 항목 클릭→수정 페이지, "발행"(204)→목록·임시저장함 재조회+토스트 | 4 | 5 | ☑ |

> **M15 split 판단(복잡도·중요도)**: T15.1은 연관 기능ID 2개(F308 `BOARD_DRAFTS`, F306 `BOARD_PUBLISH`)가 모두 **기존 훅 재사용**(T12.1 `useBoardDraftsQuery`·T11.4 `useBoardPublishMutation`, 신규 API 함수·query/mutation 훅 0개)이고 단일 도메인(board)·실시간(STOMP)/파일 업로드 미포함이라 복잡도 5(<7) → **split 없음(단일 task 유지)**. `boardKeys.drafts()`·`boardKeys.all`은 T10.2에서 이미 신설돼 있음을 실측 확인(`src/features/board/model/queryKeys.ts`)했고, 발행 성공 시 "목록·임시저장함 둘 다 invalidate"는 `boardKeys.all`(`['board']`) 단일 invalidate로 충족되도록 이미 설계돼 있어(queryKeys.ts 주석 실측) 신규 무효화 로직 발명이 불필요하다. T11.4(복잡도4, 기능ID1개·신규 mutation1개+버튼 배선)보다 신규 페이지+라우트+목록 렌더+클릭 내비게이션+버튼+더블 invalidate 조립 지점이 많아 근소 상회하나, 신규 데이터 계층이 전혀 없어 T10.3·T12.2(복잡도6)보다는 낮다. 중요도는 ROADMAP 실측 Depends-on 참조 횟수 기준: T15.1을 Depends-on으로 참조하는 후행 태스크가 로드맵 전체에 없음(여정상 최종 마일스톤의 유일 리프 태스크) → T3.1·T8.1·T9.2·T9.3과 동형 근거로 4.
> **실행 순서(의존성 위상)**: 단일 태스크. 선행(T12.1·T11.4·T13.3·T10.3) 완료 후 T15.1 착수(추가 내부 순서 없음).
>
> Shrimp task-id: T15.1=`069403fe-e6fc-4610-9f6f-9446e89108e8`

---

## 🔀 병렬화 가능 지점 (요약)

- **M0**: T0.1 · T0.3 · T0.6 상호 독립 → 동시 착수.
- **M1**: T1.5(회원가입·비인증 라우트)는 T1.2~T1.4(인증 라우트 체인)와 독립 병렬.
- **M2**: 없음 — T2.1이 T2.1-a(데이터)/T2.1-b(UI+라우트+셸)로 split되며 T2.1-b가 라우트·셸 배선을 겸해 T2.2·T2.3까지 단일 선형 체인으로 직렬 진행(§M2 표 하단 참조).
- **M4**: T4.3(푸터)은 T4.1(사이드바 표준)·T4.2(헤더)와 독립 → 병렬 착수 가능.
- **M5**: T5.1(blob 프리미티브) 완료 후 **T5.2(F103 EMP 뷰)와 T5.3(F101 헤더 아바타)은 서로 독립 → 병렬** 가능. 또한 M5의 T5.1·T5.2(EMP 뷰 계층)는 M2 위에만 의존하고 헤더(M4)에 의존하지 않으므로 **M4와 부분 병렬 착수 가능**(단, T5.3 헤더 아바타는 T4.2 슬롯에 의존).
- 마일스톤 경계(M0→M1→M2→M3, 이어서 M4→M5)는 배관·셸 의존성상 **직렬 유지**를 권장한다(골격·셸이 도메인 뷰에 선행). M4~M5는 완료된 M0~M3 위에 얹으며 배관을 재작업하지 않는다.
- **M6**: T6.1(정합화)→T6.2(DEPTS)→T6.3(페이지·메뉴)는 단일 선형 체인(직렬). 정합화가 데이터·UI에 선행.
- **M7 ↔ M8**: 둘 다 M6 위에 얹히고 서로 독립(M7=상세 열람, M8=목록 위 등록) → **병렬 착수 가능**. 단 M9(관리)는 M7(상세 컨테이너) 완료에 의존.
- **M9**: T9.1(관리 mutation 데이터 계층) 완료 후 **T9.2(3개 placeholder 실동작화)와 T9.3(F207/F209 신설)은 서로 독립 → 병렬** 가능. T9.3은 후보 목록에 T6.2(DEPTS)를 재사용하므로 M6 완료를 함께 전제.
- 마일스톤 경계(M6→M7→{M8,M9})도 조회 계층·컨테이너가 mutation에 선행하므로 **직렬 유지**를 권장한다(M8/M7만 상호 병렬). M6~M9는 완료된 M0~M5 위에 얹으며 배관·셸을 재작업하지 않는다.
- **M10**: T10.1(페이징 표준)·T10.2(데이터 조회 훅) 상호 독립 → 병렬 착수, T10.3(UI)은 둘 완료 후.
- **M11**: T11.2(파일 다운로드/미리보기 표준)는 T11.1 완료 후 T11.3(상세 UI)과 부분 병렬 가능. T11.4(발행)는 T11.3 후.
- **M13**: T13.1(편집 데이터)·T13.2(파일 업로드/삭제 표준) 상호 독립 → 병렬, T13.3(UI)은 둘 완료 후.
- **M12 ↔ M14**: 둘 다 M11(상세 컨테이너) 위에 얹히고 서로 독립(M12=작성, M14=상세 댓글 영역) → **병렬 착수 가능**. M13(수정)은 M12 완료에 의존, M15(임시저장함)는 M12·M13·M11.4 모두에 의존.
- 마일스톤 경계(M10→M11→{M12→M13→M15, M14})는 배관·조회 계층이 mutation/편집에 선행하므로 **직렬 유지**를 권장한다(M12/M14, 그리고 M14와 M13은 상호 병렬). M10~M15는 완료된 M0~M9 배관·셸·react-table·objectURL 표준을 재작업 없이 소비·복제한다.

---

## ⚠️ 리스크 & 선행 결정 (Open Questions)

PRD가 "구현 시 결정 / 추후 조정"으로 명시적으로 남긴 지점. 착수 전/중 확정 필요.

1. **QueryClient `staleTime`·`retry` 구체값** (§A-3) — "조회형 기본 짧게", "retry 0~1"만 결정됨. 실제 수치는 구현 시 확정. (T0.3)
2. **zod 필드 상세** — 필드 이름 수준만 PRD에 정의. 실제 제약은 `generated-snippets/<기능ID>/` 스니펫 실측을 근거로 확정(추측 금지). 대상: `REGISTER`(empNo 9자리·loginId 8~20·name ≤20·password 규칙), `UPDATE_SELF_INFO`(extensionNo `NNN-NNNN`·newRawPassword 규칙). (T1.1, T1.5, T3.1)
3. **레이아웃 셸 디자인** (§B) — 스크린샷 없이 텍스트 스펙으로 진행, 추후 디자인 조정 여지. 푸터는 회사명/카피라이트 placeholder. (T0.7, T1.6)
4. **`activeFiles` 렌더링 범위** (§참조 계약 매핑 주의) — 응답에 필드 존재하나 이번 스코프는 파일 표시/업로드 UI 제외 → "렌더링 최소화"의 구체 수준(완전 숨김 vs 이름만 표기) 확정 필요. (T2.2)
5. ~~**부서 멤버 목록 `deptId` 출처**~~ — **확정됨**: `DEPT_MEMBERS`는 path `deptId` 필요하며, 이번 스코프는 **"본인 소속 부서 자동 진입"** 방식으로 사용자 확인을 거쳐 결정했다. `useMeQuery`(T1.3) 조회 결과의 `currentDepts`에서 `isPrimary===true` 항목을 우선 선택(없으면 첫 항목 폴백)해 `deptId`를 자동 도출, `useDepartmentMembersQuery(deptId)`로 바로 진입한다. 별도 부서 선택 UI는 이번 스코프에 없다. (T2.1-a)
6. **403(`ROLE_003`) 처리 경로** — 이번 스코프엔 부서 불일치 유발 기능이 없으나, PRD가 "인터셉터 배관 증명을 위해 403 처리 경로는 구현·표준화"를 요구 → T0.2 헬퍼에 403 권한부족 UX 분기를 실기능 없이도 포함. (T0.2, T2.2)
7. **⚠️ 본인(me) 프로필사진 preview용 numeric `empId` 소스 공백 — 열린 항목(2번째 PRD §B-4)** — `EMP_FILE_PREVIEW`는 경로에 numeric `{empId}`를 요구하나, `RETRIEVE_ME_INFO`/`RETRIEVE_FILES_INFOS` 응답에는 numeric `empId`가 **없고**(`empBasicInfo`에 `empNo` 문자열만 존재), 본인 전용 preview 별칭 기능ID도 스니펫에 없다. 따라서 **본인 케이스(F101 헤더 아바타·F103 내 정보 조회 프로필사진)는 확정 소스에서 empId를 얻을 수 없다.**
   - **이번 스코프 처리(로드맵 반영)**: 본인 아바타/내 정보 프로필사진은 **이니셜 폴백을 기본**으로 하고, `//todo: 본인 preview용 numeric empId 소스 확정(서버가 me 전용 preview 기능 제공 or me 응답에 empId 추가) 필요` 플래그를 남긴다. empId 소스가 확정되면 T5.1 프리미티브를 통해 이미지로 승격한다. **T5.3·T5.2(me 부분)의 Done 조건에 "empId 미확정 시 이니셜 폴백 동작"을 명시**했다. (T5.1, T5.2, T5.3)
   - **정상 케이스**: 타 사원 상세(F103)는 `DEPT_MEMBERS`/`RETRIEVE_EMP_INFO`·라우트로 numeric `empId`를 확보하므로 실 프로필사진이 정상 표시된다 — blob-avatar 표준을 **먼저 실증**하는 경로.
   - **추측 금지 준수**: 본인 전용 preview 기능ID·경로를 임의 발명하지 않는다. 확정 필요 시 사용자·백엔드와 논의.

### M6~M9(3번째 PRD: 부서 관리) 리스크 & 선행 결정

8. **⚠️ F202/F203 조회 계층 재사용 가능하나 `DeptLeader` 타입 정합화 선행 필요(§부서장 공석 wire 계약)** — 기존 `useDepartmentInfoQuery`/`useDepartmentMembersQuery`/`DepartmentDetailView`는 상세 열람(F202/F203)에 그대로 재사용 가능하지만, **`model/deptInfo.ts`의 `DeptLeader`가 non-null로 선언**돼 실측 wire(부서장 공석 시 전 필드 null 객체)와 불일치한다(`deptInfo.ts:15`·`DepartmentMembersPage.tsx:104,154` `//todo`). **wire 타입(전 필드 nullable) 신설 + `empName` 유무 공석 판별 정규화**가 T6.1로 선행돼야 목록(F201)·상세(F202)의 공석 렌더가 근본적으로 안전해진다. (T6.1)
9. **⚠️ `DepartmentDetailView` ADMIN "부서 관리" 섹션 현황 — 3개 disabled placeholder + F207/F209 부재(코드 감사 확인)** — 현재 이 컴포넌트의 관리 섹션에는 **F205(활성화/비활성화)·F206(부서명변경)·F208(부서장지정) 3개만 disabled placeholder**로 존재하며 **서버 mutation과 전혀 연동돼 있지 않다**(클릭 무동작). **F207(상위부서변경)·F209(부서장종료)는 placeholder조차 없다**(`DepartmentDetailView.tsx` 내 `//todo` 확인). 따라서 M9는 (a) 3개 placeholder를 실동작으로 전환(T9.2) + (b) F207/F209 UI 신설(T9.3)의 두 갈래로 나뉜다. (T9.1~T9.3)
10. **F207 상위 부서 변경 후보/최상위 옵션** — 후보 목록은 `DEPTS`(isActive=true) 재조회로 구성하고 **자기 자신은 후보에서 제외**하며, `parentDeptId`는 계약상 optional이라 **선택 해제 = "최상위로 이동"**(미전달)로 처리한다. 순환 참조 등 심화 검증은 **서버 위임**(프론트에서 재구현 금지). (T9.3)
11. **부서장 지정/종료 날짜 포맷** — `appointedAt`/`endAt`는 스니펫 실측상 **`yyyy-MM-dd`**(전역 dayjs 규약 준수). 구체 UX(달력 vs 텍스트)는 구현 시 결정하되 포맷은 계약 고정. (T9.2, T9.3)
12. **부서 목록 페이징 UI 포함(M2와 대비)** — M2 부서 멤버 목록은 페이징 UI를 제외했으나, **F201 부서 목록은 PRD가 keyword/isActive/page/size + 페이징을 명시**하므로 목록 페이지에 페이징 UI를 포함한다(백로그의 "페이징 UI 제외"는 EMP 스코프 한정). `staleTime`/`retry` 구체값은 §Open Question #1과 동일하게 구현 시 확정. (T6.3)
13. **조직도 트리 시각화 제외** — 계약은 `parentDeptId` 평면 필드만 제공하고 트리 렌더 컴포넌트가 스택에 없어, MVP는 **목록(표) + 상위부서ID 텍스트 표기**로 대체한다(트리/그래프는 §백로그, 발명 금지). (T6.3, T7.1)

### M10~M15(4번째 PRD: 게시판 슬라이스) 리스크 & 선행 결정

> PRD "🚧 착수 전 확정 필요(열린 항목)" 3건은 **태스크로 만들지 않고** 관련 태스크의 선행조건/주의사항으로만 반영했다(아래 14~16). 열린 항목이 해소되기 전에는 해당 기능을 발명하지 않는다.

14. **⚠️ 좋아요 토글 엔드포인트 부재 — 열린 항목 ①** — `api-endpoint.md` 전체에 좋아요 생성/취소 REST 엔드포인트가 없다(도메인모델 `BoardLike`만 존재). 따라서 **`likeCount` 읽기 표시만** 구현하고(F303 상세·F301 목록 응답 필드), **토글 버튼/mutation은 만들지 않는다**. 백엔드에 엔드포인트 노출 여부를 확인한 뒤 별도 태스크화한다(추측 구현 금지). (T11.3)
15. **⚠️ 댓글 삭제 권한(계약 vs 도메인모델) — 열린 항목 ②** — 도메인모델은 "작성자 또는 관리자"이나 `COMMENT_DELETE` 계약 권한은 "댓글 작성자"다. 프론트는 **계약 기준으로 댓글 작성자(`writerEmpId`===본인)에게만 삭제 버튼을 노출**하고, ADMIN 삭제 허용 여부는 **서버 403 응답 확인 후 필요 시 반영**한다(`//todo`). (T14.2)
16. **⚠️ 다중 첨부 업로드 방식(단수 `file` 문서화) — 열린 항목 ③** — `BOARD_FILE_UPLOAD` request-parts는 단수 `file` 1개만 문서화됨. 10개 첨부를 **파일별 순차 PATCH를 기본안**으로 처리하되, 다중 part 일괄 전송 가능 여부는 실측/백엔드 논의로 확정한다(현재 `//todo`, 순차 PATCH로 진행). (T13.2)
17. **첨부 사전검증 총량 기준(도메인모델 vs file-upload.md)** — 프론트 사전검증은 `@../docs/도메인모델.md`(게시글당 최대 10개·총 10MB)를 따르며, `file-upload.md`의 per-file 20MB는 서버 multipart 상위 천장(더 느슨)이라 채택하지 않는다(계약 정합). 허용확장자·위반코드(FILE_001~004)는 §참조 계약 매핑 근거. (T13.2)
18. **`BOARD_REGISTER` boardId 미반환 — 설계로 해결(백엔드 논의 불필요)** — 작성 API가 boardId를 반환하지 않아 작성 직후 업로드 대상을 특정할 수 없다. **UX로 해결**: 첨부 없이 임시저장 → 작성 페이지 "임시저장글 불러오기"(F308 재사용)에서 **사용자가 직접** 방금 저장한 글 선택 → 확정된 boardId로 수정 페이지 이동해 업로드. "가장 최근 updatedAt" 같은 **자동 추정/휴리스틱 금지**(다건 임시저장 오배치 방지). 별도 자동 판별 태스크를 만들지 않는다. (T12.2, T13.3)
19. **`Page` 페이징 표준의 최초 확립 지점(흡수①)** — 현재 페이징 UI는 `DepartmentDetailView`에 **인라인**으로만 존재한다. T10.1에서 이를 **재사용 가능한 공유 훅/컴포넌트로 승격**해 BOARD_LIST·BOARD_COMMENTS·이후 목록 도메인이 복제하게 한다. 추출 시 기존 부서 상세 멤버 페이징 회귀가 없도록 한다. `staleTime`/`retry` 구체값은 §Open Question #1과 동일하게 구현 시 확정. (T10.1)
20. **본문 렌더 방식(Tiptap vs textarea)** — PRD 기술 스택이 "Tiptap 또는 textarea(셸 표준 따름)"로 열어둠. longtext 본문 입력/렌더 방식은 구현 시 결정하되, **추가 라이브러리 도입 금지**(Tiptap은 스택에 이미 있음). 확정 필요 시 사용자와 논의. (T12.2, T13.3, T11.3)

---

## 📦 백로그 (PRD 명시 제외 — 태스크화 금지)

> PRD "3. MVP 이후 기능"에 의도적 제외로 명시된 항목. 향후 별도 PRD/로드맵 대상이며 이번 로드맵에서 태스크화하지 않는다.

- 사원 수정(HR `HR_UPDATE_EMP_INFO` / 부서매니저 `DEPT_MANAGER_UPDATE_EMP_INFO`)
- 사원 삭제/퇴직/정직/활성화(`HR_RESIGN_EMP`, `HR_SUSPEND_EMP`, `HR_ACTIVATE_EMP` 등)
- 사원 검색·필터(`EMPS_FOR_MANAGEMENT` keyword/status), **페이징 UI**
- 파일 업로드(프로필/전자서명 `EMP_FILE_UPLOAD` 등) — 도메인 정책 상이, `@../docs/도메인모델.md` 참조
- 테마/다크모드, 다국어(i18n), 프로필 커스터마이징, 브라우저 푸시 알림
- auth 외 전 도메인(근태·전자결재·일정·게시판·쪽지·채팅·가맹점 등)

**M4~M5(2번째 PRD "4. MVP 이후 기능") 명시 제외 — 태스크화 금지:**

- **알림(notification) 실기능** — `api-endpoint.md`에 대응 기능ID 부재. 셸엔 아이콘 placeholder(S3)만, 실기능은 계약 확정 시 별도 PRD.
- **채팅 전체(방 목록·실시간 송수신, `CHAT_ROOM_LIST`/`CHAT_MESSAGES`/STOMP)** — **방 목록 조회 UI 포함 완전 제외**. 셸엔 버튼 placeholder(S4)만, 별도 채팅 도메인 PRD.
- **프로필/전자서명 파일 업로드·활성화·삭제**(`EMP_FILE_UPLOAD`·`ACTIVATE_ME_FILE`·`EMP_FILE_DELETE`·`HR_UPDATE_ONES_FILE_STATUS`) — 이번 스코프는 **표시(preview)만**, 업로드/활성화/삭제 UI 없음.
- **전자서명(`SIGNATURE`) 파일 표시** — 프로필사진(`PROFILE_PICTURE`)만 표시, 서명은 계속 숨김.
- **회사 정보 동적 조회/수정** — `GET /api/companies` 라우트는 존재하나 기능ID·필드 계약 미문서화(`api-endpoint.md` 인덱스 부재)로 확정 불가 → 푸터(S5) 정적 placeholder 유지.
- **Layer 2 업무 도메인 페이지(HR/FRANCHISE/FACILITY/IT)** — 각 도메인 PRD 담당. 사이드바 노출 규칙(S2)만 M4가 확정, 실 항목은 배치하지 않음(고아 메뉴 방지).

**M6~M9(3번째 PRD "3. MVP 이후 기능") 명시 제외 — 태스크화 금지:**

- **조직도 트리/그래프 시각화** — 계약은 `parentDeptId` 평면 필드만 제공, 트리 렌더 컴포넌트는 현재 스택에 없음. MVP는 목록(표)+상위부서ID 텍스트로 대체(별도 논의 대상).
- **부서 하드 삭제** — 계약에 없음(`DEPT_ACTIVATE`/`DEPT_DEACTIVATE` 비활성화로 대체).
- **사원의 소속 부서 변경(전보)** — `employee` 도메인 기능(`DEPT_MANAGER_UPDATE_EMP_INFO`)이며 DEPT API 그룹 밖.
- **부서 근태/휴가 조회**(`DEPT_ATTENDANCE_*`·`DEPT_LEAVE_REQUEST_HISTORY`·`DEPT_BUSINESS_TRIP_REQUEST_HISTORY`·`DEPT_EMP_LEAVE_*`) — 근태/휴가 도메인 PRD 담당(부서를 조회 축으로만 씀).
- 테마/다크모드, 다국어(i18n), 프로필 커스터마이징.

**M10~M15(4번째 PRD "3. MVP 이후 기능 / 명시적 제외") 명시 제외 — 태스크화 금지:**

- **좋아요 토글(생성/취소)** — `api-endpoint.md`에 REST 엔드포인트 부재(도메인모델 `BoardLike`만 존재). `likeCount` 읽기 표시만 포함, 토글은 계약 확정 시 별도 태스크화(§리스크 14).
- **카테고리별 최신 게시글 위젯(`BOARD_LATEST`)** — 계약은 존재하나 홈 대시보드 위젯 용도로 이번 여정 밖. 홈 대시보드 PRD 담당.
- **카테고리 CRUD/노출토글**(`CATEGORY_MANAGEMENT`/`CATEGORY_REGISTER`/`CATEGORY_UPDATE_NAME`/`CATEGORY_ACTIVATE`/`CATEGORY_DEACTIVATE`, ADMIN) — 별도 관리자 PRD(이번 스코프는 `CATEGORY_LIST` 조회만).
- **게시글 검색/정렬 고급 필터** — 이번 스코프는 제목 keyword + 카테고리 필터 + 기본 페이징까지.
- **좋아요 누른 사람 목록·즐겨찾기·댓글 알림·멘션·실시간(STOMP) 갱신** — 별도 PRD(게시판은 재조회로 충분).
- **쪽지·채팅** — 같은 API 섹션이나 별도 도메인 PRD.
- 테마/다크모드, 다국어(i18n).

---

## ✅ 정합성 검증 체크리스트 (실행 결과)

**🔍 커버리지: PRD 모든 F00x → 최소 1개 태스크 매핑 (제외 기능 제외)**
- F001→T2.1 ✅ / F002→T2.2 ✅ / F003→T1.3·T2.3(및 T1.6 헤더 표시) ✅ / F004→T1.5 ✅ / F005→T3.1 ✅
- F010→T1.2 ✅ / F011→T1.4 ✅ / F012→T1.6 ✅ / F013→T1.5(F004와 단일 흐름) ✅
- **결과: 9개 기능ID 전부 태스크 매핑. F004/F013은 T1.5 단일 태스크로 통합(중복 없음) ✅**

**🔍 역참조: 모든 태스크가 PRD F00x/§섹션에 근거 (발명 태스크 없음)**
- M0(T0.1~T0.7)→§A-1~A-7·§B ✅ / M1(T1.1~T1.6)→§A-5·F010·F003·F011·F004/F013·F012 ✅ / M2(T2.1~T2.3)→F001·F002·F003 ✅ / M3(T3.1)→F005 ✅
- **결과: 근거 없는 발명 태스크 없음 ✅**

**🔍 의존성: 위상 정렬(순환 없음) + 배관 선행**
- M0(배관) → M1(인증) → M2(조회) → M3(mutation) 직렬, 각 태스크 depends-on이 앞선 태스크만 참조 → **순환 없음** ✅
- me 조회 훅(T1.3)이 세션복원(T1.4)·내 정보 조회(T2.3)·수정(T3.1)에 선행 배치 ✅
- **결과: 배관이 모든 도메인에 선행, 위상 정렬 성립 ✅**

**🔍 여정 정합: 태스크 순서 ↔ PRD 사용자 여정**
- 여정: (비인증→로그인) → 로그인→홈 셸 → 부서 멤버 목록 → 사원 상세 → 내 정보 조회 → 내 정보 수정, (부팅) 세션 복원, (가입) 회원가입→승인 대기
- 태스크 순서: T1.2(로그인)→T1.6(홈 셸)→T2.1(목록)→T2.2(상세)→T2.3(내 정보)→T3.1(수정), T1.4(세션복원), T1.5(회원가입→승인대기)
- **결과: 여정 진입 순서와 모순 없음 ✅**

**🔍 범위: PRD 제외 기능이 태스크로 유입되지 않음**
- 사원 수정(HR/부서매니저)·삭제/퇴직·검색/필터·페이징 UI·파일 업로드·테마/i18n·타 도메인 → 전부 §백로그에만 존재, 태스크 없음 ✅
- **결과: 범위 초과 없음 ✅**

**🔍 규약: 계약/전역 규칙 재서술·필드 설계·URL·인프라·견적 강제 부재**
- reissue/withCredentials/에러코드→UI 매핑 등은 §근거로 **가리키기만** 하고 재서술 안 함 ✅ / DTO 필드 상세 미설계(스니펫·PRD 참조 지시) ✅ / URL 경로 명세 없음 ✅ / 인프라·성능지표·페르소나 없음 ✅ / 달력 날짜·시수 견적 강제 없음(상대 순서·의존성 중심) ✅
- **결과: 규약 준수 ✅**

**최종: 6개 체크 전부 통과. 개발 착수 가능.**

---

### M4~M5(2번째 PRD: 공통 셸 재정비 + EMP 뷰 프로필사진) 정합성 검증

**🔍 커버리지: PRD 모든 F/S ID → 최소 1개 태스크 매핑 (제외 기능 제외)**
- F101→T5.3 ✅ / F102→T4.2(기존 배관 재사용) ✅ / F103→T5.2 ✅ / F104→T5.4 ✅ / F105→T5.2(사원 상세 프로필사진) ✅ / F106→T5.2(내 정보 조회 프로필사진) ✅
- F110→T4.2(기존 `handleLogout` 재사용) ✅ / F111→M1 T1.4 완료분 참조(재구현 없음) ✅ / F112→M3 T3.1 완료분 참조(재구현 없음) ✅
- S1→T4.2 ✅ / S2→T4.1 ✅ / S3→T4.2 ✅ / S4→T4.2 ✅ / S5→T4.3 ✅
- **결과: API 기반 F10x·셸 요소 S1~S5 전부 태스크 매핑. F110/F111/F112는 auth 완료분 재사용이라 신규 태스크 없이 참조만(중복 재구현 없음) ✅**

**🔍 역참조: 모든 태스크가 PRD F/S·§섹션에 근거 (발명 태스크 없음)**
- M4(T4.1~T4.3)→§B-2/S2·§B-1/S1·S3·S4·F102·F110·§B-3/S5 ✅ / M5(T5.1~T5.4)→§B-4·F101·F103·F104·F105·F106 ✅
- **결과: 근거 없는 발명 태스크 없음. S1~S5는 "API 미연결 셸 요소"로 PRD가 명시(발명 아님) ✅**

**🔍 의존성: 위상 정렬(순환 없음) + 배관·셸 선행**
- M4는 완료된 M0 T0.5(hasRequiredRole)·T0.7(셸)·M1 T1.6(헤더) 위에, M5는 M4(셸 프레임)·M2(EMP 뷰)·M1 T1.3(useMeQuery) 위에 얹힌다 → depends-on이 완료된 선행 마일스톤만 참조, **순환 없음** ✅
- blob-avatar 프리미티브(T5.1)가 F101(T5.3)·F103(T5.2)에 선행 배치 ✅ / **배관(M0~M3) 재작업 태스크 없음** ✅
- **결과: 셸이 도메인 뷰에 선행, 위상 정렬 성립 ✅**

**🔍 여정 정합: 태스크 순서 ↔ PRD 사용자 여정**
- 여정: 홈(셸 진입: 로고·아바타·사용자명·알림/채팅 placeholder·로그아웃·사이드바) → 부서 멤버 목록 → 사원 상세(프로필사진) → 내 정보 조회(프로필사진) → 내 정보 수정(기존)
- 태스크 순서: T4.1(사이드바)→T4.2(헤더)→T4.3(푸터) [셸 프레임] → T5.1(blob 표준)→T5.2(상세·내정보 프로필사진)→T5.3(헤더 아바타)→T5.4(목록 정합)
- **결과: 셸 프레임 확정 후 여정 순서대로 뷰 재정비, 모순 없음 ✅**

**🔍 범위: PRD 제외 기능이 태스크로 유입되지 않음**
- 알림 실기능·채팅 전체(방 목록 포함)·파일 업로드/활성화/삭제·`SIGNATURE` 표시·회사 정보 동적 조회·Layer 2 도메인 페이지 → 전부 §백로그에만 존재, 태스크 없음(셸엔 placeholder만) ✅
- **결과: 범위 초과 없음 ✅**

**🔍 규약: 계약/전역 규칙 재서술·필드 설계·URL·인프라·견적 강제 부재**
- axios 인터셉터·QueryClient·authStore·Router 등 배관은 M0~M3 §근거로 **가리키기만** 하고 재작업·재서술 안 함 ✅ / `EmpFileInfo`·`activeFiles` 필드 상세 미설계(스니펫·PRD §참조 계약 매핑 지시) ✅ / URL 경로는 근거 표기용(`EMP_FILE_PREVIEW`)일 뿐 명세 재작성 없음 ✅ / 인프라·성능지표·페르소나 없음 ✅ / 날짜·시수 견적 강제 없음(상대 순서·의존성 중심) ✅
- **결과: 규약 준수 ✅**

**🔍 열린 항목(고아 아님, 명시적 리스크): 본인 preview용 numeric empId 소스 공백(§리스크 7)** — 확정 전 이니셜 폴백 + `//todo`, T5.2(me)·T5.3 Done 조건에 반영. 타 사원 상세는 정상. 추측 경로 발명 금지 ✅

**최종: M4~M5 6개 체크 전부 통과(열린 항목 1건 명시). 개발 착수 가능.**

---

### M6~M9(3번째 PRD: 부서(조직) 관리) 정합성 검증

**🔍 커버리지: PRD 모든 F00x → 최소 1개 태스크 매핑 (제외 기능 제외)**
- F201→T6.2·T6.3 ✅ / F202→T6.1·T7.1 ✅ / F203→T7.1 ✅ / F204→T8.1 ✅ / F205→T9.1·T9.2 ✅ / F206→T9.1·T9.2 ✅ / F207→T9.1·T9.3 ✅ / F208→T9.1·T9.2 ✅ / F209→T9.1·T9.3 ✅
- **결과: 9개 기능ID(F201~F209) 전부 태스크 매핑. F202의 부서장 공석 wire 정합화는 T6.1로 선행 분리(중복 아님) ✅**

**🔍 역참조: 모든 태스크가 PRD F00x/§섹션에 근거 (발명 태스크 없음)**
- M6(T6.1~T6.3)→F201·F202·§부서장 공석 wire 계약·부서 목록 페이지·메뉴 구조 ✅ / M7(T7.1)→F202·F203·부서 상세 페이지 ✅ / M8(T8.1)→F204 ✅ / M9(T9.1~T9.3)→F205~F209·§참조 계약 매핑 ✅
- **결과: 근거 없는 발명 태스크 없음. 기존 `DepartmentMembersPage`(§2 F104)는 대상 아님으로 명시 분리 ✅**

**🔍 의존성: 위상 정렬(순환 없음) + 배관·셸·조회 선행**
- M6(목록/정합화) → M7(상세 컨테이너) → {M8(등록, 실제로는 M6 위)·M9(관리)} 순. T6.1이 T6.2·T6.3·T7.1(공석 렌더)에 선행, T9.1(데이터)이 T9.2·T9.3(UI)에 선행 → depends-on이 앞선 태스크만 참조, **순환 없음** ✅
- **완료된 M0~M5 배관·셸·EMP 뷰·`departmentKeys`·`DepartmentDetailView` 재작업 태스크 없음**(재사용/신규 배선만) ✅
- **결과: 조회 계층·컨테이너가 mutation에 선행, 위상 정렬 성립 ✅**

**🔍 여정 정합: 태스크 순서 ↔ PRD 사용자 여정**
- 여정: 사이드바 "조직도" → 부서 목록(검색/필터/페이징, ADMIN 등록) → 행 클릭 → 부서 상세(기본정보·부서장·멤버) → (ADMIN) 관리 액션
- 태스크 순서: T6.3(조직도 메뉴·목록)→T7.1(상세 열람)→T8.1(목록 위 등록)·T9.x(상세 관리)
- **결과: 여정 진입 순서(메뉴→목록→상세→관리)와 모순 없음 ✅**

**🔍 범위: PRD 제외 기능이 태스크로 유입되지 않음**
- 조직도 트리 시각화·하드 삭제·전보(`DEPT_MANAGER_UPDATE_EMP_INFO`)·부서 근태/휴가 조회 → 전부 §백로그에만 존재, 태스크 없음 ✅
- **결과: 범위 초과 없음 ✅**

**🔍 규약: 계약/전역 규칙 재서술·필드 설계·URL·인프라·견적 강제 부재**
- axios 인터셉터·QueryClient·authStore·에러매핑 등 배관은 M0~M5 근거로 **가리키기만** 함 ✅ / DTO·query 필드 상세 미설계(§참조 계약 매핑·`generated-snippets/<기능ID>/` 지시, 날짜 `yyyy-MM-dd`·`parentDeptId` optional 등은 계약 인용) ✅ / URL 경로 명세 없음(기능ID로만 표기) ✅ / 인프라·성능지표·페르소나 없음 ✅ / 날짜·시수 견적 강제 없음(상대 순서·의존성 중심) ✅
- **결과: 규약 준수 ✅**

**🔍 열린 항목(고아 아님, 명시적 리스크): §리스크 8~13** — DeptLeader 타입 정합화 선행(8)·3개 placeholder 실동작화 + F207/F209 신설(9)·F207 최상위 옵션/서버 위임(10)·날짜 포맷(11)·목록 페이징 포함(12)·트리 제외(13). 코드 감사 사실 그대로 반영, 추측 경로 발명 없음 ✅

**최종: M6~M9 6개 체크 전부 통과(열린 항목 6건 명시). 개발 착수 가능(복잡도·중요도·split은 task-planner가 착수 시 확정).**

---

### M10~M15(4번째 PRD: 게시판 세로 슬라이스) 정합성 검증

**🔍 커버리지: PRD 모든 F00x → 최소 1개 태스크 매핑 (제외 기능 제외)**
- F301→T10.2·T10.3 ✅ / F302→T10.2·T10.3 ✅ / F303→T11.1·T11.3 ✅ / F304→T11.1·T13.3(상세·수정 재사용) ✅ / F305→T12.1·T12.2 ✅ / F306→T11.4·T15.1(재사용) ✅ / F307→T13.1·T13.3 ✅ / F308→T12.1·T12.2·T15.1(재사용) ✅
- F309→T13.2·T13.3 ✅ / F310→T11.2·T11.3 ✅ / F311→T11.2·T11.3 ✅ / F312→T13.2·T13.3 ✅ / F313→T14.1·T14.2 ✅ / F314→T14.1·T14.2 ✅ / F315→T14.1·T14.2 ✅ / F316→T14.1·T14.2 ✅ / F317→T14.1·T14.2 ✅
- **결과: 17개 기능ID(F301~F317) 전부 태스크 매핑. F304/F306/F308은 재사용(상세↔수정, 상세↔임시저장함, 작성↔임시저장함)이라 중복 생성 없이 단일 데이터 계층을 공유(§흡수·재사용 원칙) ✅. 좋아요 토글은 근거 엔드포인트 부재로 태스크화하지 않음(§리스크 14) ✅**

**🔍 역참조: 모든 태스크가 PRD F00x/§섹션에 근거 (발명 태스크 없음)**
- M10(T10.1~T10.3)→§흡수①·F301·F302 ✅ / M11(T11.1~T11.4)→F303·F304·F310·F311·F306·§흡수② ✅ / M12(T12.1~T12.2)→F305·F308 ✅ / M13(T13.1~T13.3)→F307·F304·F309·F312·§흡수② ✅ / M14(T14.1~T14.2)→F313~F317 ✅ / M15(T15.1)→F308·F306 ✅
- **결과: 근거 없는 발명 태스크 없음. 페이징·파일 표준(T10.1·T11.2·T13.2)은 PRD "MVP 필수 지원(흡수①/②)"이 명시(발명 아님). 첨부 자동 판별·좋아요 토글 태스크 미생성 ✅**

**🔍 의존성: 위상 정렬(순환 없음) + 배관·조회 선행**
- M10(배관+목록) → M11(상세) → {M12(작성)→M13(수정)→M15(임시저장함), M14(댓글)} 순. T10.1/T10.2(배관)가 T10.3(목록)에, T11.1(상세 데이터)이 T11.3·T13.1·T14.1에, T12.1(drafts)·T11.4(발행)가 T15.1에 선행 → depends-on이 앞선 태스크만 참조, **순환 없음** ✅
- **완료된 M0~M9 배관·셸·react-table·objectURL 표준(T5.1)·`hasRequiredRole` 재작업 태스크 없음**(재사용/신규 배선만) ✅
- **결과: 배관·조회 계층이 편집/댓글 mutation에 선행, 위상 정렬 성립 ✅**

**🔍 여정 정합: 태스크 순서 ↔ PRD 사용자 여정**
- 여정: 사이드바 "게시판" → 목록(카테고리 필터+페이징) → 상세(첨부/댓글/좋아요표시) → 작성(텍스트만) → 임시저장글 불러오기 → 수정(첨부 포함) → 내 임시저장함
- 태스크 순서: T10.3(목록)→T11.3(상세)→T12.2(작성+불러오기)→T13.3(수정+첨부)→T14.2(댓글)→T15.1(임시저장함)
- **결과: 여정 진입 순서(목록→상세→작성→불러오기/수정→댓글→임시저장함)와 모순 없음 ✅**

**🔍 범위: PRD 제외 기능이 태스크로 유입되지 않음**
- 좋아요 토글·`BOARD_LATEST` 위젯·카테고리 CRUD·고급 검색/정렬·좋아요 목록/즐겨찾기/알림/멘션/STOMP·쪽지·채팅·테마/i18n → 전부 §백로그에만 존재, 태스크 없음 ✅
- **결과: 범위 초과 없음 ✅**

**🔍 규약: 계약/전역 규칙 재서술·필드 설계·URL·인프라·견적 강제 부재**
- axios 인터셉터·QueryClient·authStore·에러매핑·objectURL 생명주기 등은 M0~M9 근거로 **가리키기만** 함 ✅ / DTO·query 필드 상세 미설계(§참조 계약 매핑·`generated-snippets/<기능ID>/` 지시, part명 `file`·`publishedAt` optional·`modifiedAt` required 등은 계약 인용) ✅ / URL 경로는 라우트(`/boards`·`/boards/:boardId` 등) 표기일 뿐 API URL 명세 재작성 없음(기능ID로 표기) ✅ / 인프라·성능지표·페르소나 없음 ✅ / 날짜·시수 견적 강제 없음(상대 순서·의존성 중심) ✅
- **결과: 규약 준수 ✅**

**🔍 열린 항목(고아 아님, 명시적 리스크): §리스크 14~20** — 좋아요 토글 부재(14)·댓글 삭제 권한 서버 위임(15)·다중 첨부 순차 PATCH(16)·사전검증 총량 기준(17)·boardId 미반환 UX 해결(18)·페이징 표준 최초 확립(19)·본문 렌더 방식(20). PRD 열린 항목 3건(14~16)은 태스크화하지 않고 선행조건/주의로만 반영, 추측 경로 발명 없음 ✅

**최종: M10~M15 6개 체크 전부 통과(열린 항목 7건 명시). 개발 착수 가능(복잡도·중요도·split은 task-planner가 착수 시 확정).**
