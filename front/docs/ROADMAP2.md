# 근태(Attendance) Frontend 개발 ROADMAP

> 출처 PRD: `docs/prd/5.attendance-prd.md` (groupware-frontend-prd-generator 생성 · groupware-prd-validator 검증 통과, Open Question #1 백엔드 수정으로 해결)
> 이 로드맵은 PRD를 **실행 순서·의존성·태스크**로 전개한 것이다. 기능/계약의 사실 원천은 PRD와 백엔드 계약 문서(`api-endpoint.md` ATTENDANCE API + `back/build/generated-snippets/<기능ID>/`)이며, 여기서는 **무엇을 어떤 순서로 만들지**만 다룬다. 필드/DTO는 재서술하지 않고 PRD §참조 계약 매핑을 가리킨다.

## 🗺️ 개요

**📅 최종 업데이트**: 2026-07-09
**📊 진행 상황**: 19/19 Tasks 완료 (100%) — M1 ✅(6/6) / M2 ✅(3/3) / M3 ✅(6/6) / M4 ✅(4/4)

- **전략**: walking-skeleton-first 세로 슬라이스. 단, **아키텍처 배관(M0)은 이미 완료**되어 있으므로 재구축하지 않고 **소비**한다. 근태 도메인은 조회 슬라이스 → mutation 슬라이스 순으로 얇게 관통한다.
- **소비할 기존 배관(재구축 금지)**:
  - axios 단일 인스턴스·401/reissue 인터셉터·`withCredentials`: `src/shared/api/client.ts`
  - QueryClient·retry/staleTime 방침: `src/shared/api/queryClient.ts`
  - 에러 정규화·에러코드→UI 매핑 헬퍼: `src/shared/lib/apiError.ts` (`ROLE_003` 권한부족 UX 포함)
  - 보호 라우트·role 가드: `src/shared/components/ProtectedRoute.tsx`, `src/shared/lib/hasRequiredRole.ts`
  - 레이아웃 셸·사이드바 메뉴 슬롯: `src/shared/components/LayoutShell.tsx`, `sidebarMenuItems.ts`(근태 그룹 placeholder 2개 이미 선언됨)
  - 본인 부서(`deptId`) 출처: `src/features/employee/api/useMeQuery.ts` → `currentDepts[]`(`isPrimary` 축)
  - 도메인 폴더 컨벤션·queryKey 팩토리·@tanstack/react-table 목록 패턴: `src/features/board/**` 복제 대상
  - 날짜/현재시각 생성: `dayjs` / 토스트: `sonner` (CLAUDE.md §6 고정 스택)
- **범위 경계**: PRD §"MVP 이후 기능(제외)"은 로드맵 범위 밖(§백로그 참조, 태스크화 금지).
- **완료 게이트(전 마일스톤 공통)**: `npm run check-all` 통과 + `npm run build` 성공(CLAUDE.md §9).

## 🧩 의존성 개요

```
[이미 완료된 배관: M0 배관 · 인증 슬라이스 · 셸/사원뷰]  ← 소비만 함(재구축 금지)
  └→ M1 내 근태 조회 슬라이스 (F303 월별목록 + F304 요약)          ← 도메인 스캐폴딩(model/queryKeys/api) 최초 생성
        └→ M2 내 근태 mutation 슬라이스 (F301 출근 + F302 퇴근)     ← M1 월별쿼리로 오늘 버튼상태 도출·invalidate
        └→ M3 부서 근태 조회 슬라이스 (F305 월별 + F306 승인대기)     ← M1의 AttendanceItem·상태배지·페이징 재사용 + DEPT_MANAGER 게이팅
              └→ M4 부서 근태 mutation 슬라이스 (F307 수정 + F308 승인)
```

- M2와 M3은 둘 다 M1에만 의존 → **병렬 착수 가능**(§병렬화 지점 참조).

## 🚩 마일스톤 & 태스크

### M1 — 내 근태 조회 슬라이스 (읽기 우선 세로 슬라이스) ✅

> 목표: 사이드바 "내 근태" 진입 → 월별 근태 표 + 요약 카드가 실제로 그려지는 얇은 슬라이스. 근거: PRD §사용자 여정(내 근태), §페이지별 상세(내 근태 페이지), F303·F304.
> 완료 정의: `EMPLOYEE`가 메뉴로 진입해 현재 월 목록·요약을 조회, 월/상태 필터·페이징이 동작.
> 이 마일스톤이 근태 도메인 스캐폴딩(`features/attendance/{model,api,components,pages}`)을 최초로 만든다 — 이후 슬라이스가 복제·소비.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T1.1 | 근태 도메인 타입 정의: `AttendanceItem`·`AttendanceStatus` enum·`MyAttendance`·`MyAttendanceSummary`(필드 상세는 스니펫 실측, 여기서 재서술 안 함) | §참조 계약 매핑, `MY_ATTENDANCE_MONTHLY`/`_SUMMARY` | — | `features/attendance/model/attendance.ts`에 타입 존재, 스니펫과 대조 통과(contract-conformance) | 8 | 3 | ☑ |
| T1.2 | `attendanceKeys` queryKey 팩토리(board `queryKeys.ts` 동형: `all`/`myMonthly(params)`/`mySummary(yearMonth)` 등 선언) | §기술 스택, §참조 계약 매핑 | — (T1.1과 병렬) | `invalidateQueries(attendanceKeys.all)`로 하위 일괄 갱신 가능한 구조 | 7 | 2 | ☑ |
| T1.3 | 상태 배지 매핑·초과근무(overtimeMinutes) "n시간 m분" 포맷 유틸(dayjs) | §참조 계약 매핑(AttendanceStatus enum), Open Q #4 | T1.1 | `NORMAL`~`ABSENT` 6개 상태 배지 + 분→시간 변환 헬퍼 존재 | 6 | 3 | ☑ |
| T1.4 | API 함수 + query 훅: 내 월별 목록(F303, yearMonth/status/page/size optional), 내 월별 요약(F304) | F303·F304, §참조 계약 매핑 | T1.1, T1.2 | axios 인스턴스 소비, 페이징 메타(number+1) 반영, 요약은 단일 객체 | 8 | 6 | ☑ |
| T1.5 | 내 근태 페이지 조립: 월 선택(yyyy-MM, 기본=현재월)·상태 필터·요약 카드·월별 표(react-table)·페이징 | §페이지별 상세(내 근태), F303·F304 | T1.3, T1.4 | 표/카드/필터/페이징 렌더·상호작용, 조회 실패 시 에러 토스트(apiError 매핑 소비) | 6 | 6 | ☑ |
| T1.6 | 라우트 승격: `/attendance/me`(가칭) ProtectedRoute 자식으로 추가 + 사이드바 "내 근태" placeholder→`implemented:true`+`to` 승격 | §메뉴 구조, §사용자 여정 | T1.5 | 미인증→로그인 리디렉션(기존 가드), `EMPLOYEE` 메뉴 클릭→페이지 진입 | 4 | 3 | ☑ |

*(라우트 경로 최종 확정·router.tsx/sidebarMenuItems.ts 배선은 react-router-developer 위임 권장. `/attendance/me` 경로명은 착수 시 확정 — Open Questions 참조.)*

> **M1 split 판단(복잡도·중요도)**: 전 태스크 복잡도 < 7 → **split 없음(6개 전부 단일 task 유지)**. T1.1(연관 기능ID 2개·순수 타입선언, 로직 없음)·T1.2(선언적 팩토리)·T1.3(단일 도메인 순수 유틸)은 낮은 복잡도(2~3). T1.4(F303+F304 2개 엔드포인트 묶음이나 axios+react-query 표준 패턴 반복, react-table·라우트 미포함)와 T1.5(필터+요약카드+표+페이징 조립이나 라우트/사이드바 배선은 T1.6으로 분리)는 각각 6으로 경계값이나 7 미만 유지. T1.6은 기존 placeholder 승격 수준(신규 로직 없음)이라 복잡도 3.
> **실행 순서**: T1.1(중요도8) → T1.2(중요도7, T1.1과 병렬) → T1.4(중요도8, T1.1·T1.2 의존) → T1.3(중요도6, T1.4와 동순위나 중요도 낮아 후순) → T1.5(T1.3·T1.4 의존) → T1.6(T1.5 의존, 리프). 근거: 위상정렬(Depends-on) 우선 + 동순위 내 중요도 높은 순. T1.1·T1.4가 M2(T2.1/T2.2)·M3(T3.1/T3.3/T3.4)까지 재사용되는 기반이라 M1 내 최고 중요도.

### M2 — 내 근태 mutation 슬라이스 (출근/퇴근) ✅

> 목표: 오늘 출·퇴근 버튼이 당일 근태 상태에 따라 활성/비활성되고, 성공 시 목록·요약이 갱신되는 슬라이스. 근거: PRD §페이지별 상세(내 근태 주요기능), F301·F302.
> 완료 정의: 오늘 기록 없음→출근 활성, 출근만 있음→퇴근 활성, 완료→둘 다 비활성. 성공(204)→월별 목록·요약 invalidate + 토스트, 규칙위반→에러 토스트.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T2.1 | 오늘 버튼 상태 도출 로직: M1의 현재월 목록에서 오늘 일자 레코드로 출근/퇴근 활성 판정(하루 최대 2건 규칙 반영) | §페이지별 상세(내 근태), Open Q #3 | T1.4 | 3가지 상태(미기록/출근만/완료)에 대해 버튼 enable 규칙 도출, 판정 기준 문서화 | 5 | 3 | ☑ |
| T2.2 | mutation 훅: 출근(F301, body 없음 POST)·퇴근(F302, body 없음 PATCH), onSuccess에서 `attendanceKeys` invalidate + 성공 토스트 | F301·F302, §다음 이동 | T1.4 | 204 처리, 성공→목록·요약 재조회, 실패→apiError 매핑 에러 토스트 | 6 | 4 | ☑ |
| T2.3 | 내 근태 페이지에 출근/퇴근 버튼 배선(T2.1 상태 × T2.2 mutation) | §페이지별 상세(내 근태) | T2.1, T2.2, T1.5 | 미출근 상태 퇴근/중복 출근 시도 시 서버 에러 토스트로 처리, 성공 시 표/카드 즉시 갱신 | 4 | 4 | ☑ |

> **M2 split 판단(복잡도·중요도)**: 전 태스크 복잡도 < 7 → **split 없음(3개 전부 단일 task 유지)**. T2.1(연관 기능ID 0개·T1.4 캐시 데이터 파생 순수 로직, API 호출 없음)은 복잡도 3(M1 T1.3 순수유틸과 동급). T2.2(F301+F302 2개 기능ID, 표준 react-query mutation 2종 반복 보일러플레이트, board 패턴 복제)는 복잡도 4(T1.2의 2보다 높으나 GET 2종+페이징 매핑까지 포함한 T1.4의 6보다 낮음). T2.3(신규 API/로직 없이 T2.1 상태×T2.2 mutation을 T1.5 페이지에 배선)은 복잡도 4(UI 배선 수준, M1 T1.6 리프와 유사). 전부 실시간(STOMP)·파일 업로드 미포함, 단일 도메인(attendance).
> **실행 순서**: T2.2(중요도6, T1.4 의존) → T2.1(중요도5, T1.4 의존·T2.2와 병렬 가능) → T2.3(중요도4, T2.1·T2.2·T1.5 의존, M2 리프). 근거: 위상정렬(Depends-on) 우선 + 동순위 내 중요도 높은 순. T2.2가 F301/F302(밀레스톤 핵심 산출물)를 실현하는 직접 선행조건이라 T2.1보다 먼저. T2.1·T2.2는 후행이 T2.3 하나뿐이라 M1의 T1.1/T1.4(M2·M3까지 재사용)보다는 낮은 중요도.

### M3 — 부서 근태 조회 슬라이스 (부서 근태 관리 페이지) ✅

> 목표: `DEPT_MANAGER` 이상만 진입하는 부서 근태 관리 페이지에서 탭①월별 근태·탭②승인대기를 조회하는 슬라이스. 근거: PRD §사용자 여정(부서 근태 관리), §페이지별 상세(부서 근태 관리 페이지), F305·F306.
> 완료 정의: 메뉴 게이팅(EMPLOYEE 미노출)·탭 전환·부서원 keyword/월/상태 필터·페이징 동작, 본인 부서(`deptId`) 축으로 조회, 타 부서 접근 시 403(`ROLE_003`) 권한부족 UX.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T3.1 | 부서 근태 타입 분리: `DeptAttendanceRow`(attendanceInfo=**배열**)·`DeptPendingRow`(attendanceInfo=**단건**) — 형태 차이로 타입 분리 | §참조 계약 매핑(월별/승인대기 형태 상이) | T1.1 | 두 타입 분리 정의, `AttendanceItem`(attendanceId 포함) 재사용 | 7 | 3 | ☑ |
| T3.2 | 본인 부서 deptId 도출: `useMeQuery().currentDepts`의 `isPrimary` 부서 → `deptId` (복수부서/선택UI 필요성은 Open Q #2) | §권한 분기점, Open Q #2 | — | deptId 확정 전 조회 훅 `enabled:false` 대기 처리 | 6 | 2 | ☑ |
| T3.3 | `attendanceKeys`에 부서 축 추가(`deptMonthly(deptId, params)`/`deptPending(deptId, params)`) + API 함수·query 훅 2종(F305 keyword/yearMonth/status/page/size, F306 page/size) | F305·F306, §참조 계약 매핑 | T3.1, T1.2 | 페이징 메타 반영, 403→apiError 권한부족 매핑 소비 | 8 | 6 | ☑ |
| T3.4-a | Tabs 셸 신설 + 탭① 월별 근태 조립(검색·월·상태 필터 + 사원별 요약/상세 배열 표 + 페이징) | §페이지별 상세(부서 근태 관리), F305 | T3.2, T3.3, T1.3 | 필터 변경 시 재조회, 요약+상세 표 렌더, 페이징 동작, 탭② 슬롯 보유 | 7 | 6 | ☑ |
| T3.4-b | 탭② 승인대기 조회 조립(단건 표 + 페이징) + 탭①↔② 전환 시 상태 독립 유지 확인 | §페이지별 상세(부서 근태 관리), F306 | T3.4-a | 승인대기 표+페이징 렌더, 탭 전환해도 각 탭 상태 보존 | 6 | 5 | ☑ |
| T3.5 | 라우트 승격: `/attendance/dept`(가칭) ProtectedRoute+`DEPT_MANAGER` 게이팅 + 사이드바 "부서 근태 승인" placeholder→승격(minRole DEPT_MANAGER) | §메뉴 구조, §권한 분기점 | T3.4-b | `EMPLOYEE`에게 메뉴 미노출, `ADMIN` 계층 자동 노출, `DEPT_MANAGER` 진입 가능 | 4 | 3 | ☑ |

*(router.tsx role 가드·sidebarMenuItems 게이팅 배선은 react-router-developer 위임 권장.)*

> **M3 split 판단(복잡도·중요도)**: T3.1(연관 기능ID 2개·순수 타입선언, 로직 없음)은 T1.1과 동급 복잡도 3, 후행이 T3.3(M3)·T4.1(M4) 2개 마일스톤에 걸쳐 재사용되어 중요도 7. T3.2(캐시된 me 데이터에서 배열 find 1회, 신규 API 없음)는 M3 최저 복잡도 2, T3.3·T3.4-a 2곳이 직접 소비해 중요도 6. T3.3(F305+F306 2개 GET, path deptId+403 매핑까지 포함해 T1.4와 동급 패턴)은 복잡도 6, F305/F306을 직접 실현하는 산출물이라 M3 최고 중요도 8. **T3.4는 2개 기능ID(F305/F306)를 상이한 데이터 형태(배열/단건)로 각각 별도 탭에 렌더 + 탭별 독립 필터·페이징 상태 관리가 겹쳐 복잡도 7(임계값) → split**: T3.4-a(Tabs 셸+탭① 월별 조립, 검색/월/상태 3종 필터+중첩 배열 표라 T1.5의 단일 필터+단일 표보다 넓은 범위, 복잡도 6·중요도 7)를 선행, T3.4-b(이미 만들어진 셸에 탭② 단건 표만 추가하는 좁은 범위, 복잡도 5·중요도 6)를 후행으로 의존성 순서 축 분할. T3.5는 T1.6과 동형인 placeholder 승격 수준이라 복잡도 3, M3 리프라 중요도 4.
> **실행 순서**: T3.1(중요도7) → T3.2(중요도6, T3.1과 독립·병렬 가능하나 동순위 내 중요도 낮아 후순) → T3.3(중요도8, T3.1 의존) → T3.4-a(중요도7, T3.2·T3.3 의존) → T3.4-b(중요도6, T3.4-a 의존) → T3.5(중요도4, T3.4-b 의존, M3 리프). 근거: 위상정렬(Depends-on) 우선 + 동순위 내 중요도 높은 순. T3.1·T3.2는 §병렬화 가능 지점에 명시된 대로 상호 독립이라 병렬 착수 가능하나, 표의 실행 순서는 중요도 우선 표기 기준을 따른다.

### M4 — 부서 근태 mutation 슬라이스 (수정/승인) ✅

> 목표: 미승인 근태 행에서 시각 수정(다이얼로그) 및 승인이 동작하고, 성공 시 해당 탭 목록이 갱신되는 슬라이스. 근거: PRD §페이지별 상세(부서 근태 관리 주요기능·다음 이동), F307·F308.
> 완료 정의: 수정 다이얼로그(RHF+zod) 제출·승인 버튼 동작, 성공(204)→해당 탭 invalidate+토스트, 규칙위반(이미 승인/당일 승인/승인건 수정)→서버 에러 토스트, 타 부서 403→권한부족 안내.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T4.1 | 근태 수정 폼 스키마(zod): startAt·endAt 중 **최소 1개** HH:mm:ss(refine) + editReason 필수 ≤100자, targetEmpId·editedAt(현재시각 ISO, dayjs) 동봉 | F307, §참조 계약 매핑(UPDATE) | T3.1 | refine으로 "둘 다 비었을 때" 폼 에러, 100자 초과 폼 에러 | 7 | 3 | ☑ |
| T4.2 | 수정 mutation 훅(F307, path `attendanceId`=목록 응답의 attendanceId), onSuccess→해당 탭 invalidate+토스트 | F307, Open Q #1(해결됨) | T4.1, T3.3 | 204 처리, 이미 승인건 수정 등 서버 위반→에러 토스트, attendanceId 목록값 그대로 사용 | 7 | 4 | ☑ |
| T4.3 | 근태 수정 다이얼로그(shadcn Dialog): 미승인 행 [수정]→폼 다이얼로그 오픈·제출 | §페이지별 상세(부서 근태 관리) | T4.1, T4.2, T3.4-a, T3.4-b | 미승인 행에서만 오픈, 검증 실패→필드 에러, 성공→다이얼로그 닫힘+목록 갱신 | 4 | 5 | ☑ |
| T4.4 | 승인 mutation 훅(F308, query targetEmpId+approvedAt 현재시각 ISO, path attendanceId, body 없음) + 행 [승인] 버튼 배선 | F308, §참조 계약 매핑(APPROVE) | T4.2 | 이미 승인/당일 건 버튼 비활성 또는 서버 에러 처리, 성공→승인대기 탭 갱신+토스트 | 6 | 5 | ☑ |

> **M4 split 판단(복잡도·중요도)**: 전 태스크 복잡도 < 7 → **split 없음(4개 전부 단일 task 유지)**. T4.1(연관 기능ID 1개·순수 zod 스키마 선언, API 호출 없음)은 복잡도 3, 후행 T4.2·T4.3 2곳이 직접 소비해 중요도 7. T4.2(F307 단일 PATCH+path parameter, T3.3이 이미 노출한 attendanceId 재사용·재조회 없음)는 복잡도 4(T3.3의 2엔드포인트+403매핑 복잡도6보다 낮고 T2.2의 2엔드포인트 복잡도4와 동급 스케일), T4.3·T4.4 2곳의 직접 선행조건이라 중요도 7. T4.3(신규 API 없이 기존 스키마·mutation을 department의 RegisterDepartmentDialog 패턴 그대로 이식해 탭①·탭② 양쪽 행에 배선)은 복잡도 5(단일 배선인 T2.3보다 두 탭 배선이라 약간 넓음), 후행 없는 M4 리프라 중요도 4. T4.4(F308 단일 mutation+버튼 배선을 다이얼로그 없이 한 태스크로 결합, T2.2+T2.3 결합 수준)는 복잡도 5, 리프이나 F308을 직접 실현하는 마일스톤 핵심 산출물이라 중요도 6.
> **실행 순서**: T4.1(중요도7, T3.1 의존) → T4.2(중요도7, T4.1·T3.3 의존) → T4.4(중요도6, T4.2 의존, T4.3과 동순위 아니나 중요도 높아 선행) → T4.3(중요도4, T4.1·T4.2·T3.4-a·T3.4-b 의존, M4 리프). 근거: 위상정렬(Depends-on) 우선 + 동순위 내 중요도 높은 순. T4.3의 Depends-on `T3.4`는 T3.4-a(탭① 조립)·T3.4-b(탭② 조립) 양쪽 모두를 가리킨다(PRD 사용자 여정상 두 탭 모두 [수정] 액션 보유). Shrimp task-id: T4.1=`92d0aa5e-52ed-482f-a5a2-a96fbe0051af`, T4.2=`219f6025-f798-4844-b7c7-ee4bf044ba89`, T4.3=`eaece374-0e1f-44dd-969e-fad9bd35b12f`, T4.4=`a0fc7d5e-2b11-4615-862c-0d225a928a19`.
> **T4.4 진행 메모(완료)**: 최초 착수 시에는 mutation 훅(`approveAttendance.ts`/`useApproveAttendanceMutation.ts`, F308)만 완성하고 [승인] 버튼 배선은 T3.4-b(탭② 승인대기 표) 완료 후로 미뤘었다(T3.4-b가 당시 `pending` 상태라 승인 대기 탭이 플레이스홀더만 렌더 중이었음). T3.4-b·T4.3(수정 다이얼로그)이 모두 완료된 뒤 `DeptAttendancePendingTable.tsx`에 [승인] 버튼을 배선했다 — `useApproveAttendanceMutation`을 표 컴포넌트 최상단에서 직접 호출(다이얼로그/폼 없는 단발 액션, board 도메인 `CommentItem.tsx`의 "상태 없는 단발 액션은 그 자리에서 처리" 원칙과 동일하되 인스턴스 공유 단위만 다름 — `CommentItem`은 항목별 1개, 여기는 표 전체가 1개 공유), `isApproved===false` 행에만 노출, `mutation.isPending` 동안 전 행 [승인] 버튼을 함께 비활성화해 중복 클릭을 막는다. `approvedAt`은 처음부터 `dayjs().format('YYYY-MM-DDTHH:mm:ss')`(오프셋 없는 로컬 wall-clock, 서버 `LocalDateTime` 파싱과 일치, contract-conformance-reviewer 지적으로 확정)로 합성했고, T4.2(`updateAttendance.ts`)·T4.3(`UpdateAttendanceDialog.tsx`)의 `editedAt`도 동일 형식을 그대로 따랐다(도메인 전체 `toISOString()` 오사용 0건, code-reviewer 재확인). code-reviewer가 T4.3 전체 구현(다이얼로그+두 탭 배선)과 T4.4 버튼 배선을 함께 검토해 non-minor 이슈 없음으로 통과, test-author-runner가 `DeptAttendancePendingTable.test.tsx`(QueryClientProvider 래핑 리팩터링 + 승인 버튼 테스트 5건 추가)를 포함해 근태 도메인 전체 26개 파일·150개 테스트 통과를 확인했다.

## 🔀 병렬화 가능 지점

- **T1.1(타입)과 T1.2(queryKeys)**: 상호 독립 → 병렬.
- **M2와 M3**: 둘 다 M1(특히 T1.4/T1.1)에만 의존하고 서로 독립 → 두 슬라이스 병렬 착수 가능(내 근태 mutation과 부서 조회를 동시에).
- **T3.1(타입)·T3.2(deptId 도출)**: 독립 → 병렬.
- **M4 내부 T4.1(스키마)**: T3.1 이후 T3.3/T3.4와 무관하게 선행 가능.

## ⚠️ 리스크 & 선행 결정 (Open Questions — PRD §Open Questions 승계)

- **라우트 경로 명명(신규 결정)**: 근태 두 페이지의 실제 경로(`/attendance/me`·`/attendance/dept`는 가칭)를 기존 router 컨벤션에 맞춰 착수 전 확정. 근태 그룹 슬롯은 PRD가 정의한 sidebarMenuItems "근태" 그룹 그대로.
- **[Open Q #2] deptId 출처**: `useMeQuery().currentDepts`의 `isPrimary` 부서를 조회 축으로 가정(T3.2). 매니저가 복수 부서를 관리하는 경우 부서 선택 UI가 필요한지 확인 필요 — 필요 시 M3에 태스크 추가.
- **[Open Q #3] 오늘 출근/퇴근 버튼 판정 기준**: 당일 근태 단건 엔드포인트 부재로 현재월 목록에서 오늘 레코드로 도출(T2.1). 하루 최대 2건(반차 분할) 시 "출근 완료" 판정 기준을 UX 확정 필요.
- **[Open Q #4] overtimeMinutes 표기 단위**: 분 정수→"n시간 m분" 변환 가정(T1.3). 반올림/표기 규칙 확인 권장.
- **[해결됨] Open Q #1**: 부서 근태 수정/승인 path `attendanceId`가 목록 응답(`attendanceInfo[].attendanceId`/단건)에 포함되도록 백엔드 수정 완료. F307/F308은 목록값을 그대로 사용(T4.2/T4.4 전제).

## 📦 백로그 (PRD 명시 제외 — 태스크화 금지)

PRD §"MVP 이후 기능(이번 PRD 명시적 제외)" 참조로만 나열(향후 별도 PRD 대상):

- 근태 정정/이의 신청 화면(`*_DRAFT_*`, `draftId` 연동 — 전자결재 도메인). 근태 목록의 `draftId`는 **표시 전용**으로만 사용.
- 휴가/연차·출장 신청·잔여 휴가(`*_LEAVE_*`, `*_BUSINESS_TRIP_*` — 별도 도메인).
- 근태 통계/차트 대시보드(Recharts 시각화).
- 관리자(ADMIN) 전용 전사 근태 조회(계약상 전사 엔드포인트 없음 — ADMIN은 부서 화면 재사용).
- 테마/다크모드, i18n, 브라우저 푸시 알림.

## ✅ 정합성 검증 체크리스트 (실행 결과)

- 🔍 **커버리지**: F301(T2.2/T2.3)·F302(T2.2/T2.3)·F303(T1.4/T1.5)·F304(T1.4/T1.5)·F305(T3.3/T3.4)·F306(T3.3/T3.4)·F307(T4.1~T4.3)·F308(T4.4) — 8개 전부 ≥1 태스크 매핑 ✅
- 🔍 **역참조**: 모든 태스크가 PRD F30x/§페이지별 상세/§참조 계약 매핑/§Open Questions에 근거 — 발명 태스크 없음 ✅
- 🔍 **의존성**: M1→(M2·M3)→M4 위상 정렬, 순환 없음. 기존 배관은 재구축하지 않고 소비 전제 ✅
- 🔍 **여정 정합**: 태스크 순서가 PRD 사용자 여정(내 근태 조회→출퇴근→부서 조회→수정/승인)과 일치 ✅
- 🔍 **범위**: PRD 제외 기능(정정/휴가/출장/차트/전사조회)은 백로그로만, 태스크화 없음. `draftId` 표시 전용 ✅
- 🔍 **규약**: 계약/전역 규칙(reissue·페이징+1·ROLE_003·withCredentials) 재서술 없음, 필드/DTO 설계 없음(스니펫 참조로 위임), URL/인프라/견적 강제 없음 ✅

**결과: 6개 항목 전부 통과. 기존 배관 소비 전제로 근태 도메인 M1~M4만 설계 완료. F301~F308 착수 가능.**
