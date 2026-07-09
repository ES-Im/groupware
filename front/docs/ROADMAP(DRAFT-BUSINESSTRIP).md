# 출장 기안(Business Trip Draft) 작성/수정/참여자/이력 Frontend 개발 ROADMAP

> 출처 PRD: `docs/prd/10.businesstrip-draft-prd.md` (groupware-prd-validator 검증 통과 · Major 교정 반영 — 출장 기안 판별은 슬롯-null 술어 `businessTrip != null`)
> 이 로드맵은 PRD를 **실행 순서·의존성·태스크**로 전개한 것이다. 기능/계약의 사실 원천은 PRD와 백엔드 계약 문서(`api-endpoint.md`의 `BUSINESS_TRIP_*` / `MY_·DEPT_BUSINESS_TRIP_REQUEST_HISTORY` + `back/build/generated-snippets/<기능ID>/`)이며, 여기서는 **무엇을 어떤 순서로 만들지**만 다룬다. 필드/DTO·body 구조는 재서술하지 않고 PRD §참조 계약 매핑을 가리킨다.

## 🗺️ 개요

**📅 최종 업데이트**: 2026-07-09
**📊 진행 상황**: 18/18 Tasks 완료 (100%) — M1~M5 전체 완료. 라우팅/사이드바 배선(T1.4·T2.4·T4.3·T5.3) react-router-developer 위임으로 일괄 완료(공유 파일 병목 회피)

- **전략**: walking-skeleton-first 세로 슬라이스. **①공통(`docs/ROADMAP(DRAFT).md` 28/28, `src/features/approval/**`)·②일반 기안(`docs/ROADMAP(DRAFT-COMMON).md` 8/8, `src/features/approval/**`)은 이미 완료**되어 재구현하지 않고 **소비**한다. ③출장 기안 관심사는 여정 진입 순서대로 **작성 슬라이스(F730, 즉시 착수) → 수정 슬라이스(F731, 상세 `[수정]` 배선) → 상세 본문+참여자 슬라이스(F732) → 내 이력(F733) → 부서 이력(F734)** 로 얇게 관통한다. 작성이 여정 진입점이라 M1 우선.
- **범위 경계**: ③이 소유하는 것은 **출장 기안 작성 페이지·수정 페이지·참여자 수정 다이얼로그·내/부서 출장 이력 페이지 + 그 api/mutation/query(6개 기능ID)·출장 폼 zod 스키마·출장 상세 본문(`BusinessTripDraftBody`)·상세 `[수정]` 출장 분기 배선·유형 판별 술어 `isBusinessTripDraft`·사이드바 출장 항목 3개**뿐이다. 상세·문서함 5종·상신/철회/취소·승인/반려/공람·첨부 뷰·`EmployeePicker`·`ApproverParam`·`approvalKeys`·`useDraftDetailQuery`·`BusinessTripSlot` 타입·첨부 업로드(F716)·`usePrimaryDeptId`·`CirculationAddDialog` 패턴은 **①/②/근태 소유(재구현 금지, 소비만)**. PRD §"MVP 이후 기능 / 범위 외"(타 유형 슬롯 전부·첨부 후처리·협조 결재자 UI·참여자 add/remove 세분 조작)는 로드맵 범위 밖(§백로그 참조, 태스크화 금지).
- **소비할 완료 자산(재구현 금지)**:
  - **①상세/셸**: `src/features/approval/pages/DraftDetailPage.tsx`, `components/detail/{DraftDetailHeader,DraftTypeBody,DrafterActions,AttachmentSection,...}.tsx`
  - **①기안자 액션 판정**: `lib/resolveDrafterActions.ts`(`canEdit` = 기안자 본인 + UNSUBMITTED, 이미 계산됨 — ③는 판정 로직 재작성 안 함, 노출 게이팅만 소비), `components/detail/DrafterActions.tsx`(`handleEdit` 67~73행 — 현재 `isGeneralDraft` 분기 + "준비 중" 폴백 토스트 → ③가 `isBusinessTripDraft` 분기 실배선)
  - **①슬롯-null 유형 판별 선례**: `components/detail/DraftTypeBody.tsx`(30~32행 `draft.businessTrip != null` → 현재 "출장 기안 본문 화면은 준비 중입니다" 폴백 렌더 → ③가 `BusinessTripDraftBody`로 교체), `lib/isGeneralDraft.ts`(슬롯-null 술어 동형 선례 — ③의 `isBusinessTripDraft`가 이 톤을 계승)
  - **①상세 타입(import·재정의 금지)**: `model/draftDetail.ts`의 `DraftDetailResponse.businessTrip: BusinessTripSlot{startAt,endAt,destination,purpose,participants:DraftEmployeeRef[]}`(53~59행, ①실측 확정) — 본문 렌더·수정 프리필·참여자 선반영·판별 소스, `DraftEmployeeRef{empId,empName}`
  - **①결재선/참여자 선택 UI**: `components/EmployeePicker.tsx`(제어형, props `selected`/`onChange`/`multiple`/`disabledEmpIds` — 선택 순서 유지, `EmployeePickerEmployee{empId,empName}`), `model/approverParam.ts`(`ApproverParam{approverId,role,order}` — 신규 타입 발명 금지) — **결재선·참여자 양쪽 공용**
  - **①쿼리/프리필/첨부**: `model/queryKeys.ts`(`approvalKeys.all`·`draftDetail(draftId)`), `api/useDraftDetailQuery.ts`(F701, 수정 프리필·본문·참여자 선반영 소스), `api/useDraftFileUploadMutation.ts`(F716, 첨부는 생성 후 상세 `AttachmentSection`에서 관리)
  - **①다이얼로그 선례**: `components/detail/CirculationAddDialog.tsx`(제어형 open/onOpenChange + `EmployeePicker` + 제출 중 닫기 무시 가드 + 성공 시 `approvalKeys` invalidate) — ③의 `BusinessTripParticipantsDialog`가 이 패턴을 복제하되 **add 아닌 전량 교체**(기존 참여자 선반영)로 변형
  - **②동형 복제 구조적 템플릿(이름만 치환)**: `model/generalDraftSchema.ts`→`businessTripDraftSchema.ts`, `api/createGeneralDraft.ts`(submit boolean 분기로 한 함수가 두 URL 호출)→`createBusinessTripDraft.ts`, `api/useGeneralDraftCreateMutation.ts`→`useBusinessTripDraftCreateMutation.ts`, `pages/GeneralDraftCreatePage.tsx`→`BusinessTripDraftCreatePage.tsx`, `lib/isGeneralDraft.ts`→`isBusinessTripDraft.ts`, `api/updateGeneralDraft.ts`→`updateBusinessTripDraft.ts`, `api/useGeneralDraftUpdateMutation.ts`→`useBusinessTripDraftUpdateMutation.ts`, `pages/GeneralDraftEditPage.tsx`→`BusinessTripDraftEditPage.tsx`
  - **근태 소비(부서 이력)**: `src/features/attendance/model/usePrimaryDeptId.ts`(strict, 폴백 없음 — `undefined`이면 게이팅), `src/features/attendance/pages/DeptAttendancePage.tsx`(부서 페이징·필터·`deptId` 게이팅 선례), `src/shared/components/PaginationControls.tsx`, `src/shared/lib/usePageState.ts`
  - **폼/에러 배관**: `src/shared/lib/form.ts`(`useZodForm`/`submitWithErrorMapping`), `shared/lib/apiError.ts`(`handleApiError`), `ProtectedRoute`, `LayoutShell`, `src/shared/components/sidebarMenuItems.ts`(①이 "전자결재" 그룹 추가 완료), `src/app/router.tsx`(`/approval/drafts/:draftId` 상세·`/approval/drafts/new`·`.../:draftId/edit` 라우트 존재)
  - 날짜 `dayjs` / 토스트 `sonner` / 폼 `react-hook-form + zod` / shadcn Input·Textarea·Button·Card·Label·Dialog·Table (CLAUDE.md §6 고정 스택 — 추가 라이브러리 도입 금지)
- **PRD에서 확정된 결정(로드맵 반영)**:
  - **유형 판별(슬롯 non-null)**: 출장 기안 = `draft.businessTrip != null`(`isBusinessTripDraft`). **`draftType` 문자열 비교 금지**(백엔드 `getClass().getSimpleName()`, 스니펫 값 outdated). ②의 `isGeneralDraft`(슬롯 전부 null)와 동형 축이며, T2.1이 소유·T2.3/T2.4가 소비.
  - **작성/수정 body 혼합 구조(⚠️ 평탄화 금지)**: 작성/수정은 `param{title,content,approvers?}` 객체와 최상위 형제 `startAt/endAt/destination/purpose/participantIds?`(작성)·`startAt?/endAt?/destination?/purpose?`(수정, participants 제외)가 **나란히** 붙는 혼합 구조다(②일반 기안의 평탄 `{title,content,approvers}`와 다름). 참여자 교체만 **최상위 bare 배열** `number[]`. 필드/구조 상세는 PRD §참조 계약 매핑 실측값에 위임.
  - **날짜 정밀도 이원화**: 작성/수정 요청 `startAt/endAt`은 **datetime**(`yyyy-MM-dd'T'HH:mm:ss`) — `datetime-local`(분 단위) 입력을 dayjs로 초 보정해 전송. `MY_BUSINESS_TRIP_REQUEST_HISTORY` 응답의 `startAt/endAt`은 **date-only**(`yyyy-MM-dd`) — 목록 표시용.
  - **이력 필터 계약 확정(Open Q#2 해소, `query-parameters.adoc` 실측)**: `approvalStatus`·`yearMonth`(+DEPT는 `keyword`·`page`·`size`) 전부 선택. `approvalStatus` 전송값은 응답 표시 문자열이 아니라 **enum 코드**(`UNSUBMITTED`/`WAITING`/`IN_PROGRESS`/`APPROVED`/`REJECTED`). `yearMonth`(`yyyy-MM`)는 **미입력 시 서버가 현재 월로 응답** → 두 이력 페이지 모두 월 선택기 기본값을 당월로 맞추고 "이번 달 이력만 표시됩니다" 안내(근태 `MY_ATTENDANCE_MONTHLY` 관례 동형).
  - **참여자 = 전량 교체**: F732 body는 최상위 `number[]`(필수, **빈 배열 불가**). add/remove 의미 부여 금지 — 다이얼로그가 기존 참여자를 선반영해 사용자가 전체 집합을 편집, 저장 시 현재 선택 전체 전송(선택 0명이면 저장 비활성).
  - **Open Q#1**: `[생성 후 상신]`은 결재선 최소 1명 클라 사전검증, `[임시저장으로 생성]`은 결재선 없이 허용. 최종 판정 서버(②`GeneralDraftCreatePage` 정책 복제).
- **완료 게이트(전 마일스톤 공통)**: `npm run check-all` 통과 + `npm run build` 성공(CLAUDE.md §9). 단 attendance flake로 `check-all`이 exit 1일 수 있어 **approval/출장 관련 신규 테스트만 통과 확인**한다. 도메인 슬라이스 구현 직후 test-author-runner로 유닛/컴포넌트 테스트 작성·실행.

## 🧩 의존성 개요

```
[①공통 완료 자산: DraftDetailPage·DrafterActions(handleEdit:67-73)·resolveDrafterActions(canEdit)·
 DraftTypeBody(businessTrip 폴백:30-32)·BusinessTripSlot(draftDetail.ts)·EmployeePicker·ApproverParam·
 approvalKeys·useDraftDetailQuery·useDraftFileUploadMutation·CirculationAddDialog(다이얼로그 패턴)·
 폼 배관·usePrimaryDeptId·PaginationControls/usePageState·LayoutShell·sidebarMenuItems·router]
[②일반 기안 완료: generalDraftSchema·createGeneralDraft(submit 분기)·GeneralDraft{Create,Edit}Page·
 isGeneralDraft·updateGeneralDraft — ③가 이름만 바꿔 동형 복제할 구조적 템플릿]   ← 소비만(재구현 금지)
  │
  ├→ M1 출장 기안 작성 슬라이스 (F730)              ← 즉시 착수(여정 진입점, 상세 배선과 무관)
  │     T1.1 작성 zod 스키마 ┐
  │     T1.2 작성 api+mutation ┴→ T1.3 작성 페이지 → T1.4 라우트 + 사이드바 "출장 기안 작성"
  │
  ├→ M2 출장 기안 수정 슬라이스 (F731) + 상세 [수정] 배선
  │     T2.1 isBusinessTripDraft(슬롯 non-null) ┐
  │     T2.2 수정 api+mutation                  ┴→ T2.3 수정 페이지 → T2.4 DrafterActions 분기 + 라우트
  │
  ├→ M3 출장 상세 본문 렌더 + 참여자 전량 교체 슬라이스 (F732)
  │     T3.1 BusinessTripDraftBody(폴백 교체) ─────────────────┐
  │     T3.2 참여자 api+mutation → T3.3 참여자 다이얼로그 ──────┴→ T3.4 본문에 [참여자 수정] 버튼+다이얼로그 배선
  │
  ├→ M4 내 출장 이력 슬라이스 (F733)
  │     T4.1 api+query → T4.2 페이지 → T4.3 라우트 + 사이드바 "내 출장 이력"
  │
  └→ M5 부서 출장 이력 슬라이스 (F734)
        T5.1 api+query → T5.2 페이지(usePrimaryDeptId·페이징) → T5.3 라우트 + 사이드바 "부서 출장 이력"
```

- **M1~M5는 서로 코드 하드 의존이 없다**(전부 ①/②/근태 자산만 소비) → 기술적으로 병렬 착수 가능. walking-skeleton 권고 순서는 **여정 순(M1→M5)**. 단 **소프트 의존**: M2 수정 폼(T2.3)·M3 본문(T3.1)은 M1의 `businessTripDraftSchema`(T1.1)의 출장 필드 정의를 재사용할 수 있어 T1.1 선행 권장(하드 의존 아님). **공유 파일 병목**: 라우트/사이드바 태스크(T1.4·T2.4·T4.3·T5.3)는 전부 `router.tsx`·`sidebarMenuItems.ts`를 건드리므로 react-router-developer 위임 시 조율 필요(§병렬화 참조).
- **각 마일스톤 내부**: 스키마/술어/api+mutation(1티어)은 상호 독립 → 병렬 가능. 페이지(2티어)가 이들을 조립, 라우트/배선(리프)이 마지막.
- **`isBusinessTripDraft`의 위치**: T2.1이 술어를 **소유**하고, T2.4(상세 `[수정]` navigate 분기)·T2.3(수정 페이지 진입 가드)이 **소비**한다. `BusinessTripDraftBody`(T3.1)는 `DraftTypeBody`가 이미 `businessTrip != null`로 분기하므로 술어 불필요(폴백 교체만).

## 🚩 마일스톤 & 태스크

> 표기: **라우팅/사이드바 배선**(`router.tsx`·`sidebarMenuItems.ts` 수정) 부분은 **react-router-developer 위임 대상**(①·② 동일 컨벤션). 나머지(데이터 계층·비라우팅 UI)는 직접 구현. 완료 여부: ☐ 미착수 / ☑ 완료.

### M1 — 출장 기안 작성 슬라이스 (F730)

> 목표: 사이드바 "전자결재 > 출장 기안 작성" → 제목·본문 + 출장 기간(`startAt`<`endAt`)·목적지·목적 입력 + 결재선(`EmployeePicker`) + (선택) 참여자(`EmployeePicker`) → `[임시저장으로 생성]`(UNSUBMITTED) 또는 `[생성 후 상신]`(WAITING) → 생성 기안 상세(①)로 이동하는 얇은 세로 슬라이스. 근거: PRD §사용자 여정, §페이지별 상세(출장 기안 작성 페이지), F730.
> 완료 정의: `EMPLOYEE`가 메뉴로 작성 페이지에 진입해 제목·본문·출장 필드 입력(zod 필수·`startAt<endAt` 검증)·결재선·(선택) 참여자 지정 후 두 버튼으로 생성. 둘 다 `201 {draftId}` → `/approval/drafts/{draftId}` 상세로 이동 + `approvalKeys.all` invalidate + 성공 토스트. `[생성 후 상신]`은 결재선 최소 1명 클라 사전검증(Open Q#1), `[임시저장으로 생성]`은 결재선 없이 허용. 첨부 UI 미포함(생성 후 상세에서 관리 — ②선례).
> 이 마일스톤은 ②의 `createGeneralDraft`/`useGeneralDraftCreateMutation`/`GeneralDraftCreatePage`를 동형 복제하되 **혼합 body 구조(`param{...}` + 최상위 형제 출장 필드)·참여자 picker·datetime 필드**를 추가한다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T1.1 | 작성 폼 zod 스키마 `businessTripDraftSchema`(title·content·destination·purpose 필수·공백 불가, `startAt`/`endAt` 필수 + `startAt`<`endAt` refine). `model/generalDraftSchema.ts` 동형 확장(결재선·참여자는 스키마 밖 `EmployeePicker` 로컬 선택 상태로 관리) | §페이지별 상세(zod 사전검증), §참조 계약 매핑(`BUSINESS_TRIP_DRAFT_CREATE` 필수 필드) | — | `features/approval/model/businessTripDraftSchema.ts`에 스키마·`BusinessTripDraftFormValues` 존재, 필수 필드 공백/`startAt≥endAt` 시 인라인 에러 | 7 | 3 | ☑ |
| T1.2 | 작성 api 함수 `createBusinessTripDraft`(submit boolean 분기: `POST /api/drafts/business-trips`(생성) vs `.../business-trips/submission`(생성+상신), **혼합 body** `param{title,content,approvers?}` + 최상위 `startAt/endAt/destination/purpose/participantIds?`, resp `201 {draftId}`) + mutation 훅 `useBusinessTripDraftCreateMutation`(onSuccess `invalidateQueries(approvalKeys.all)`). `api/createGeneralDraft.ts`·`useGeneralDraftCreateMutation.ts` 동형, `approvers` 항목·`ApproverParam` 재사용(신규 타입 금지), **body 평탄화 금지** | F730, §참조 계약 매핑(`BUSINESS_TRIP_DRAFT_CREATE`/`_CREATE_SUBMISSION`, 혼합 body) | — (T1.1과 병렬) | `features/approval/api/createBusinessTripDraft.ts`+`useBusinessTripDraftCreateMutation.ts` 생성, 두 엔드포인트 axios 소비, `201 {draftId}` 파싱, 신규 타입 `BusinessTripDraftPayload`(param 중첩), 실패→throw(호출부 `submitWithErrorMapping` 위임), 성공 시 `approvalKeys.all` invalidate | 8 | 4 | ☑ |
| T1.3 | 작성 페이지 `BusinessTripDraftCreatePage`: 제목(Input)·본문(Textarea)·출장 기간(`datetime-local`×2)·목적지·목적 RHF+zod(T1.1) + 결재선 `EmployeePicker`(①, 선택 순서→`order` 1-base·`role:'APPROVER'`→`ApproverParam[]`) + (선택) 참여자 `EmployeePicker`(①, `selected.map(e=>e.empId)`→`number[]`) + `[임시저장으로 생성]`(type=button)/`[생성 후 상신]`(type=submit) 2버튼. `[생성 후 상신]`은 결재선 0명 시 사전검증 차단(Open Q#1), `datetime-local`→dayjs 초 보정 후 혼합 body 조립, 생성 성공(T1.2)→`navigate('/approval/drafts/${draftId}')` + 토스트. `GeneralDraftCreatePage` 이식(첨부 UI 없음) | F730, §페이지별 상세(출장 기안 작성 페이지·다음 이동), Open Q#1 | T1.1, T1.2 | `features/approval/pages/BusinessTripDraftCreatePage.tsx` 생성, 필수 필드 미입력·`startAt≥endAt` 폼 에러, 결재선·참여자 지정/해제, 상신 버튼이 결재선 0명 차단, 두 경로 생성 성공→상세 이동·invalidate·토스트, 서버 에러→`handleApiError` 토스트 | 8 | 7 | ☑ |
| T1.4 | 라우트 승격 `/approval/drafts/business-trips/new` ProtectedRoute 자식 추가 + 사이드바 "전자결재" 그룹에 **"출장 기안 작성" 항목 1개**(`to:'/approval/drafts/business-trips/new'`, `minRole:'EMPLOYEE'`) 추가. **정적 `business-trips/new` 세그먼트가 동적 `:draftId`보다 먼저 매칭**(②`drafts/new` 컨벤션 동형, RR7 정적 우선 랭킹 + `DraftDetailPage` decimal 가드 이중 안전). **라우팅/사이드바 react-router-developer 위임** | §메뉴 구조("출장 기안 작성" 신규 진입점), §사용자 여정 | T1.3 | 미인증→로그인 리디렉션(기존 가드), `EMPLOYEE` 메뉴 클릭→작성 페이지, 직접 URL 진입 동작, `/approval/drafts/6` 상세는 여전히 상세로 매칭 | 6 | 3 | ☑ |

> **M1 split 판단(복잡도·중요도)**: T1.3(복잡도 7)만 임계값 도달 — `GeneralDraftCreatePage` 이식이나 **출장 필드(datetime×2·목적지·목적)·참여자 picker(두 번째 `EmployeePicker`)·혼합 body 조립·datetime 초 보정**이 ②보다 무겁다. **task-planner 판단으로 T1.3a(폼 필드/스키마 바인딩 + 두 `EmployeePicker`)·T1.3b(제출 핸들러 2버튼 + 상신 사전검증 + 혼합 body 조립·navigate) 분할 후보**. 나머지(T1.1·T1.2·T1.4 < 7)는 단일 유지.
> **실행 순서**: T1.1(중요도7)·T1.2(중요도8) 상호 독립 → 병렬 → T1.3(중요도8, T1.1·T1.2 의존) → T1.4(중요도6, T1.3 의존, M1 리프). 위상정렬 + 동순위 내 중요도 순.

### M2 — 출장 기안 수정 슬라이스 (F731) + 상세 `[수정]` 배선

> 목표: 임시저장함/내 출장 이력(①)→상세(①)에서 기안자 본인이 `[수정]`(`DrafterActions`, `canEdit`=기안자+UNSUBMITTED)을 눌러 **출장 기안일 때만** 수정 페이지로 진입 → 기존 값 프리필(제목·본문·결재선·출장 기간·목적지·목적, **참여자 제외**) 수정 → `[저장]`(`204`) → 상세 복귀하는 슬라이스. 근거: PRD §사용자 여정(수정), §페이지별 상세(출장 기안 수정 페이지·상세 `[수정]` 배선), F731.
> 완료 정의: 상세 `[수정]` 클릭 시 `isBusinessTripDraft(draft)`일 때만 수정 페이지로 `navigate`(②의 `isGeneralDraft` 분기는 유지, 타 유형은 폴백 토스트 유지). 수정 페이지가 `DRAFT_DETAIL`(F701, ①)로 title/content/approvers[]/`businessTrip.{startAt,endAt,destination,purpose}` 프리필(결재선은 `order` 순 정렬→`EmployeePicker` 초기 선택 복원), zod 검증 후 `[저장]`(`BUSINESS_TRIP_DRAFT_UPDATE`, `PATCH`, `204`)→`approvalKeys.draftDetail`/`all` invalidate + 상세 복귀 + 토스트. **참여자·첨부는 이 폼 범위 밖**(참여자=F732 다이얼로그, 첨부=①상세).
> 이 마일스톤이 **슬롯 non-null 술어(`isBusinessTripDraft`)를 소유(T2.1)하고, 상세 `[수정]` 라우팅(T2.4)·수정 진입 가드(T2.3)에 배선**한다. ②의 `updateGeneralDraft`/`GeneralDraftEditPage`를 동형 복제(혼합 body·출장 필드 추가).

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T2.1 | **출장 기안 판별 술어 `isBusinessTripDraft(draft)` 추출**(순수 함수): `draft.businessTrip != null`. `lib/isGeneralDraft.ts` 동형(슬롯-null 축), T2.4(상세 `[수정]` navigate)·T2.3(수정 진입 가드)이 공유. **`draftType` 문자열 비교 금지**(백엔드 `getClass().getSimpleName()`, 스니펫 값 outdated) | §계약 실측 메모(슬롯-null 규약), §상세 `[수정]` 배선 | — | `features/approval/lib/isBusinessTripDraft.ts` + `isBusinessTripDraft.test.ts`에 술어 존재, `businessTrip` non-null=true / null=false 단위 검증, `DraftTypeBody`(30~32행) 분기 규칙과 일치 | 8 | 2 | ☑ |
| T2.2 | 수정 api 함수 `updateBusinessTripDraft`(`PATCH /api/drafts/business-trips/{draftId}`, **혼합 body** `param?{title?,content?,approvers?}` + 최상위 `startAt?/endAt?/destination?/purpose?`, 전부 optional 부분 수정, `204` Empty, **`participantIds` 없음**) + mutation 훅 `useBusinessTripDraftUpdateMutation`(onSuccess `invalidateQueries(approvalKeys.draftDetail(draftId))` + `approvalKeys.all`). `api/updateGeneralDraft.ts`·`useGeneralDraftUpdateMutation.ts` 동형, **body 평탄화 금지** | F731, §참조 계약 매핑(`BUSINESS_TRIP_DRAFT_UPDATE`, 부분 수정 혼합 body) | — (T2.1과 병렬) | `features/approval/api/updateBusinessTripDraft.ts`+`useBusinessTripDraftUpdateMutation.ts` 생성, `204` 처리, 권한/상태 위반→throw(호출부 `handleApiError` 위임), 성공 시 상세·목록 invalidate | 7 | 4 | ☑ |
| T2.3 | 수정 페이지 `BusinessTripDraftEditPage`: `useDraftDetailQuery`(F701, ①)로 프리필(title/content + approvers[]를 `order` 순 정렬→`{empId,empName}`→`EmployeePicker` 복원 + `businessTrip.{startAt,endAt,destination,purpose}`→`datetime-local` 초기값). 진입 가드 = `isBusinessTripDraft`(T2.1) × UNSUBMITTED × 기안자(`resolveDrafterActions.canEdit` 소비, 최종 서버) + decimal 양의 정수 라우트 가드. `[저장]`(T2.2)→`204`→상세 복귀 + 토스트. **참여자는 이 화면에 없음**(상세 다이얼로그 안내). `GeneralDraftEditPage` 복제 | F731, §페이지별 상세(출장 기안 수정 페이지·다음 이동), §계약 실측 메모(프리필 소스) | T2.1, T2.2 | `features/approval/pages/BusinessTripDraftEditPage.tsx` 생성, `draftId`로 상세 프리필→제목/본문/결재선/기간/목적지/목적 초기값 복원, 비-출장·비-UNSUBMITTED·비-기안자 진입 시 권한 부족/처리 불가 UX, 저장 성공→상세 복귀·invalidate·토스트, 검증 실패→인라인 에러 | 8 | 7 | ☑ |
| T2.4 | 상세 `[수정]` 실배선: `DrafterActions.handleEdit`(67~73행)에 `isBusinessTripDraft(draft)`(T2.1) 분기 추가 → `navigate('/approval/drafts/business-trips/${draftId}/edit')`. 기존 `isGeneralDraft` 분기·타 유형(휴가/매출) 폴백 토스트 유지. + 라우트 승격 `/approval/drafts/business-trips/:draftId/edit` ProtectedRoute 자식 추가(정적 `business-trips` 하위 동적 `:draftId/edit`). **라우팅 react-router-developer 위임**, `DrafterActions` 수정은 ③ 직접 | §상세 `[수정]` 배선(출장 분기만 추가·기존 분기 유지), Open Q#5 | T2.1, T2.3 | 출장 기안 상세에서 `[수정]`→출장 수정 페이지 이동, 일반 기안은 여전히 일반 수정 페이지, 휴가/매출은 폴백 토스트, 직접 URL `.../business-trips/{id}/edit` 진입 동작 | 7 | 4 | ☑ |

> **M2 split 판단(복잡도·중요도)**: T2.3(복잡도 7)만 임계값 도달 — `GeneralDraftEditPage` 복제이나 **혼합 body 프리필(approvers[]→picker + businessTrip 슬롯→datetime 4필드) + 3중 진입 가드**로 M1 T1.3과 대칭. **task-planner 판단으로 T2.3a(프리필/폼 바인딩)·T2.3b(진입 가드 + 저장 핸들러) 분할 후보**. T2.1(단일 슬롯 non-null, 복잡도 2)·T2.2(PATCH 204, 복잡도 4)·T2.4(분기 1줄 추가 + 라우트, 복잡도 4)는 단일 유지.
> **실행 순서**: T2.1(중요도8)·T2.2(중요도7) 상호 독립 → 병렬 → T2.3(중요도8, T2.1·T2.2 의존) → T2.4(중요도7, T2.1·T2.3 의존, M2 리프). T2.1은 T2.3·T2.4 공유 술어라 M2 착수 즉시 확정.

### M3 — 출장 상세 본문 렌더 + 참여자 전량 교체 슬라이스 (F732)

> 목표: 기안서 상세(①)에서 출장 기안 본문(기간·목적지·목적·참여자)을 실제로 렌더하고, 기안자 본인(UNSUBMITTED)이 본문 내 `[참여자 수정]`으로 독립 다이얼로그를 열어 참여자를 **전량 교체**(기존 참여자 선반영, 빈 배열 불가)하는 슬라이스. 근거: PRD §페이지별 상세(기안서 상세 페이지 — 출장 본문·참여자·`[수정]` 배선), F732.
> 완료 정의: `DraftTypeBody`(30~32행)의 `businessTrip != null` "준비 중" 폴백을 `BusinessTripDraftBody`로 교체 — `businessTrip` 슬롯(`BusinessTripSlot` import)과 공통 `content`를 dayjs 포맷으로 렌더. 본문 내 `[참여자 수정]` 버튼(노출 = `resolveDrafterActions.canEdit` ①판정 소비 — Open Q#3)→`BusinessTripParticipantsDialog`(진입 시 `businessTrip.participants` 선반영, 저장 시 현재 선택 전체→`BUSINESS_TRIP_PARTICIPANTS_UPDATE` bare `number[]`, 선택 0명이면 저장 비활성, `204`)→성공 시 `approvalKeys.all` invalidate로 상세 갱신.
> 이 마일스톤은 ①의 `CirculationAddDialog` 패턴을 복제하되 **add가 아닌 전량 교체**(기존 선반영)로 변형한다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T3.1 | 출장 상세 본문 컴포넌트 `BusinessTripDraftBody`: `DraftTypeBody`(30~32행)의 `businessTrip != null` `TypeSlotFallback` 폴백을 실제 렌더로 교체. `businessTrip` 슬롯(`BusinessTripSlot` import — 기간 `startAt~endAt`·`destination`·`purpose`·`participants[]`)과 공통 `content`를 렌더, 기간/날짜는 dayjs 포맷. **신규 조회 없음**(F701 슬롯 소비) | §페이지별 상세(출장 본문 렌더 `BusinessTripDraftBody`), §참조 계약 매핑(`DRAFT_DETAIL` `BusinessTripSlot`) | — | `features/approval/components/detail/BusinessTripDraftBody.tsx` 생성 + `DraftTypeBody`가 출장 분기에서 이를 렌더, 출장 상세 진입 시 기간·목적지·목적·참여자·본문 표시(폴백 문구 사라짐) | 8 | 5 | ☑ |
| T3.2 | 참여자 교체 api 함수 `updateBusinessTripParticipants`(`PATCH /api/drafts/business-trips/{draftId}/participants`, **최상위 bare 배열** `number[]`(필수·빈 배열 불가·전량 교체), `204` Empty) + mutation 훅 `useBusinessTripParticipantsUpdateMutation`(onSuccess `invalidateQueries(approvalKeys.all)`). **body 객체 래핑 금지**(bare array) | F732, §참조 계약 매핑(`BUSINESS_TRIP_PARTICIPANTS_UPDATE`, 최상위 배열) | — (T3.1과 병렬) | `features/approval/api/updateBusinessTripParticipants.ts`+`useBusinessTripParticipantsUpdateMutation.ts` 생성, bare `number[]` 전송, `204` 처리, 실패→throw(`handleApiError` 위임), 성공 시 `approvalKeys.all` invalidate | 7 | 4 | ☑ |
| T3.3 | 참여자 수정 다이얼로그 `BusinessTripParticipantsDialog`: `CirculationAddDialog` 제어형 패턴 복제(open/onOpenChange, 제출 중 닫기 무시). **add 아닌 전량 교체** — 진입 시 `businessTrip.participants`를 `EmployeePicker` 초기 선택으로 **선반영**, `[저장]`은 현재 선택 전체를 `selected.map(e=>e.empId)`→T3.2 mutation 전송. **선택 0명이면 저장 비활성**(빈 배열 불가). 성공 시 닫기 + `approvalKeys.all` invalidate | F732, §페이지별 상세(참여자 수정 독립 다이얼로그), Open Q#3·#5 | T3.2 | `features/approval/components/detail/BusinessTripParticipantsDialog.tsx` 생성, 열면 기존 참여자 선반영, 선택 편집, 0명 시 저장 버튼 비활성, 저장 성공→다이얼로그 닫힘·상세 참여자 갱신 | 8 | 6 | ☑ |
| T3.4 | 본문 배선: `BusinessTripDraftBody`(T3.1)에 `[참여자 수정]` 버튼 + `BusinessTripParticipantsDialog`(T3.3) 마운트. 버튼 노출 = `resolveDrafterActions(draft, myEmpId).canEdit`(기안자 본인 + UNSUBMITTED, ①판정 소비 — 재작성 금지). `useMeQuery`로 `myEmpId` 도출(`DrafterActions` 동형) | §페이지별 상세(참여자 수정 노출 = `canEdit`), Open Q#3·#5 | T3.1, T3.3 | 출장 상세에서 기안자+UNSUBMITTED일 때만 `[참여자 수정]` 노출, 클릭→다이얼로그, 그 외에는 버튼 미노출 | 7 | 4 | ☑ |

> **M3 split 판단(복잡도·중요도)**: 전 태스크 복잡도 < 7 → **split 없음**. T3.3(복잡도 6)이 최대 — `CirculationAddDialog` 선례 복제 + 선반영 변형이라 임계값 미만. T3.1(본문 렌더 5)·T3.2(bare array PATCH 4)·T3.4(버튼+마운트 배선 4)는 낮음.
> **실행 순서**: T3.1(중요도8·본문)·T3.2(중요도7·api) 상호 독립 → 병렬 → T3.3(중요도8, T3.2 의존) → T3.4(중요도7, T3.1·T3.3 의존, M3 리프). T3.1은 F732와 독립적으로도 가치 있으므로(상세 본문) 우선 착수 가능.

### M4 — 내 출장 이력 슬라이스 (F733)

> 목표: 사이드바 "전자결재 > 내 출장 이력" → 본인 출장 기안 이력을 목록(페이징 없는 배열)으로 조회, (선택) `approvalStatus`·`yearMonth`(기본 당월) 필터, 행 클릭 → ①상세. 근거: PRD §페이지별 상세(내 출장 이력 페이지), F733.
> 완료 정의: `MY_BUSINESS_TRIP_REQUEST_HISTORY`(배열 응답·페이징 없음) 조회, 컬럼 기간(`startAt~endAt`, **`yyyy-MM-dd` date-only**)·목적지·목적·결재 상태(①`approvalStatusBadge` 재사용 가능), 상태/월 필터(`approvalStatus`=enum 코드 전송, `yearMonth` 미지정 시 서버가 당월 응답 → 필터 기본값 당월 + "이번 달 이력만 표시됩니다" 안내), 행 → `/approval/drafts/${draftId}` 상세.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T4.1 | 내 이력 api 함수 `getMyBusinessTripHistory`(`GET /api/business-trips/employees/me/request-history?approvalStatus&yearMonth`, **배열 응답·페이징 없음**, `approvalStatus`=enum 코드·`yearMonth`=`yyyy-MM` 둘 다 선택) + query 훅 `useMyBusinessTripHistoryQuery`(`approvalKeys` 파생 키, 필터 파라미터 반영). 응답 항목 타입 정의(`draftId`/`startAt`/`endAt`(date-only)/`destination`/`purpose`/`approvalStatus`) | F733, §참조 계약 매핑(`MY_BUSINESS_TRIP_REQUEST_HISTORY`, 배열·필터 실측) | — | `features/approval/api/getMyBusinessTripHistory.ts`+`useMyBusinessTripHistoryQuery.ts` 생성, 배열 응답 파싱, 필터 파라미터가 쿼리스트링에 반영, 실패→`handleApiError` 위임 | 8 | 4 | ☑ |
| T4.2 | 내 이력 페이지 `MyBusinessTripHistoryPage`: 목록 테이블(기간 date-only·목적지·목적·상태 배지) + 상태 필터(enum 코드) + 월 선택기(**기본값 당월** + 안내 문구) + 빈 상태 안내. 행 클릭 → `navigate('/approval/drafts/${draftId}')`. **페이지네이션 없음**(배열 응답) | F733, §페이지별 상세(내 출장 이력 페이지·다음 이동), §계약 실측 메모(yearMonth 당월 기본) | T4.1 | `features/approval/pages/MyBusinessTripHistoryPage.tsx` 생성, 당월 이력 기본 표시 + 안내, 상태/월 필터 변경 시 재조회, 행 클릭→상세, 빈 목록→빈 상태 | 8 | 6 | ☑ |
| T4.3 | 라우트 승격 `/approval/business-trips/me/history` ProtectedRoute 자식 추가 + 사이드바 "전자결재" 그룹에 **"내 출장 이력" 항목 1개**(`minRole:'EMPLOYEE'`). **라우팅/사이드바 react-router-developer 위임** | §메뉴 구조("내 출장 이력" 신규 진입점) | T4.2 | 미인증→리디렉션, `EMPLOYEE` 메뉴 클릭→내 이력 페이지, 직접 URL 진입 동작 | 6 | 3 | ☑ |

> **M4 split 판단**: 전 태스크 복잡도 < 7 → **split 없음**. T4.2(목록+필터+월선택기, 복잡도 6)가 최대이나 페이징 없는 단순 배열 렌더라 임계값 미만.
> **실행 순서**: T4.1(중요도8) → T4.2(중요도8, T4.1 의존) → T4.3(중요도6, 리프). 선형 슬라이스.

### M5 — 부서 출장 이력 슬라이스 (F734)

> 목표: 사이드바 "전자결재 > 부서 출장 이력"(minRole `DEPT_MANAGER`) → 소속 부서원 출장 이력을 표준 페이징 목록으로 조회, (선택) `keyword`·`approvalStatus`·`yearMonth`(기본 당월) 필터 + 페이지 이동, `{deptId}`=`usePrimaryDeptId()`, 행 클릭 → ①상세. 근거: PRD §페이지별 상세(부서 출장 이력 페이지), F734.
> 완료 정의: `DEPT_BUSINESS_TRIP_REQUEST_HISTORY`(`Page<T>` 표준 페이징) 조회, 컬럼 사원(`empNo`/`empName`)·기간(`historyResponse.startAt~endAt`)·목적지·목적·상태, 필터(`keyword` 디바운스·`approvalStatus` enum 코드·`yearMonth` 당월 기본, 필터 변경 시 `resetPage`) + `PaginationControls`/`usePageState`. `{deptId}`는 `usePrimaryDeptId()`(strict) 도출 — `undefined`이면 "부서 정보를 확인하는 중" 게이팅(근태 `DeptAttendancePage` 동형). 타 부서 접근 시 서버 403(`ROLE_003`) → `handleApiError` 토스트. 행 → `/approval/drafts/${historyResponse.draftId}` 상세.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T5.1 | 부서 이력 api 함수 `getDeptBusinessTripHistory`(`GET /api/business-trips/departments/{deptId}/request-history?keyword&approvalStatus&yearMonth&page&size`, **`Page<T>` 표준 페이징**, 전 쿼리 선택) + query 훅 `useDeptBusinessTripHistoryQuery`. 응답 `content[]` = 사원 식별(`empId`/`empNo`/`empName`) + `historyResponse{draftId,startAt,endAt,destination,purpose,approvalStatus}` + 표준 페이지 메타 타입 정의 | F734, §참조 계약 매핑(`DEPT_BUSINESS_TRIP_REQUEST_HISTORY`, `Page<T>`·필터 실측) | — | `features/approval/api/getDeptBusinessTripHistory.ts`+`useDeptBusinessTripHistoryQuery.ts` 생성, `Page<T>` 파싱, `deptId`/필터/page/size 파라미터 반영, `deptId` undefined 시 `enabled:false` 게이팅, 실패→`handleApiError` 위임 | 8 | 5 | ☑ |
| T5.2 | 부서 이력 페이지 `DeptBusinessTripHistoryPage`: `usePrimaryDeptId`(strict) 게이팅(undefined→"부서 정보 확인 중" 안내) + 목록 테이블(사원·기간·목적지·목적·상태) + 필터(`keyword` 디바운스·상태 enum·월 선택기 당월 기본, 변경 시 `resetPage`) + `PaginationControls`/`usePageState`(page/size) + 빈 상태·403 토스트. 행 클릭 → `navigate('/approval/drafts/${historyResponse.draftId}')`. `DeptAttendancePage` 컨벤션 복제 | F734, §페이지별 상세(부서 출장 이력 페이지·다음 이동·접근 권한), Open Q#4, §계약 실측 메모 | T5.1 | `features/approval/pages/DeptBusinessTripHistoryPage.tsx` 생성, `deptId` 미확정 시 게이팅, 당월 기본 + 필터·페이지 이동 재조회, 디바운스 검색·필터 변경 시 페이지 리셋, 타 부서 403→토스트, 행 클릭→상세, 빈 목록→빈 상태 | 8 | 7 | ☑ |
| T5.3 | 라우트 승격 `/approval/business-trips/dept/history` ProtectedRoute 자식 추가 + 사이드바 "전자결재" 그룹에 **"부서 출장 이력" 항목 1개**(`minRole:'DEPT_MANAGER'` — `hasRequiredRole` 자동 게이팅, `ADMIN` 자동 포함). 라우트는 `ProtectedRoute`만(근태 `/attendance/dept` 컨벤션, 별도 RoleGuard 없이 서버 403 최종 판단). **라우팅/사이드바 react-router-developer 위임** | §메뉴 구조("부서 출장 이력" `DEPT_MANAGER`), §페이지별 상세(접근 권한) | T5.2 | 비매니저에게 사이드바 미노출, `DEPT_MANAGER`/`ADMIN` 메뉴 클릭→부서 이력 페이지, 직접 URL 진입 동작 | 6 | 3 | ☑ |

> **M5 split 판단(복잡도·중요도)**: T5.2(복잡도 7)만 임계값 도달 — `DeptAttendancePage` 복제이나 **게이팅 + 다중 필터(keyword 디바운스·상태·월) + 페이징 + resetPage**로 무겁다. **task-planner 판단으로 T5.2a(게이팅 + 목록/컬럼)·T5.2b(필터/디바운스/페이징 배선) 분할 후보**. T5.1(`Page<T>` query 5)·T5.3(라우트+사이드바 3)은 단일 유지.
> **실행 순서**: T5.1(중요도8) → T5.2(중요도8, T5.1 의존) → T5.3(중요도6, 리프). 선형 슬라이스.

## 🔀 병렬화 가능 지점

build-domain 5단계가 아래 그룹을 병렬 실행자에게 위임 판단할 수 있다.

- **마일스톤 간(M1~M5)**: 서로 코드 하드 의존 없음(전부 ①/②/근태 자산만 소비) → **5개 마일스톤 병렬 착수 가능**. walking-skeleton 권고 순서는 여정 순(M1→M5)이나 병렬 실행을 막지 않는다. **소프트 의존**: M2 T2.3·M3 T3.1이 M1 T1.1(`businessTripDraftSchema`)의 출장 필드 정의를 재사용하려면 T1.1 선행 권장(하드 의존 아님 — 미선행 시 동일 shape 재정의 가능).
- **각 마일스톤 1티어(상호 독립 → 병렬)**: `M1{T1.1·T1.2}` / `M2{T2.1·T2.2}` / `M3{T3.1·T3.2}` / `M4 T4.1` / `M5 T5.1`. 서로 다른 파일(`model/`·`lib/`·`api/`·`components/detail/`)이라 충돌 없음.
- **병렬 웨이브 요약**:
  - **웨이브 1**(net-new, 동시 착수): T1.1·T1.2·T2.1·T2.2·T3.1·T3.2·T4.1·T5.1
  - **웨이브 2**(페이지·다이얼로그, 각 1티어 완료 후): T1.3·T2.3·T3.3·T4.2·T5.2
  - **웨이브 3**(배선·리프): T3.4 + 라우트 4종(T1.4·T2.4·T4.3·T5.3)
- **⚠️ 공유 파일 병목(라우트/사이드바)**: T1.4·T2.4·T4.3·T5.3은 전부 `src/app/router.tsx`·`src/shared/components/sidebarMenuItems.ts`를 수정한다. **react-router-developer 위임 시 4개 라우트(`business-trips/new`·`business-trips/:draftId/edit`·`business-trips/me/history`·`business-trips/dept/history`)와 3개 사이드바 항목을 한 번에 추가**하면 병합 충돌 없이 효율적(정적 `business-trips/new` vs 동적 `:draftId` 세그먼트 랭킹 함께 검토). 병렬로 쪼개면 같은 파일 동시 편집 충돌 위험.

## ⚠️ 리스크 & 선행 결정 (Open Questions — PRD §Open Questions 승계)

- **라우트 경로 명명 + 세그먼트 랭킹(신규 결정)**: `/approval/drafts/business-trips/new`는 정적 세그먼트가 상세 `/approval/drafts/:draftId`보다 먼저 매칭돼야 한다 — RR7은 정적을 동적보다 높게 랭크하고 `DraftDetailPage`가 `:draftId`를 decimal 양의 정수로만 가드하므로 오매핑되지 않으나(②`drafts/new` 동형), react-router-developer가 등록 순서·랭킹을 명시적으로 확인. 사이드바 그룹 구성은 PRD §메뉴 구조를 따른다.
- **[Open Q#1] 상신 시 결재선 필수 검증 위치(T1.3 착수 전)**: `BUSINESS_TRIP_DRAFT_CREATE_SUBMISSION`의 `param.approvers`는 optional로 문서화되나 도메인 규칙은 "상신=결재자 ≥1". 프론트 정책: `[생성 후 상신]`은 결재선 최소 1명 클라 사전검증(차단), `[임시저장으로 생성]`은 없이 허용. 최종은 서버(②`GeneralDraftCreatePage` 동일 정책 복제). 결재선은 `EmployeePicker` 로컬 선택 상태라 순수 zod 밖 — 상신 핸들러에서 `approverSelection.length` 가드.
- **[Open Q#3] 참여자 교체·수정의 상태 전제(T2.3·T3.3·T3.4)**: F731 수정·F732 참여자 교체는 계약상 "기안자(EMPLOYEE)"까지만 명시되고 UNSUBMITTED 제약은 스니펫에 없다. ②수정과의 일관성상 **두 액션 모두 `canEdit`(기안자 본인 + UNSUBMITTED)로 노출을 게이팅**하고 서버가 최종 판단(위반 시 400/403/도메인 에러 → `handleApiError` 토스트)하도록 가정. 상신 후 참여자 교체 허용 여부는 서버 반응으로 확정(비블로킹).
- **[Open Q#4] 부서 출장 이력의 `deptId` 도출과 ADMIN/복수 부서(T5.2)**: `usePrimaryDeptId`는 strict(폴백 없음)라 primary 소속이 없는 ADMIN·복수 부서 겸직 매니저는 `undefined`로 게이팅될 수 있다(근태 `DeptAttendancePage`와 동일 한계). 부서 선택 UI 도입 여부는 근태 도메인 Open Q와 함께 후속 확정(이번 범위 밖 — 게이팅 안내로 진행).
- **[Open Q#5] 참여자 수정 노출 지점(T3.3·T3.4)**: 기본안 = **상세 화면 독립 다이얼로그**(F732, `CirculationAddDialog` 패턴 복제, `BusinessTripDraftBody` 내 `[참여자 수정]` 버튼). 수정 페이지(F731)에 참여자를 함께 노출(편의상 수정+참여자 동시)할지는 **범위 밖**으로 두되 필요 시 후속 확정. 이번 로드맵은 다이얼로그 기본안으로 진행.
- **[해소·Open Q#2] 이력 필터 계약**: `query-parameters.adoc` 실측으로 확정(§개요·§계약 실측 메모 반영). 남은 실행 세부(월 선택기 UI 컴포넌트 선정 등)는 구현 시 결정 — 비블로킹.
- **혼합 body 평탄화 리스크(T1.2·T2.2)**: 작성/수정 body는 `param{...}` + 최상위 형제 출장 필드의 혼합 구조라 ②의 평탄 body를 그대로 복사하면 계약 위반. api 함수 구현 시 **`param` 중첩과 최상위 형제를 분리 조립**해야 하며, contract-conformance-reviewer로 body 구조 검증 권장.
- **완료 게이트 flake**: attendance 테스트 flake로 `check-all`이 exit 1일 수 있어 approval/출장 관련 신규 테스트만 통과 확인(②선례).

## 📦 백로그 (PRD 명시 제외 — 태스크화 금지)

PRD §"MVP 이후 기능 / 범위 외" 참조로만 나열(각 유형 작성 PRD 또는 ①공통 대상):

- **타 유형 슬롯 작성/수정 전부**: `GENERAL_DRAFT_*`(②일반, 완료)·`LEAVE_DRAFT_*`(④연가, `docs/prd/6.leave-prd.md`)·`SALES_DRAFT_*`(⑤매출) — 각 유형 작성 PRD 관할. ③은 출장만.
- **상세조회·문서함 5종·상신/철회/취소·승인/반려·공람·첨부 뷰·워크플로우 액션** — ①공통 소유(`docs/prd/7.approval-common-prd.md`, `docs/ROADMAP(DRAFT).md` 28/28).
- **첨부 후처리(미리보기/다운로드/삭제)** — 상세 페이지 첨부 영역(F717~F719) ①소유. ③의 작성 폼은 업로드 진입만(권고: 상세에서 관리).
- **결재선 협조 결재자(`COOPERATOR`) 역할 지정 UI** — MVP 범위 밖(APPROVER 고정, ②선례).
- **참여자 add/remove 세분 조작** — 계약이 전량 교체(bare array)뿐이라 부분 조작 의미 부여 금지.
- **부서 선택 UI(ADMIN·복수 부서 deptId 도출)** — 근태 도메인 Open Q와 함께 후속(Open Q#4).
- **테마/다크모드·다국어(i18n)·브라우저 푸시 알림** — 전 도메인 공통 제외.

## ✅ 정합성 검증 체크리스트 (실행 결과)

- 🔍 **커버리지**: F730(T1.1~T1.4)·F731(T2.2/T2.3 + 배선 T2.1/T2.4)·F732(T3.2/T3.3/T3.4)·F733(T4.1~T4.3)·F734(T5.1~T5.3) — PRD MVP 핵심 기능 5개 전부 ≥1 태스크 매핑 ✅. 지원 배선(`isBusinessTripDraft`=T2.1·`BusinessTripDraftBody`=T3.1·`DrafterActions` 분기=T2.4) 태스크화 ✅. 첨부 F716·`BusinessTripSlot`·`EmployeePicker`·`usePrimaryDeptId`는 소비(신규 F 아님) ✅
- 🔍 **역참조**: 모든 태스크가 PRD F730~F734/§페이지별 상세/§참조 계약 매핑/§계약 실측 메모/§Open Questions에 근거 — 발명 태스크 없음 ✅
- 🔍 **의존성**: M1(T1.1·T1.2→T1.3→T1.4)·M2(T2.1·T2.2→T2.3→T2.4)·M3(T3.1·T3.2→T3.3→T3.4)·M4(T4.1→T4.2→T4.3)·M5(T5.1→T5.2→T5.3) 위상 정렬, 순환 없음. ①/②/근태 자산은 재구현 없이 소비 전제 ✅
- 🔍 **여정 정합**: 태스크 순서가 PRD 사용자 여정(작성→상세[수정]·참여자→내 이력→부서 이력)과 일치. 작성이 진입점이라 M1 우선(walking-skeleton) ✅
- 🔍 **범위**: PRD 제외 기능(타 유형 슬롯·첨부 후처리·협조 결재자·참여자 add/remove·부서 선택 UI·테마/i18n/푸시)은 백로그로만, 태스크화 없음. ③은 출장 F730~F734 + 지원 배선만 ✅
- 🔍 **규약**: 계약/전역 규칙(reissue·페이징·403/`ROLE_003` 매핑·`withCredentials`·날짜 dayjs·파일 정책) 재서술 없음, 필드/DTO·body 구조 재설계 없음(스니펫·§참조 계약 매핑·기존 `ApproverParam`/`BusinessTripSlot`으로 위임), URL은 PRD 확정 라우트 + react-router-developer 위임, 견적 강제 없음 ✅

**결과: 6개 항목 전부 통과. ①공통·②일반 기안·근태 자산 소비 전제로 ③출장 기안 F730~F734 + 지원 배선을 5개 마일스톤(M1 작성·M2 수정+[수정]배선·M3 상세본문+참여자·M4 내 이력·M5 부서 이력)·18개 태스크로 전개 완료. 슬롯 non-null 술어 `isBusinessTripDraft`는 T2.1이 소유·T2.3/T2.4가 소비. Open Q#1(상신 결재선 사전검증)은 T1.3 착수 전 정책 확정, #3(상태 전제)·#4(deptId 도출)·#5(참여자 노출)는 비블로킹으로 격리 — F730~F734 착수 가능.**
