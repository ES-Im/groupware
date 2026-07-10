# 회의/회의실(Meeting) 예약·관리 Frontend 개발 ROADMAP

> 출처 PRD: `docs/prd/13.meeting-prd.md` (groupware-prd-validator 검증 통과 · Open Questions #1~#6 전부 확정 2026-07-10 — 참여자 풀 전사 검색·예약자 별개, 회의실 변경 필드 노출, 파일 10MB·jpg/jpeg/png, 시각 HH:mm 전송, FACILITY 조회 전용, capacity 수동 입력)
> 이 로드맵은 PRD를 **실행 순서·의존성·태스크**로 전개한 것이다. 기능/계약의 사실 원천은 PRD와 백엔드 계약 문서(`api-endpoint.md`의 `SCHEDULE/MEETING API`(회의 예약 7종)·`MEETING ROOM API`(회의실 9종)·`FILE API` 회의실 4종 + `back/build/generated-snippets/<기능ID>/`)이며, 여기서는 **무엇을 어떤 순서로 만들지**만 다룬다. 필드/DTO·body 구조는 재서술하지 않고 PRD §참조 계약 매핑을 가리킨다.

## 🗺️ 개요

**📅 최종 업데이트**: 2026-07-10
**📊 진행 상황**: 29/29 Tasks 완료 — M1 ✅(4/4) / M2 ✅(5/5) / M3 ✅(4/4) / M4 ✅(5/5) / M5 ✅(2/2) / M6 ✅(4/4) / M7 ✅(4/4) / M8 ✅(1/1) — **전체 완료**

- **전략**: walking-skeleton-first 세로 슬라이스. **아키텍처 배관(M0)은 없다** — axios 인스턴스·`withCredentials`·QueryClient·`ProtectedRoute`·`hasRequiredRole`·`LayoutShell`·`handleApiError`·`useZodForm`/`submitWithErrorMapping`·shadcn 폼·sonner·dayjs는 완성돼 있으므로 재구축하지 않고 **소비**한다(board/attendance/leave 로드맵 동일 관행). 여정 진입점(내 예약 캘린더 랜딩)부터 얇게 관통한 뒤, **공유 read 블록(회의실 열람)을 선확립**하고 예약 생성·상세·관리 축으로 전개, 마지막에 라우팅/사이드바 배선을 한 태스크로 통합한다.
- **⚠️ 순서 근거(여정 vs 의존성)**: 여정상 예약 생성(P2)이 회의실 열람(P4)보다 먼저지만, **회의실 열람 블록(F807/F808/F809, P4)은 P2의 회의실 카드 `[상세 보기]`와 P7(회의실 관리 상세)이 공유 소비**하고 **F809가 FullCalendar 2번째 소비처**라, board가 페이징 표준을 먼저 세운 것과 동형으로 **M2에서 공유 read 블록을 선확립**한다(P2/P7이 소비). 이는 아키텍처 배관 의존성 우선(계획 철학) 근거다. 회의 예약 검색(F802)도 활성 회의실 데이터를 전제하므로 M2의 회의실 read 타입이 선행되면 자연스럽다.
- **🗓️ FullCalendar 첫 소비처(중요)**: `@fullcalendar/react`는 CLAUDE.md §6 고정 스택에 있으나 **아직 실제 설치·소비 사례가 없다**(package.json 미포함·src import 0건, 실측 확인). **M1의 캘린더 통합 태스크(T1.2)가 FullCalendar를 처음 설치·확립**하고 재사용 가능한 래퍼로 만든다 — F800(내 예약 캘린더)·F809(회의실 예약 캘린더)가 이 래퍼를 소비한다(board가 react-table 페이징 표준을 먼저 세우고 이후 목록들이 소비한 것과 동형). **패키지 세트 확정(2026-07-10, 사용자 결정)**: 최소셋 `@fullcalendar/react`+`@fullcalendar/core`+`@fullcalendar/daygrid`+`@fullcalendar/interaction`(월간 뷰만, `timegrid` 미도입 — F809도 daygrid 일자별 이벤트 목록으로 표시).
- **소비할 완료 자산(재구축 금지, 패턴만 복제)**:
  - **폼/에러/가드 배관**: `src/shared/lib/form.ts`(`useZodForm`/`submitWithErrorMapping`), `src/shared/lib/apiError.ts`(`handleApiError` — 403/`ROLE_002`·`ROLE_003`·도메인 에러 토스트 포함), `src/shared/components/ProtectedRoute.tsx`, `src/shared/lib/hasRequiredRole.ts`, `src/shared/components/LayoutShell.tsx`, `src/app/router.tsx`, `src/shared/components/sidebarMenuItems.ts`(**"일정/회의" 그룹 123~131행에 placeholder 3개: `일정 캘린더`(범위 밖·미터치)·`회의실 예약` EMPLOYEE·`회의실 관리` FACILITY**)
  - **board 페이징 표준(react-table + Spring `Page` 메타, `number+1`)**: `src/features/board/model/queryKeys.ts`(queryKey 팩토리 동형 선례), `src/shared/components/PaginationControls.tsx`, `src/shared/lib/usePageState.ts` — F810·F811 목록 표가 복제
  - **board 파일 objectURL 표준**: `src/features/board/api/{getBoardFiles,downloadBoardFile,deleteBoardFile,uploadBoardFile}.ts` + `useBoardFilePreviewUrl.ts`(objectURL 미리보기)·`useBoardFileUploadMutation.ts`·`useBoardFileDeleteMutation.ts`·`lib/fileValidation.ts` — F808(열람/미리보기/다운로드)·F815(업로드)·F816(삭제)이 동형 복제
  - **전자결재 `EmployeePicker`**: `src/features/approval/components/EmployeePicker.tsx`(제어형 다중 선택, `features/department` 소비) — F803 생성·F805 참여자 교체의 참여자 지정에 **전사 전체 검색 모드**로 재사용(부서 한정 아님)
  - **본인 empId**: `useMeQuery().data?.empBasicInfo.empId`(전자결재 확립 패턴) — F803 `reserverId`·P3 예약자 본인 액션 노출에 소비. 로딩 전/부재 시 `undefined` → fail-closed(예약자 액션 미노출)
  - **franchise FACILITY(Layer 2) 게이팅 선례**: `sidebarMenuItems.ts`의 `minRole:'FRANCHISE'` 그룹 동형 — 회의 예약 관리·회의실 관리 메뉴/라우트를 `minRole:'FACILITY'`로 게이팅(`hasRequiredRole`가 `ADMIN` 자동 포함)
  - 날짜 `dayjs` / 토스트 `sonner` / 폼 `react-hook-form + zod` / shadcn Input·Textarea·Button·Card·Label·Dialog·AlertDialog·Table (CLAUDE.md §6 고정 스택 — **추가 라이브러리 도입 금지, 필요 시 사용자 논의**)
- **PRD에서 확정된 결정(로드맵 전제, 재서술 금지)**:
  - **참여자 풀=전사 전체 검색, 예약자(`reserverId`)와 참여자(`participants`)는 별개**(예약자 자동 포함 안 함) — `EmployeePicker` 전사 검색 모드.
  - **회의실 변경은 예약 수정 다이얼로그에 `meetingRoomId`(optional) 필드로 노출**(취소+재예약 유도 아님). 새 회의실·시간대 가용 여부는 서버 최종 판단(충돌 시 도메인 에러 토스트, 프론트 사전검증 없음).
  - **회의실 첨부**: 10MB, jpg/jpeg/png만(gif 불가), `accept="image/jpeg,image/png"`.
  - **시각 전송 `HH:mm`**, 응답 `HH:mm:ss`도 dayjs 파싱 가능하게 처리.
  - **FACILITY의 회의 예약 관리(P5)는 조회 전용**(수정/취소 등 액션 버튼 없음 — 강제 취소 API 부재).
  - **예약 수정/참여자 교체/취소는 예약자 본인만**(서버 최종 판정). 소유자 불일치 403은 `ROLE_003` 아님 → `code` 비의존 `handleApiError` 토스트 후 상세 복귀. 액션 노출 힌트: 예약자 본인 + `isCanceled=false` + 회의일 내일 이후(1일 전 규칙) — 최종 판정은 서버.
- **완료 게이트(전 마일스톤 공통)**: `npm run check-all` 통과 + `npm run build` 성공(CLAUDE.md §9). 도메인 슬라이스 구현 직후 test-author-runner로 유닛/컴포넌트 테스트 작성·실행.

## 🧩 의존성 개요

```
[이미 완료된 배관: axios·QueryClient·ProtectedRoute·hasRequiredRole·LayoutShell·handleApiError·
 form(useZodForm/submitWithErrorMapping)·sidebarMenuItems(일정/회의 그룹 placeholder 3개)·router]  ← 소비만(재구축 금지)
[board 페이징 표준(react-table+PaginationControls+usePageState)·파일 objectURL 표준]              ← 소비만
[전자결재 EmployeePicker(전사 검색)·useMeQuery empId·franchise FACILITY 게이팅 선례]               ← 소비만
  │
  └→ M1 도메인 스캐폴딩 + FullCalendar 통합 + 내 예약 캘린더 슬라이스 (F800, P1 랜딩)   ← meeting 스캐폴딩·meetingKeys·FullCalendar 래퍼 최초 확립
        │
        ├→ M2 회의실 열람 슬라이스 (F807+F808+F809, P4)   ← 공유 read 블록(P2 [상세보기]·P7 소비) · FullCalendar 2번째 소비 · 회의실 read 타입(F802 전제)
        │     │
        │     ├→ M3 회의 예약 생성 슬라이스 (F802 검색 + F803 생성, P2)   ← M2 [상세보기]→P4 소비 · EmployeePicker · reserverId=본인 empId
        │     │     └→ M4 회의 예약 상세·수정·참여자교체·취소 (F801/F804/F805/F806, P3)   ← F804 회의실 변경은 F802 검색 재사용 · EmployeePicker
        │     │           └→ M5 회의 예약 관리 (F810, P5 FACILITY 조회 전용)   ← react-table 페이징 · 행 클릭→P3 상세(조회 전용) 재사용
        │     │
        │     └→ M7 회의실 관리 상세 슬라이스 (F813/F815/F816/F814, P7 FACILITY)   ← M2 회의실 read 블록(F807/F808/F809) 소비 · board 파일 업로드 표준 · M6 토글 mutation 재사용
        │
        └→ M6 회의실 관리 목록 슬라이스 (F811/F812/F814, P6 FACILITY)   ← react-table 페이징 · 행 클릭/등록성공→P7
              (M6·M7은 서로 컴포넌트 import 없음 — 네비게이션은 라우트 문자열, 병렬 가능. M7은 M2 추가 의존)
  │
  └→ M8 라우팅/사이드바 배선 통합 (react-router-developer 위임)   ← M1~M7 전 페이지 + 사이드바 3항목(placeholder 2 승격 + 회의 예약 관리 신규)
```

- **M2가 공유 read 블록**(회의실 상세·이미지·예약 캘린더)을 확립하고, M3(P2 [상세보기])·M7(P7 열람)이 이를 소비한다.
- **M6·M7(회의실 관리)은 M2·M1에만 의존**(서로 코드 하드 의존 없음) → 예약 축(M3~M5)과 병렬 착수 가능.
- **M8(라우팅/사이드바)은 리프** — M1~M7 페이지가 존재해야 라우트를 연결. 공유 파일(`router.tsx`·`sidebarMenuItems.ts`) 병렬 편집 충돌 회피 위해 단일 태스크로 통합(leave M6 선례).

## 🚩 마일스톤 & 태스크

> 표기: **라우팅/사이드바 배선**(`router.tsx`·`sidebarMenuItems.ts` 수정)은 각 마일스톤에서 하지 않고 **M8로 통합**(react-router-developer 위임). 나머지(데이터 계층·비라우팅 UI)는 직접 구현. 각 마일스톤 페이지는 배선 전 **직접 URL 진입**으로 검증한다(attendance/leave 선례). 완료 여부: ☐ 미착수 / ☑ 완료. **중요도/복잡도/완료 여부 컬럼은 착수 시 task-planner가 채운다(현재 공란).**

### M1 — 도메인 스캐폴딩 + FullCalendar 통합 + 내 예약 캘린더 슬라이스 (F800)

> 목표: 사이드바 "회의실 예약" 진입 → 내가 예약한 회의가 FullCalendar 월간 뷰에 그려지고 예약 생성/상세로 진입하는 얇은 세로 슬라이스. **이 마일스톤이 meeting 도메인 스캐폴딩(`features/meeting/{model,api,components,pages}`)·`meetingKeys` queryKey 팩토리·재사용 FullCalendar 래퍼를 최초 확립**한다. 근거: PRD §사용자 여정(내 예약 캘린더 랜딩), §페이지별 상세(P1), F800.
> 완료 정의: `EMPLOYEE`가 캘린더에 진입해 당월 내 예약을 조회(뷰 이동 시 `start`/`end` 파생 재조회), 취소건(`isCanceled=true`) 시각 구분, 이벤트 클릭 → 상세(P3, M8 배선) 진입, `[회의 예약하기]` → 생성(P2). 직접 URL `/meetings`로 검증 가능.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T1.1 | meeting 도메인 스캐폴딩(`features/meeting/{model,api,components,pages}`) + **`meetingKeys` queryKey 팩토리**(board 동형: `all`/`myReservationsCalendar(range)`/`roomDetail(id)`/`roomReservationsCalendar(id,range)`/`availableRooms(params)`/`reservationDetail(id)`/`managementReservations(params)`/`roomManagement(params)` 등 축 선언) + **캘린더 기간 파라미터 유틸**(FullCalendar 뷰 range → `start`/`end` `yyyy-MM-dd'T'HH:mm:ss` dayjs 조립, 미입력 당월) | §기술 스택, §참조 계약 매핑(캘린더 `start`/`end`), §계약 실측 메모(날짜/기간 파라미터) | — | `features/meeting/model/meetingKeys.ts` + 기간 유틸 존재, `invalidateQueries(meetingKeys.all)`로 하위 일괄 갱신 가능 구조 | 9 | 3 | ☑ |
| T1.2 | **FullCalendar 통합 래퍼 확립(첫 소비처)**: `@fullcalendar/react` + 필요한 플러그인 패키지 설치(세트 Open Q#1) → 재사용 캘린더 래퍼 컴포넌트(이벤트 배열 렌더 + 뷰/월 이동 시 range 콜백으로 상위에 `start`/`end` 전달 → react-query 재조회). F800·F809 공용. board가 react-table 페이징을 먼저 세운 것과 동형 | §기술 스택(FullCalendar 첫 소비처), §페이지별 상세(P1 · `@fullcalendar/react` 첫 소비처) | T1.1 | `features/meeting/components/` 재사용 캘린더 래퍼 존재, 뷰 이동 시 range 콜백 발화, 이벤트 클릭 핸들러 노출, 설치 패키지 package.json 반영 | 8 | 6 | ☑ |
| T1.3 | F800 내 예약 캘린더 API 함수 + query 훅(`GET /api/meetings/my/reservations/calendar?start&end`, 응답 배열 → 캘린더 이벤트 매핑, `MY_MEETING_RESERVATIONS_CALENDAR`) | F800, §참조 계약 매핑(`MY_MEETING_RESERVATIONS_CALENDAR` 배열) | T1.1 | `features/meeting/api/` 조회 함수+query 훅 생성, 배열 응답 파싱, range 파라미터 쿼리 반영, 실패→`handleApiError` 위임 | 5 | 3 | ☑ |
| T1.4 | P1 내 예약 캘린더 페이지 `MyMeetingCalendarPage`: FullCalendar 래퍼(T1.2)에 T1.3 이벤트 바인딩(회의실명·제목·시간 요약, 취소건 흐림/뱃지) + 이벤트 클릭 → `navigate('/meetings/:meetingId')`(M8 배선) + `[회의 예약하기]` 버튼(→ `/meetings/new`) | F800, §페이지별 상세(P1·다음 이동) | T1.2, T1.3 | `features/meeting/pages/MyMeetingCalendarPage.tsx` 생성, 당월 이벤트 렌더·뷰 이동 재조회, 취소건 구분, 이벤트 클릭/`[회의 예약하기]` 네비게이션, 조회 실패→토스트 | 4 | 5 | ☑ |

> **split 판단(실측 산정 완료)**: T1.2(FullCalendar 첫 설치+래퍼)를 최대 후보로 실제 산정한 결과 **복잡도 6/10 — split 안 함**. 근거: 연관 기능ID 0개(자체는 API 미호출, F800·F809 2곳의 소비 대상일 뿐)·단일 도메인·실시간/파일 미포함이라 SKILL.md 규칙상 ≤6 캡이 적용되고, 신규 라이브러리 최초 통합 리스크를 반영해 상한값 6으로 산정했다(패키지 설치·래퍼 렌더·range 콜백·이벤트 클릭 노출이 한 컴포넌트 파일 안에 응집되는 단일 작업 단위라 인위적 분할이 오히려 검증 단위를 흐린다). 나머지(T1.1=복잡도3, T1.3=복잡도3, T1.4=복잡도5)도 전부 <7 — M1 전체 하위분할 없이 4개 평행 태스크로 확정.
> **중요도**: T1.1=9(meetingKeys·기간유틸을 M2~M8 전체가 재사용하는 최상위 기반) > T1.2=8(F800·F809 2개 마일스톤이 재사용하는 FullCalendar 래퍼) > T1.3=5(T1.4 단일 소비처) > T1.4=4(M1 리프, 후행 마일스톤은 T1.4가 아니라 T1.1·T1.2를 소비).
> **실행 순서**: T1.1 → (T1.2 · T1.3 병렬, 둘 다 T1.1 의존) → T1.4(T1.2·T1.3 의존, 리프). 동순위(T1.2·T1.3) 내 중요도가 T1.2(8)>T1.3(5)이므로 병렬 착수 시 T1.2를 우선 진행 권고. Shrimp task-id: T1.1=`ace35cb2-2238-44b2-ab1b-618a4b9367e1` / T1.2=`74d39751-fbd8-463c-983d-520f2c71d2f4` / T1.3=`d62e011d-2ee9-46e1-beeb-205dacd2ed42` / T1.4=`44a95519-2145-4a82-8cdb-e303fb7354d4`.

### M2 — 회의실 열람 슬라이스 (F807 + F808 + F809) — 공유 read 블록 (P4)

> 목표: 회의실 정보·안내 이미지·예약(점유) 캘린더를 열람하는 읽기 전용 화면(P4). **이 마일스톤이 P2 회의실 카드 `[상세 보기]`·P7 회의실 관리 상세가 공유 소비할 회의실 상세 컴포넌트/훅을 확립**하고, **FullCalendar를 2번째로 소비(T1.2 래퍼 재사용)**하며, F802 검색이 전제하는 회의실 read 타입을 제공한다. 근거: PRD §사용자 여정(회의실 상세 열람), §페이지별 상세(P4), F807·F808·F809.
> 완료 정의: 회의실 상세(이름·설명·수용인원·활성여부) + 안내 이미지 목록/미리보기(objectURL)/다운로드 + 예약 캘린더(점유 시간대만·제목/예약자 상세 없음 → 상세 링크하지 않음) 렌더. 직접 URL `/meeting-rooms/:meetingRoomId`로 검증. 조회 실패(404) → not-found UX.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T2.1 | 회의실 read 타입 + F807 회의실 상세 API/query(`GET /api/meeting-rooms/{meetingRoomId}`, 응답 `{meetingRoomId,name,description,capacity,isAvailable}`, `MEETING_ROOM_DETAIL`) | F807, §참조 계약 매핑(`MEETING_ROOM_DETAIL`) | T1.1 | `features/meeting/api/` 회의실 상세 함수+query 훅 + 회의실 read 타입 존재, 실패→위임 | 5 | 3 | ☑ |
| T2.2 | F808 회의실 이미지 목록/미리보기/다운로드(`GET /api/meeting-rooms/{id}/files[/{fileId}/preview\|download]`, 목록 `Array<{fileId,originalName,extension,fileSize}>` + preview/download Binary → objectURL) — **board 파일 objectURL 표준 동형 복제**(`getBoardFiles`/`useBoardFilePreviewUrl`/`downloadBoardFile` 패턴) | F808, §참조 계약 매핑(`MEETING_ROOM_FILES/_PREVIEW/_DOWNLOAD`, objectURL 표준) | T1.1 | `features/meeting/api/` 파일 목록/미리보기/다운로드 함수+훅 생성, objectURL 생성·해제, 실패→위임 | 5 | 5 | ☑ |
| T2.3 | F809 회의실 예약 캘린더 API/query(`GET /api/meeting-rooms/{id}/reservations/calendar?start&end`, 응답 `Array<{reserverDeptName,reserverEmpName,participantCount,meetingDate,startAt,endAt}>` — ⚠️`meetingId`·`title` 없음) + **FullCalendar 2번째 소비(T1.2 래퍼 재사용)**, 점유 시간대만 표시·상세 링크 없음 | F809, §참조 계약 매핑(`MEETING_ROOM_RESERVATIONS_CALENDAR` 필드 축소), §계약 실측 메모(캘린더 필드 축소=설계 의도) | T1.1, T1.2 | `features/meeting/api/` 회의실 예약 캘린더 함수+훅 + T1.2 래퍼로 렌더, 이벤트에 상세 링크 없음, range 재조회 | 5 | 5 | ☑ |
| T2.4 | P4 회의실 상세(열람) 페이지 `MeetingRoomDetailPage`: 상세(T2.1) + 이미지 목록/미리보기/다운로드(T2.2) + 예약 캘린더(T2.3) 조립 — **P2/P7이 소비할 공유 컴포넌트 단위로 구성** | F807·F808·F809, §페이지별 상세(P4·다음 이동) | T2.1, T2.2, T2.3 | `features/meeting/pages/MeetingRoomDetailPage.tsx` 생성, 상세·이미지·점유 캘린더 렌더, 404→not-found, 재사용 가능한 상세 컴포넌트 구조 | 8 | 7 | ☐ |
| T2.4-a | (T2.4 분할 ①) 회의실 정보 + 이미지 갤러리 **공유 컴포넌트** 조립: `MeetingRoomInfoPanel`(T2.1 소비, 이름·설명·수용인원·활성여부) + `MeetingRoomImageGallery`(T2.2 소비, 목록/미리보기/다운로드) — 각각 `meetingRoomId` props만으로 독립 렌더, P7(T7.2)이 재소비할 컴포넌트 단위 | F807·F808, §페이지별 상세(P4), §M7(T7.2 "T2.4 컴포넌트" 소비) | T2.1, T2.2 | `features/meeting/components/MeetingRoomInfoPanel.tsx`+`MeetingRoomImageGallery.tsx` 생성, 각각 `meetingRoomId`만으로 독립 렌더 가능, 페이지 전용 상태에 결합되지 않음 | 7 | 4 | ☑ |
| T2.4-b | (T2.4 분할 ②, 리프) 예약 캘린더 통합 + P4 페이지 최종 조립: T2.4-a(정보+갤러리) + T2.3(예약 캘린더 블록) 통합해 `MeetingRoomDetailPage` 완성, 라우트 파라미터 `meetingRoomId` 파싱·404→not-found | F807·F808·F809, §페이지별 상세(P4·다음 이동) | T2.4-a, T2.3 | `features/meeting/pages/MeetingRoomDetailPage.tsx` 생성, 상세·이미지·점유 캘린더 렌더, 404→not-found, 직접 URL `/meeting-rooms/:meetingRoomId` 검증 가능 | 8 | 4 | ☑ |

> **split 판단(실측 산정 완료)**: T2.4(상세+이미지+캘린더 3영역 조립)를 실제 산정한 결과 **복잡도 7 — split**. 근거: 관련 기능ID 3개(F807+F808+F809)를 한 페이지에 통합 + PRD·로드맵이 명시한 "P2/P7 공유 재사용 컴포넌트 구조" 설계 부담(단순 조립이 아니라 컴포넌트 경계 설계 필요)이 겹쳐 SKILL.md 캡(≤6, 기능ID 1개 이하 조건) 미적용 대상. 분할 축은 의존성 순서: **T2.4-a**(정보+이미지 공유 컴포넌트, T2.1·T2.2 소비 — M7 T7.2가 재소비할 컴포넌트 실체) → **T2.4-b**(예약 캘린더 통합+페이지 최종 조립, T2.4-a·T2.3 소비, 리프 — M3 T3.3·M7 T7.2가 참조하는 "완성된 T2.4" 계약의 실제 이행 지점). T2.1(복잡도3)·T2.2(복잡도5, 3기능ID+파일이나 board 표준 1:1 복제)·T2.3(복잡도5, 기능ID1개지만 T1.2 캘린더 렌더 결합+선행의존 2개)은 전부 <7 — 분할 없음.
> **중요도**: T2.4-b=8(M3 T3.3·M7 T7.2 두 마일스톤이 직접 참조하는 실제 계약 이행 지점, T1.2와 동형 2마일스톤 소비 프로파일) > T2.4-a=7(T2.4-b 소비 + M7 T7.2가 "T2.4 컴포넌트"로 재소비 명시) > T2.1=T2.2=T2.3=5(로드맵상 유일한 직접 후행 의존이 각각 T2.4-a/T2.4-b 1곳뿐 — T1.3=5와 동일 산정 원칙).
> **실행 순서**: T1.1(선행, M1) → (T2.1 · T2.2 · T2.3 병렬, T2.3만 T1.2 추가 의존) → T2.4-a(T2.1·T2.2 의존) → T2.4-b(T2.4-a·T2.3 의존, 리프). 동순위(T2.1/T2.2/T2.3) 중요도 동률(5)이므로 PRD 서술 순서(F807→F808→F809) 그대로 착수 권고. Shrimp task-id: T2.1=`46f2871a-5d0c-4e51-8df1-1ace4f7a5b93` / T2.2=`a68a55d9-9023-4728-ad30-d4af647f4b3c` / T2.3=`5bcd69ef-a6f8-43a8-8414-34385d0f7258` / T2.4-a=`79a5d49e-da2f-441d-8909-257465be9e7e` / T2.4-b=`ea6994ab-b031-4a58-ab39-5acb1b91a139`.

### M3 — 회의 예약 생성 슬라이스 (F802 + F803) (P2)

> 목표: 조건(날짜·시각·최소 수용인원)으로 예약 가능 회의실을 검색해 제목·참여자와 함께 회의를 예약하는 화면(P2). 근거: PRD §사용자 여정(예약 생성), §페이지별 상세(P2), F802·F803.
> 완료 정의: `EMPLOYEE`가 `date`/`startAt`/`endAt`/`capacity`(4개 필수) 입력 → 회의실 검색(페이징) → 카드 선택(필요 시 `[상세 보기]`→P4, M2 소비) → 제목(≤100자)·참여자(EmployeePicker 전사 검색, 빈 배열 불가) 지정 → `[예약]`(`reserverId`=본인 empId) → `201` → P1 복귀 + 캘린더 invalidate + 토스트. 검증 실패 인라인 에러, 시간대 충돌/도메인 위반 에러 토스트. 직접 URL `/meetings/new`로 검증.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T3.1 | F802 예약 가능 회의실 검색 API/query(`GET /api/meeting-rooms/available?date&startAt&endAt&capacity&page&size`, **4개 필수 파라미터**, 시각 `HH:mm`, `Page<{meetingRoomId,name,capacity,isAvailable}>`, `AVAILABLE_MEETING_ROOMS`) + query 훅(검색 조건 확정 전 `enabled:false`) | F802, §참조 계약 매핑(`AVAILABLE_MEETING_ROOMS` 4필수·`HH:mm`), Open Q#5 | T1.1 | `features/meeting/api/` 검색 함수+query 훅 생성, 4필수 파라미터 쿼리·페이징 반영, 조건 미충족 시 미조회, 실패→위임 | 7 | 3 | ☑ |
| T3.2 | F803 예약 생성 zod 스키마(제목 ≤100자·공백불가, 회의일 현재 이후, 시각 종료>시작, 참여자 빈 배열 불가) + **시각 `HH:mm` 전송 조립**(dayjs) + create API/mutation(`POST /api/meetings`, 혼합 필드 `{meetingRoomId,reserverId,title,meetingDate,startAt,endAt,participantIds}`, `201` Empty, `MEETING_RESERVATION_CREATE`, onSuccess 캘린더 invalidate). 신규 타입 `MeetingReservationCreatePayload` | F803, §참조 계약 매핑(`MEETING_RESERVATION_CREATE`·`HH:mm`), Open Q#5·#6 | T1.1 | `features/meeting/{model,api}/` 스키마+create 함수+mutation 생성, `HH:mm` 전송, `201` 처리, 성공 시 캘린더 invalidate, 실패→throw(`submitWithErrorMapping` 위임) | 5 | 4 | ☑ |
| T3.3 | P2 예약 생성 페이지 `MeetingReservationCreatePage`: ①검색 폼(T3.1, 날짜·시작/종료 시각·capacity) → 회의실 카드 목록(이름·수용인원, `[상세 보기]`→P4 소비 **M2**) → ②제목 Input·참여자 `EmployeePicker`(전사 검색→`participantIds`) → `[예약]`(T3.2, `reserverId`=`useMeQuery` empId, 참여자 수>capacity 시 경고만) → `201`→`navigate('/meetings')`+invalidate+토스트 | F802·F803, §페이지별 상세(P2·다음 이동), Open Q#1·#6 | T3.1, T3.2, T2.4-b | `features/meeting/pages/MeetingReservationCreatePage.tsx` 생성, 검색→카드→[상세보기]→P4, 제목·참여자 지정, 빈 참여자/미검증 인라인 에러, 생성 성공→P1 이동·invalidate·토스트, 서버 에러→토스트 | 4 | 7 | ☑ |
| T3.3-a | (T3.3 분할 ①) 검색 폼(T3.1, 날짜·시작/종료 시각·capacity) + 회의실 카드 목록(이름·수용인원) + 카드 선택 상태 + `[상세 보기]`→P4 내비게이션(M2 **T2.4-b** 소비, 코드 import 없이 라우트 문자열) — 페이지 전용 상태에 결합되지 않는 독립 조각, T3.3-b가 소비 | F802, §페이지별 상세(P2) | T3.1, T2.4-b | `features/meeting/components/MeetingRoomSearchAndSelect.tsx` 생성, 검색 제출 시 T3.1 조회 발화, 카드 목록 렌더, 선택 상태 관리, `[상세 보기]`→`/meeting-rooms/:meetingRoomId` 내비게이션 동작 | 5 | 4 | ☑ |
| T3.3-b | (T3.3 분할 ②, 리프) 제목 Input(zod ≤100자)·참여자 `EmployeePicker`(전사 검색→`participantIds`) + `[예약]`(T3.2, `reserverId`=`useMeQuery` empId, 참여자 수>capacity 시 경고만) 배선 + T3.3-a 통합해 `MeetingReservationCreatePage` 최종 조립 → `201`→`navigate('/meetings')`+invalidate+토스트 | F803, §페이지별 상세(P2·다음 이동), Open Q#1·#6 | T3.3-a, T3.2 | `features/meeting/pages/MeetingReservationCreatePage.tsx` 생성, 검색→카드→[상세보기]→P4 관통, 제목·참여자 지정, 빈 참여자/미검증 인라인 에러, 생성 성공→P1 이동·invalidate·토스트, 서버 에러→토스트, 직접 URL `/meetings/new` 검증 가능 | 4 | 4 | ☑ |

> **split 판단(실측 산정 완료)**: T3.3(검색 UI + 카드 선택 + 제목/참여자/제출)을 실제 산정한 결과 **복잡도 7 — split**. 근거: 관련 기능ID 2개(F802 검색+F803 생성)를 한 페이지에서 검색→카드선택→`[상세 보기]`내비(M2 소비)→제목/참여자입력→제출의 다단계 위저드로 통합 + 전자결재 `EmployeePicker` 전사 검색 모드 재사용(cross-feature 위젯 통합) + `useMeQuery` 본인 empId 의존이 겹쳐 SKILL.md 캡(≤6, 기능ID 1개 이하 조건) 미적용 대상(T2.4와 동형 프로파일). 분할 축은 의존성 순서: **T3.3-a**(검색 폼+카드 목록+선택 상태+`[상세 보기]`→P4 내비게이션, T3.1 소비, T2.4-b 의존 — 내비게이션 타깃 존재 전제) → **T3.3-b**(제목·참여자 입력+제출, T3.3-a·T3.2 소비, 리프 — `MeetingReservationCreatePage` 완성 지점). T3.1(복잡도3, 표준 검색+페이징 조회 — board 페이징 표준 복제)·T3.2(복잡도4, 단일 기능ID지만 제목/회의일/시각교차/참여자 zod 다중검증+`HH:mm` 조립)는 전부 <7 — 분할 없음.
> **중요도**: T3.1=7(**M4 T4.3**이 Depends-on에 "(+ T3.1 soft)"로 명시 참조하는 교차 마일스톤 소비 — F804 회의실 변경 UI가 F802 검색 재사용, soft 의존이나 T1.2와 동형 다마일스톤 소비 프로파일) > T3.3-a=5(T3.3-b 단일 소비, 교차 마일스톤 재사용 없음 — T2.1/T2.2/T2.3와 동일 산정 원칙) = T3.2=5(T3.3-b 단일 소비, 교차 마일스톤 참조 없음) > T3.3-b=4(M3 리프, 후행 마일스톤은 T3.3이 아니라 T3.1을 소비 — T1.4와 동형 산정).
> **실행 순서**: T1.1(선행, M1) → (T3.1 · T3.2 병렬, 각 T1.1 의존) → T3.3-a(T3.1·T2.4-b 의존) → T3.3-b(T3.3-a·T3.2 의존, 리프). Shrimp task-id: T3.1=`feaa1b62-6777-4e8a-8c77-0b9d338b8a05` / T3.2=`602054e4-d305-4abd-bd2b-0a0866cbf6c3` / T3.3-a=`ae431a47-1e96-43af-b4f4-8d99112cf402` / T3.3-b=`40c02da3-7e1c-4702-a039-cc88753fee54`.

### M4 — 회의 예약 상세·수정·참여자교체·취소 슬라이스 (F801/F804/F805/F806) (P3)

> 목표: 예약 상세·참여자를 확인하고 예약자 본인이 수정/참여자 교체/취소하는 화면(P3). 근거: PRD §사용자 여정(예약 상세), §페이지별 상세(P3), F801·F804·F805·F806.
> 완료 정의: 상세(F801, 회의실·예약자·일시·취소여부·참여자 목록) 렌더 + **예약자 본인 액션 게이팅**(본인 empId 일치 + `isCanceled=false` + 회의일 내일 이후, 최종 서버) → 수정 다이얼로그(F804, 회의일/시각/제목 + **회의실 변경 필드** `meetingRoomId`)·참여자 교체 다이얼로그(F805, EmployeePicker 전사 전체 교체)·취소(F806, AlertDialog). 성공(`204`) → 상세·캘린더 invalidate + 토스트, 취소 후 P1 복귀 가능. 소유자 불일치 403 → `code` 비의존 토스트. FACILITY가 P5 경유 진입 시 액션 미노출(조회 전용). 직접 URL `/meetings/:meetingId`로 검증.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T4.1 | F801 예약 상세 API/query(`GET /api/meetings/{meetingId}`, 응답 상세+`participants:Array<{empId,deptName,empName}>`, `MEETING_RESERVATION_DETAIL`) | F801, §참조 계약 매핑(`MEETING_RESERVATION_DETAIL`) | T1.1 | `features/meeting/api/` 상세 함수+query 훅 생성, 참여자 배열 파싱, 404→not-found, 실패→위임 | 5 | 3 | ☑ |
| T4.2 | 예약 mutation 3종: F804 수정(`PATCH .../reservation-info`, 전 필드 optional `{meetingDate?,startAt?,endAt?,meetingRoomId?,title?}`, `204`) + F805 참여자 교체(`PATCH .../participants`, `{participantIds}` 전체 교체·빈 배열 불가, `204`) + F806 취소(`PATCH .../cancel`, body 없음, `204`) + mutation 훅(onSuccess 상세·캘린더 invalidate). 시각 `HH:mm` 전송 | F804·F805·F806, §참조 계약 매핑(`MEETING_RESERVATION_UPDATE/_PARTICIPANTS_REPLACE/_CANCEL`), Open Q#5 | T1.1 | `features/meeting/api/` mutation 3종 생성, `204` 처리, 권한/기간/소유자 위반→throw(`handleApiError` 위임), 성공 시 상세·캘린더 invalidate | 5 | 6 | ☑ |
| T4.3 | P3 예약 상세 페이지 `MeetingReservationDetailPage`: 상세 렌더(T4.1) + 예약자 본인 액션 게이팅(본인 empId·`isCanceled`·1일전 힌트) + `[예약 정보 수정]` 다이얼로그(T4.2 F804 · 회의일/시각/제목 + **회의실 변경 필드**: F802 검색(T3.1) 재사용) + `[참여자 교체]` 다이얼로그(T4.2 F805 · `EmployeePicker` 전사 검색) + `[예약 취소]`(T4.2 F806 · AlertDialog). FACILITY 조회 진입 시 액션 미노출 | F801·F804·F805·F806, §페이지별 상세(P3·다음 이동), Open Q#2 | T4.1, T4.2 (+ T3.1 soft) | `features/meeting/pages/MeetingReservationDetailPage.tsx` 생성, 상세·참여자 렌더, 예약자 본인만 액션 노출(비본인·취소건·1일 내 미노출), 수정/교체/취소 성공→invalidate·토스트, 소유자 불일치 403→토스트, 조회 실패→not-found | 8 | 8 | ☑ |
| T4.3-a | (T4.3 분할 ①) 상세 렌더(T4.1) + 예약자 본인 액션 게이팅 판정(본인 empId·`isCanceled=false`·회의일 내일 이후 힌트) — `MeetingReservationDetailPage` 뼈대, FACILITY 조회 전용 진입 시 액션 영역 미노출, T4.3-b·T4.3-c가 다이얼로그를 삽입할 슬롯 제공 | F801, §페이지별 상세(P3), Open Q#2 | T4.1 | `features/meeting/pages/MeetingReservationDetailPage.tsx` 뼈대 생성, 상세·참여자 렌더, 액션 게이팅 판정 함수/훅 존재, FACILITY 조회 전용 시 액션 영역 미노출, 404→not-found | 5 | 4 | ☑ |
| T4.3-b | (T4.3 분할 ②) `[예약 정보 수정]` 다이얼로그(T4.2 F804 · 회의일/시각/제목 부분 수정 + **회의실 변경 필드**: F802 검색(T3.1) 재사용) T4.3-a 게이팅 슬롯에 배선 | F804, §참조 계약 매핑(`MEETING_RESERVATION_UPDATE`), Open Q#2(회의실 변경 UX) | T4.3-a, T4.2 (+ T3.1 soft) | 수정 다이얼로그 컴포넌트 생성, 회의일/시각/제목 부분 수정 입력, 회의실 변경 필드에 T3.1 검색 재사용 배선, 게이팅 조건 충족 시만 버튼 노출, 성공→invalidate·토스트, 서버 위반→토스트 | 5 | 5 | ☑ |
| T4.3-c | (T4.3 분할 ③, 리프) `[참여자 교체]` 다이얼로그(T4.2 F805 · `EmployeePicker` 전사 검색) + `[예약 취소]`(T4.2 F806 · AlertDialog) 배선 + T4.3-b 통합해 `MeetingReservationDetailPage` 최종 완성 | F805·F806, §페이지별 상세(P3·다음 이동) | T4.3-b, T4.2 | `features/meeting/pages/MeetingReservationDetailPage.tsx` 완성, 참여자 교체·취소 다이얼로그 동작, 소유자 불일치 403→`code` 비의존 토스트, 성공→invalidate·토스트, 취소 후 P1 복귀 가능, 직접 URL `/meetings/:meetingId` 검증 가능 | 8 | 5 | ☑ |

> **split 판단(실측 산정 완료)**: T4.3(상세+게이팅+3다이얼로그[수정·교체·취소])를 실제 산정한 결과 **복잡도 8 — split**. 근거: 관련 기능ID 4개(F801+F804+F805+F806)를 한 페이지에서 상세 렌더→예약자 본인 게이팅 판정→수정(회의실 변경 필드에 F802 검색(T3.1) cross-milestone 재사용)→참여자 교체(EmployeePicker)→취소(AlertDialog) 다이얼로그 3종을 배선하는 복합 조립이라 T2.4·T3.3(둘 다 복잡도 7)보다 기능ID 수가 많고 FACILITY 조회 전용 분기까지 겹쳐 SKILL.md 캡(≤6, 기능ID 1개 이하 조건) 미적용 대상. 분할 축은 의존성 순서: **T4.3-a**(상세 렌더+예약자 본인 액션 게이팅, T4.1 소비 — 후속 다이얼로그가 게이팅 판정을 전제로 노출 여부 결정) → **T4.3-b**(수정 다이얼로그, T4.3-a·T4.2 소비, T3.1 soft — 회의실 변경 필드 검색 재사용) → **T4.3-c**(참여자교체+취소 다이얼로그 통합+페이지 최종 조립, T4.3-b·T4.2 소비, 리프 — M5 T5.2·M8 T8.1이 참조하는 완성된 P3 계약의 실제 이행 지점). T4.1(복잡도3, 표준 단일 조회+참여자 배열 파싱)·T4.2(복잡도6, 기능ID 3개[F804/F805/F806] 묶음이나 UI 없는 순수 mutation 계층이라 T2.4·T3.3의 UI 조립 부담과 달리 split 임계 미도달)는 각각 <7 — 분할 없음.
> **중요도**: T4.3-c=8(M5 T5.2·M8 T8.1 두 마일스톤이 직접 참조하는 완성된 P3 계약 이행 지점, T2.4-b와 동형 2마일스톤 소비 프로파일) > T4.3-a=T4.3-b=5(각각 체인 내 다음 단계 1곳만 소비, 교차 마일스톤 참조 없음 — T2.1/T2.2/T2.3·T3.3-a와 동일 산정 원칙) = T4.1=T4.2(로드맵상 유일한 직접 후행 의존이 T4.3 체인 1곳뿐).
> **실행 순서**: (T4.1 · T4.2 병렬, 각 T1.1 의존) → T4.3-a(T4.1 의존) → T4.3-b(T4.3-a·T4.2 의존, T3.1 soft) → T4.3-c(T4.3-b·T4.2 의존, 리프). 동순위(T4.1·T4.2) 중요도 동률(5)이므로 PRD 서술 순서(F801→F804/F805/F806) 그대로 착수 권고. Shrimp task-id: T4.1=`725b1a41-3162-4a31-963b-a5b078597322` / T4.2=`a38b1658-ea8a-4853-901f-40a986f5ddfc` / T4.3-a=`cf5f9482-74fc-42df-9af3-566012b38adb` / T4.3-b=`f3ff15ce-16e0-4ffa-a83a-8eb146aca885` / T4.3-c=`23ee2534-a571-49c0-b20e-f0522ad0cfd9`.

### M5 — 회의 예약 관리 슬라이스 (F810) (P5, FACILITY 조회 전용)

> 목표: 시설 담당이 전사 회의 예약을 월·검색어·회의실로 필터링해 감독하는 목록 화면(P5, **조회 전용**). 근거: PRD §사용자 여정(회의 예약 관리 독립 축), §페이지별 상세(P5), F810.
> 완료 정의: `FACILITY`(ADMIN 자동 포함)가 `yearMonth`(기본 현재월)·`keyword`(디바운스)·`meetingRoomId` 필터로 페이징 표(react-table + Spring Page, `number+1`) 조회, 행 클릭 → P3 상세(조회 전용·액션 미노출). 비FACILITY 서버 403 → 권한 부족 UX. 직접 URL `/meetings/management`로 검증.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T5.1 | F810 회의 예약 관리 목록 API/query(`GET /api/meetings?yearMonth&keyword&meetingRoomId&page&size`, 전 쿼리 선택, `Page<...>` + 표준 페이지 메타, `MEETING_RESERVATION_MANAGEMENT`) + `meetingKeys` 관리 축 확장 | F810, §참조 계약 매핑(`MEETING_RESERVATION_MANAGEMENT` Page) | T1.1 | `features/meeting/api/` 관리 목록 함수+query 훅 생성, `Page<T>`·`number+1` 파싱, 필터·page/size 반영, 403→`handleApiError` 위임 | 5 | 3 | ☑ |
| T5.2 | P5 회의 예약 관리 페이지 `MeetingReservationManagementPage`: react-table 페이징 표(T5.1 · 컬럼 회의실·예약자·제목·일시·참여자수·취소여부, board 페이징 표준 `PaginationControls`/`usePageState` 소비) + 필터(월 기본 현재월·`keyword` 디바운스·회의실 선택) + 행 클릭 → `navigate('/meetings/:meetingId')`(P3 조회 전용) | F810, §페이지별 상세(P5·다음 이동) | T5.1, T4.3-c | `features/meeting/pages/MeetingReservationManagementPage.tsx` 생성, 표·필터·페이징 렌더, 디바운스/필터 변경 시 페이지 리셋, 행 클릭→P3, 조회 실패/403→토스트, 빈 목록→빈 상태 | 4 | 4 | ☑ |

> **split 판단(실측 산정 완료)**: T5.2(표+필터3종+페이징+행클릭 내비게이션)를 최대 후보로 실제 산정한 결과 **복잡도 4 — split 안 함**. 근거: 연관 기능ID 1개(F810)·단일 도메인·실시간/파일 미포함이라 SKILL.md 규칙상 ≤6 캡이 적용되고, board 페이징 표준(`PaginationControls`/`usePageState`)을 그대로 소비하는 조립이라 다이얼로그·mutation이 있는 T3.3-a(복잡도4)보다도 상태 관리 부담이 낮다(선택 상태·위저드 단계 없음, 순수 조회+필터+내비게이션). T5.1(복잡도3, 목록+필터+`Page` 파싱 — T3.1·T2.1·T4.1과 동형 순수 조회 계층)도 <7 — M5 전체 하위분할 없이 2개 평행 태스크로 확정.
> **중요도**: T5.1=5(T5.2 1곳만 소비, 교차 마일스톤 참조 없음 — T2.1/T2.2/T2.3·T4.1과 동일 산정 원칙) > T5.2=4(M5 리프, 후행 마일스톤이 T5.2를 구체적으로 참조하지 않음 — T1.4/T3.3-b와 동일 산정 원칙. M8은 전 페이지 공통 배선이라 특정 재사용 근거로 보지 않음).
> **실행 순서**: T5.1 → T5.2(T5.1·T4.3-c[P3 상세 완성본, 코드 결합 없이 라우트 문자열 재사용] 의존, 리프). Shrimp task-id: T5.1=`d77e02d1-930d-42eb-ac04-28c43868bbd7` / T5.2=`9e6d76c9-0938-43ce-9623-d6b2f57e67b1`.

### M6 — 회의실 관리 목록 슬라이스 (F811/F812/F814) (P6, FACILITY)

> 목표: 회의실 자원을 목록으로 관리하고 신규 등록·활성 토글하는 화면(P6). 근거: PRD §사용자 여정(회의실 관리 독립 축), §페이지별 상세(P6), F811·F812·F814.
> 완료 정의: `FACILITY`(ADMIN 자동 포함)가 `available`/`bookedInFuture` 필터로 회의실 페이징 표 조회, `[회의실 등록]` 다이얼로그(F812, 이름≤50자·공백불가·설명 공백불가·수용인원 양수 zod 사전검증)로 생성(`201 {meetingRoomId}`) → 생성된 P7으로 이동(이미지 업로드 유도) + 목록 invalidate, 행 `[활성화]/[비활성화]` 토글(F814, AlertDialog). 이름 중복 등 서버 위반 → 에러 토스트. 직접 URL `/meeting-rooms/management`로 검증.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T6.1 | F811 회의실 관리 목록 API/query(`GET /api/meeting-rooms/management?available&bookedInFuture&page&size`, `Page<{meetingRoomId,name,capacity,isAvailable}>` + 표준 페이지 메타, `MEETING_ROOM_MANAGEMENT`) + `meetingKeys` 회의실 관리 축 확장 | F811, §참조 계약 매핑(`MEETING_ROOM_MANAGEMENT` Page) | T1.1 | `features/meeting/api/` 회의실 관리 목록 함수+query 훅 생성, `Page<T>`·`number+1` 파싱, 필터·page/size 반영, 실패→위임 | 5 | 3 | ☑ |
| T6.2 | F812 회의실 등록 zod 스키마(이름 ≤50자·공백불가, 설명 공백불가, 수용인원 양수) + create API/mutation(`POST /api/meeting-rooms`, `201 {meetingRoomId}`, `MEETING_ROOM_CREATE`) + **F814 활성/비활성 토글 mutation**(`PATCH .../activate\|deactivate`, body 없음, `204`, `MEETING_ROOM_ACTIVATE/_DEACTIVATE`) + mutation 훅(onSuccess 목록 invalidate) | F812·F814, §참조 계약 매핑(`MEETING_ROOM_CREATE`·`_ACTIVATE`/`_DEACTIVATE`) | T1.1 | `features/meeting/{model,api}/` 등록 스키마+create+토글 mutation 생성, `201 {meetingRoomId}`·`204` 처리, 이름 중복 등 위반→throw(위임), 성공 시 목록 invalidate | 8 | 4 | ☑ |
| T6.3 | P6 회의실 관리 목록 페이지 `MeetingRoomManagementPage`: react-table 페이징 표(T6.1 · 컬럼 이름·수용인원·활성여부, 필터 `available`/`bookedInFuture`, board 페이징 표준 소비) + `[회의실 등록]` 다이얼로그(T6.2 F812) → `201`→생성 P7으로 이동 + 목록 invalidate + 행 `[활성화]/[비활성화]` 토글(T6.2 F814, AlertDialog) + 행 클릭 → P7 | F811·F812·F814, §페이지별 상세(P6·다음 이동) | T6.1, T6.2 | `features/meeting/pages/MeetingRoomManagementPage.tsx` 생성, 표·필터·페이징, 등록 다이얼로그 검증·성공→P7 이동·invalidate, 토글 성공→invalidate·토스트, 행 클릭→P7, 위반→토스트 | 7 | 7 | ☐ |
| T6.3-a | (T6.3 분할 ①) 표+필터(`available`/`bookedInFuture`)+페이징(T6.1 소비, board 표준 `PaginationControls`/`usePageState`) + 행 클릭 → P7 내비게이션(코드 import 없이 라우트 문자열) — read 전용 조각, T6.3-b가 등록 다이얼로그·토글을 배선할 뼈대 제공 | F811, §페이지별 상세(P6) | T6.1 | `features/meeting/pages/MeetingRoomManagementPage.tsx` read 조각 생성, 표·필터·페이징 렌더, 필터 변경 시 페이지 리셋, 행 클릭→`/meeting-rooms/management/:meetingRoomId` 내비게이션 | 5 | 4 | ☑ |
| T6.3-b | (T6.3 분할 ②, 리프) `[회의실 등록]` 다이얼로그(T6.2 F812, `201`→생성 P7 이동+invalidate+토스트) + 행 `[활성화]/[비활성화]` 토글(T6.2 F814, AlertDialog) 배선 + T6.3-a 통합해 `MeetingRoomManagementPage` 최종 완성 | F812·F814, §페이지별 상세(P6·다음 이동) | T6.3-a, T6.2 | `features/meeting/pages/MeetingRoomManagementPage.tsx` 완성, 등록 다이얼로그 검증·성공→P7 이동·invalidate·토스트, 토글 성공→invalidate·토스트, 위반→토스트, 직접 URL `/meeting-rooms/management` 검증 가능 | 4 | 4 | ☑ |

> **split 판단(실측 산정 완료)**: T6.3(표+필터+페이징 + 등록 다이얼로그 + 토글)을 실제 산정한 결과 **복잡도 7 — split**. 근거: 관련 기능ID 3개(F811+F812+F814)를 read(표+필터+페이징) + write 2종(등록 다이얼로그, 토글 액션) 총 3개 관심사로 한 페이지에 통합 — T2.4(기능ID3개→복잡도7 split)와 동형 프로파일이며 T5.2(기능ID1개, 표만, 복잡도4)보다 관심사가 2배 이상 확장돼 SKILL.md 캡(≤6, 기능ID 1개 이하 조건) 미적용 대상. 분할 축은 의존성 순서: **T6.3-a**(read 전용, T6.1 소비 — 뼈대) → **T6.3-b**(write 2종 배선+최종 조립, T6.3-a·T6.2 소비, 리프). T6.1(복잡도3, 표준 Page 조회 — T5.1·T2.1과 동형)·T6.2(복잡도4, 기능ID2개[F812+F814]지만 UI 없는 순수 mutation 계층이라 T4.2[기능ID3, 복잡도6]보다 단순 — create는 3필드 zod, toggle 2종은 body 없는 trivial PATCH)는 전부 <7 — 분할 없음.
> **중요도**: T6.2=8(**F814 토글 mutation이 M7 T7.2에 cross-milestone 재사용** — 단일 마일스톤 소비가 아니라 M7까지 재사용되는 기반이라 T2.4-b·T4.3-c와 동형 2마일스톤 소비 프로파일로 상향, 재사용을 위해 독립 export 훅으로 설계) > T6.3-a=5(T6.3-b 단일 소비, 교차 마일스톤 참조 없음 — T2.1/T2.2/T2.3·T3.3-a와 동일 산정 원칙) = T6.1=5(T6.3-a 1곳만 소비) > T6.3-b=4(M6 리프, M8은 전 페이지 공통 배선이라 특정 재사용 근거로 보지 않음 — T1.4/T5.2와 동일 산정 원칙).
> **실행 순서**: (T6.1 · T6.2 병렬, 각 T1.1 의존, 중요도 T6.2(8)>T6.1(5)이므로 병렬 착수 시 T6.2 우선 권고 — M7 T7.2가 조기에 필요로 할 재사용 자산이기도 함) → T6.3-a(T6.1 의존) → T6.3-b(T6.3-a·T6.2 의존, 리프). M6은 M1에만 의존 → 예약 축(M3~M5)과 병렬 착수 가능. Shrimp task-id: T6.1=`4877ed5d-0d56-43d6-830b-6c7086273789` / T6.2=`80198dcd-e1a3-4d4e-9937-16db46c5ebb8` / T6.3-a=`c0639b8f-e5de-4fc7-8c2a-f844eb7579c3` / T6.3-b=`01e7afc8-303d-4d58-bf70-1032378b5102`.

### M7 — 회의실 관리 상세 슬라이스 (F813/F815/F816/F814) (P7, FACILITY)

> 목표: 개별 회의실의 정보 수정·안내 이미지 관리·활성 토글·예약 현황을 다루는 상세 화면(P7). **M2 회의실 read 블록(F807/F808/F809)을 열람 영역으로 소비**하고, F815/F816 이미지 업로드/삭제로 확장한다. 근거: PRD §페이지별 상세(P7·다음 이동), F813·F815·F816·F814.
> 완료 정의: `FACILITY`가 회의실 정보 표시(F807, M2)·수정(F813, 부분 수정·변경값 없으면 서버 거부) + 안내 이미지 목록/미리보기/다운로드(F808, M2) + **업로드(F815, `PATCH` multipart part명 `file`, jpg/jpeg/png·10MB, `accept="image/jpeg,image/png"`)·삭제(F816)** + 활성 토글(F814, M6 재사용) + 예약 캘린더(F809, M2). 성공(`204`/`201`) → 해당 쿼리 invalidate + 토스트, 파일 위반(`FILE_001~005`) → 에러 토스트. 직접 URL `/meeting-rooms/management/:meetingRoomId`로 검증.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T7.1 | 회의실 관리 mutation: F813 정보 수정 zod(이름/설명/수용인원 부분 optional·양수) + update API/mutation(`PATCH /api/meeting-rooms/{id}`, `204`, 변경값 없으면 서버 거부, `MEETING_ROOM_UPDATE`) + **F815 이미지 업로드**(`PATCH .../files` multipart part명 `file`, `accept="image/jpeg,image/png"`·10MB 프론트 사전검증, `204`, board 파일 업로드 표준 소비) + **F816 이미지 삭제**(`DELETE .../files/{fileId}`, `204`) + mutation 훅(onSuccess 상세·파일 목록 invalidate) | F813·F815·F816, §참조 계약 매핑(`MEETING_ROOM_UPDATE`·`_FILE_UPLOAD`/`_DELETE`), Open Q#3(파일 정책 확정) | T1.1 | `features/meeting/{model,api}/` 수정 스키마+update+업로드+삭제 mutation 생성, `204` 처리, jpg/png·10MB 사전검증, 위반→throw(위임), 성공 시 상세·파일 invalidate | 5 | 6 | ☑ |
| T7.2 | P7 회의실 관리 상세 페이지 `MeetingRoomManagementDetailPage`: **M2 회의실 상세 read 블록(F807/F808/F809 · T2.4-b 컴포넌트) 소비** + 정보 `[수정]`(T7.1 F813) + 이미지 `[업로드]`/`[삭제]`(T7.1 F815/F816) + 활성 토글(T6.2 F814 재사용) | F813·F815·F816·F814(+F807~F809 소비), §페이지별 상세(P7·다음 이동) | T7.1, T2.4-b, T6.2 | `features/meeting/pages/MeetingRoomManagementDetailPage.tsx` 생성, 상세·이미지·예약 캘린더(M2) + 수정/업로드/삭제/토글 동작, 파일 위반→토스트, 404→not-found | 4 | 8 | ☐ |
| T7.2-a | (T7.2 분할 ①) 회의실 관리 상세 페이지 **뼈대**: M2 T2.4-b 산출물(`MeetingRoomInfoPanel`+`MeetingRoomImageGallery`+`MeetingRoomReservationCalendarBlock`, `meetingRoomId` props 독립 렌더) 재사용 + **M6 T6.2 독립 export 토글 훅**(`useMeetingRoomActivateMutation`/`useMeetingRoomDeactivateMutation`) 재사용 배선 — T7.2-b·T7.2-c가 삽입할 슬롯 제공 | F807~F809(M2 소비)·F814(M6 재사용), §페이지별 상세(P7) | T2.4-b, T6.2 | `features/meeting/pages/MeetingRoomManagementDetailPage.tsx` 뼈대 생성, T2.4-b 컴포넌트 3종 재사용 렌더, 활성/비활성 토글 동작(invalidate·토스트), 404→not-found | 5 | 4 | ☑ |
| T7.2-b | (T7.2 분할 ②) 정보 `[수정]` 다이얼로그(T7.1 F813 스키마+mutation) T7.2-a 슬롯에 배선, 변경값 없으면 서버 거부 안내 | F813, §참조 계약 매핑(`MEETING_ROOM_UPDATE`) | T7.2-a, T7.1 | 수정 다이얼로그 컴포넌트 생성, 이름/설명/수용인원 부분수정 입력, 성공→invalidate·토스트, 서버 위반(이름 중복 등)→토스트 | 5 | 4 | ☑ |
| T7.2-c | (T7.2 분할 ③, 리프) 이미지 `[업로드]`/`[삭제]`(T7.1 F815/F816) 배선 + T7.2-b 통합해 `MeetingRoomManagementDetailPage` 최종 완성 | F815·F816, §페이지별 상세(P7·다음 이동) | T7.2-b, T7.1 | 업로드(jpg/jpeg/png·10MB 사전검증)·삭제 동작, 파일 위반→토스트, 성공→파일목록 invalidate·토스트, 직접 URL `/meeting-rooms/management/:meetingRoomId` 검증 가능 | 4 | 4 | ☑ |

> **split 판단(실측 산정 완료)**: T7.1(F813 수정+F815 업로드+F816 삭제 mutation 묶음, UI 없음)을 실제 산정한 결과 **복잡도 6 — split 안 함**. 근거: 3개 기능ID + 파일 업로드(멀티파트) 포함이나 board 파일 업로드/삭제 표준(`uploadBoardFile.ts`/`useBoardFileUploadMutation.ts`/`useBoardFileDeleteMutation.ts`/`fileValidation.ts`, 실측 확인)을 패턴만 그대로 복제해 신규 설계 부담이 낮고 UI 조립이 없어 M4 T4.2(3기능ID mutation 묶음·UI없음·복잡도6)와 동일 프로파일 — SKILL.md 캡(≤6, 기능ID 1개 이하 조건)은 미적용 대상이지만 board 표준 복제가 파일 가중을 상쇄해 6에서 그친다. T7.2(read 블록 소비+수정+이미지 업로드/삭제+토글 조립)를 실제 산정한 결과 **복잡도 8 — split**. 근거: 4개 기능ID(F813/F815/F816/F814) 조립 + M2 read 블록(F807/F808/F809, T2.4-b 3종 컴포넌트) 소비까지 겹쳐 M4 T4.3(4기능ID 조립·복잡도8·3-way split)과 동일 프로파일. 분할 축은 의존성 순서: **T7.2-a**(read 블록 뼈대+토글, T2.4-b·T6.2 소비 — 후속 다이얼로그가 삽입될 슬롯 제공) → **T7.2-b**(정보수정 다이얼로그, T7.2-a·T7.1 소비) → **T7.2-c**(이미지 업로드/삭제+최종조립, T7.2-b·T7.1 소비, 리프) — T4.3-a/b/c(뼈대→수정다이얼로그→나머지액션+최종조립)와 동형 3단 분할.
> **중요도**: T7.1=5(T7.2 계열 단일 소비, 교차 마일스톤 참조 없음 — T2.1/T2.2/T2.3·T6.1과 동일 원칙). T7.2(부모)=4(리프 T7.2-c와 동일값) > T7.2-a=T7.2-b=5(체인 내 다음 단계 1곳만 소비) > T7.2-c=4(M7 리프 — M8은 전 페이지 공통 배선이라 특정 재사용 근거로 보지 않음, M1 T1.4/M3 T3.3-b/M5 T5.2/M6 T6.3-b와 동일 산정 원칙).
> **실행 순서**: T7.1(선행, T1.1 의존) 및 T7.2-a(T2.4-b·T6.2 의존)는 서로 독립이라 병렬 착수 가능 → T7.2-b(T7.2-a·T7.1 의존) → T7.2-c(T7.2-b·T7.1 의존, 리프). M7은 M2(T2.4-b)·M6(T6.2)에 의존(M6 토글 mutation 재사용·M2 read 블록 소비). Shrimp task-id: T7.1=`acc45870-5635-4597-b066-d4263522e559` / T7.2-a=`b8dfb09b-ce96-4942-90ea-0caea5fcb829` / T7.2-b=`727183fd-935d-449a-ba96-392f6ff631ee` / T7.2-c=`0d3dd4a5-eecc-49db-94f1-d8081aaf30ee`.

### M8 — 라우팅/사이드바 배선 통합 (react-router-developer 위임)

> 목표: M1~M7이 만든 7개 페이지를 라우트에 연결하고, 사이드바 "일정/회의" 그룹을 실 라우트로 승격/추가하는 **공유 파일 통합 태스크**. 근거: PRD §메뉴 구조, §페이지별 상세(각 라우트). 두 파일(`router.tsx`·`sidebarMenuItems.ts`)을 한 번에 편집해 병렬 편집 충돌을 회피한다(leave M6 선례).
> 완료 정의: 7개 라우트 등록 + 사이드바 3항목(placeholder 2 승격 + 회의 예약 관리 신규). 미인증→리디렉션, role별 노출/게이팅(예약 계열 EMPLOYEE·관리 계열 FACILITY, `ADMIN` 자동 포함), 각 페이지 진입·네비게이션이 관통.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T8.1 | **라우팅/사이드바 통합 배선**(react-router-developer 위임): (1) `router.tsx` `ProtectedRoute` 자식에 7라우트 추가 — `/meetings`(P1)·`/meetings/new`(P2)·`/meetings/:meetingId`(P3)·`/meeting-rooms/:meetingRoomId`(P4)·`/meetings/management`(P5)·`/meeting-rooms/management`(P6)·`/meeting-rooms/management/:meetingRoomId`(P7). **정적 세그먼트 랭킹 확인**: `/meetings/new`·`/meetings/management`가 `/meetings/:meetingId`보다, `/meeting-rooms/management`가 `/meeting-rooms/:meetingRoomId`보다 우선 매칭(RR7 정적>동적 랭킹). (2) `sidebarMenuItems.ts` "일정/회의" 그룹(123~131행): `회의실 예약` placeholder→`to:'/meetings'`(EMPLOYEE, `implemented` 제거) 승격 + `회의실 관리` placeholder→`to:'/meeting-rooms/management'`(FACILITY) 승격 + **`회의 예약 관리`**(`to:'/meetings/management'`, `minRole:'FACILITY'`) 신규 항목 추가. `일정 캘린더` placeholder는 **미터치**(범위 밖) | §메뉴 구조(3항목·`일정 캘린더` 미터치), §페이지별 상세(라우트) | T1.4, T2.4-b, T3.3-b, T4.3-c, T5.2, T6.3-b, T7.2-c | 7라우트 직접 URL 진입 동작, 정적/동적 세그먼트 오매핑 없음, 사이드바 3항목 role별 노출(EMPLOYEE 회의실 예약·FACILITY 회의 예약 관리·회의실 관리, `ADMIN` 계층 자동 포함), `일정 캘린더` 미터치 | 4 | 4 | ☑ |

> **split 판단(실측 산정 완료)**: T8.1(7라우트+사이드바 3항목 배선)을 실제 산정한 결과 **복잡도 4 — split 안 함**(로드맵 사전 판단과 일치). 근거: 신규 API 호출·zod·mutation·상태관리·비즈니스 로직 분기가 전혀 없는 순수 config 배선(2파일)이라 SKILL.md 캡(≤6, 기능ID 1개 이하 조건)이 자연히 적용된다. 동일 저장소 내 실측 선례 2건과 대조: `ROADMAP(DRAFT-BUSINESSTRIP)` M5 T5.3(라우트1+사이드바1, 로직분기 없음)=복잡도3, `ROADMAP(LEAVE)` M6 T6.1(라우트5+사이드바3+`DrafterActions.tsx` 로직분기 1개, 3파일)=복잡도4. T8.1은 라우트 수(7)가 LEAVE 선례보다 많으나 로직 분기가 없고 파일 수도 2개(LEAVE의 3개보다 적음)라 상쇄되어 LEAVE T6.1과 동일 수준(복잡도4)으로 산정. 정적>동적 세그먼트 랭킹(`/meetings/new`·`/meetings/management`→`:meetingId`, `/meeting-rooms/management`→`:meetingRoomId`)은 코드베이스 내 이미 4개 선례(`approval/drafts/new`·`business-trips/new`·`leaves/new`·`sales/new`가 전부 `:draftId`보다 먼저 등록)로 검증된 패턴이라 신규 설계 리스크 없음.
> **중요도**: T8.1=4 — 로드맵의 최종 리프 태스크로 후행 마일스톤이 없다. 이 로드맵 내 일관 원칙(후행 미참조 리프 태스크는 중요도4 — T1.4·T3.3-b·T5.2·T6.3-b·T7.2-c와 동일 근거)을 그대로 적용.
> **실행 순서**: M1~M7 전 페이지(T1.4·T2.4-b·T3.3-b·T4.3-c·T5.2·T6.3-b·T7.2-c) 완료 후 착수(리프, 웨이브 3). Shrimp task-id: T8.1=`6eb678b3-19e9-40c1-8a17-dbf55e40035b`.

## 🔀 병렬화 가능 지점

build-domain 5단계가 아래 그룹을 병렬 실행자에게 위임 판단할 수 있다.

- **마일스톤 축 분기**: M1 완료 후 (a) 예약 축 M2→M3→M4→M5, (b) 회의실 관리 축 M6, 이후 M7(M2·M6 의존)이 **부분 병렬** 가능. M6은 M1에만 의존해 예약 축과 즉시 병렬 착수 가능. M8은 전 페이지 완료 후 리프.
- **각 마일스톤 1티어(api/mutation, 상호 독립 → 병렬)**: `M1{T1.2·T1.3}` / `M2{T2.1·T2.2·T2.3}` / `M3{T3.1·T3.2}` / `M4{T4.1·T4.2}` / `M6{T6.1·T6.2}`. 서로 다른 파일이라 충돌 없음. `M5{T5.1}`·`M7{T7.1}`은 단일 진입.
- **병렬 웨이브 요약**:
  - **웨이브 0**(기반): T1.1(스캐폴딩+meetingKeys+기간 유틸) — 전 마일스톤 선행.
  - **웨이브 1**(api/mutation/래퍼, T1.1 후 동시): T1.2·T1.3 / T2.1·T2.2·T2.3 / T3.1·T3.2 / T4.1·T4.2 / T5.1 / T6.1·T6.2 / T7.1
  - **웨이브 2**(페이지 조립, 각 마일스톤 1티어 완료 후): T1.4 → T2.4 → (T3.3 · T6.3) → T4.3 → (T5.2 · T7.2)  *(화살표는 소비 의존: T2.4←T1.4 래퍼/read 블록, T3.3←T2.4, T4.3←T4.x, T5.2←T4.3, T7.2←T2.4·T6.2)*
  - **웨이브 3**(배선 리프): T8.1(라우팅/사이드바 통합)

## ⚠️ 리스크 & 선행 결정 (Open Questions)

- **[해소됨 · M1 T1.2] FullCalendar 플러그인 패키지 세트 — 확정(2026-07-10, 사용자 결정)**: **최소셋** `@fullcalendar/react` + `@fullcalendar/core`(peer) + `@fullcalendar/daygrid`(월간 뷰) + `@fullcalendar/interaction`(이벤트 클릭) 채택. `@fullcalendar/timegrid`는 도입하지 않는다 — F809 회의실 예약 캘린더의 점유 시간대도 daygrid 월간 뷰의 일자별 이벤트 목록 형태로 표시(시간대 세분화 없음).
- **[비블로킹 · M4 T4.3] F804 회의실 변경 필드 UI 형태**: `meetingRoomId` 필드 노출은 확정(PRD Open Q#2). 다만 EMPLOYEE가 접근 가능한 회의실 소스는 **F802 예약 가능 검색뿐**(F811 관리 목록은 FACILITY 전용, "전체 회의실 목록" EMPLOYEE 엔드포인트 부재)이므로 수정 다이얼로그의 회의실 변경은 **F802 검색(T3.1) 재사용**이 자연스럽다(변경할 날짜·시각으로 재검색). 단순 드롭다운은 소스 부재로 불가. 착수 시 UX(검색 인라인 vs 서브다이얼로그) 확정. **비블로킹**.
- **[비블로킹 · M8 T8.1] 라우트 경로 + 세그먼트 랭킹**: PRD §페이지별 상세 참고 라우트를 따른다(`/meetings`·`/meetings/new`·`/meetings/:meetingId`·`/meeting-rooms/:meetingRoomId`·`/meetings/management`·`/meeting-rooms/management`·`/meeting-rooms/management/:meetingRoomId`). 정적 `/meetings/new`·`/meetings/management`가 동적 `/meetings/:meetingId`보다, `/meeting-rooms/management`가 `/meeting-rooms/:meetingRoomId`보다 우선 매칭돼야 한다(RR7 정적>동적 자동 랭킹, react-router-developer가 M8에서 명시 확인). **비블로킹**.
- **[해소됨 · 참조만] 시각 포맷**: 필드 스펙 기준 **`HH:mm` 전송**, 응답 `HH:mm:ss`도 dayjs 파싱(PRD Open Q#5 확정). 캘린더 기간(`start`/`end`)은 `yyyy-MM-dd'T'HH:mm:ss`, 회의일/검색 날짜는 `yyyy-MM-dd`, 관리 월 필터는 `yyyy-MM`. 전부 dayjs 조립.
- **[해소됨 · 참조만] 파일 정책**: 회의실 첨부 **10MB·jpg/jpeg/png(gif 불가)**, `accept="image/jpeg,image/png"`(PRD Open Q#3 확정, 정책 원천 `@docs/backend-contract/file-upload.md`).
- **[해소됨 · 참조만] 참여자/예약자·capacity·FACILITY 범위**: 참여자 풀=전사 전체·예약자 별개(Open Q#1), capacity 수동 입력·참여자 수>capacity 시 경고만(Open Q#6), FACILITY 회의 예약 관리 조회 전용(Open Q#4) — PRD 확정, 로드맵 전제.

## 📦 백로그 (PRD 명시 제외 — 태스크화 금지)

PRD §"MVP 이후 기능 / 범위 외" 참조로만 나열(향후 별도 PRD 대상):

- **통합 일정 캘린더**(`SCHEDULE_CALENDAR`·`SCHEDULE_DETAIL`·`MANUAL_SCHEDULE_*`·`SCHEDULE_PARTICIPANTS_*`·`SCHEDULE_CANCEL`) — 수기/회의/출장/휴가 통합 뷰, 별개 크로스도메인 기능. 사이드바 `일정 캘린더` placeholder **미터치**.
- **회의실 변경 전용 API** — 존재하지 않음. 회의실 변경은 F804 `meetingRoomId` 부분 수정으로 처리(전용 엔드포인트 없음).
- **FACILITY의 회의 예약 강제 취소/수정** — 계약상 예약 수정/취소는 예약자 본인만. FACILITY는 관리 목록·상세 **조회 전용**(별도 관리자 취소 API 부재).
- **테마/다크모드·다국어(i18n)·브라우저 푸시 알림** — 전 도메인 공통 제외.

## ✅ 정합성 검증 체크리스트 (실행 결과)

- 🔍 **커버리지**: F800(T1.3/T1.4)·F801(T4.1/T4.3)·F802(T3.1/T3.3)·F803(T3.2/T3.3)·F804(T4.2/T4.3)·F805(T4.2/T4.3)·F806(T4.2/T4.3)·F807(T2.1/T2.4·T7.2 소비)·F808(T2.2/T2.4·T7.2 소비)·F809(T2.3/T2.4·T7.2 소비)·F810(T5.1/T5.2)·F811(T6.1/T6.3)·F812(T6.2/T6.3)·F813(T7.1/T7.2)·F814(T6.2/T6.3·T7.2)·F815(T7.1/T7.2)·F816(T7.1/T7.2) — 17개 전부 ≥1 태스크 매핑 ✅. 지원 자산(FullCalendar 래퍼=T1.2·`meetingKeys`=T1.1·`EmployeePicker`=T3.3/T4.3·`useMeQuery` empId=T3.3/T4.3·board 파일 표준=T2.2/T7.1·react-table 페이징=T5.2/T6.3)은 소비(신규 F 아님) ✅
- 🔍 **역참조**: 모든 태스크가 PRD F800~F816/§페이지별 상세/§참조 계약 매핑/§계약 실측 메모/§Open Questions에 근거 — 발명 태스크 없음 ✅
- 🔍 **의존성**: M1→M2→(M3→M4→M5)·M6→M7→M8 위상 정렬, 순환 없음. 아키텍처 배관·board 표준·EmployeePicker는 재구축 없이 소비 전제 ✅. M6·M7 상호 컴포넌트 import 없음(네비게이션 라우트 문자열) — 병렬 가능 명시 ✅
- 🔍 **여정 정합**: 태스크 순서가 PRD 사용자 여정(내 예약 캘린더 랜딩→예약 생성→상세→회의실 열람 // 회의 예약 관리·회의실 관리 독립 축)과 정합. **여정상 P2가 P4보다 먼저지만 P4(공유 read 블록·FullCalendar 2번째 소비·F802 전제)를 M2에서 선확립**하는 것은 아키텍처 의존성 우선 근거로 명시(board 페이징 선확립 동형) ✅
- 🔍 **범위**: PRD 제외 기능(통합 일정 캘린더·회의실 변경 전용 API·FACILITY 강제취소·테마/i18n/푸시)은 백로그로만, 태스크화 없음. `일정 캘린더` placeholder 미터치 ✅
- 🔍 **규약**: 계약/전역 규칙(reissue·페이징 `number+1`·403/`ROLE_003` 매핑·`withCredentials`·날짜 dayjs·파일 정책) 재서술 없음, 필드/DTO·body 구조 재설계 없음(스니펫·§참조 계약 매핑으로 위임), URL은 PRD 참고 라우트 + react-router-developer 위임, 견적 강제 없음 ✅

**결과: 6개 항목 전부 통과. 완성 배관·board 페이징/파일 표준·전자결재 `EmployeePicker`·franchise FACILITY 게이팅 소비 전제로 meeting 도메인(회의 예약 EMPLOYEE 7종 + 회의실 열람 3종 + 회의·회의실 관리 FACILITY 7종) F800~F816을 8개 마일스톤(M1 스캐폴딩+FullCalendar+내 예약 캘린더 · M2 회의실 열람 공유 블록 · M3 예약 생성 · M4 예약 상세/수정/교체/취소 · M5 회의 예약 관리 · M6 회의실 관리 목록 · M7 회의실 관리 상세 · M8 라우팅 통합)·22개 태스크로 전개 완료. FullCalendar(T1.2)는 M1에서 최초 설치·확립하고 F800·F809가 소비(첫 소비처 명시). 회의실 열람 블록(M2)은 P2 [상세보기]·P7이 공유 소비. 공유 파일 2종(router·sidebar)은 M8 단일 태스크로 통합해 병렬 충돌 회피. FullCalendar 플러그인 세트는 최소셋(daygrid)으로 확정(2026-07-10) — 블로킹 해소. 잔여 비블로킹 Open Q(F804 회의실 변경 UI, 라우트 랭킹)는 착수 시 확정 — 나머지는 PRD 확정 전제. F800~F816 착수 가능(중요도/복잡도/완료 여부는 task-planner가 채움).**
