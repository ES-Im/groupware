# 가맹점(Franchise) Frontend 개발 ROADMAP

> 출처 PRD: `docs/prd/16.franchise-prd.md` (F1601~F1626, groupware-prd-validator 검증 통과 — blocker/major 0건, minor 3건 반영 완료, Open Q#2(BusinessStatus enum)는 백엔드 실측으로 해소)
> 이 로드맵은 PRD를 **실행 순서·의존성·태스크**로 전개한 것이다. 기능/계약의 사실 원천은 PRD와 백엔드 계약이며, 여기서는 **무엇을 어떤 순서로 만들지**만 다룬다. 필드/DTO·body 구조는 재서술하지 않고 PRD §참조 계약 매핑을 가리킨다.

## 🗺️ 개요

**📅 최종 업데이트**: 2026-07-10
**📊 진행 상황**: 9/18 Tasks 완료 (50%) — M0 ☑ / M1 ☑ / M2 ☑ / M3 ☐(T4.1 구현·테스트 완료, 리뷰부터 재개 / T4.3·T4.4 구현 완료, 테스트부터 재개) / M4 ☐(T5.1 구현 완료, 테스트부터 재개) — ⚠️ 2026-07-10 세션 한도 중단, 인수인계: 메모리 `franchise-build-handover.md`. UX 보류: T2.3·T2.4(백엔드 FRANCHISE_DETAIL 500 수정 대기)·T3.2·T5.1

- **전략**: walking-skeleton-first 세로 슬라이스. 전역 아키텍처 배관(axios·reissue·QueryClient·authStore·ProtectedRoute·`hasRequiredRole`·LayoutShell·`apiError`·`useZodForm`·페이징 파서·blob 취득)은 이미 완료되어 있으므로 **재구축하지 않고 소비**한다. franchise 도메인은 **① 기반(모델/queryKeys 확장 + 라우팅·사이드바 placeholder 4종 승격 + FranchisePicker 공용화)** → 이후 **관심사별 4개 슬라이스(가맹점 관리 / 매출 조회 / 교육 / 문의)가 상호 독립**이라 M1~M4는 파일이 겹치지 않아 **병렬 진행 가능**하다. 각 슬라이스 내부는 조회 → 상세 → mutation 순의 세로 관통.
- **소비할 기존 자산(재구축 금지)**:
  - axios 인스턴스·401/`ROLE_002` reissue 인터셉터: `src/shared/api/client.ts` / QueryClient: `src/shared/api/queryClient.ts` / 에러 정규화: `src/shared/lib/apiError.ts` / 폼 배관: `src/shared/lib/form.ts`(`useZodForm`/`submitWithErrorMapping`)
  - authStore·부팅 시퀀스·본인 empId(`useMeQuery().data?.empBasicInfo.empId`): `src/features/auth/store/authStore.ts`, `src/features/employee/api/useMeQuery.ts`
  - 보호 라우트/셸/사이드바: `src/shared/components/ProtectedRoute.tsx`, `LayoutShell.tsx`, `sidebarMenuItems.ts`(**가맹점 그룹 placeholder 157~167행, 자식 4개 162~165행 — `implemented:false` 승격 대상**), 라우터: `src/app/router.tsx`
  - **franchise 기존 스캐폴딩(매출 기안서 때 생성, 그대로 소비)**: `src/features/franchise/api/getFranchises.ts`·`useFranchisesQuery.ts`(keyword/status/managerId/page/size 전체 지원·keepPreviousData 적용 완료)·`getFranchiseMonthlySales.ts`, `model/franchise.ts`(`Franchise`/`Page<T>`/`FranchisesPage`/`FranchiseMonthlySales`)·`model/queryKeys.ts`(`franchiseKeys.all/list/monthlySales`)
  - **사원 선택**: `EmployeePicker`(`src/shared/components/EmployeePicker.tsx`, 단일 선택 모드) — 담당자 변경(F1606)·답변 담당자 배정(F1620)
  - **가맹점 선택**: `FranchisePicker`(현 `src/features/approval/components/FranchisePicker.tsx`) — T1.3이 shared 승격(PRD Open Q#4 해소 방침, EmployeePicker 선례 동형)
  - FullCalendar(meeting 선례)·Recharts·react-table(board 페이징 표준 `number+1`)·파일 objectURL/blob 표준(board M11/M13)·shadcn·sonner·dayjs — CLAUDE.md §6 고정 스택, 추가 라이브러리 금지
- **권한 방침(PRD §권한 분기점)**: 라우트엔 인증 가드(`ProtectedRoute`)만, Layer 2 게이팅은 사이드바 `hasRequiredRole('FRANCHISE')`(meeting FACILITY 선례 동형). ADMIN은 RoleHierarchy상 자동 포함. 교육 등록자·답변 담당자 같은 소유자 조건은 **서버 403 전담**(교육 상세 응답에 등록자 식별자 없음 — 프론트는 `isActive`/`appliedCount`·`assignedManagerId===myEmpId` 힌트만).
- **계약 유의점(PRD §계약 실측 메모 승계)**: ① 식별자 필드 엔드포인트별 상이(`id`/`franchiseId`/`educationId`/`inquiryId`/`answerId`) ② 영업상태는 조회=한글 표시명·전송=enum 코드(`OPEN`·`CLOSED`·`PRE_OPEN`·`TEMP_CLOSED`·`READY_TO_OPEN`) ③ 매출 응답 `salesMonth`(`yyyyMM`)·`salesDate`(`yyyyMMdd`)는 숫자(단 일 매출 `salesDate`는 문자열) ④ 교육 파일 경로는 `/api/educations/**`(franchise-educations 아님) ⑤ 교육 활성/비활성 토글은 POST.
- **범위 경계**: 매출 기안서(`SALES_DRAFT_*`, approval 구현 완료)·외부 API 싱크·가맹점 삭제·문의 원문 수정/삭제·테마/i18n/푸시는 범위 밖(§백로그, 태스크화 금지).
- **완료 게이트(전 마일스톤 공통)**: `npm run check-all` 통과 + `npm run build` 성공(CLAUDE.md §9). 슬라이스 구현 직후 test-author-runner로 테스트 작성·실행. 기존 타 도메인 타임아웃 플레이크로 `check-all`이 exit 1일 수 있어 **franchise(+FranchisePicker 이동 영향을 받는 approval) 관련 신규·기존 테스트 통과**를 확인한다.

## 🧩 의존성 개요

```
[이미 완료된 전역 배관 + franchise 기존 스캐폴딩]  ← 소비만(재구축 금지)
  │
  └→ M0 기반 & 진입 스켈레톤
        T1.1 franchise 모델/queryKeys 확장(교육·문의·매출 네임스페이스)
        T1.2 라우팅 7개 + 사이드바 placeholder 4종 승격 [react-router-developer 위임]   (T1.1과 병렬)
        T1.3 FranchisePicker shared 승격(+approval import 갱신)                        (T1.1·T1.2와 병렬)
        │
        ├→ M1 가맹점 관리 슬라이스 (P1·P2)          ┐
        │     T2.1 목록 페이지(F1601, 기존 훅 소비)  │
        │        ├→ T2.2 가맹점 등록(F1603)         │
        │        └→ T2.3 상세 조회+UI(F1602)        │  M1·M2·M3·M4는
        │              └→ T2.4 상세 mutation 4종     │  서로 파일이 겹치지 않아
        │                 (F1604·F1605·F1606·F1607·F1608)  │  상호 독립·병렬 가능
        ├→ M2 매출 조회 슬라이스 (P3)               │
        │     T3.1 매출 api/훅 3종(F1624·F1625·F1626) │
        │        └→ T3.2 매출 조회 페이지 UI(+T1.3 의존) │
        ├→ M3 교육 슬라이스 (P4·P5)                 │
        │     T4.1 교육 캘린더(F1609, FullCalendar)  │
        │        └→ T4.2 교육 등록(F1612)            │
        │     T4.3 교육 상세+신청자(F1610·F1611)     │ (T4.1과 병렬)
        │        ├→ T4.4 교육 수정+활성토글(F1613·F1614) │
        │        └→ T4.5 교육 첨부 4종(F1615·F1616)  │
        └→ M4 문의 슬라이스 (P6·P7)                 ┘
              T5.1 문의 목록(F1617)
                 └→ T5.2 문의 상세+답변 조회(F1618·F1619)
                       ├→ T5.3 담당자 배정(F1620)
                       └→ T5.4 답변 초안 생성/수정/발송(F1621·F1622·F1623)
```

- **M0 내부 3개 태스크는 상호 독립·병렬 가능**(서로 다른 파일: model/queryKeys ↔ router/sidebar ↔ FranchisePicker 이동).
- **M1~M4는 M0 완료 후 상호 독립·병렬 가능** — 슬라이스별 담당 파일이 분리(P1·P2 ↔ P3 ↔ P4·P5 ↔ P6·P7). 단 T3.2는 T1.3(FranchisePicker 위치)에 추가 의존.
- **M3 내부**: T4.1(캘린더)과 T4.3(상세+신청자)은 서로 다른 파일 → 병렬 가능. T4.2는 등록 성공 후 상세 이동이 있어 T4.1에, T4.4·T4.5는 상세 화면 배선이라 T4.3에 의존.
- **여정 정합**: 각 슬라이스 내부 순서는 PRD 사용자 여정(목록/캘린더 진입 → 상세 → mutation)을 그대로 따른다.

## 🚩 마일스톤 & 태스크

> 표기: **라우팅·사이드바 진입 스켈레톤**(`router.tsx`·`sidebarMenuItems.ts` 편집)은 **react-router-developer 위임**(T1.2). 나머지(데이터 계층·비라우팅 UI)는 직접 구현. UI는 최소 기능 구현(스타일링은 adapt-ui 단계로 미룸). 완료 여부: ☐ 미착수 / ☑ 완료. **중요도/복잡도는 development-planner 초기 추정치**이며 착수 전 task-planner(`/shrimp:thought_split`)가 재판정·split한다(복잡도 ≥7 태스크는 split 후보).

### M0 — 기반 & 진입 스켈레톤

> 목표: 이후 4개 슬라이스가 소비할 도메인 기반(모델/queryKeys 확장·공용 가맹점 선택 위젯)과 진입 골격(라우트 7개·사이드바 가맹점 그룹 승격)을 확정. 근거: PRD §메뉴 구조, §참조 계약 매핑, Open Q#4.
> 완료 정의: FRANCHISE(또는 ADMIN) 계정으로 사이드바 `가맹점` 그룹 4개 메뉴가 노출·클릭 가능하고 각 라우트가 보호 라우트로 빈 페이지 셸을 렌더하며, `FranchisePicker`가 `src/shared/components/`에서 approval 소비처와 함께 정상 동작한다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T1.1 | franchise 모델/queryKeys 확장 — `model/franchise.ts`에 상세·생성·교육·신청자·문의·답변·연/일 매출 타입 추가(스니펫 실측, PRD §참조 계약 매핑), `model/queryKeys.ts`에 `detail`·`education*`·`inquiry*`·`sales*` 키 추가(기존 `all/list/monthlySales` 유지), `BusinessStatus` enum 코드↔표시명 상수(`OPEN`·`CLOSED`·`PRE_OPEN`·`TEMP_CLOSED`·`READY_TO_OPEN`) 정의. **[재판정: 신규 기능ID 12개·4개 서브도메인(가맹점/교육/문의/매출) 커버 → split]** | §참조 계약 매핑, §계약 실측 메모, Open Q#2(해소) | — | 타입·키 팩토리·enum 상수가 컴파일되고 기존 `getFranchises`/`getFranchiseMonthlySales` 소비처가 깨지지 않음 | 9 | 7 | ☑ |
| T1.1-a | 가맹점 상세/생성 타입 + `BusinessStatus` enum 상수 — `FRANCHISE_DETAIL`·`FRANCHISE_CREATE` 타입 + enum 코드↔표시명 매핑 상수, `franchiseKeys.detail` 키 (Shrimp `77552c58-299c-46b4-baea-5d30d6cec859`) | §참조 계약 매핑(P2 상세/등록), Open Q#2 | — | tsc 컴파일 통과, `FranchiseDetail`/`FranchiseCreateRequest`/`FranchiseCreateResponse`·enum 상수 export, 기존 심볼 무변경 | 9 | 3 | ☑ |
| T1.1-b | 교육 타입 4종 + `education*` queryKeys — `FRANCHISE_EDUCATION_CALENDAR`·`DETAIL`·`APPLICANTS`·`CREATE` 타입(`fileListInfoList`는 Open Q#3 가정 주석 필수), `franchiseKeys.education*` (Shrimp `5bebd9e5-afb7-4775-a231-a3419ac60cf7`) | §참조 계약 매핑(P4·P5), Open Q#3 | T1.1-a | tsc 컴파일 통과, 교육 4종 타입·`franchiseKeys.education*` export, T1.1-a와 이름 충돌 없음 | 8 | 4 | ☑ |
| T1.1-c | 문의 타입 3종 + `inquiry*` queryKeys — `FRANCHISE_INQUIRY_LIST`·`DETAIL`·`ANSWER_DETAIL` 타입, `franchiseKeys.inquiry*` (Shrimp `6a0fdc45-4e02-4523-a600-5b1a4493f77a`) | §참조 계약 매핑(P6·P7) | T1.1-b | tsc 컴파일 통과, 문의 3종 타입·`franchiseKeys.inquiry*` export, 기존/이전 subtask와 이름 충돌 없음 | 8 | 3 | ☑ |
| T1.1-d | 연/일 매출 타입 + `sales*` queryKeys — `FRANCHISE_SALES_YEARLY`·`DAILY` 타입(일 매출 `salesDate`는 문자열, 연/월과 타입 다름 주의), `franchiseKeys.sales*` (Shrimp `df3fc6a1-5fb8-447b-bb50-14aac3db5073`) | §참조 계약 매핑(P3), §계약 실측 메모 | T1.1-c | tsc 컴파일 통과, 연/일 매출 타입·`franchiseKeys.sales*` export, 기존 `FranchiseMonthlySales`/`monthlySales`/`getFranchiseMonthlySales` 무변경. **완료 시 T1.1 전체 Done 조건 충족** | 7 | 3 | ☑ |
| T1.2 | 라우팅 + 사이드바 승격 **[react-router-developer 위임]** — `/franchises`(P1)·`/franchises/:franchiseId`(P2)·`/franchise-sales`(P3)·`/franchise-educations`(P4)·`/franchise-educations/:educationId`(P5)·`/franchise-inquiries`(P6)·`/franchise-inquiries/:inquiryId`(P7) 라우트 + 페이지 셸 7개 생성, `sidebarMenuItems.ts` 가맹점 그룹 자식 4개(162~165행) `implemented:false` 제거·`to` 부여. **[재판정: F16xx 미직접 구현·meeting M8/T8.1 선례 동형 반복 적용 → split 불필요, 단일 유지]** (Shrimp `bbfb0408-5dda-41df-910c-99ef6d048c63`) | §메뉴 구조, §페이지별 상세(라우트 참고) | — (T1.1과 병렬) | 사이드바 4개 메뉴가 FRANCHISE 이상에게 노출되고 7개 라우트가 ProtectedRoute 하위에서 빈 셸 렌더 | 9 | 4 | ☑ |
| T1.3 | `FranchisePicker` shared 승격 — `src/features/approval/components/FranchisePicker.tsx`(+전용 위젯 테스트 `FranchisePicker.test.tsx`) → `src/shared/components/`로 이동 + approval 소비처 2곳(grep 실측: `SalesDraftCreatePage.tsx:21`·`SalesDraftEditPage.tsx:16`) import 경로 갱신(EmployeePicker 승격 선례 동형). 기능 변경 없음(이동만). **[재판정: 연관 기능ID 0·단일 파일 이동류·실시간/파일업로드 미포함 → split 불필요, 단일 유지]** (Shrimp `2378fb00-b8a6-4cd2-9298-caf4035986ad`) | §5 지원 기능(가맹점 선택 위젯), Open Q#4 | — (T1.1·T1.2와 병렬) | approval 매출 기안서 화면의 가맹점 선택이 기존과 동일 동작, import 경로 전부 갱신, 관련 기존 테스트(SalesDraftCreatePage·SalesDraftEditPage·FranchisePicker 각 test) 통과 | 6 | 3 | ☑ |

> 실행 순서: T1.1-a → T1.1-b → T1.1-c → T1.1-d (동일 파일 순차 확장, 위상 정렬 필수) ∥ T1.2 ∥ T1.3 — T1.1 계열은 M1~M4 전 슬라이스의 선행조건(중요도9)이라 M0 내에서 최우선 착수, T1.2·T1.3은 T1.1과 파일이 겹치지 않아 병렬 진행

### M1 — 가맹점 관리 슬라이스 (P1 목록 · P2 상세)

> 목표: 가맹점을 검색·등록·상세 관리(기본정보/영업상태/담당자/메모)하는 관리 코어 관통. 근거: PRD F1601~F1608, P1·P2.
> 완료 정의: FRANCHISE 계정이 목록에서 필터·페이징으로 가맹점을 찾고, 등록 다이얼로그로 신규 생성하며, 상세에서 기본정보·영업상태·담당자·메모를 수정/삭제할 수 있다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T2.1 | 가맹점 목록 페이지(P1) — **기존 `useFranchisesQuery` 소비**(확장 불요), react-table 페이징 표(`number+1`, `usePageState`+`PaginationControls`, MeetingRoomManagementPage 동형) + 필터(검색어 디바운스 300ms·영업상태 enum 드롭다운(T1.1-a 상수 소비)·담당자 — EmployeePicker 단일선택+Dialog 트리거, Popover 미도입 실측 확인) + 행 클릭 → P2 네비. **[재판정: 기능ID 1개(F1601)·단일 도메인·실시간/파일업로드 미포함 → split 불필요, 단일 유지]** (Shrimp `c78952b4-1027-40a2-be9d-ff767acd2fd7`) | F1601, P1 | T1.1(정확히 T1.1-a), T1.2 | 필터 3종·페이징이 동작하고 행 클릭 시 상세로 이동 | 9 | 6 | ☑ |
| T2.2 | 가맹점 등록(F1603) — P1 `[가맹점 등록]` 다이얼로그: zod 폼(사업자번호·가맹점명·주소·대표자명·연락처·이메일 필수 + 담당자 선택 EmployeePicker 단일) + 등록 api/mutation(`201 {franchiseId}`) → 목록 invalidate·성공 토스트. MeetingRoomCreateDialog+useMeetingRoomCreateMutation+meetingRoomCreateSchema 3종 세트 동형 복제. **[재판정: 기능ID 1개(F1603)·단일 도메인·실시간/파일 미포함 → 복잡도≤6 구간, split 불필요 단일 유지. 로드맵 의존성 그래프상 후행 태스크가 T2.2를 Depends-on으로 참조하지 않는 리프 태스크 → 중요도 하향]** (Shrimp `c442b3fe-ad93-4ff5-affb-a52531dd0d09`) | F1603, P1 | T2.1, T1.1-a | 등록 성공 시 목록 갱신, 검증 실패 인라인 에러·도메인 위반(이메일 중복 등) 토스트 | 4 | 6 | ☑ |
| T2.3 | 가맹점 상세 조회 + UI(P2) — 상세 api/훅(F1602) + 상세 렌더(사업자번호·연락처·이메일·영업상태 표시명·메모·담당자) + `[매출 조회]` → P3 프리필 네비 + 404 not-found UX | F1602, P2 | T1.1, T1.2 (T2.1과 병렬 가능) | 상세 필드 전부 렌더, 404 시 not-found 처리 | 8 | 4 | ☑ |
| T2.4 | 가맹점 상세 mutation 4종 — 기본정보 수정(F1604, 부분 수정·최소 1개 변경), 영업상태 변경(F1605, enum 코드 전송 드롭다운), 담당자 변경(F1606, EmployeePicker 단일 다이얼로그), 메모 수정/삭제(F1607·F1608, AlertDialog 확인) → 성공 시 상세·목록 invalidate. **[재판정: 연관 기능ID 5개(F1604~1608)·서로 다른 UI 패턴 4종(부분수정폼/드롭다운/EmployeePicker 다이얼로그/텍스트폼+삭제확인)이 동일 파일(FranchiseDetailPage.tsx)에 집중 → split. 로드맵 의존성 그래프상 후행 태스크가 T2.4를 Depends-on으로 참조하지 않는 리프 태스크(T2.2 재판정과 동일 논리) → 중요도 하향]** | F1604~F1608, P2 | T2.3 | 4종 각각 204 성공 → 상세 갱신·토스트, 도메인 위반 에러 토스트 | 5 | 7 | ☑ |
| T2.4-a | 가맹점 기본정보 수정(F1604) — PATCH JSON body 전 필드 optional(`franchiseUpdateSchema`, `meetingRoomUpdateSchema` 동형 부분수정 폼) + 수정 다이얼로그 + FranchiseDetailPage 최초 mutation 배선. "최소 1개 변경값" 프론트 강제 여부는 실행 시 서버위임/refine 중 택일 (Shrimp `d0d5cc27-3922-4a0f-8ca9-b2d2a094dda9`) | §참조 계약 매핑(P2 기본정보 수정) | T2.3 | 204 성공 → 상세 갱신·토스트, 도메인 위반(이메일 중복 등) 에러 토스트 | 6 | 5 | ☑ |
| T2.4-b | 가맹점 영업상태 변경(F1605) — PATCH 쿼리 `status`(`BUSINESS_STATUS_CODES` 드롭다운, T1.1-a 상수 소비) + FranchiseDetailPage 배선 추가 (Shrimp `fe2f8bc3-b101-40d7-9b99-666234388718`) | §참조 계약 매핑(P2 영업상태 변경) | T2.4-a | 204 성공 → 상세 표시명 갱신·토스트 | 5 | 3 | ☑ |
| T2.4-c | 가맹점 담당자 변경(F1606) — PATCH 쿼리 `newManagerId`, `EmployeePicker`(multiple=false) Dialog 즉시배정형 다이얼로그 + FranchiseDetailPage 배선 추가 (Shrimp `27f15ab2-1023-4c8d-ab68-67fd0837e07d`) | §참조 계약 매핑(P2 담당자 변경), §5 지원 기능 | T2.4-b | 204 성공 → 상세 담당자명 갱신·토스트 | 5 | 4 | ☑ |
| T2.4-d | 가맹점 메모 수정/삭제(F1607·F1608) — 수정 PATCH `{memo}`(공백 불가) / 삭제 PATCH 무본문(AlertDialog 확인) + FranchiseDetailPage 최종 배선 + 4종 mutation 통합 검증 (Shrimp `34b8bcaf-176c-4cbb-866f-9f12d7373a48`) | §참조 계약 매핑(P2 메모 수정/삭제) | T2.4-c | 204 성공 → 상세 메모 갱신·토스트. **완료 시 T2.4 전체 Done 조건 충족** | 4 | 4 | ☑ |

> 실행 순서: T2.3 → T2.4-a → T2.4-b → T2.4-c → T2.4-d — 4개 subtask 전부 동일 파일(`FranchiseDetailPage.tsx`)에 UI를 배선해 병렬 시 파일 충돌이 확정적이라 순차 체인 필수(위상 정렬). 중요도는 리프 태스크 특성상 낮게 산정했으며 체인 내 상대 우선순위(앞쪽일수록 후속 subtask 수가 많음)로만 참고

### M2 — 매출 조회 슬라이스 (P3)

> 목표: 가맹점별 연/월/일 매출 읽기 전용 리포팅 관통. 근거: PRD F1624~F1626, P3, §🔗(읽기 전용 — 원천 데이터는 도메인 밖 생성).
> 완료 정의: 가맹점을 선택하고 연/월/일 단위를 전환하며 매출 KPI와 Recharts 추이 차트를 조회할 수 있고, P2 `[매출 조회]`로 진입하면 가맹점이 프리필된다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T3.1 | 매출 api/훅 3종 — 연 매출(F1624, 신규)·월 매출(F1625, **기존 `getFranchiseMonthlySales` 소비**+훅 래핑)·일 매출(F1626, 신규·`salesDate` 문자열 타입 주의). queryKeys는 T1.1의 `sales*` 키 소비 | F1624~F1626, §참조 계약 매핑 | T1.1 | 3종 훅이 franchiseId+기간 파라미터로 조회·캐시 | 7 | 4 | ☑ |
| T3.2 | 매출 조회 페이지 UI(P3) — FranchisePicker(T1.3) + 조회 단위 탭(연/월/일) + 기간 입력(dayjs 조립: `yyyy`/`yyyy-MM`/`yyyy-MM-dd`) + 연·월 Recharts 추이 차트(`salesMonth`/`salesDate` 숫자 → dayjs 파싱 라벨) + KPI 카드 + P2 진입 시 franchiseId 프리필 + 데이터 없음 빈 상태. **[재판정: 연관 기능ID 3개(F1624~F1626)가 동일 파일(FranchiseSalesPage.tsx)에 집중·서로 다른 UI 패턴(연·월=차트+KPI 2세트, 일=KPI 단독)·Recharts 프로젝트 최초 도입(package.json 실측: dependencies에 미포함) → split. 로드맵 의존성 그래프상 후행 태스크가 T3.2를 Depends-on으로 참조하지 않는 리프 태스크(T2.2·T2.4 재판정과 동일 논리)이나, 사이드바 독립 메뉴("가맹점 매출")의 유일한 실 구현이자 M2 슬라이스 Done 조건을 단독 충족시키는 태스크라 대폭 하향은 아닌 소폭 하향]** | F1624~F1626, P3 | T3.1, T1.2, T1.3 | 3개 단위 전환 조회·차트/KPI 렌더·프리필 동작, 빈 데이터 시 빈 상태(에러 아님) | 6 | 7 | ☑ (UX 검토 보류) |
| T3.2-a | 매출 조회 페이지 골격 + 가맹점 선택 + 프리필 — `FranchiseSalesPage.tsx`에 FranchisePicker 배선 + 조회단위 탭(연/월/일) 상태 + 기간 입력(dayjs 조립) + T2.3이 이미 확정한 프리필 계약(`franchiseId` 쿼리, `FranchiseDetailPage.tsx:105` 실측) 소비(`useFranchiseDetailQuery` 재사용해 name 보강) (Shrimp `06b85061-b511-4c22-a68f-1442c5d15ef2`) | §참조 계약 매핑(P3), T2.3 프리필 계약 | T3.1, T1.3 | `franchiseId` 프리필 진입 시 FranchisePicker 자동 선택, 탭 3종 전환 시 기간 입력 UI가 단위에 맞게 전환, tsc 컴파일 통과 | 6 | 5 | ☑ |
| T3.2-b | 연·월 매출 Recharts 차트 + KPI 카드 — `npm install recharts`(package.json 실측: 프로젝트 최초 도입, CLAUDE.md §6 고정 스택 이행) + 연 매출(F1624) 추이 차트+KPI 카드 + 월 매출(F1625, 기존 `getFranchiseMonthlySales` 기반 훅 소비) 추이 차트+KPI 카드(`salesMonth`/`salesDate` 숫자 → dayjs 파싱 라벨) (Shrimp `bb074654-2fd3-40b9-9bfa-1df533cb6775`) | §참조 계약 매핑(P3 연·월 매출), §계약 실측 메모(숫자 날짜 포맷) | T3.2-a | 연/월 단위 조회 시 추이 차트+KPI 각각 정상 렌더, 라벨 날짜 형식 정확, tsc 컴파일·`npm run build` 통과 | 5 | 6 | ☑ |
| T3.2-c | 일 매출 KPI + 빈 상태 + 통합 검증 — 일 매출(F1626) KPI 카드(매출액·주문수, `salesDate` 문자열 그대로 표기) + 3개 조회 단위 공통 빈 상태 처리(데이터 없음 → 안내, 에러 토스트 아님) + 가맹점 선택→탭 전환→프리필→차트/KPI 전체 흐름 통합 검증 (Shrimp `8878c6f7-78ec-4ec2-918d-14600e532eb7`) | §참조 계약 매핑(P3 일 매출), §계약 실측 메모 | T3.2-b | 일 단위 KPI 렌더, 데이터 없음 시 에러 아닌 빈 상태 안내, 3종 통합 동작. **완료 시 T3.2 전체 Done 조건 충족** | 5 | 4 | ☑ |

> 실행 순서: T3.1 → T3.2-a → T3.2-b → T3.2-c — T3.1(매출 api/훅 3종, 중요도7)이 T3.2 전 서브태스크의 선행조건이라 최우선 착수, T3.2 내부 3개 subtask는 동일 파일(`FranchiseSalesPage.tsx`)에 순차로 UI를 채워 병렬 시 파일 충돌이 확정적이라 위상 정렬 필수(T2.4 체인과 동일 컨벤션)

### M3 — 교육 슬라이스 (P4 캘린더 · P5 상세)

> 목표: 교육을 캘린더로 편성(등록→상세→수정/활성토글/첨부/신청자)하는 흐름 관통. 근거: PRD F1609~F1616, P4·P5.
> 완료 정의: 캘린더에서 교육을 조회·등록(비활성 생성)하고, 상세에서 신청자 확인·수정·활성/비활성 토글·첨부 관리(업로드/삭제/미리보기/다운로드)가 동작한다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T4.1 | 교육 캘린더 페이지(P4) — 캘린더 조회 api/훅(F1609, `start`/`end` 재조회) + FullCalendar 렌더(제목·장소, `isActive=false`/`isFull=true` 시각 구분, meeting 선례 동형) + 이벤트 클릭 → P5 네비. **[재판정: 연관 기능ID 1개(F1609)·단일 서브도메인(교육 캘린더)·실시간/파일 미포함 → 복잡도 낮게(≤6) 산정 구간, FullCalendar는 meeting 선례 동형 복제라 상승 요인 아님 → split 불필요 단일 유지. 로드맵 의존성 그래프상 T4.2가 T4.1을 Depends-on으로 명시 참조 + 사이드바 "가맹점 교육" 메뉴의 유일한 진입점(M3 슬라이스 게이트) → 중요도 유지]** (Shrimp `5f718600-f9e6-49ac-bed2-b7f40942dc0f`) | F1609, P4 | T1.1, T1.2 | 월 이동 시 재조회·이벤트 클릭 시 상세 이동 | 8 | 5 | ☑ |
| T4.2 | 교육 등록(F1612) — P4 `[교육 등록]` 다이얼로그: zod 폼(교육일시 datetime·장소≤50·제목≤50·내용·정원 양수) + mutation(`201 {educationId}`, **비활성 생성**) → 생성된 P5로 이동 + 캘린더 invalidate. **[재판정: 연관 기능ID 1개(F1612)·단일 도메인(교육)·실시간/파일업로드 미포함 → 복잡도 규칙상 ≤6 구간, MeetingRoomCreateDialog 3종 세트 동형 복제이나 datetime 분리입력(날짜+시간)→단일 문자열 조합 로직이 franchise 전용 신규 작성이라 소폭 상향 → split 불필요 단일 유지. 로드맵 의존성 그래프상 후행 태스크가 T4.2를 Depends-on으로 참조하지 않는 리프 태스크(T2.2 재판정과 동일 논리) → 중요도 하향]** (Shrimp `220a6ea0-91b8-4168-8547-f3488cf74dc3`) | F1612, P4 | T4.1 | 등록 성공 시 상세로 이동(첨부·활성화 유도) | 4 | 5 | ☑ |
| T4.3 | 교육 상세 + 신청자(P5) — 상세 api/훅(F1610) + 신청자 페이징 api/훅(F1611) + 상세 렌더(일자·시작시각·장소·제목·내용·정원/잔여·활성여부·첨부목록)와 신청자 react-table + 404 not-found UX. `fileListInfoList` shape는 board 표준 가정 후 런타임 확인(Open Q#3). **[재판정: 연관 기능ID 2개(F1610·F1611)·단일 서브도메인(교육)·실시간/파일업로드 미포함(첨부 조작은 T4.5 관할, 이 태스크는 목록 텍스트 표시만) → 복잡도 규칙상 ≤6 구간, T5.2(문의상세+답변조회 동형) 동일 근거 → split 불필요 단일 유지. 로드맵 의존성 그래프상 T4.4·T4.5가 T4.3을 Depends-on으로 명시 참조 + P5 화면 전체의 데이터 계층 게이트(T2.3 동형 근거) → 중요도 유지]** (Shrimp `86ca0238-16fa-4cee-9bdc-9607bfef889b`) | F1610·F1611, P5 | T1.1, T1.2 (T4.1과 병렬 가능) | 상세·신청자 표 렌더, 404 처리 | 8 | 5 | ☑ |
| T4.4 | 교육 수정 + 활성/비활성(F1613·F1614) — 부분 수정 폼(노출 힌트: `isActive=false && appliedCount=0`, 등록자 판정은 서버 403 전담) + 활성/비활성 토글(POST, AlertDialog 확인) → 상세·캘린더 invalidate | F1613·F1614, P5, §권한 분기점 | T4.3 | 수정·토글 204 성공 → 갱신·토스트, 상태/소유 위반 시 에러 토스트 | 7 | 5 | ☑ |
| T4.5 | 교육 첨부 4종(F1615·F1616) — 업로드(PATCH multipart `file`)·삭제·미리보기·다운로드(blob/objectURL board 표준). ⚠️ 경로 `/api/educations/{educationId}/files/**`(generated-snippets 4종 전수 실측 재확인). 파일 정책은 도메인모델.md `Education_file` 실측(개수 최대 10개·총량 10MB, board/draft와 동일 컨벤션으로 프론트 사전검증 채택) + file-upload.md 20MB(서버 상위 캡) 위반 `FILE_00x` 토스트. preview/download는 인증만(등록자 조건 없음). **[재판정: 연관 기능ID 4개(EDUCATION_FILE_UPLOAD/DELETE/PREVIEW/DOWNLOAD)이나 board·draft가 2회 확립한 '도메인마다 독립 정의' 컨벤션의 완전 복제(신규 로직 발명 없음)이고 UI도 approval AttachmentSection.tsx 단일 컴포넌트 패턴 복제(T2.4류 "서로 다른 UI 패턴 4종 집중"과 다름) → 파일 업로드 포함으로 baseline보다는 높으나 split 필요 임계(7)는 아님, 복잡도 6 유지 단일 태스크. 로드맵 의존성 그래프상 후행 태스크가 T4.5를 Depends-on으로 참조하지 않는 M3 리프 태스크(T2.2·T2.4·T4.2 재판정과 동일 논리, P5 게이트는 T4.3이 담당) → 중요도 하향]** (Shrimp `843a5fa4-9079-4626-9a95-9c2ec6dc4254`) | F1615·F1616, P5, §계약 실측 메모 | T4.3, T4.4(같은 파일 편집 충돌 방지 — 실행 순서상 순차 착수) | 업로드→목록 갱신, 삭제, 미리보기/다운로드 blob 동작 | 5 | 6 | ☑ |

### M4 — 문의 슬라이스 (P6 목록 · P7 상세)

> 목표: 문의 접수 확인→담당자 배정→답변 초안 작성/수정→발송 흐름 관통. 근거: PRD F1617~F1623, P6·P7.
> 완료 정의: 문의를 필터·페이징으로 조회하고, 상세에서 담당자를 배정하며, 담당자가 답변 초안을 작성·수정·발송할 수 있다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T5.1 | 문의 목록 페이지(P6) — 목록 api/훅(F1617) + react-table 페이징 표(가맹점명·제목·문의일시·답변여부·담당자·`isDeleted`) + 필터(답변여부·담당자·검색어 디바운스·기간 `yyyy-MM-dd`) + 행 클릭 → P7 네비. **[재판정: 연관 기능ID 1개(F1617)·단일 도메인(문의)·실시간/파일업로드 미포함 → split 불필요 단일 유지(복잡도5 유지). 로드맵 의존성 그래프상 T5.2가 T5.1을 Depends-on으로 명시 참조 + M4 슬라이스의 유일한 진입점(T2.1·T4.1·T4.3 동형 근거) → 중요도8 유지]** (Shrimp `565939bd-a32f-454d-89e3-e06e352a5a4e`) | F1617, P6 | T1.1, T1.2 | 필터 4종·페이징 동작, 행 클릭 상세 이동 | 8 | 5 | ☑ |
| T5.2 | 문의 상세 + 답변 조회(P7) — 상세 api/훅(F1618) + 답변 조회 api/훅(F1619, **미작성 시 404/빈 응답 모두 "미작성 → 작성 유도" 처리**, Open Q#5) + 상세·답변 섹션 렌더 + 404 not-found UX. **[재판정: 연관 기능ID 2개(F1618·F1619)·단일 서브도메인(문의)·실시간/파일업로드 미포함 → 복잡도 규칙상 ≤6 구간, T4.3(교육상세+신청자) 동형 근거로 복잡도5 확정 → split 불필요 단일 유지. 로드맵 의존성 그래프상 T5.3·T5.4가 T5.2를 Depends-on으로 명시 참조 + P7 화면 전체의 데이터 계층 게이트(T2.3·T4.3 동형 근거) → 중요도8 유지]** (Shrimp `4ac1f922-ba2d-45a7-9781-73c38eef0c84`) | F1618·F1619, P7 | T1.1, T1.2 (T5.1과 병렬 가능) | 원문·답변(또는 빈 상태) 렌더 | 8 | 5 | ☑ |
| T5.3 | 답변 담당자 배정(F1620) — `[담당자 배정]` 다이얼로그(EmployeePicker 단일, null 배정 불가) + mutation → 상세·목록 invalidate. **[재판정: 연관 기능ID 1개(F1620)·단일 도메인(문의)·실시간/파일업로드 미포함 → 복잡도3 유지(T2.4-c 완전 동형 복제, 신규 로직 없음). 로드맵 의존성 그래프상 후행 태스크가 T5.3을 Depends-on으로 참조하지 않는 리프 태스크(§병렬화 지점 "T5.3∥T5.4"로 T5.4와 독립, T2.2·T4.2 재판정과 동일 논리) → 중요도7→5로 하향]** (Shrimp `4c98896c-8a67-4f7e-9472-bdc4b1e4ee83`) | F1620, P7 | T5.2 | 배정 204 성공 → 상세 갱신·토스트 | 5 | 3 | ☑ |
| T5.4 | 답변 초안 생성/수정/발송(F1621~F1623) — 답변 작성 폼(`answer` 공백 불가, 노출 힌트: `assignedManagerId===myEmpId`) + 생성(201)/수정(204, 미제출만)/발송(204, AlertDialog·제출 후 수정 불가) mutation → 답변·상세·목록 invalidate. 담당자 미배정 시 배정 유도. **[재판정: 연관 기능ID 3개(F1621~F1623)·단일 서브도메인(문의 답변)·실시간/파일업로드 미포함 → 복잡도5 유지(폼+AlertDialog 2종 패턴, T2.4류 4종 이질 패턴 미만이라 split 불필요). 로드맵 의존성 그래프상 후행 태스크 Depends-on 참조 없는 리프이나 M4 완료 정의("담당자가 답변 초안을 작성·수정·발송할 수 있다")를 단독 충족시키는 PRD 여정 종착점(T3.2 동형 근거) → 대폭 하향 아닌 소폭 하향, 중요도8→6]** (Shrimp `536ac572-75f4-49ce-8821-747c2d4778e6`) | F1621~F1623, P7, §권한 분기점 | T5.2, T5.3(같은 파일 편집 충돌 방지 — 실행 순서상 순차 착수) | 초안 저장→수정→발송 전체 흐름 동작, 소유/상태 위반 에러 토스트 | 6 | 5 | ☑ |

> 실행 순서: T5.1 → T5.2 → T5.3 → T5.4 — T5.1·T5.2는 M4 진입/데이터 계층 게이트(중요도8, T2.1·T4.3 동형 근거)라 우선 착수, T5.3·T5.4는 §병렬화 지점상 개념적으로 독립(배정↔답변)이나 둘 다 FranchiseInquiryDetailPage.tsx에 UI를 배선해 병렬 시 파일 충돌이 확정적이라 순차 체인 강제(T2.4·T3.2 체인과 동일 컨벤션)

## 🔀 병렬화 가능 지점

- **M0 내부**: T1.1 ∥ T1.2 ∥ T1.3 (3개 전부 상호 독립 — 같은 턴 병렬 위임 가능)
- **M0 완료 후**: M1 ∥ M2 ∥ M3 ∥ M4 (슬라이스 간 파일 비겹침. 단 T3.2만 T1.3 추가 의존)
- **슬라이스 내부 병렬**: T2.1 ∥ T2.3 / T4.1 ∥ T4.3 / T5.1 ∥ T5.2 (각각 목록↔상세가 서로 다른 파일) · T4.4 ∥ T4.5 (수정/토글 ↔ 첨부) · T5.3 ∥ T5.4 (배정 ↔ 답변)
- **순차 필수**: T2.2→T2.1(다이얼로그가 목록 페이지에 부착) · T2.4→T2.3 · T4.2→T4.1 · T3.2→T3.1·T1.3

## ⚠️ 리스크 & 선행 결정 (Open Questions — PRD §❓ 승계)

- **(해소됨) BusinessStatus enum**: 백엔드 실측 5종(`OPEN`·`CLOSED`·`PRE_OPEN`·`TEMP_CLOSED`·`READY_TO_OPEN`), 생성 기본값 `READY_TO_OPEN`. T1.1이 상수화.
- **Q#3 `fileListInfoList` shape 미문서화**: T4.3·T4.5에서 board/meeting `FileListInfo` 표준 가정 → 실제 응답 런타임 확인 후 타입 확정(더미데이터로 첨부 있는 교육 필요).
- **Q#5 답변 미작성 응답(404 vs 빈 바디)**: T5.2가 양쪽 모두 "작성 유도" 빈 상태로 처리(분기 안전).
- **Q#6 교육 등록자 판정**: 상세 응답에 등록자 식별자 없음 → 소유자 액션 서버 403 전담, 프론트는 상태 힌트만(T4.4·T4.5).
- **Q#1 매출 원천 쓰기 경로(비블로킹)**: 문서 간 방향 상충 실재하나 매출 조회는 읽기 전용이라 구현 무영향.
- **매출 더미데이터**: 외부 API 싱크로 생성되는 데이터라 REST 등록 API가 없을 수 있음 — M2 확인 시 데이터 부재하면 dummy-data-seeder 적용 가능 여부를 별도 판단.

## 📦 백로그 (PRD 명시 제외 — 태스크화 금지)

- 매출 기안서(`SALES_DRAFT_*`) — approval 도메인 구현 완료
- 가맹점 외부 API 싱크(일매출/문의/교육신청 배치) — 백엔드 관할, 프론트 화면 없음
- 가맹점 삭제(엔드포인트 부재, 영업상태 `CLOSED` 대체)·문의 원문 수정/삭제(외부 싱크 소유)
- 테마/다크모드·i18n·브라우저 푸시

## ✅ 정합성 검증 체크리스트 (실행 결과)

- 🔍 커버리지: F1601→T2.1 / F1602→T2.3 / F1603→T2.2 / F1604~F1608→T2.4 / F1609→T4.1 / F1610·F1611→T4.3 / F1612→T4.2 / F1613·F1614→T4.4 / F1615·F1616→T4.5 / F1617→T5.1 / F1618·F1619→T5.2 / F1620→T5.3 / F1621~F1623→T5.4 / F1624~F1626→T3.1·T3.2 — **26개 전부 매핑** ✅
- 🔍 역참조: 전 태스크가 PRD F ID/§섹션 근거 보유(발명 태스크 없음 — T1.1·T1.3은 §참조 계약 매핑·§5 지원 기능·Open Q#2/#4 근거) ✅
- 🔍 의존성: T1.x(M0) → 슬라이스, 슬라이스 내부 목록→상세→mutation 위상 정렬, 순환 없음 ✅
- 🔍 여정 정합: 사이드바 진입 → 목록/캘린더 → 상세 → mutation 순서가 PRD §사용자 여정과 일치 ✅
- 🔍 범위: SALES_DRAFT_*·외부 싱크·가맹점 삭제 등 제외 항목은 백로그로만 표기 ✅
- 🔍 규약: 계약 재서술 없음(§참조 계약 매핑 포인터만), 필드 설계 없음, 인프라/견적 없음 ✅
