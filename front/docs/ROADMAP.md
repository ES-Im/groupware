# HARUON Auth Walking Skeleton (EMP 대표 슬라이스) Frontend 개발 ROADMAP

> 출처 PRD: `docs/prd/auth-walking-skeleton-prd.md`
> 이 로드맵은 PRD를 **실행 순서·의존성·태스크**로 전개한 것이다. 기능/계약의 사실 원천은 PRD와 백엔드 계약 문서이며, 여기서는 **무엇을 어떤 순서로 만들지**만 다룬다.
> 계약·전역 규칙(reissue 로직, dayjs, 페이징 +1, ApiError 구조, withCredentials, 에러코드→UI 매핑)과 필드/DTO 상세는 재서술하지 않는다 — PRD 본문·§참조 계약 매핑·`generated-snippets`를 가리킨다.

---

## 🗺️ 개요

**📅 최종 업데이트**: 2026-07-06
**📊 진행 상황**: 13/17 Tasks 완료 (76%) — M0 ✅ / M1 ✅ / M2 대기 / M3 대기

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
```

- 원칙: **배관이 모든 도메인에 선행**한다. 각 도메인 마일스톤은 화면·훅·상태·에러를 관통하는 **작동하는 얇은 슬라이스** 하나를 완성한다.
- me 조회 훅(F003)은 세션 복원(M1)에서 먼저 필요하므로 M1에 선행 배치하고, M2·M3가 이를 재소비한다.

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

### M2 — EMP 조회 슬라이스 · 근거: PRD F001/F002/F003, §A-3

> 목표: 인증된 셸 위에서 목록→상세 조회 세로 슬라이스를 완성한다. 여정 순서(부서 멤버 목록 → 사원 상세 → 내 정보 조회)를 따른다.
> 완료 정의: 사이드바 목록 → 행 클릭 상세 → 내 정보 조회까지 조회 동선이 동작한다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| **T2.1** | 부서 멤버 목록 페이지: `useDepartmentMembersQuery(deptId)` → `departmentKeys.members(deptId)` / `DEPT_MEMBERS`. **deptId는 본인 소속 부서 자동 진입**(`useMeQuery`의 `currentDepts`에서 도출, 별도 선택 UI 없음 — §⚠️ 리스크 5번 확정). `@tanstack/react-table`로 목록 렌더(**1페이지만·페이징 UI 제외**, 메타는 응답에 존재), 행 클릭→사원 상세, 조회 실패→토스트/`*_NOT_FOUND_*` not-found UX | F001, 부서 멤버 목록 페이지 | T0.3, T0.7, T1.6 | 부서 멤버 목록 렌더, 행 클릭 시 상세 라우트 이동 | 8 | 7 | ☐ |
| T2.1-a | (데이터 계층) `departmentKeys` 팩토리·`getDepartmentMembers`·`useDepartmentMembersQuery` 신설 + `getPrimaryDeptId(currentDepts)`로 본인 소속 deptId 자동 도출(isPrimary 우선, 없으면 첫 항목 폴백) | F001, §A-3 | T0.3, T1.3 | 훅 호출 시 `DEPT_MEMBERS` 응답이 `departmentKeys.members(deptId)`에 캐시, deptId 도출 규칙 동작 | 7 | 4 | ☐ |
| T2.1-b | (UI 계층) 목록 페이지(react-table 최초 도입) + router.tsx 라우트 신설(목록/`employees/:empId` placeholder) + `LayoutShell` 사이드바 3항목(홈/부서 멤버 목록/내 정보) 실배선 + 행 클릭 이동 + not-found/토스트 분기 | F001, §B | T2.1-a, T0.7, T1.6 | 목록 자동 렌더, 행 클릭 이동, 사이드바 3항목 동작, 에러 분기 노출 | 8 | 6 | ☐ |
| **T2.2** | 사원 상세 페이지(타 사원): `useEmployeeQuery(empId)` → `employeeKeys.detail(empId)`(기존) / `RETRIEVE_EMP_INFO`. `RETRIEVE_ME_INFO`와 **동일 응답 스키마**(스니펫 실측 확인) → `model/me.ts`를 `EmployeeInfoResponse`로 일반화 후 공유 컴포넌트 `EmployeeInfoView` 신설. 미존재(`EMP_001` 등 `*_NOT_FOUND_*`)→not-found UX, 403→권한 부족 UX. `activeFiles`는 필드만 존재·렌더링 완전 숨김(파일 UI 제외) | F002, 사원 상세 페이지 | T2.1-b | 상세 단건 조회 렌더, not-found·403 분기 UX 존재, me와 컴포넌트 재사용 | 6 | 5 | ☐ |
| **T2.3** | 내 정보 조회 페이지(본인 상세): `useMeQuery`(T1.3, 완료) + T2.2의 `EmployeeInfoView` 재사용으로 본인 상세 렌더, `/me` 라우트 실연결(사이드바·헤더 링크는 T2.1-b에서 배선 완료), "수정" 버튼 노출(→ M3, 페이지는 미구현). 본인 상세는 `RETRIEVE_ME_INFO` 사용(`/api/auth/me` 미존재) | F003, 내 정보 조회 페이지 | T1.3, T2.2 | 본인 정보 렌더(상세와 동일 컴포넌트 재사용), "수정" 버튼 노출 | 7 | 3 | ☐ |

> **M2 split 판단(복잡도·중요도)**: T2.1은 신규 department 도메인 슬라이스 신설 + `@tanstack/react-table` 최초 도입 + `LayoutShell`(공유 셸) 사이드바 실배선 + `router.tsx` 라우트 신설이 겹쳐 복잡도 7로 판정 → **의존성 순서 축(데이터 계층 → UI 계층)으로 split**(T2.1-a/T2.1-b). T2.2·T2.3은 각각 연관 기능ID 1개(`RETRIEVE_EMP_INFO`/`RETRIEVE_ME_INFO`)·단일 도메인(employee)·실시간·파일 업로드 미포함이며 기존 훅/타입(`employeeKeys.detail`, `useMeQuery`) 재사용 비중이 커 복잡도 < 7 → **split 없음(단일 task 유지)**.
> **실행 순서(의존성 위상 우선, 동순위 내 중요도)**: T2.1-a → T2.1-b → T2.2 → T2.3(단일 선형 체인이라 전 구간 위상 순서가 곧 실행 순서). T2.1-b(중요도8)가 T2.2·T2.3의 라우팅/셸 인프라를 함께 확정하므로 M2 내 최고 중요도.
> M2 병렬 지점: 위 split로 인해 T2.1 내부는 직렬(a→b)로 확정되며, T2.2의 상세 조회 컴포넌트 코어를 목록과 완전 독립 개발하는 기존 병렬안은 T2.1-b가 라우트/셸 배선까지 겸하므로 채택하지 않는다(직렬 진행).

---

### M3 — 대표 mutation 슬라이스 · 근거: PRD F005, §A-3, §A-5

> 목표: RHF+zod+**서버 검증 에러매핑**과 mutation 성공 invalidate를 관통 증명하는 대표 mutation 하나를 완성한다. 여정상 마지막(내 정보 조회 → 수정 → 재조회).
> 완료 정의: 내 정보 수정 저장(204) → `employeeKeys.me()` invalidate → 내 정보 조회 재검증까지 동작한다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| **T3.1** | 내 정보 수정 페이지 + `useUpdateMeMutation()`(`UPDATE_SELF_INFO`): RHF+zod 폼, 저장 성공(204) → `onSuccess`에서 `employeeKeys.me()` invalidate → 내 정보 조회 재조회, 검증 실패(`VALIDATION_ERROR`/`COMMON_00x`)→폼 필드 에러, 그 외→에러 토스트 | F005, 내 정보 수정 페이지 | T1.1, T2.3 | 저장→204→me invalidate→조회 재검증, 서버 검증 에러가 해당 필드로 매핑 | | | |

> 필드 상세(`UpdateSelfInfoRequest`의 `extensionNo` `NNN-NNNN`·`newRawPassword` 제약 등)는 PRD §참조 계약 매핑 및 `generated-snippets/UPDATE_SELF_INFO/`를 zod 스키마 근거로 사용(이 로드맵에서 재설계하지 않음).

---

## 🔀 병렬화 가능 지점 (요약)

- **M0**: T0.1 · T0.3 · T0.6 상호 독립 → 동시 착수.
- **M1**: T1.5(회원가입·비인증 라우트)는 T1.2~T1.4(인증 라우트 체인)와 독립 병렬.
- **M2**: 없음 — T2.1이 T2.1-a(데이터)/T2.1-b(UI+라우트+셸)로 split되며 T2.1-b가 라우트·셸 배선을 겸해 T2.2·T2.3까지 단일 선형 체인으로 직렬 진행(§M2 표 하단 참조).
- 마일스톤 경계(M0→M1→M2→M3)는 배관 의존성상 **직렬 유지**를 권장한다(골격이 도메인에 선행).

---

## ⚠️ 리스크 & 선행 결정 (Open Questions)

PRD가 "구현 시 결정 / 추후 조정"으로 명시적으로 남긴 지점. 착수 전/중 확정 필요.

1. **QueryClient `staleTime`·`retry` 구체값** (§A-3) — "조회형 기본 짧게", "retry 0~1"만 결정됨. 실제 수치는 구현 시 확정. (T0.3)
2. **zod 필드 상세** — 필드 이름 수준만 PRD에 정의. 실제 제약은 `generated-snippets/<기능ID>/` 스니펫 실측을 근거로 확정(추측 금지). 대상: `REGISTER`(empNo 9자리·loginId 8~20·name ≤20·password 규칙), `UPDATE_SELF_INFO`(extensionNo `NNN-NNNN`·newRawPassword 규칙). (T1.1, T1.5, T3.1)
3. **레이아웃 셸 디자인** (§B) — 스크린샷 없이 텍스트 스펙으로 진행, 추후 디자인 조정 여지. 푸터는 회사명/카피라이트 placeholder. (T0.7, T1.6)
4. **`activeFiles` 렌더링 범위** (§참조 계약 매핑 주의) — 응답에 필드 존재하나 이번 스코프는 파일 표시/업로드 UI 제외 → "렌더링 최소화"의 구체 수준(완전 숨김 vs 이름만 표기) 확정 필요. (T2.2)
5. ~~**부서 멤버 목록 `deptId` 출처**~~ — **확정됨**: `DEPT_MEMBERS`는 path `deptId` 필요하며, 이번 스코프는 **"본인 소속 부서 자동 진입"** 방식으로 사용자 확인을 거쳐 결정했다. `useMeQuery`(T1.3) 조회 결과의 `currentDepts`에서 `isPrimary===true` 항목을 우선 선택(없으면 첫 항목 폴백)해 `deptId`를 자동 도출, `useDepartmentMembersQuery(deptId)`로 바로 진입한다. 별도 부서 선택 UI는 이번 스코프에 없다. (T2.1-a)
6. **403(`ROLE_003`) 처리 경로** — 이번 스코프엔 부서 불일치 유발 기능이 없으나, PRD가 "인터셉터 배관 증명을 위해 403 처리 경로는 구현·표준화"를 요구 → T0.2 헬퍼에 403 권한부족 UX 분기를 실기능 없이도 포함. (T0.2, T2.2)

---

## 📦 백로그 (PRD 명시 제외 — 태스크화 금지)

> PRD "3. MVP 이후 기능"에 의도적 제외로 명시된 항목. 향후 별도 PRD/로드맵 대상이며 이번 로드맵에서 태스크화하지 않는다.

- 사원 수정(HR `HR_UPDATE_EMP_INFO` / 부서매니저 `DEPT_MANAGER_UPDATE_EMP_INFO`)
- 사원 삭제/퇴직/정직/활성화(`HR_RESIGN_EMP`, `HR_SUSPEND_EMP`, `HR_ACTIVATE_EMP` 등)
- 사원 검색·필터(`EMPS_FOR_MANAGEMENT` keyword/status), **페이징 UI**
- 파일 업로드(프로필/전자서명 `EMP_FILE_UPLOAD` 등) — 도메인 정책 상이, `@../docs/도메인모델.md` 참조
- 테마/다크모드, 다국어(i18n), 프로필 커스터마이징, 브라우저 푸시 알림
- auth 외 전 도메인(근태·전자결재·일정·게시판·쪽지·채팅·가맹점 등)

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
