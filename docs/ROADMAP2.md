# 인사관리 — 신규 사원 가입승인 + 조직소속 배정 Frontend 개발 ROADMAP

> 출처 PRD: `docs/prd/18.hr-registration-prd.md` (검증 PASS · non-minor 이슈 0건)
> 이 로드맵은 PRD를 **실행 순서·의존성·태스크**로 전개한 것이다. 기능/계약의 사실 원천은 PRD와
> 백엔드 계약 문서(`@docs/backend-contract/`·`back/build/generated-snippets/<기능ID>/`)이며,
> 여기서는 **무엇을 어떤 순서로 만들지**만 다룬다(필드/DTO/URL 재서술 없음).

## 🗺️ 개요

- **성격**: 이 도메인은 **워킹 스켈레톤 최초 구축이 아니다.** 아키텍처 배관(axios `withCredentials`·
  QueryClient·`ProtectedRoute`·`hasRequiredRole`·`LayoutShell`·`handleApiError`·`useZodForm`/
  `submitWithErrorMapping`·shadcn 폼·sonner·dayjs·`@tanstack/react-table`+`Page<T>` 소비 표준)은
  이미 완성돼 있다(3번째 이후 도메인 슬라이스). **따라서 M0(아키텍처 배관) 마일스톤은 만들지 않는다.**
- **전략**: 이 도메인 하나가 통째로 **하나의 응집된 세로 슬라이스**다 — 목록조회(F001) → 승인(F002)
  → 소속배정(F003)이 하나의 마법사 플로우로 연결된다. 마일스톤은 이 여정을 "작동하는 얇은 슬라이스"
  단위로 쪼갠 것이다: **M1 목록 슬라이스(읽기 경로) → M2 승인 단계(첫 mutation) → M3 소속배정 단계
  (두 번째 mutation·마법사 완성) → M4 통합 검증**.
- **소비만·재구축 금지**: 부서 드롭다운은 `features/department`의 `useDepartmentsQuery`를 그대로
  소비(신규 조회 훅 생성 금지). 페이징 테이블은 `EMPS_FOR_MANAGEMENT`(관리용 사원 목록)가 확립한
  `@tanstack/react-table` + Spring `Page<T>` 소비 표준을 동형 재사용. 폼은 `useZodForm`+
  `submitWithErrorMapping`, mutation 무효화는 `employeeKeys` 팩토리 접두 무효화 패턴을 복제.
- **슬라이스 배치(확정)**: `features/employee/registration/` 그룹(하위 `api`/`model`/`components`/
  `pages`). 새 `features/hr` 신설 안 함(Open Q#4 확정).
- **완료 게이트(전 마일스톤 공통)**: `npm run check-all` 통과 + `npm run build` 성공(CLAUDE.md §9).

### 팀리드 확정 결정 (PRD Open Questions #1~#4 — 저자 권고안 채택)

- **#1 라우트**: `/employees/new` 채택(리소스 경로 컨벤션 `/departments`·`/department-members` 정합).
- **#2 승인 후 소속 미배정 이탈**: **경고만** 노출, 닫기 차단 안 함. 사후 재배정은 향후 사원 관리 화면 소관.
- **#3 직급 드롭다운**: PositionCode **전체 노출 + 미선택 강제**(필수 필드라 명시적 선택 유도).
- **#4 슬라이스 배치**: `features/employee/registration` 그룹 채택.

## 🧩 의존성 개요

```
(M0 아키텍처 배관 — 이미 완성. 신규 태스크 없음)
  │
  ├→ M1 가입대기자 목록 슬라이스 (F001 · 읽기 경로 · 라우트/사이드바 랜딩)
  │        └→ M2 가입 승인 단계 (F002 · 첫 mutation · 마법사 1단계, 목록 [승인]과 배선)
  │                 └→ M3 조직 소속 배정 단계 (F003 · 두 번째 mutation · 마법사 2단계 완성)
  │                          └→ M4 통합 검증 (테스트 · 계약검토 · check-all/build 게이트)
  │
  └ (M1/M2/M3의 순수 데이터 계층 — types·API함수·schema·hook — 은 서로 독립 → §병렬화 참고)
```

## 🚩 마일스톤 & 태스크

### M1 — 가입대기자 목록 슬라이스 (F001)

> 목표: HR/ADMIN이 사이드바로 진입해 PENDING 신규 사원을 **페이징·이름검색**으로 조망하는
> **작동하는 랜딩 화면**을 완성한다. 근거: PRD F001 · P1. 이 슬라이스만으로 읽기 경로가 관통한다.
> 완료 정의: 사이드바 "신규 사원 승인" 클릭 → 실제 PENDING 목록 렌더 · 검색/페이지 이동 동작 ·
> 각 행 `[승인]` 버튼 존재(다이얼로그 연결은 M2). `npm run check-all`/`build` 통과.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T1.1 | `NewEmpRecord` 타입 + `Page<NewEmpRecord>` 응답 타입 정의(`registration/model`). 필드는 `NEW_EMP_LIST` 스니펫 실측(`name` 필드 — 관리용 목록의 `empName`과 다름 주의) | F001 · §참조계약매핑 P1 | — | 타입이 스니펫 `content[]`·Page 메타와 1:1 대응 | 7 | 2 | ☑ |
| T1.2 | `getNewEmployees` API 함수(`GET /api/employees/new?keyword&page&size`, 쿼리 3개 전부 선택 → 값 없으면 생략, `getEmpsForManagement` 컨벤션 복제) | F001 · `NEW_EMP_LIST` | T1.1 | 조건부 파라미터로 요청, `Page<NewEmpRecord>` 반환 | 5 | 2 | ☑ |
| T1.3 | `employeeKeys` 팩토리에 `newEmployees(params)` 키 추가(params를 키에 포함 — 검색/페이지별 캐시 분리, 기존 `empsForManagement` 동형) | §기술스택(캐시 무효화) | — (T1.1과 병렬) | 접두 무효화(`[...all,'newEmployees']`) 가능한 키 존재 | 5 | 1 | ☑ |
| T1.4 | `useNewEmployeesQuery` 훅(`keepPreviousData`로 검색/페이지 전환 깜빡임 방지, `useDepartmentsQuery` 동형) | F001 · P1 | T1.2, T1.3 | keyword/page 변경 시 재조회, 이전 목록 유지 | 7 | 2 | ☑ |
| T1.5 | 가입대기자 테이블 컴포넌트(`@tanstack/react-table`, 컬럼: 사원번호·이름·로그인ID·이메일·내선번호 + 행별 `[승인]` 액션 콜백) | F001 · P1 | T1.1 | 5개 컬럼 렌더, `[승인]` 클릭 시 대상 empId·name 콜백 | 6 | 3 | ☑ |
| T1.6 | 신규 사원 승인 페이지(`registration/pages`): 이름 검색 입력(디바운스) · 페이지네이션(Page 메타 `totalPages`/`number`/`first`/`last`) · 빈 목록 안내("가입 대기 중인 사원이 없습니다") · `[승인]` 클릭 시 대상 empId·name을 selected 상태로 보관(다이얼로그 host는 M2) | F001 · P1 | T1.4, T1.5 | 검색·페이지 이동·빈상태 동작, `[승인]` 클릭이 selected 상태를 세팅 | 7 | 5 | ☑ |
| T1.7 | 라우트 배선 `/employees/new`(ProtectedRoute 하위) + 사이드바 placeholder 승격(`sidebarMenuItems.ts:151` `{ label:'신규 사원 승인', minRole:'HR', implemented:false }` → `to:'/employees/new'` 부여·`implemented` 제거) — **react-router-developer 위임**. role 게이팅 방식은 Open Q#R1 확인 후 결정 | P1 진입경로 · §메뉴구조 · Open Q#1 | T1.6 | 사이드바 클릭→페이지 렌더, 비HR·비ADMIN 접근 게이팅(방식은 Q#R1) | 5 | 2 | ☑ |

> 실행 순서: T1.1 → T1.3 → T1.2 → T1.5 → T1.4 → T1.6 → T1.7 (위상 정렬 우선 · T1.3/T1.5는 각각 T1.1만 의존해 병렬 착수 가능 · 동순위 내 중요도 높은 순. 전 태스크 복잡도 <7이라 하위 분할 없음, 원자 태스크 7개로 등록)

### M2 — 가입 승인 단계 (F002 · 마법사 1단계)

> 목표: 목록 `[승인]`에서 여는 **2단계 마법사 다이얼로그의 셸 + 1단계(가입 승인)**를 완성한다.
> 승인(PENDING→ACTIVE, `204`) 성공 시 2단계로 자동 전진한다(2단계 폼 본체는 M3). 근거: PRD F002 · P2.
> **순서 강제(도메인 규칙)**: 소속 배정은 대상이 ACTIVE일 때만 가능 → 승인(1단계)이 반드시 선행.
> 완료 정의: PENDING 사원 승인 → `204` → 2단계로 전진(placeholder). 실패 시 에러 토스트 후 닫고 목록 갱신.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T2.1 | 승인 폼 스키마(`hiredAt` yyyy-MM-dd 필수, dayjs strict 검증 — `updateHrManagedInfoSchema`의 `hireAt` 검증 복제) | F002 · P2 1단계 | — | 유효/무효 날짜 사전검증 | 5 | 2 | ☑ |
| T2.2 | `approveEmpRegistration` API 함수(`PATCH /api/employees/{empId}/registration-approval?hiredAt=`, **바디 없음** → `patch(url, null, { params:{ hiredAt } })`, 응답 `204` Empty) | F002 · `HR_APPROVE_EMP_REGISTRATION` | — (T2.1과 병렬) | 쿼리 파라미터만 전송, 바디 없음 확인 | 5 | 2 | ☑ |
| T2.3 | `useApproveEmpRegistrationMutation` 훅(성공 시 후속 전이는 호출부가 처리 — 이 단계에선 목록 무효화하지 않음, 승인만으로 목록에서 사라지지 않으므로) | F002 · P2 | T2.2 | 204 성공/실패를 호출부에 전달 | 6 | 3 | ☑ |
| T2.4 | 마법사 다이얼로그 셸(shadcn Dialog) + **단계 표시기**(1/2) + 1단계 폼: 대상 사원 요약(이름·로그인ID) · 입사일자 date 입력 · `[승인]` 버튼(`useZodForm`+`submitWithErrorMapping`) | F002 · P2 1단계 | T2.1, T2.3 | 1단계 폼 렌더·검증·제출 동작, 단계 표시기 노출 | 7 | 5 | ☑ |
| T2.5 | P1 `[승인]` → 마법사 다이얼로그 host 배선(대상 empId·name 컨텍스트 전달, open/close). 승인 성공(204) → 2단계로 자동 전진(2단계 본체는 M3 placeholder). 1단계 실패(이미 ACTIVE 등) → 에러 토스트 후 다이얼로그 닫고 목록 invalidate | F002 · P2 다음이동 | T2.4, T1.6 | PENDING 승인 → 204 → 2단계 전진; 실패 → 토스트+닫기+목록갱신 | 8 | 5 | ☑ |

> 실행 순서: T2.1 → T2.2 → T2.3 → T2.4 → T2.5 (위상 정렬 우선 · T2.1/T2.2는 서로 독립이라 병렬 착수 가능, 동순위 내 중요도 높은 T2.1을 먼저 · T2.3은 T2.2에만 의존(스키마는 폼 레이어 전용) · T2.4는 T2.1·T2.3 모두 필요 · T2.5는 T2.4와 M1 T1.6에 의존하며 M3(T3.7) 전체의 진입점이라 중요도 최고. 전 태스크 복잡도 <7이라 하위 분할 없음, 원자 태스크 5개로 등록)

### M3 — 조직 소속 배정 단계 (F003 · 마법사 2단계 · 슬라이스 완성)

> 목표: 마법사 **2단계(조직 소속 최초 배정)**를 완성해 승인→배정 전체 플로우를 관통시킨다.
> 신규 소속 등록이므로 `deptId·position·isPrimary·startAt` **4필드 모두 필수**(하나라도 null이면
> 서버가 "수정" 케이스로 오인), `endAt` 미수집(null). 근거: PRD F003 · P2 2단계.
> 완료 정의: 승인→소속배정 전체 마법사 관통, 배정 성공(204) 시 다이얼로그 닫고 목록 invalidate →
> 배정된 사원이 PENDING 목록에서 사라짐. `npm run check-all`/`build` 통과.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T3.1 | `PositionCode` 타입 + `positionLabels` 라벨맵 신규 작성(`registration/model`) — enum 실측: `NONE`·`INTERN`·`STAFF`·`SENIOR_STAFF`·`ASSISTANT_MANAGER`·`MANAGER`·`SENIOR_MANAGER`·`DIRECTOR`·`EXECUTIVE`(프론트에 `position` 코드용 타입/라벨맵 없어 신규) | F003 · §계약실측메모 | — | 9개 코드·한글 라벨맵 존재 | 8 | 1 | ☑ |
| T3.2 | `EmpBelongingsCreatePayload` 타입(`{ deptId, position, isPrimary, startAt, endAt:null }`) | F003 · `HR_UPDATE_EMP_BELONGINGS` | T3.1 | 스니펫 request-fields와 1:1 대응 | 5 | 1 | ☑ |
| T3.3 | 소속 배정 폼 스키마(`deptId`·`position`(PositionCode)·`isPrimary`·`startAt` yyyy-MM-dd **4필드 필수**, 직급 미선택 불허) | F003 · Open Q#3 확정 | T3.1 | 4필드 필수 사전검증, 미선택 직급 차단 | 6 | 2 | ☑ |
| T3.4 | `updateEmpBelongings` API 함수(`PATCH /api/employees/{empId}/belongings`, 4필드 바디 + `endAt:null`, 응답 `204` Empty) | F003 · `HR_UPDATE_EMP_BELONGINGS` | T3.2 | 4필드 non-null 바디 전송 | 5 | 1 | ☑ |
| T3.5 | `useUpdateEmpBelongingsMutation` 훅(성공 시 `newEmployees` 목록 접두 무효화 — 배정 완료 사원이 목록에서 사라지도록, `useUpdateHrManagedInfoMutation` 무효화 패턴 복제) | F003 · P2 다음이동 | T3.4 | 204 성공 시 목록 invalidate | 6 | 2 | ☑ |
| T3.6 | 2단계 폼 컴포넌트: **부서 드롭다운**(`useDepartmentsQuery({ isActive:true })` **재사용**, 응답은 `content[].deptInfoResponse.{deptId,deptName}` 구조 실측) · **직급 Select**(PositionCode 전체, 미선택 강제) · **주요소속** 읽기전용/기본 체크(요청엔 항상 `true`) · **발령시작일**(startAt, **기본값=1단계 입사일자** 프리필) — `onSubmit` prop으로 mutation 위임(T3.5 직접 의존 없음) | F003 · P2 2단계 · Open Q#3 | T3.1, T3.3 | 부서/직급/발령일 입력, startAt 기본값이 hiredAt로 프리필 | 7 | 6 | ☑ |
| T3.7 | 마법사 2단계 통합: 1→2단계 전이 확정(hiredAt→startAt 컨텍스트 전달) · 배정 성공(204) → 다이얼로그 닫고 목록 invalidate + 성공 토스트 · 실패(부서 미존재·필수누락 등) → 에러 토스트, **2단계 유지(승인 재호출 금지, 소속배정만 재시도)** · 승인 후 2단계에서 닫기 시 **경고 노출**("승인은 완료되었으나 소속이 배정되지 않았습니다", 닫기 차단은 안 함 — Q#2 확정) | F003 · P2 다음이동 · 엣지케이스 · Open Q#2 확정 | T3.5, T3.6, T2.5 | 승인→배정 전체 관통, 성공 시 목록서 사라짐, 이탈 경고 노출 | 9 | 6 | ☑ |

> 실행 순서: T3.1 → T3.3 → T3.6 → T3.2 → T3.4 → T3.5 → T3.7 (위상 정렬 우선 · T3.1에서 갈라지는 두 병렬 라인(T3.2→T3.4→T3.5 vs T3.3→T3.6) 중 동순위 내 중요도 높은 라인/태스크를 먼저 착수 · T3.6이 T3.7의 UI 핵심이라 T3.2보다 먼저 · T3.7은 M3 Done 조건 자체를 충족시키는 지점이자 M2 T2.5에도 의존해 중요도 최고. 전 태스크 복잡도 <7이라 하위 분할 없음(기능ID 1개·단일 도메인·실시간/파일 미포함 기준 충족), 원자 태스크 7개로 등록)

### M4 — 통합 검증 & 완료 게이트

> 목표: 슬라이스 전체의 테스트·계약 정합성·빌드 게이트를 통과시킨다. 근거: CLAUDE.md §9 체크리스트.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T4.1 | 유닛/컴포넌트 테스트 작성·실행(**test-author-runner** 위임, Mock-First/MSW): 목록 훅·테이블 렌더·검색/페이지네이션·마법사 단계 전이·두 mutation 무효화·스키마 검증 | CLAUDE.md §9 | T1.7, T2.5, T3.7 | 신규 슬라이스 테스트 통과 | 7 | 8 | ☑ |
| T4.1-a | 데이터 계층 유닛 테스트: `useNewEmployeesQuery`(keyword/page 재조회·keepPreviousData)·`useApproveEmpRegistrationMutation`(204 성공/실패, invalidate 없음)·`useUpdateEmpBelongingsMutation`(204 성공 시 `newEmployees` 접두 무효화)·승인/소속배정 폼 스키마 유효·무효 케이스 | F001·F002·F003 · T1.4/T2.1/T2.3/T3.1/T3.3/T3.5 | T1.7, T2.5, T3.7 | 4개 축(목록훅·승인mutation·소속배정mutation·2개 스키마) 테스트 통과 | 5 | 5 | ☑ |
| T4.1-b | 컴포넌트 렌더 테스트: 가입대기자 테이블(5컬럼·`[승인]` 콜백)·마법사 1단계 폼(사원요약·입사일자·단계표시기)·마법사 2단계 폼(부서 드롭다운·직급 Select·주요소속·발령시작일 프리필) | F001·F002·F003 · T1.5/T2.4/T3.6 | T4.1-a | 테이블·1단계·2단계 3개 렌더 테스트 통과 | 5 | 5 | ☑ |
| T4.1-c | 통합 플로우 테스트: 검색(디바운스)/페이지네이션·마법사 1→2단계 전이(성공/실패)·두 mutation 무효화가 목록에 반영·승인 후 2단계 이탈 경고 | F001·F002·F003 · T1.6/T1.7·T2.5·T3.7 · Open Q#2 | T4.1-b | 4개 시나리오(검색·페이지네이션/전이/무효화/이탈경고) 테스트 통과 | 8 | 6 | ☑ |
| T4.2 | 계약 정합성 검토(**contract-conformance-reviewer** 위임): 3개 엔드포인트 API 레이어(`getNewEmployees`·`approveEmpRegistration`·`updateEmpBelongings`) + 신규 타입을 스니펫과 대조 | CLAUDE.md §7 | T1.7, T2.5, T3.7 | 계약 위반 0건 | 6 | 7 | ☑ |
| T4.2-a | `NEW_EMP_LIST` 대조: `getNewEmployees` 쿼리 파라미터 조건부 생략 + `NewEmpRecord`/`Page<NewEmpRecord>` 응답 필드 1:1 대응 | `NEW_EMP_LIST` · T1.1/T1.2 | T1.7 | 계약 위반 0건 보고 | 4 | 3 | ☑ |
| T4.2-b | `HR_APPROVE_EMP_REGISTRATION` 대조: `approveEmpRegistration`의 쿼리 파라미터 전송·바디 없음(`patch(url,null,{params})`)·204 처리 | `HR_APPROVE_EMP_REGISTRATION` · T2.2 | T2.5 | 계약 위반 0건 보고 | 4 | 3 | ☑ |
| T4.2-c | `HR_UPDATE_EMP_BELONGINGS` 대조: `updateEmpBelongings` 4필드+`endAt:null` 바디·`EmpBelongingsCreatePayload`·`PositionCode` 9종 라벨맵이 스니펫/백엔드 enum과 일치 | `HR_UPDATE_EMP_BELONGINGS` · T3.1/T3.2/T3.4 | T3.7 | 계약 위반 0건 보고(4필드 필수·endAt:null·PositionCode 9종 포함) | 6 | 3 | ☑ |
| T4.3 | 완료 게이트: `npm run check-all` + `npm run build` | CLAUDE.md §9 | T4.1-c, T4.2-a, T4.2-b, T4.2-c | 검사·빌드 성공 | 9 | 2 | ☑ |

> 실행 순서: (T4.1-a ∥ T4.2-a ∥ T4.2-b) → T4.1-b → (T4.1-c ∥ T4.2-c) → T4.3 (위상 정렬 우선 · T4.1-a/T4.2-a/T4.2-b는 각각 T1.7/T2.5에만 의존해 병렬 착수 가능 · T4.1 내부는 데이터계층→컴포넌트→통합플로우 순서 강제 · T4.2-c는 T3.7 의존이라 T4.1-b 완료 시점과 병행 가능 · T4.3은 전체 후행 게이트라 중요도 최고. T4.1·T4.2는 기능ID 3개 전부에 걸쳐 복잡도≥7이라 의존성 순서(데이터계층→컴포넌트→통합, 엔드포인트별)로 3분할, T4.3은 복잡도<7이라 단일 유지)

## 🔀 병렬화 가능 지점

- **M1 내부**: `T1.1`(타입)과 `T1.3`(queryKey)은 독립 → 병렬. `T1.5`(테이블)는 `T1.1`만 의존하므로
  `T1.2`→`T1.4`(API→훅) 라인과 병렬 진행 가능.
- **M2 내부**: `T2.1`(스키마)과 `T2.2`(API)는 독립 → 병렬.
- **M3 내부**: `T3.1`(PositionCode)에서 갈라지는 두 라인 — `T3.2`→`T3.4`→`T3.5`(타입→API→훅)와
  `T3.3`/`T3.6`(스키마→2단계 폼) — 은 서로 독립 → 병렬.
- **마일스톤 교차(데이터 계층 선행 착수)**: M1·M2·M3의 **순수 데이터 계층 태스크**
  (`T1.1~T1.4`, `T2.1~T2.3`, `T3.1~T3.5`)는 UI 통합 태스크에 대한 의존만 있을 뿐 서로 간
  교차 의존이 없다 → 세 도메인 계층을 병렬로 먼저 깔 수 있다. **단 UI 통합·마법사 배선**
  (`T1.6`/`T1.7` → `T2.4`/`T2.5` → `T3.6`/`T3.7`)은 마법사 단계 순서(목록→승인→배정)를
  반드시 따른다.
- **M4**: `T4.1`(테스트)과 `T4.2`(계약검토)는 독립 → 병렬. `T4.3`(게이트)은 둘 이후.

## ⚠️ 리스크 & 선행 결정 (Open Questions)

- **Q#R1 확정됨(기존 컨벤션 채택)**: `/employees/new`는 신규 RoleGuard를 도입하지 않고 기존 컨벤션
  (`leaves/admin`·FACILITY 라우트 등과 동일)을 그대로 따른다 — **사이드바 `minRole:'HR'` 게이팅 +
  라우트 자체는 `ProtectedRoute`(인증 가드)만 적용, 최종 권한 판단은 서버 403에 위임**. 이번에
  `SecurityConfig.java`에 `GET /api/employees/new`·`PATCH .../belongings`를 HR 매처에 추가해
  두었으므로(팀리드 확정) 비HR·비ADMIN URL 직접 진입 시에도 서버가 403으로 최종 차단한다(T1.7).
- **Q#2 확정됨(이탈 경고만)**: 승인 후 소속 미배정 이탈은 경고만 노출, 닫기 차단 안 함(T3.7).
  이 사원("ACTIVE·주요소속 없음")의 사후 배정 경로는 향후 사원 관리 화면 소관(범위 밖).
- **`staleTime`/디바운스 값**: 목록 쿼리 `staleTime`·이름검색 디바운스(ms) 구체값은 기존 목록 화면
  (부서 멤버/관리용 사원 목록) 관례를 따르되, 값 자체는 구현 시 확정(발명 아님).
- **`isPrimary` UI 표현**: 최초 배정이라 항상 `true` → 읽기전용 표시 vs 기본 체크(비활성) 중 시각
  표현은 구현 시 결정(요청 바디엔 항상 `true` 포함, 이 결정과 무관).

## 📦 백로그 (PRD 명시 제외 — 태스크화 금지)

- **가입 승인 거부/반려** — 백엔드 대응 엔드포인트 없음(발명 금지).
- **기존(현재) 소속 수정** — `HR_UPDATE_EMP_BELONGINGS`의 `deptId=null`(직급/기간만 수정) 케이스.
  향후 사원 상세/관리 화면 소관.
- **퇴직/정직/활성화·사원 개인정보 수정·사원 파일 관리·관리용 사원 목록**(`EMPS_FOR_MANAGEMENT`) —
  EmpManagementApi 다른 기능(별도 PRD).
- **테마/다크모드·i18n·브라우저 푸시** — 전 도메인 공통 제외.
- **UI 시각 스타일 다듬기(Ubold 톤 이식)** — 본 로드맵은 최소 기능 뷰만 배치. 스타일링은 이후
  `adapt-ui`/`ux-ui-stylist` 단계 몫.

## ✅ 정합성 검증 체크리스트 (완료 전 필수)

- 🔍 커버리지: PRD의 모든 F00x가 최소 1개 태스크에 매핑 — F001→M1(T1.x), F002→M2(T2.x),
  F003→M3(T3.x). 제외 기능은 백로그로만. **통과.**
- 🔍 역참조: 모든 태스크가 PRD의 F00x/§섹션(참조계약매핑·계약실측메모·엣지케이스)에 근거 —
  발명 태스크 없음(승인 거부/반려·기존 소속 수정 미포함). **통과.**
- 🔍 의존성: `depends-on`이 위상 정렬(순환 없음). M0 배관은 이미 완성이라 신규 생성 안 함 —
  대신 도메인 데이터 계층이 UI 통합보다 선행. 마법사 UI는 목록→승인→배정 순. **통과.**
- 🔍 여정 정합: 태스크 순서가 PRD 사용자 여정(사이드바→목록→승인→소속배정)과 일치. 도메인
  순서 강제(ACTIVE 이후에만 소속배정)를 마법사 단계 전이로 반영. **통과.**
- 🔍 범위: PRD 제외 기능이 태스크로 유입되지 않음(백로그로만). **통과.**
- 🔍 규약: 계약/전역 규칙 재서술·필드 설계·URL 발명·인프라·마일스톤 날짜 견적 없음. 타입 이름
  수준까지만 언급하고 필드 상세는 스니펫을 가리킴. **통과.**
