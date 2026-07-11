# 일정(Schedule) 캘린더 Frontend 개발 ROADMAP

> 출처 PRD: `docs/prd/17.schedule-prd.md` (F001~F007, groupware-prd-validator 검증 통과 — non-minor 이슈 없음, minor 이슈 4건은 착수 시 반영)
> 이 로드맵은 PRD를 **실행 순서·의존성·태스크**로 전개한 것이다. 기능/계약의 사실 원천은 PRD와 백엔드 계약 문서(`api-endpoint.md` SCHEDULE 7개 기능ID + `back/build/generated-snippets/<기능ID>/`)이며, 여기서는 **무엇을 어떤 순서로 만들지**만 다룬다. 필드/DTO·body 구조는 재서술하지 않고 PRD §참조 계약 매핑을 가리킨다.

## 🗺️ 개요

**📅 최종 업데이트**: 2026-07-11
**📊 진행 상황**: 20/20 Tasks 완료 (100%) — M1~M6 전부 ☑ — 전 태스크 구현·리뷰·테스트·UX검토·verify_task 완료. 다음: 도메인 전체 규약검토(7단계)·UI 스타일링(8단계)·마무리 보고(9단계)

- **전략**: walking-skeleton-first 세로 슬라이스. PRD에 §아키텍처 배관 섹션이 없다(전역 배관은 이미 완료·재구축 금지). **별도 배관 마일스톤 없이 도메인 세로 슬라이스로 곧바로 시작**하되, 최초 소비처(M1)에서 도메인 스캐폴딩(`scheduleKeys` 팩토리)을 흡수한다(M10 게시판·M1 근태 선례와 동형). 여정 순서: 캘린더 조회(M1) → 상세 조회(M2) → 수기 일정 등록(M3) → 수정(M4) → 참여자 추가/제외(M5) → 취소(M6).
- **소비할 기존 배관/자산(재구축 금지)**:
  - axios 단일 인스턴스·401/`ROLE_002` reissue 인터셉터·`withCredentials`: `src/shared/api/client.ts`
  - QueryClient·retry/staleTime 방침, queryKey 팩토리 컨벤션: `src/shared/api/queryClient.ts`, `src/features/*/model/*Keys.ts` 동형
  - 에러 정규화·에러코드→UI 매핑(`handleApiError`, 소유자 불일치는 `code` 비의존 토스트 처리): `src/shared/lib/apiError.ts`
  - 보호 라우트·role 가드·본인 empId: `src/shared/components/ProtectedRoute.tsx`, `src/features/employee/api/useMeQuery.ts`
  - 사이드바 선언 트리 placeholder 승격: `src/shared/components/sidebarMenuItems.ts`(`일정/회의` 그룹, "일정 캘린더" placeholder 123행)
  - 폼/에러 배관: `src/shared/lib/form.ts`(`useZodForm`/`submitWithErrorMapping`), shadcn Dialog·AlertDialog·Input·Textarea·Button·Card·Label·RadioGroup
  - **캘린더 프리미티브(meeting 도메인 동형 재사용, 리팩터링 불필요 — PRD 검증 확인)**: `src/features/meeting/lib/calendarRange.ts`(`buildCalendarRangeParams`), `src/features/meeting/components/MeetingCalendar.tsx`(도메인 비의존 제네릭 래퍼 `EventInput[]`+`onRangeChange`+`onEventClick`), `src/features/meeting/lib/mapMeetingRoomReservationsToEvents.ts`(이벤트 매핑 어댑터 패턴)
  - **참여자 선택 위젯**: `src/shared/components/EmployeePicker.tsx`(공용, 다중 선택, `disabledEmpIds` prop 보유 — PRD 원문의 "전자결재 EmployeePicker" 표기는 부정확하므로 이 로드맵에서 정정)
  - 날짜 `dayjs` / 토스트 `sonner` / 캘린더 `@fullcalendar/react`(CLAUDE.md §6 고정 스택 — 추가 라이브러리 도입 금지)
- **범위 경계**: PRD §"MVP 이후 기능 / 범위 외"(MEETING/LEAVE/BUSINESS_TRIP 타입 CRUD·원천 문서 딥링크·부서/공용 관리 화면·반복 일정 편집기·테마/i18n/푸시)는 로드맵 범위 밖(§백로그 참조, 태스크화 금지).
- **완료 게이트(전 마일스톤 공통)**: `npm run check-all` 통과 + `npm run build` 성공(CLAUDE.md §9). 도메인 슬라이스 구현 직후 test-author-runner로 유닛/컴포넌트 테스트 작성·실행.

## 🧩 의존성 개요

```
[이미 완료된 전역 배관: axios/reissue·QueryClient·authStore·ProtectedRoute·LayoutShell·apiError·useZodForm]  ← 소비만(재구축 금지)
  │
  └→ M1 통합 일정 캘린더 조회 슬라이스 + 진입 스켈레톤 (F001, 배관: scheduleKeys 팩토리 흡수)
        T1.1 schedule 스캐폴딩 + scheduleKeys 팩토리
              ├→ T1.2 getScheduleCalendar API + useScheduleCalendarQuery (buildCalendarRangeParams 재사용)  ┐
              └→ T1.3 mapScheduleToEvents 어댑터(타입별 색상·취소건 표시)                                    ┴→ T1.4 ScheduleCalendarPage(MeetingCalendar 소비)
                                                                                                                    └→ T1.5 라우팅(/schedules)+사이드바 placeholder 승격 [react-router-developer 위임]
        └→ M2 일정 상세 조회 슬라이스 (F002)                    └→ M3 수기 일정 등록 슬라이스 (F003, M1과 병렬 가능)
              T2.1 getScheduleDetail API+훅                           T3.1 createManualSchedule API+훅  ┐
              └→ T2.2 ScheduleDetailDialog(상세 렌더 뼈대)             T3.2 manualScheduleCreateSchema(zod) ┴→ T3.3 ScheduleCreateDialog
                    └→ T2.3 P1 이벤트클릭→상세 오픈 배선                                                        └→ T3.4 P1 [일정 등록]버튼 배선
                          │
                          ├→ M4 수기 일정 수정 슬라이스 (F004)
                          │     T4.1 updateManualSchedule API+훅 ┐
                          │     T4.2 manualScheduleUpdateSchema  ┴→ T4.3 상세다이얼로그 수정 폼 배선(scope 라디오)
                          ├→ M5 참여자 추가/제외 슬라이스 (F005·F006)
                          │     T5.1 add/removeScheduleParticipants API+훅 2종 → T5.2 참여자 추가 UI(EmployeePicker) → T5.3 참여자 제외 UI(소유자행 disabled)
                          └→ M6 일정 취소 슬라이스 (F007)
                                T6.1 cancelSchedule API+훅 → T6.2 취소 액션 UI(AlertDialog, participantCount 힌트)
```

- **T1.1(스캐폴딩)이 전 도메인 태스크의 공통 선행**이다. T1.2·T1.3은 T1.1에만 의존 → 상호 독립·병렬 가능.
- **M2(상세)와 M3(등록)은 둘 다 M1(T1.4 캘린더 페이지)에만 의존** → 마일스톤 단위 병렬 착수 가능(서로 다른 파일).
- **M4·M5·M6은 모두 M2(T2.2 상세 다이얼로그)에 의존**한다. 각 마일스톤의 API/스키마 태스크(T4.1·T4.2, T5.1, T6.1)는 서로 다른 파일이라 T2.2 완료 후 상호 독립·병렬 가능.
- **⚠️ 실행 시 주의**: T4.3·T5.2·T5.3·T6.2는 전부 동일 파일 `ScheduleDetailDialog.tsx`를 수정한다. 의존성 그래프상 병렬 가능해 보이지만 **동시 편집 충돌을 피하기 위해 UI 배선 태스크(T4.3→T5.2→T5.3→T6.2)는 순차 실행을 권장**한다(API/스키마 태스크만 병렬, UI 조립은 순차).

## 🚩 마일스톤 & 태스크

> 표기: **라우팅·사이드바 진입 스켈레톤**(`router.tsx`·`sidebarMenuItems.ts` 편집)은 **react-router-developer 위임**(T1.5). 나머지(데이터 계층·비라우팅 UI)는 직접 구현. 완료 여부: ☐ 미착수 / ☑ 완료. **중요도/복잡도는 development-planner 산출물에 포함하지 않는다** — 착수 전 `task-planner`(Shrimp)가 채운다.

### M1 — 통합 일정 캘린더 조회 슬라이스 + 진입 스켈레톤 · 근거: PRD F001, P1, §메뉴 구조

> 목표: 사이드바 "일정/회의 > 일정 캘린더" 진입 시 조회 가능 범위 일정이 FullCalendar에 타입별 색상으로 렌더된다.
> 완료 정의: `/schedules` 보호 라우트가 실 데이터로 캘린더를 그리고, 월 이동 시 재조회되며, 타입 토글로 표시가 필터된다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T1.1 | `src/features/schedule/{api,components,pages,model,lib}` 폴더 스캐폴딩 + `scheduleKeys` queryKey 팩토리(`calendar(params)`/`detail(scheduleId)` 동형) | §기술스택, §참조 계약 매핑 | — | 폴더 구조 생성, `model/scheduleKeys.ts` export | 9 | 2 | ☑ |
| T1.2 | `getScheduleCalendar` API 함수 + `useScheduleCalendarQuery` 훅(`SCHEDULE_CALENDAR` 소비, `buildCalendarRangeParams` 재사용해 `start`/`end` 조립) | F001, §참조 계약 매핑(P1 캘린더 행) | T1.1 | 기간 쿼리로 캘린더 응답 배열 반환, 뷰 이동 시 재조회 | 7 | 3 | ☑ |
| T1.3 | `mapScheduleToEvents` 어댑터(응답 → FullCalendar `EventInput[]` 매핑, `scheduleType`별 색상 구분, `isCanceled=true` 흐림/뱃지 표시) | F001, §계약 실측 메모 | T1.1 (T1.2와 병렬 가능) | 4개 타입 색상 분기 + 취소건 시각 구분이 이벤트 객체에 반영 | 6 | 3 | ☑ |
| T1.4 | `ScheduleCalendarPage`(`MeetingCalendar` 제네릭 래퍼 소비, `onRangeChange`로 월 이동 시 range 재조립, 타입별 클라이언트 표시 토글, `[일정 등록]` 버튼 자리 배치) | F001, P1 | T1.2, T1.3 | 캘린더가 실 데이터 렌더, 월 이동 시 새 기간 재조회, 타입 토글 동작 | 8 | 6 | ☑ |
| T1.5 | **[react-router-developer 위임]** `router.tsx`에 `/schedules` 보호 라우트 추가(`ScheduleCalendarPage` 마운트) + `sidebarMenuItems.ts` 123행 `{ label:'일정 캘린더', minRole:'EMPLOYEE', implemented:false }` placeholder를 `to:'/schedules'` 부여·`implemented` 제거로 승격 | §메뉴 구조, P1 진입 경로 | T1.4 | 사이드바 "일정 캘린더" 클릭 → `/schedules` 렌더, 미인증 시 로그인 리디렉션 | 3 | 2 | ☑ |

> 실행 순서: T1.1 → (T1.2 ∥ T1.3) → T1.4 → T1.5 — T1.1은 전 도메인 공통 선행(중요도 최고), T1.2/T1.3은 서로 다른 파일이라 병렬 가능(중요도 T1.2>T1.3, API가 어댑터의 입력을 규정), T1.4는 둘 다 완료해야 조립 가능하고 T1.5의 유일한 선행이라 중요도 높음, T1.5는 하위 의존 태스크가 없어 중요도 최저(복잡도도 최저, 위임 태스크).

### M2 — 일정 상세 조회 슬라이스 · 근거: PRD F002, P2

> 목표: 캘린더 이벤트 클릭 시 상세 다이얼로그가 실 데이터(타입·소유자·참여자·`isEditable`)로 열린다.
> 완료 정의: 임의 타입(MANUAL/MEETING/LEAVE/BUSINESS_TRIP) 이벤트 클릭 시 상세가 정확히 렌더되고, `isEditable`/타입에 따라 액션 영역 유무가 갈린다(액션 자체는 M4~M6에서 채움).

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T2.1 | `getScheduleDetail` API + `useScheduleDetailQuery` 훅(`SCHEDULE_DETAIL` 소비) | F002, §참조 계약 매핑(P2 상세 행) | T1.1 | `scheduleId`로 상세 응답(참여자 목록 포함) 반환 | 7 | 2 | ☑ |
| T2.2 | `ScheduleDetailDialog` 컴포넌트(타입·소유자 부서/이름·제목·내용·날짜·시각·종일/취소여부·참여자수·참여자 목록 렌더, `isEditable && scheduleType==='MANUAL' && !isCanceled` 조건으로 액션 영역 노출 뼈대 배치 — 실제 mutation 버튼은 M4~M6에서 채움) | F002, P2 | T2.1 | 4개 타입 모두 조회 전용으로 우선 렌더, MANUAL+`isEditable`인 경우만 액션 영역 자리 표시 | 9 | 5 | ☑ |
| T2.3 | P1 캘린더 이벤트 클릭(`onEventClick`) → `scheduleId` 전달해 상세 다이얼로그 오픈 배선 | P1 다음 이동, P2 진입 경로 | T1.4, T2.2 | 캘린더 이벤트 클릭 시 상세 다이얼로그가 해당 일정으로 열림 | 3 | 2 | ☑ |

> 실행 순서: T2.1 → T2.2 → T2.3 — 선형 위상 정렬(T2.1은 T1.1이 확정한 `scheduleKeys.detail`을 소비하는 유일 선행, T2.2는 M4·M5·M6의 UI 배선 태스크(T4.3·T5.2·T5.3·T6.2) 전부가 공통으로 의존하는 기반이라 중요도 최고, T2.3은 후행 의존 태스크가 없어 중요도 최저). 복잡도는 3개 태스크 전부 기능ID 1개(`SCHEDULE_DETAIL`)·단일 도메인·STOMP/파일 미포함이라 7 미만으로 산정, 세부 a/b/c 분할은 불필요.

### M3 — 수기 일정 등록 슬라이스 · 근거: PRD F003, P3

> 목표: `[일정 등록]` 버튼으로 새 수기 일정을 만들고 캘린더에 반영된다.
> 완료 정의: 제목·내용·시작/종료 일시 입력 후 등록 성공 시 다이얼로그가 닫히고 캘린더에 새 이벤트가 나타난다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T3.1 | `createManualSchedule` API + `useCreateManualScheduleMutation` 훅(`MANUAL_SCHEDULE_CREATE` 소비) | F003, §참조 계약 매핑(P3 등록 행) | T1.1 | 등록 성공 시 `201 { sourceKey }` 반환 확인 | 7 | 3 | ☑ |
| T3.2 | `manualScheduleCreateSchema`(zod: `title` 필수·공백불가·≤100자, `content` 필수·공백불가, `startAt`/`endAt` full datetime `yyyy-MM-dd'T'HH:mm:ss`·종료>시작) | F003, §참조 계약 매핑 | — (T3.1과 병렬 가능) | 종료<시작·빈 제목 등 클라이언트 사전검증 동작 | 5 | 2 | ☑ |
| T3.3 | `ScheduleCreateDialog`(`useZodForm`+`submitWithErrorMapping`, 성공 시 `scheduleKeys.calendar` invalidate + 성공 토스트) | F003, P3 | T3.1, T3.2 | 등록 성공/검증실패/도메인 위반(종료<시작) 3분기 UX 동작 | 8 | 5 | ☑ |
| T3.4 | P1 `[일정 등록]` 버튼 → 등록 다이얼로그 오픈 배선 | P1 다음 이동, P3 진입 경로 | T1.4, T3.3 | 버튼 클릭 → 등록 다이얼로그 열림 → 성공 후 캘린더 갱신 | 3 | 2 | ☑ |

> 실행 순서: T1.1 → (T3.1 ∥ T3.2) → T3.3 → T3.4 — T3.1/T3.2는 서로 다른 파일(API/훅 vs zod)이라 T1.1 완료 후 병렬 가능(중요도 T3.1>T3.2, API 훅이 다이얼로그 조립의 실행축), T3.3은 두 산출물을 모두 조립하는 M3의 유일한 완성 게이트라 중요도 최고, T3.4는 하위 의존 태스크가 없어 중요도·복잡도 모두 최저(T1.5 선례와 동형인 순수 UI 배선). 복잡도는 4개 태스크 전부 기능ID 1개(`MANUAL_SCHEDULE_CREATE`)·단일 도메인·STOMP/파일 미포함이라 상한 6 이내로 산정, 세부 a/b/c 분할은 불필요.

### M4 — 수기 일정 수정 슬라이스 · 근거: PRD F004, P2

> 목표: 소유자가 상세 다이얼로그에서 수기 일정의 제목/내용/시각을 수정할 수 있다.
> 완료 정의: MANUAL 타입·소유자(`isEditable=true`) 상세에서 수정 폼 저장 시 반영되고 상세/캘린더가 갱신된다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T4.1 | `updateManualSchedule` API + `useUpdateManualScheduleMutation` 훅(`MANUAL_SCHEDULE_UPDATE` 소비, `scope` 쿼리 지원) | F004, §참조 계약 매핑(P2 수정 행) | T1.1 | `scope=SINGLE\|SERIES` 쿼리로 `204` 응답 확인 | 7 | 3 | ☑ |
| T4.2 | `manualScheduleUpdateSchema`(전 필드 optional, `startAt`/`endAt`는 **시각만 `HH:mm:ss`**·종료>시작 — CREATE의 full datetime과 다름을 반영) | F004, §계약 실측 메모(시각 포맷 차이) | — (T4.1과 병렬 가능) | CREATE 스키마와 별도 타입, 시각 전용 필드로 검증 | 5 | 2 | ☑ |
| T4.3 | `ScheduleDetailDialog` 내 수정 폼 배선(`isEditable && scheduleType==='MANUAL' && !isCanceled`일 때만 노출, `scope` SINGLE/SERIES 라디오 기본 SINGLE — Open Q#1) | F004, P2, Open Q#1·#3 | T2.2, T4.1, T4.2 | 소유자·수기·미취소 상세에서만 수정 폼 노출, 저장 성공 시 상세+캘린더 invalidate | 8 | 6 | ☑ |

> 실행 순서: T1.1 → (T4.1 ∥ T4.2) → T4.3 — T4.1/T4.2는 서로 다른 파일(API/훅 vs zod)이라 T1.1 완료 후 병렬 가능(중요도 T4.1(7)>T4.2(5), API 훅이 폼 배선의 실행축), T4.3은 T2.2·T4.1·T4.2 세 산출물을 모두 조립하는 M4의 유일한 완성 게이트라 중요도 최고(8). 복잡도는 3개 태스크 전부 기능ID 1개(`MANUAL_SCHEDULE_UPDATE`)·단일 도메인·STOMP/파일 미포함이라 상한 6 이내로 산정(T4.3은 3개 의존 조립+기존 파일 diff 충돌 주의로 상한값), 세부 a/b/c 분할은 불필요. Shrimp task-id: T4.1=`e1bd12af-3dd1-4d36-8bb4-5ed1f65f260b`, T4.2=`2cb93a01-d5ad-4668-96fe-9cbbd2bc7c21`, T4.3=`70ff69b6-40fd-476d-ac24-40f6ef7b38b9`.

### M5 — 참여자 추가/제외 슬라이스 · 근거: PRD F005·F006, P2

> 목표: 소유자가 상세 다이얼로그에서 참여자를 추가·제외할 수 있다.
> 완료 정의: `EmployeePicker`로 참여자 추가, 참여자 목록에서 소유자 제외 참여자를 제거할 수 있다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T5.1 | `addScheduleParticipants`/`removeScheduleParticipants` API + 훅 2종(`SCHEDULE_PARTICIPANTS_ADD`/`SCHEDULE_PARTICIPANTS_REMOVE` 소비, `scope` 쿼리 지원) | F005, F006, §참조 계약 매핑 | T1.1 | 추가 `201`, 제외 `204` 응답 확인, `participantIds` 빈 배열/null 요소 클라이언트 사전 차단 | 7 | 4 | ☑ |
| T5.2 | 참여자 추가 UI(`EmployeePicker`[`@/shared/components`] 다중 선택 → `participantIds`) 배선, 성공 시 상세 invalidate | F005, P2 | T2.2, T5.1 | 소유자가 참여자 추가 시 상세 참여자 목록에 즉시 반영 | 8 | 6 | ☑ |
| T5.3 | 참여자 제외 UI(상세 참여자 목록에서 선택, 소유자 행은 `disabledEmpIds`로 비활성 — §계약 실측 메모 "소유자 제외 불가") 배선 | F006, P2, §계약 실측 메모 | T5.2 | 참여자 제외 성공 시 목록 갱신, 소유자 행은 선택 자체가 불가 | 4 | 4 | ☑ |

> 실행 순서: T5.1 → T5.2 → T5.3 — Depends-on상 완전 선형(T5.1은 T5.2·T5.3 둘 다 경유 의존하는 공통 API 선행이라 중요도 7, T5.2는 T5.3의 유일한 직접 선행이자 F005 완성 게이트라 중요도 최고 8, T5.3은 후행 의존 태스크가 없어 중요도 최저 4). 복잡도는 3개 태스크 전부 기능ID 1~2개·단일 도메인(schedule)·STOMP/파일 미포함이라 7 미만으로 산정, split 불필요. Shrimp task-id: T5.1=`a839d638-7797-4774-983d-89f45767d283`, T5.2=`b7bb21bd-3367-4092-a0e6-8c417133a250`, T5.3=`cd8fce64-36e2-4d39-8f03-91606ca47fa0`.

### M6 — 일정 취소 슬라이스 · 근거: PRD F007, P2

> 목표: 소유자가 상세 다이얼로그에서 일정을 취소할 수 있다.
> 완료 정의: 소유자 외 참가자가 없는 MANUAL 일정을 취소하면 캘린더에 취소 상태로 반영되고, 재취소·타입 미해당 시 버튼이 노출되지 않는다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T6.1 | `cancelSchedule` API + `useCancelScheduleMutation` 훅(`SCHEDULE_CANCEL` 소비, `scope` 쿼리 지원, body 없음) | F007, §참조 계약 매핑(P2 취소 행) | T1.1 | `scope` 쿼리만으로 `204` 응답 확인 | 7 | 2 | ☑ |
| T6.2 | 취소 액션 UI(shadcn `AlertDialog` 확인, `participantCount`>1(소유자 외 참가자 존재)이면 "참가자를 먼저 제외해야 취소할 수 있습니다" 안내 후 취소 버튼 비활성, `isCanceled=true`면 버튼 미노출) 배선 | F007, P2, Open Q#1 | T2.2, T6.1 | 취소 성공 시 다이얼로그 닫히고 캘린더 갱신, 선행조건 미충족 시 안내만 표시(서버 최종 판정) | 3 | 4 | ☑ |

> 실행 순서: T6.1 → T6.2 — T6.1은 T6.2의 유일한 API 선행이라 중요도 높음(T2.1/T3.1/T4.1과 동형 산정), T6.2는 이 로드맵 전체에서 하위 의존 태스크가 없는 종결 태스크라 중요도 최저(T2.3/T3.4/T1.5와 동형). 복잡도는 둘 다 기능ID 1개(`SCHEDULE_CANCEL`)·단일 도메인·STOMP/파일 미포함이라 6 이하로 산정(T6.1은 body 없는 단순 PATCH라 2, T6.2는 `AlertDialog` 확인+`participantCount`/`isCanceled` 2중 조건부 노출 로직이 있어 4), 세부 a/b/c 분할은 불필요. ⚠️ T6.2는 `ScheduleDetailDialog.tsx`를 공유 수정하는 T4.3→T5.2→T5.3 이후 마지막으로 실행할 것(§실행 시 주의). Shrimp task-id: T6.1=`2251da40-6f89-41b8-b4ba-41a98c604585`, T6.2=`32acbce0-c551-44c2-aa17-48571a3fb720`.

## 🔀 병렬화 가능 지점

- T1.2(캘린더 API/훅)와 T1.3(이벤트 매핑 어댑터)은 서로 다른 파일 → T1.1 완료 후 병렬 가능.
- M2(상세 슬라이스 T2.x)와 M3(등록 슬라이스 T3.x)은 M1(T1.4) 완료 후 서로 독립 → 마일스톤 단위 병렬 착수 가능.
- T4.1/T4.2(수정), T5.1(참여자 API), T6.1(취소 API)은 M2(T2.2) 완료 후 서로 다른 파일이라 병렬 착수 가능.
- **주의**: T4.3·T5.2·T5.3·T6.2는 모두 `ScheduleDetailDialog.tsx` 한 파일을 수정한다 — 병렬 실행 시 동시 편집 충돌 위험이 있으므로 API/스키마 태스크만 병렬화하고 UI 배선은 순차 실행한다.

## ⚠️ 리스크 & 선행 결정 (Open Questions)

- **[Open Q#1 — PRD 승계] scope(SINGLE/SERIES) 노출 UX.** 캘린더/상세 응답에 series(`sourceKey`) 식별 정보가 없어 프론트는 이 일정이 여러 날 묶음인지 알 수 없다. PRD 권고대로 M4·M5·M6 액션에 "이 날짜만(SINGLE)/동일 일정 전체(SERIES)" 라디오를 항상 노출(기본 SINGLE)하는 것으로 설계했다. 착수 시 더미데이터로 여러 날 수기 일정을 만들어 SERIES 동작을 실측 권장.
- **[Open Q#2 — PRD 승계] 수기 일정 종일(`isAllDay`) 등록 미지원.** `MANUAL_SCHEDULE_CREATE`/`UPDATE` 요청에 `isAllDay` 필드가 없어 M3 스키마(T3.2)는 시각 지정만 제공한다. 종일 수기 일정이 필요해지면 별도 백엔드 계약 확장 논의가 선행되어야 한다.
- **[Open Q#3 — PRD 승계] 상세/등록/수정 화면 형태.** 다이얼로그로 설계했다(T2.2/T3.3, PRD 권고). 딥링크(공유 가능 URL)가 필요해지면 라우트 페이지 승격은 이 로드맵 범위 밖 별도 논의 대상.
- **[Open Q#4 — PRD 승계] 캘린더 조회 범위 실측.** `SCHEDULE_CALENDAR`가 서버 판정 "조회 가능 범위"(본인 소유·참여 등)로 응답한다. M1 착수 시 더미데이터로 실제 반환 범위를 확인 필요.
- **[validator minor #3, advisory] 캘린더 프리미티브 shared 승격 여부.** `features/schedule`가 `features/meeting/*`를 직접 import하는 구조를 이번 로드맵은 그대로 유지한다(PRD "동형 소비" 원칙, 재구축 금지). 3번째 도메인이 같은 프리미티브를 필요로 하게 되면 그때 `shared/`로 승격을 검토(이번 로드맵 태스크 아님).

## 📦 백로그 (PRD 명시 제외 — 태스크화 금지)

- MEETING/LEAVE/BUSINESS_TRIP 타입 일정의 생성/수정/취소(각각 회의/휴가/출장 도메인 소관, 이벤트 기반 자동 생성)
- 일정 상세에서 원천 문서(회의 예약·기안서)로의 딥링크(`sourceId`/원천 링크 필드 없음)
- 부서/공용 일정 별도 관리 화면·반복 일정 편집기(RRULE) — 대응 API 없음
- 테마/다크모드·다국어(i18n)·브라우저 푸시 알림 — 전 도메인 공통 제외

## ✅ 정합성 검증 체크리스트 (실행 결과)

- 🔍 **커버리지**: F001~F007 전부 최소 1개 태스크에 매핑됨(F001→T1.2~T1.4, F002→T2.1~T2.3, F003→T3.1~T3.4, F004→T4.1~T4.3, F005→T5.1~T5.2, F006→T5.1·T5.3, F007→T6.1~T6.2). 누락 없음. ✅
- 🔍 **역참조**: 전 태스크가 PRD F00x/§섹션에 근거. 발명 태스크 없음(캘린더 프리미티브 재사용도 PRD §기술스택/§MVP 필수 지원 기능 명시 근거). ✅
- 🔍 **의존성**: T1.1(스캐폴딩)이 전 도메인 태스크의 공통 선행, M1→{M2∥M3}→{M4∥M5∥M6} 위상 정렬, 순환 없음. ✅
- 🔍 **여정 정합**: PRD 사용자 여정(캘린더 진입→이벤트 클릭→상세→수정/참여자/취소, 또는 캘린더→등록)과 태스크 순서 일치. ✅
- 🔍 **범위**: MEETING/LEAVE/BUSINESS_TRIP CRUD·딥링크·부서관리·반복편집기·테마/i18n는 태스크화하지 않고 백로그로만 격리. ✅
- 🔍 **규약**: 필드/DTO 설계 없음(스키마는 이름·검증 규칙 수준까지만, 상세는 PRD §참조 계약 매핑 지시), API URL 재서술 없음, 인프라/CI·성능지표·날짜견적 강제 없음. ✅

**결과: 6단계 전부 통과. schedule 도메인 M1~M6(20개 태스크) 로드맵 확정. `/shrimp:thought_split` 단계로 진행 가능.**
