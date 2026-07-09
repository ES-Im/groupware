# 연가(Leave Draft) 작성/수정·본문·내 휴가/부서/관리자 조회 Frontend 개발 ROADMAP

> 출처 PRD: `docs/prd/11.leave-draft-prd.md` (groupware-prd-validator 검증 통과 · Major 교정 반영 — 휴가 기안 판별은 슬롯-null 술어 `leave != null`, `LeaveSlot` 하위필드는 백엔드 DTO 소스 대조로 확정)
> 이 로드맵은 PRD를 **실행 순서·의존성·태스크**로 전개한 것이다. 기능/계약의 사실 원천은 PRD와 백엔드 계약 문서(`api-endpoint.md`의 `LEAVE_DRAFT_*` / `MY_·DEPT_LEAVE_*` / `EMP_LEAVE_*` + `back/build/generated-snippets/<기능ID>/`)이며, 여기서는 **무엇을 어떤 순서로 만들지**만 다룬다. 필드/DTO·body 구조는 재서술하지 않고 PRD §참조 계약 매핑을 가리킨다.

## 🗺️ 개요

**📅 최종 업데이트**: 2026-07-09
**📊 진행 상황**: 16/16 Tasks 완료 (100%) — M1 ✅ / M2 ✅ / M3 ✅ / M4 ✅ / M5 ✅ / M6 ✅

- **전략**: walking-skeleton-first 세로 슬라이스. **①공통(`docs/ROADMAP(DRAFT).md`, `src/features/approval/**`)·②일반 기안(`docs/ROADMAP(DRAFT-COMMON).md`)·③출장 기안(`docs/ROADMAP(DRAFT-BUSINESSTRIP).md`) 은 이미 완료**되어 재구현하지 않고 **소비**한다. ④연가 관심사는 여정 순서대로 **작성 슬라이스(F740) → 상세 본문+수정 슬라이스(F741, `LeaveDraftBody`·`isLeaveDraft`·`LeaveSlot` 확정 포함) → 내 휴가(F742·F743) → 부서 휴가 관리(F744~F746) → 관리자 휴가 현황(F747~F750)** 으로 얇게 관통하고, 마지막에 라우팅/사이드바/`[수정]` 분기 배선을 **한 태스크로 통합**한다(공유 파일 병목 회피). PRD 사용자 여정 진입점은 "내 휴가 → [휴가 신청]"이나, 작성(F740)이 핵심 세로 슬라이스(폼→api→상세)라 M1 우선(작성 페이지는 직접 URL로도 단독 검증 가능 — ③선례). **M0(아키텍처 배관) 마일스톤 없음** — ①의 배관을 그대로 소비한다.
- **범위 경계**: ④가 소유하는 것은 **휴가 기안 작성 페이지·수정 페이지·내 휴가/부서/관리자 페이지 + 그 api/mutation/query(11개 기능ID)·휴가 폼 zod 스키마·휴가 상세 본문(`LeaveDraftBody`)·상세 `[수정]` 연가 분기 배선·유형 판별 술어 `isLeaveDraft`·`LeaveSlot` 구체 타입 확정·사이드바 "휴가 관리" 그룹 3항목**뿐이다. 상세·문서함 5종·상신/철회/취소·승인/반려/공람·첨부 뷰·**결재대기함**·`EmployeePicker`·`ApproverParam`·`approvalKeys`·`useDraftDetailQuery`·`useDraftFileUploadMutation`(F716)·`usePrimaryDeptId`·`PaginationControls`/`usePageState`는 **①/근태 소유(재구현 금지, 소비만)**. PRD §"MVP 이후 기능 / 범위 외"(타 유형 슬롯 전부·첨부 후처리·협조 결재자 UI·휴가↔근태 연동·잔여 초과 사전 차단·Recharts 시각화)는 로드맵 범위 밖(§백로그 참조, 태스크화 금지).
- **소비할 완료 자산(재구현 금지)**:
  - **①상세/셸**: `src/features/approval/pages/DraftDetailPage.tsx`, `components/detail/{DraftDetailHeader,DraftTypeBody,DrafterActions,ApproverActions,AttachmentSection,...}.tsx`
  - **①기안자 액션 판정**: `lib/resolveDrafterActions.ts`(`canEdit` = 기안자 본인 + UNSUBMITTED, 이미 계산됨 — ④는 판정 로직 재작성 안 함, 노출 게이팅만 소비), `components/detail/DrafterActions.tsx`(`handleEdit` 69~79행 — 현재 `isGeneralDraft`·`isBusinessTripDraft` 분기 + 휴가/매출 "준비 중" 폴백 토스트 → ④가 `isLeaveDraft` 분기 실배선)
  - **①슬롯-null 유형 판별 선례**: `components/detail/DraftTypeBody.tsx`(29~31행 `draft.leave != null` → 현재 `TypeSlotFallback typeName="휴가"` "준비 중" 폴백 렌더 → ④가 `LeaveDraftBody`로 교체), `lib/isGeneralDraft.ts`·`lib/isBusinessTripDraft.ts`(슬롯-null 술어 동형 선례 — ④의 `isLeaveDraft`가 이 톤을 계승, `businessTrip != null`과 정확히 대칭인 `leave != null`)
  - **①상세 타입**: `model/draftDetail.ts`의 `DraftDetailResponse.leave: LeaveSlot`(103행) — 현재 `LeaveSlot = Record<string, unknown>`(67행, ①이 미확정으로 남겨둠) → **④가 `{startAt,endAt,leaveType,reservedHours}` 구체 타입으로 좁힌다**(T2.1). 본문 렌더·수정 프리필·판별 소스. `DraftEmployeeRef{empId,empName}`·`DraftApprover`도 소비
  - **①결재선 선택 UI**: `components/EmployeePicker.tsx`(제어형, props `selected`/`onChange`/`multiple`/`disabledEmpIds` — 선택 순서 유지, `EmployeePickerEmployee{empId,empName}`), `model/approverParam.ts`(`ApproverParam{approverId,role,order}` — 신규 타입 발명 금지, 선택 순서→`order` 1-base·`role:'APPROVER'` 고정)
  - **①쿼리/프리필/첨부**: `model/queryKeys.ts`(`approvalKeys.all`·`draftDetail(draftId)` — 작성/수정 성공 후 invalidate 대상), `api/useDraftDetailQuery.ts`(F701, 수정 프리필·본문 렌더 소스), `api/useDraftFileUploadMutation.ts`(F716, 첨부는 생성 후 상세 `AttachmentSection`에서 관리)
  - **②③ 동형 복제 구조적 템플릿(이름만 치환)**: `model/generalDraftSchema.ts`·`model/businessTripDraftSchema.ts`→`leaveDraftSchema.ts`, `api/createBusinessTripDraft.ts`(**혼합 body**·submit boolean 분기로 한 함수가 두 URL 호출)→`createLeaveDraft.ts`, `api/useBusinessTripDraftCreateMutation.ts`→`useLeaveDraftCreateMutation.ts`, `pages/BusinessTripDraftCreatePage.tsx`→`LeaveDraftCreatePage.tsx`, `api/updateBusinessTripDraft.ts`→`updateLeaveDraft.ts`, `api/useBusinessTripDraftUpdateMutation.ts`→`useLeaveDraftUpdateMutation.ts`, `pages/BusinessTripDraftEditPage.tsx`→`LeaveDraftEditPage.tsx`, `components/detail/BusinessTripDraftBody.tsx`→`LeaveDraftBody.tsx`(단 참여자 다이얼로그 없음 — 연가 슬롯은 mutation 없는 read-only 본문)
  - **근태 소비(부서/관리자 목록)**: `src/features/attendance/model/usePrimaryDeptId.ts`(strict, 폴백 없음 — `undefined`이면 게이팅), `src/features/attendance/pages/DeptAttendancePage.tsx`(부서 페이징·필터·`deptId` 게이팅 선례), `src/shared/components/PaginationControls.tsx`, `src/shared/lib/usePageState.ts`
  - **폼/에러 배관**: `src/shared/lib/form.ts`(`useZodForm`/`submitWithErrorMapping`), `shared/lib/apiError.ts`(`handleApiError` — `ROLE_003` 권한부족 UX 포함), `ProtectedRoute`, `LayoutShell`, `src/shared/components/sidebarMenuItems.ts`("휴가 관리" 그룹 placeholder 2개 선언됨: `내 휴가 요약` EMPLOYEE / `부서 휴가 관리` DEPT_MANAGER, 128~135행), `src/app/router.tsx`
  - 날짜 `dayjs` / 토스트 `sonner` / 폼 `react-hook-form + zod` / shadcn Input·Textarea·Select·Button·Card·Label·Dialog·Table·Tabs·Badge (CLAUDE.md §6 고정 스택 — 추가 라이브러리 도입 금지)
- **PRD에서 확정된 결정(로드맵 반영)**:
  - **유형 판별(슬롯 non-null)**: 휴가 기안 = `draft.leave != null`(`isLeaveDraft`). **`draftType` 문자열 비교 금지**(백엔드 `getClass().getSimpleName()`, 스니펫 값 outdated). ③의 `isBusinessTripDraft`(`businessTrip != null`)와 동형 축이며, T2.1이 소유·T2.4(수정 진입 가드)·T6.1(상세 `[수정]` navigate)이 소비. `LeaveDraftBody`(T2.2)는 `DraftTypeBody`가 이미 `leave != null`로 분기하므로 술어 불필요(폴백 교체만).
  - **작성/수정 body 혼합 구조(⚠️ 평탄화 금지)**: 작성/수정은 `param{title,content,approvers?}` 객체와 최상위 형제 `startAt/endAt/leaveType`(작성)·`startAt?/endAt?/leaveType?`(수정)가 **나란히** 붙는 혼합 구조다(③출장의 `param{...}` + `startAt/endAt/destination/purpose/participantIds`와 동형 구조·필드만 다름, ②일반 기안의 평탄 `{title,content,approvers}`와 다름). 신규 타입 `LeaveDraftPayload`(`param` 중첩). 필드/구조 상세는 PRD §참조 계약 매핑 실측값에 위임.
  - **`LeaveType` enum 코드 vs 이력 표시명(⚠️ 혼동 주의)**: 작성 요청 body의 `leaveType`과 `leave` 슬롯(`DRAFT_DETAIL`)의 `leaveType`은 **enum 코드**(ANNUAL/HOURLY/SICK/OFFICIAL/COMPENSATORY/SPECIAL) 그대로 내려온다(`LeaveType.java` `@JsonValue` 없음, DTO 소스 대조 확정). 반면 `MY_/DEPT_LEAVE_REQUEST_HISTORY` 응답의 `leaveType`은 **서버 표시명 문자열**("연차"/"반차", 유형+일수 파생 라벨)이라 목록은 그대로 렌더(클라 매핑 불필요). → 작성 폼 Select·상세 본문은 enum→라벨 매핑 필요(T1.1 `leaveTypeLabels`), 이력 목록은 매핑 없이 표시명 렌더.
  - **`LeaveSlot` 구체 타입 확정**: `{ startAt, endAt, leaveType(enum 코드), reservedHours(number) }`. 백엔드 DTO(`DraftDetailResponse.LeaveDraftDetail`) 소스 대조로 확정(Open Q#4 해결). T2.1이 `model/draftDetail.ts`의 `Record<string, unknown>`을 이 타입으로 좁힌다.
  - **Open Q#1**: `[생성 후 상신]`은 결재선 최소 1명 클라 사전검증(차단), `[임시저장으로 생성]`은 결재선 없이 허용. 최종 판정 서버(②③`CreatePage` 동일 정책 복제). 결재선은 `EmployeePicker` 로컬 선택 상태라 순수 zod 밖 — 상신 핸들러에서 `approverSelection.length` 가드.
  - **`plusMinusDays` 소수 허용(⚠️ 정수 금지)**: 특별/포상 부여일수 조정(F749/F750)의 `plusMinusDays`는 **0.5일 단위 소수 허용**(반차 조정). RHF+zod 검증은 0이 아닌 숫자만 요구하고 **`.int()` 금지**(음수=차감).
  - **이력 필터 계약**: `approvalStatus`(전송값은 응답 표시 문자열이 아니라 **enum 코드** `UNSUBMITTED`/`WAITING`/`IN_PROGRESS`/`APPROVED`/`REJECTED`)·`yearMonth`(`yyyy-MM`, **미입력 시 서버가 현재 월로 응답** → 월 선택기 기본값 당월 + "이번 달 이력만 표시됩니다" 안내, 근태 관례 동형). 내 휴가 이력은 **배열 응답(비페이징)**, 부서/관리자 목록은 **`Page<T>` 표준 페이징(`number+1`)**.
- **완료 게이트(전 마일스톤 공통)**: `npm run check-all` 통과 + `npm run build` 성공(CLAUDE.md §9). 단 attendance flake로 `check-all`이 exit 1일 수 있어 **approval/leave 관련 신규 테스트만 통과 확인**한다. 도메인 슬라이스 구현 직후 test-author-runner로 유닛/컴포넌트 테스트 작성·실행.

## 🧩 의존성 개요

```
[①공통 완료 자산: DraftDetailPage·DrafterActions(handleEdit:69-79)·resolveDrafterActions(canEdit)·
 DraftTypeBody(leave 폴백:29-31)·draftDetail.ts(LeaveSlot:67·leave 슬롯:103)·EmployeePicker·ApproverParam·
 approvalKeys·useDraftDetailQuery·useDraftFileUploadMutation·폼 배관·ProtectedRoute·LayoutShell·
 sidebarMenuItems(휴가 관리 그룹 placeholder 2개)·router]
[②일반·③출장 기안 완료: businessTripDraftSchema·createBusinessTripDraft(혼합 body·submit 분기)·
 BusinessTripDraft{Create,Edit}Page·BusinessTripDraftBody·isBusinessTripDraft·updateBusinessTripDraft
   — ④가 이름만 바꿔 동형 복제할 구조적 템플릿]
[근태 소비: usePrimaryDeptId·DeptAttendancePage·PaginationControls·usePageState]   ← 소비만(재구현 금지)
  │
  ├→ M1 휴가 기안 작성 슬라이스 (F740)              ← 핵심 세로 슬라이스, 즉시 착수
  │     T1.1 작성 zod 스키마 + leaveTypeLabels ┐
  │     T1.2 작성 api+mutation(혼합 body) ──────┴→ T1.3 작성 페이지
  │
  ├→ M2 휴가 상세 본문 + 수정 슬라이스 (F741 + LeaveDraftBody + isLeaveDraft·LeaveSlot 확정)
  │     T2.1 isLeaveDraft 술어 + LeaveSlot 구체 타입 확정 ─┬→ T2.2 LeaveDraftBody(폴백 교체)
  │     T2.3 수정 api+mutation(혼합 body) ────────────────┴→ T2.4 수정 페이지(프리필)
  │
  ├→ M3 내 휴가 슬라이스 (F742 이력 + F743 잔여)
  │     T3.1 내 휴가 조회 api 2종 + leaveKeys 신설 → T3.2 내 휴가 페이지
  │
  ├→ M4 부서 휴가 관리 슬라이스 (F744·F745·F746)
  │     T4.1 부서 이력 api ┐
  │     T4.2 부서 요약+사용률 api ┴→ T4.3 부서 휴가 관리 페이지(Tabs)
  │
  ├→ M5 관리자 휴가 현황 슬라이스 (F747·F748·F749·F750)
  │     T5.1 전사 조회 api ┐
  │     T5.2 부여일수 조정 mutation 2종 ┴→ T5.3 관리자 휴가 현황 페이지(조정 다이얼로그)
  │
  └→ M6 라우팅/사이드바/[수정] 배선 통합 (M1~M5 페이지 의존, react-router-developer 위임)
        T6.1 router.tsx 5라우트 + sidebar 3항목 승격/추가 + DrafterActions isLeaveDraft 분기
```

- **M1~M5는 서로 코드 하드 의존이 없다**(전부 ①/②/③/근태 자산만 소비) → 기술적으로 병렬 착수 가능. walking-skeleton 권고 순서는 **여정 순(M1→M5)**. **소프트 의존**: M2 수정 페이지(T2.4)·M2 본문(T2.2)은 M1 T1.1의 `leaveDraftSchema` 휴가 필드 정의와 `leaveTypeLabels`를 재사용할 수 있어 T1.1 선행 권장(하드 의존 아님 — 미선행 시 동일 shape 재정의 가능).
- **공유 파일 병목(라우트/사이드바/`[수정]` 분기)**: `router.tsx`·`sidebarMenuItems.ts`·`DrafterActions.tsx`(handleEdit) 세 파일 수정은 **M6 단일 태스크로 몰아** react-router-developer에게 위임한다(③이 T1.4·T2.4·T4.3·T5.3을 일괄 위임한 패턴을 한 태스크로 응축 — 병렬 편집 충돌 회피). M6은 M1~M5 페이지가 존재해야 라우트를 연결할 수 있으므로 마지막.
- **각 마일스톤 내부**: 스키마/술어/타입/api(1티어)는 상호 독립 → 병렬 가능. 페이지(2티어)가 이들을 조립, 라우트/배선(M6 리프)이 마지막.

## 🚩 마일스톤 & 태스크

> 표기: **라우팅/사이드바/`[수정]` 분기 배선**(`router.tsx`·`sidebarMenuItems.ts`·`DrafterActions.tsx` 수정)은 각 마일스톤에서 하지 않고 **M6으로 통합**(react-router-developer 위임). 나머지(데이터 계층·비라우팅 UI·`DraftTypeBody`/`draftDetail.ts` 편집)는 직접 구현. 완료 여부: ☐ 미착수 / ☑ 완료.

### M1 — 휴가 기안 작성 슬라이스 (F740)

> 목표: 제목·본문 + 휴가 유형(`leaveType`)·시작/종료 일시(`startAt`<`endAt`) 입력 + 결재선(`EmployeePicker`) → `[임시저장으로 생성]`(UNSUBMITTED, `LEAVE_DRAFT_CREATE`) 또는 `[생성 후 상신]`(WAITING, `LEAVE_DRAFT_CREATE_SUBMISSION`) → 생성 기안 상세(①)로 이동하는 얇은 세로 슬라이스. 근거: PRD §사용자 여정(작성), §페이지별 상세(휴가 기안 작성 페이지), F740.
> 완료 정의: `EMPLOYEE`가 작성 페이지에 진입해 제목·본문·유형·기간 입력(zod 필수·`endAt≥startAt` refine·유형 6종 택1)·결재선 지정 후 두 버튼으로 생성. 둘 다 `201 {draftId}` → `/approval/drafts/{draftId}` 상세로 이동 + `approvalKeys.all` invalidate + 성공 토스트. `[생성 후 상신]`은 결재선 최소 1명 클라 사전검증(Open Q#1), `[임시저장으로 생성]`은 결재선 없이 허용. 첨부 UI 미포함(생성 후 상세에서 관리 — ②③선례·Open Q#5).
> 이 마일스톤은 ③의 `createBusinessTripDraft`/`BusinessTripDraftCreatePage`를 동형 복제하되 **출장 필드(목적지·목적·참여자)를 휴가 필드(`leaveType` Select)로 치환**한다(혼합 body·datetime 필드·2버튼·상신 사전검증은 동일).

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T1.1 | 작성 폼 zod 스키마 `leaveDraftSchema`(title·content 필수·공백 불가, `leaveType` enum 6종 필수, `startAt`/`endAt` 필수 + `endAt≥startAt` refine — 결재선은 스키마 밖 `EmployeePicker` 로컬 선택 상태) + **`leaveTypeLabels` 라벨/옵션 상수**(enum 코드↔표시 라벨, 작성 Select·상세 본문 공용, `HOURLY` 라벨 Open Q#3). `businessTripDraftSchema` 동형 확장 | §페이지별 상세(zod 사전검증), §계약 실측 메모(LeaveType 6종·enum↔표시명), Open Q#3 | — | `features/approval/model/leaveDraftSchema.ts`에 스키마·`LeaveDraftFormValues`·`leaveTypeLabels` 존재, 필수 공백/`endAt<startAt` 인라인 에러, 6종 라벨 매핑 | 7 | 3 | ☑ |
| T1.2 | 작성 api 함수 `createLeaveDraft`(submit boolean 분기: `POST /api/drafts/leaves`(생성) vs `.../leaves/submission`(생성+상신), **혼합 body** `param{title,content,approvers?}` + 최상위 `startAt/endAt/leaveType`, resp `201 {draftId}`) + mutation 훅 `useLeaveDraftCreateMutation`(onSuccess `invalidateQueries(approvalKeys.all)`). `createBusinessTripDraft`·`useBusinessTripDraftCreateMutation` 동형, `ApproverParam` 재사용(신규 타입 금지), 신규 타입 `LeaveDraftPayload`(param 중첩), **body 평탄화 금지** | F740, §참조 계약 매핑(`LEAVE_DRAFT_CREATE`/`_CREATE_SUBMISSION`, 혼합 body) | — (T1.1과 병렬) | `features/approval/api/createLeaveDraft.ts`+`useLeaveDraftCreateMutation.ts` 생성, 두 엔드포인트 axios 소비, `201 {draftId}` 파싱, 실패→throw(호출부 `submitWithErrorMapping` 위임), 성공 시 `approvalKeys.all` invalidate | 8 | 4 | ☑ |
| T1.3 | 작성 페이지 `LeaveDraftCreatePage`: 제목(Input)·본문(Textarea)·휴가 유형(Select, `leaveTypeLabels` 옵션)·시작/종료 일시(`datetime-local`×2) RHF+zod(T1.1) + 결재선 `EmployeePicker`(①, 선택 순서→`order` 1-base·`role:'APPROVER'`→`ApproverParam[]`) + `[임시저장으로 생성]`(type=button)/`[생성 후 상신]`(type=submit) 2버튼. `[생성 후 상신]`은 결재선 0명 시 사전검증 차단(Open Q#1), `datetime-local`→dayjs 초 보정(`yyyy-MM-dd'T'HH:mm:ss`) 후 혼합 body 조립, 생성 성공(T1.2)→`navigate('/approval/drafts/${draftId}')` + 토스트. `BusinessTripDraftCreatePage` 이식(참여자 picker 제거·목적지/목적→유형 Select) | F740, §페이지별 상세(휴가 기안 작성 페이지·다음 이동), Open Q#1 | T1.1, T1.2 | `features/approval/pages/LeaveDraftCreatePage.tsx` 생성, 필수 미입력·`endAt<startAt` 폼 에러, 유형 Select·결재선 지정/해제, 상신 버튼이 결재선 0명 차단, 두 경로 생성 성공→상세 이동·invalidate·토스트, 서버 에러→`handleApiError` 토스트 | 8 | 7 | ☑ |

> **M1 split 판단(복잡도·중요도)**: T1.3(복잡도 7)만 임계값 도달 — `BusinessTripDraftCreatePage` 이식이나 **유형 Select·datetime×2·혼합 body 조립·datetime 초 보정·상신 사전검증**이 겹친다. **task-planner 판단으로 T1.3a(폼 필드/스키마 바인딩 + `EmployeePicker`)·T1.3b(제출 핸들러 2버튼 + 상신 사전검증 + 혼합 body 조립·navigate) 분할 후보**. 나머지(T1.1·T1.2 < 7)는 단일 유지.
> **실행 순서**: T1.1(중요도7)·T1.2(중요도8) 상호 독립 → 병렬 → T1.3(중요도8, T1.1·T1.2 의존). 위상정렬 + 동순위 내 중요도 순.

### M2 — 휴가 상세 본문 렌더 + 수정 슬라이스 (F741 + `LeaveDraftBody` + `isLeaveDraft`·`LeaveSlot` 확정) ✅

> 목표: 기안서 상세(①)에서 휴가 기안 본문(유형·기간·`reservedHours`)을 실제로 렌더하고, 임시저장함/내 휴가 이력(①/M3)→상세→기안자 본인이 `[수정]`(`DrafterActions`, `canEdit`)을 눌러 **휴가 기안일 때만** 수정 페이지로 진입 → 기존 값 프리필(제목·본문·결재선·유형·기간) 수정 → `[저장]`(`204`) → 상세 복귀하는 슬라이스. 근거: PRD §사용자 여정(수정), §페이지별 상세(기안서 상세 페이지·휴가 기안 수정 페이지), F741.
> 완료 정의: (1) `DraftTypeBody`(29~31행)의 `leave != null` "준비 중" 폴백을 `LeaveDraftBody`로 교체 — `leave` 슬롯(`LeaveSlot` 구체 타입)과 공통 `content`를 dayjs 포맷으로 렌더(유형 enum→라벨·기간·`reservedHours` "n시간"). (2) 상세 `[수정]`(M6에서 배선) → `isLeaveDraft(draft)`일 때 수정 페이지로 `navigate`. (3) 수정 페이지가 `DRAFT_DETAIL`(F701, ①)로 title/content/approvers[]/`leave.{startAt,endAt,leaveType}` 프리필(결재선 `order` 순 정렬→`EmployeePicker` 복원), zod 검증 후 `[저장]`(`LEAVE_DRAFT_UPDATE`, `PATCH`, `204`)→`approvalKeys.draftDetail`/`all` invalidate + 상세 복귀 + 토스트. **첨부는 이 폼 범위 밖**(①상세). 상신/철회/취소·승인/반려는 ①소유(유형 무관 범용, ④ 조치 없음).
> 이 마일스톤이 **슬롯 non-null 술어(`isLeaveDraft`)와 `LeaveSlot` 구체 타입을 소유(T2.1)**하고, 상세 본문(T2.2)·수정 프리필(T2.4)이 이를 소비한다. ③의 `BusinessTripDraftBody`(참여자 다이얼로그 없이)·`updateBusinessTripDraft`/`BusinessTripDraftEditPage`를 동형 복제.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T2.1 | **휴가 기안 판별 술어 `isLeaveDraft(draft)` 추출**(순수 함수): `draft.leave != null`. `lib/isBusinessTripDraft.ts` 동형(슬롯-null 축), T2.4(수정 진입 가드)·T6.1(상세 `[수정]` navigate)이 공유. **`draftType` 문자열 비교 금지** + **`LeaveSlot` 구체 타입 확정**: `model/draftDetail.ts`(67행)의 `LeaveSlot = Record<string, unknown>`을 `{ startAt:string; endAt:string; leaveType:string; reservedHours:number }`로 좁힌다(DTO 소스 대조 확정, Open Q#4) | §계약 실측 메모(슬롯-null 규약·`LeaveSlot` 하위필드 확정 Open Q#4), §상세 `[수정]` 배선 | — | `features/approval/lib/isLeaveDraft.ts` + `isLeaveDraft.test.ts`에 술어 존재(`leave` non-null=true/null=false 단위 검증, `DraftTypeBody` 29~31행 분기와 일치), `draftDetail.ts` `LeaveSlot` 구체 타입으로 좁혀짐 | 8 | 3 | ☑ |
| T2.2 | 휴가 상세 본문 컴포넌트 `LeaveDraftBody`: `DraftTypeBody`(29~31행)의 `leave != null` `TypeSlotFallback` 폴백을 실제 렌더로 교체. `leave` 슬롯(`LeaveSlot`, T2.1 — 유형 `leaveType`(enum→`leaveTypeLabels` 라벨)·기간 `startAt~endAt`·`reservedHours`("n시간" 표기 Open Q#3))과 공통 `content`를 렌더, 기간/날짜는 dayjs(`formatDraftDateTime` 재사용). **신규 조회 없음**(F701 슬롯 소비). `BusinessTripDraftBody` 동형(참여자/`[참여자 수정]` 다이얼로그 없음 — 연가는 상세 본문 mutation 없음) | §페이지별 상세(휴가 본문 렌더 `LeaveDraftBody`), §참조 계약 매핑(`DRAFT_DETAIL` `LeaveSlot`), Open Q#3 | T2.1 | `features/approval/components/detail/LeaveDraftBody.tsx` 생성 + `DraftTypeBody`(29~31행)가 leave 분기에서 이를 렌더, 휴가 상세 진입 시 유형·기간·`reservedHours`·본문 표시(폴백 문구 사라짐) | 8 | 5 | ☑ |
| T2.3 | 수정 api 함수 `updateLeaveDraft`(`PATCH /api/drafts/leaves/{draftId}`, **혼합 body** `param?{title?,content?,approvers?}` + 최상위 `startAt?/endAt?/leaveType?`, 전부 optional 부분 수정, `204` Empty) + mutation 훅 `useLeaveDraftUpdateMutation`(onSuccess `invalidateQueries(approvalKeys.draftDetail(draftId))` + `approvalKeys.all`). `updateBusinessTripDraft`·`useBusinessTripDraftUpdateMutation` 동형, **body 평탄화 금지** | F741, §참조 계약 매핑(`LEAVE_DRAFT_UPDATE`, 부분 수정 혼합 body) | — (T2.1과 병렬) | `features/approval/api/updateLeaveDraft.ts`+`useLeaveDraftUpdateMutation.ts` 생성, `204` 처리, 권한/상태 위반→throw(호출부 `handleApiError` 위임), 성공 시 상세·목록 invalidate | 7 | 4 | ☑ |
| T2.4 | 수정 페이지 `LeaveDraftEditPage`: `useDraftDetailQuery`(F701, ①)로 프리필(title/content + approvers[]를 `order` 순 정렬→`{empId,empName}`→`EmployeePicker` 복원 + `leave.{startAt,endAt,leaveType}`→`datetime-local`/Select 초기값). 진입 가드 = `isLeaveDraft`(T2.1) × UNSUBMITTED × 기안자(`resolveDrafterActions.canEdit` 소비, 최종 서버) + decimal 양의 정수 라우트 가드. `[저장]`(T2.3)→`204`→상세 복귀 + 토스트. `BusinessTripDraftEditPage` 복제(목적지/목적→유형 Select·participants 없음) | F741, §페이지별 상세(휴가 기안 수정 페이지·다음 이동), §계약 실측 메모(프리필 소스) | T2.1, T2.3 (+ T1.1 soft) | `features/approval/pages/LeaveDraftEditPage.tsx` 생성, `draftId`로 상세 프리필→제목/본문/결재선/유형/기간 초기값 복원, 비-휴가·비-UNSUBMITTED·비-기안자 진입 시 권한 부족/처리 불가 UX, 저장 성공→상세 복귀·invalidate·토스트, 검증 실패→인라인 에러 | 8 | 7 | ☑ |

> **M2 split 판단(복잡도·중요도)**: T2.4(복잡도 7)만 임계값 도달 — `BusinessTripDraftEditPage` 복제이나 **혼합 body 프리필(approvers[]→picker + leave 슬롯→datetime/Select) + 3중 진입 가드**로 M1 T1.3과 대칭. **task-planner 판단으로 T2.4a(프리필/폼 바인딩)·T2.4b(진입 가드 + 저장 핸들러) 분할 후보**. T2.1(술어+타입 좁히기, 복잡도 3)·T2.2(본문 렌더, 복잡도 5)·T2.3(PATCH 204, 복잡도 4)은 단일 유지.
> **실행 순서**: T2.1(중요도8)·T2.3(중요도7) 상호 독립 → 병렬 → T2.2(중요도8, T2.1 의존)·T2.4(중요도8, T2.1·T2.3 의존) 병렬 → . T2.1은 T2.2·T2.4·T6.1 공유 술어/타입이라 M2 착수 즉시 확정.

### M3 — 내 휴가 슬라이스 (F742 신청 이력 + F743 잔여 요약)

> 목표: 사이드바 "휴가 관리 > 내 휴가" → 잔여 휴가 카드(연차/특별/포상 부여·사용·잔여) + 신청 이력 목록(유형 표시명·기간·신청일수·상태) + [휴가 신청] 진입점. 근거: PRD §사용자 여정(내 휴가·진입점), §페이지별 상세(내 휴가 페이지), F742·F743.
> 완료 정의: `MY_LEAVE_REQUEST_HISTORY`(**배열 응답·페이징 없음**, `approvalStatus`=enum 코드·`yearMonth`=`yyyy-MM` 당월 기본 필터) + `MY_EMP_LEAVE_SUMMARY`(`year` 기본 현재 연도, 잔여=부여−사용 **프론트 계산**) 조회. 이력 컬럼 유형(표시명 그대로)·기간(`yyyy-MM-dd`)·`requestedLeaveDays`(1.0/0.5)·상태 배지(①`approvalStatusBadge` 재사용 가능). [휴가 신청]→작성 페이지, 행 클릭→`/approval/drafts/${draftId}` 상세. 이 마일스톤이 휴가 조회 전용 스캐폴딩(`leaveKeys` queryKey 팩토리)을 최초 생성한다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T3.1 | 내 휴가 조회 api 2종 + query 훅 + **`leaveKeys` 신설**: `getMyLeaveHistory`(`GET /api/leaves/employees/me/request-history?approvalStatus&yearMonth`, **배열 응답**, 응답 항목 `{draftId,leaveType(표시명),startAt(yyyy-MM-dd),endAt,requestedLeaveDays,approvalStatus(표시명)}`) + `getMyLeaveSummary`(`GET /api/employees/me/leaves/summary?year`, 단일 객체 `{annualBaseGrantDays,annualUsedDays,specialGrantDays,specialUsedDays,compensatoryGrantDays,compensatoryUsedDays}`) + `useMyLeaveHistoryQuery`/`useMyLeaveSummaryQuery`. `leaveKeys`(board/attendance 동형 팩토리: `all`/`myHistory(params)`/`mySummary(year)` — 이후 부서/전사 축이 확장) | F742·F743, §참조 계약 매핑(`MY_LEAVE_REQUEST_HISTORY` 배열·`MY_EMP_LEAVE_SUMMARY`) | — | `features/leave/api/{getMyLeaveHistory,getMyLeaveSummary}.ts`+query 훅 + `features/leave/model/leaveKeys.ts` 생성, 이력은 배열(Page 아님) 파싱, 필터 파라미터 쿼리스트링 반영, 실패→`handleApiError` 위임 | 8 | 5 | ☑ |
| T3.2 | 내 휴가 페이지 `MyLeavePage`: 잔여 휴가 카드(연차/특별/포상 부여·사용·**잔여=부여−사용 프론트 계산**, `year` 선택 기본 올해) + 신청 이력 테이블(유형 표시명·기간·신청일수·상태 배지, `approvalStatus`(enum 코드)/`yearMonth`(당월 기본 + 안내 문구) 필터, **페이징 없음**) + [휴가 신청] 버튼(navigate 대상은 M6 라우트) + 빈 상태 안내. 행 클릭 → `navigate('/approval/drafts/${draftId}')` | F742·F743, §페이지별 상세(내 휴가 페이지·다음 이동), §계약 실측 메모(yearMonth 당월 기본·이력 leaveType 표시명) | T3.1 | `features/leave/pages/MyLeavePage.tsx` 생성, 잔여 카드(계산)·당월 이력 기본 + 안내, 연도/상태/월 필터 변경 시 재조회, 행 클릭→상세, [휴가 신청] 버튼 존재, 빈 목록→빈 상태 | 8 | 6 | ☑ |

> **M3 split 판단**: 전 태스크 복잡도 < 7 → **split 없음**. T3.2(잔여 카드+비페이징 이력+2필터, 복잡도 6)가 최대이나 페이징 없는 단순 조회라 임계값 미만. T3.1(2 엔드포인트 — 단 하나는 배열이라 **페이징 미매핑 주의** — + `leaveKeys` 신설, 복잡도 5)은 표준 패턴.
> **실행 순서**: T3.1(중요도8) → T3.2(중요도8, T3.1 의존). 선형 슬라이스. `leaveKeys`가 M4·M5 조회의 기반이라 M3 착수 즉시 확정.

### M4 — 부서 휴가 관리 슬라이스 (F744 신청 이력 + F745 부서원 요약 + F746 부서 사용률)

> 목표: 사이드바 "휴가 관리 > 부서 휴가 관리"(minRole `DEPT_MANAGER`) → 탭① 부서원 신청 이력(페이징) / 탭② 부서 연차 사용률 + 부서원 잔여 요약표(페이징)를 `{deptId}`=`usePrimaryDeptId()` 축으로 조회. 근거: PRD §사용자 여정(부서 휴가 관리), §페이지별 상세(부서 휴가 관리 페이지), F744·F745·F746.
> 완료 정의: 탭 전환·부서원 `keyword`·`approvalStatus`(enum 코드)·`yearMonth`(당월 기본)·`year` 필터·페이징(`number+1`) 동작, `{deptId}`=`usePrimaryDeptId()`(strict) — `undefined`이면 "부서 정보를 확인하는 중" 게이팅(근태 `DeptAttendancePage` 동형). 타 부서 접근 시 서버 403(`ROLE_003`) → `handleApiError` 토스트. 탭① 이력 행 클릭 → `/approval/drafts/${historyResponse.draftId}` 상세.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T4.1 | 부서 신청 이력 api 함수 `getDeptLeaveHistory`(`GET /api/leaves/departments/{deptId}/request-history?keyword&approvalStatus&yearMonth&page&size`, **`Page<T>` 표준 페이징**, 전 쿼리 선택, 응답 `content[]`=사원 식별(`empId`/`empNo`/`empName`) + `historyResponse{draftId,leaveType(표시명),startAt(yyyy-MM-dd),endAt,requestedLeaveDays,approvalStatus(표시명)}`) + query 훅 `useDeptLeaveHistoryQuery` + `leaveKeys` 부서 축 확장 | F744, §참조 계약 매핑(`DEPT_LEAVE_REQUEST_HISTORY`, `Page<T>`·필터 실측) | — | `features/leave/api/getDeptLeaveHistory.ts`+query 훅 생성, `Page<T>` 파싱, `deptId`/필터/page/size 반영, `deptId` undefined 시 `enabled:false`, 실패→`handleApiError` 위임 | 8 | 5 | ☑ |
| T4.2 | 부서원 요약 + 사용률 api 2종: `getDeptEmpLeaveSummary`(`GET /api/departments/{deptId}/employees/leaves/summary?keyword&year&page&size`, **`Page<T>`**, 응답 `content[]`=`empId`+사원+`leaveSummary{...}`) + `getDeptLeaveUsageSummary`(`GET /api/departments/{deptId}/employees/leaves/usage-summary?year`, 단일값 `{annualLeaveUsagePercent}`) + query 훅 | F745·F746, §참조 계약 매핑(`DEPT_EMP_LEAVE_SUMMARY` Page·`DEPT_EMP_LEAVE_USAGE_SUMMARY` 단일값) | — (T4.1과 병렬) | `features/leave/api/{getDeptEmpLeaveSummary,getDeptLeaveUsageSummary}.ts`+query 훅 생성, Page/단일값 파싱, `deptId` 게이팅, 실패→위임 | 7 | 5 | ☑ |
| T4.3 | 부서 휴가 관리 페이지 `DeptLeavePage`(shadcn Tabs): `usePrimaryDeptId`(strict) 게이팅(undefined→"부서 정보 확인 중") + 탭① 신청 이력(T4.1: `keyword` 디바운스·상태 enum·월 선택기 당월 기본, 변경 시 `resetPage` + `PaginationControls`/`usePageState`, 행 클릭→상세) + 탭② 부서 사용률 카드(T4.2 F746) + 부서원 요약표(T4.2 F745: `keyword`·`year` 필터 + 페이징) + 빈 상태·403 토스트. 탭①↔② 상태 독립. `DeptAttendancePage` 컨벤션 복제 | F744·F745·F746, §페이지별 상세(부서 휴가 관리 페이지·다음 이동·접근 권한) | T4.1, T4.2 | `features/leave/pages/DeptLeavePage.tsx` 생성, `deptId` 미확정 시 게이팅, 탭 전환, 당월 기본 + 필터·페이지 이동 재조회, 디바운스 검색·필터 변경 시 페이지 리셋, 타 부서 403→토스트, 행 클릭→상세, 빈 목록→빈 상태 | 8 | 7 | ☑ |

> **M4 split 판단(복잡도·중요도)**: T4.3(복잡도 7)만 임계값 도달 — **2개 탭 × 상이한 데이터(신청 이력 vs 사용률/요약) + 탭별 독립 필터·페이징 + 게이팅**으로 무겁다. **task-planner 판단으로 T4.3a(Tabs 셸 + 탭① 이력: 게이팅·검색/상태/월 필터·페이징·행클릭)·T4.3b(탭② 사용률 카드 + 부서원 요약표·year·페이징) 분할 후보**. T4.1(`Page<T>` query 5)·T4.2(Page+단일값 query 5)은 단일 유지.
> **실행 순서**: T4.1(중요도8)·T4.2(중요도7) 상호 독립(서로 다른 엔드포인트/탭) → 병렬 → T4.3(중요도8, T4.1·T4.2 의존). 위상정렬 + 동순위 내 중요도 순.

### M5 — 관리자 휴가 현황 슬라이스 (F747 전사 요약 + F748 사용률 + F749 특별 조정 + F750 포상 조정)

> 목표: 사이드바 "휴가 관리 > 관리자 휴가 현황"(minRole `ADMIN`) → 회사/부서 연차 사용률 + 전사 사원 휴가 요약표(페이징) 조회, 요약 행에서 특별/포상 부여일수 조정 다이얼로그. 근거: PRD §사용자 여정(관리자 휴가 현황), §페이지별 상세(관리자 휴가 현황 페이지), F747·F748·F749·F750.
> 완료 정의: `keyword`·`deptId`(선택, `DEPTS` 드롭다운)·`year` 필터·페이징(`number+1`)으로 요약(F747)·사용률(F748) 조회. 요약 행 [특별/포상 휴가 조정] → `plusMinusDays`(**0.5일 단위 소수 허용·정수 금지·음수=차감**) 입력·제출(`204`) → 요약(F747)·사용률(F748) invalidate + 토스트. 조정 대상 `empId`는 요약 응답 행에서 직접 사용(별도 사원 검색 불필요 — 백엔드 `empId` 보강 실측 확인). ADMIN 단일 게이트(서버 최종 판단 없음).

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T5.1 | 전사 조회 api 2종 + query 훅 + `leaveKeys` 전사 축: `getEmpLeaveSummary`(`GET /api/employees/leaves/summary?keyword&deptId&year&page&size`, **`Page<T>`**, 응답 `content[]`=`empId`+사원+`leaveSummary{...}`) + `getEmpLeaveUsageSummary`(`GET /api/employees/leaves/usage-summary?deptId&year`, 단일값 `{annualLeaveUsagePercent}`). 부서 필터 후보 목록은 기존 `DEPTS` 조회 재사용(`EmployeePicker` 내부 사용 훅, 신규 발명 금지 — Open Q) | F747·F748, §참조 계약 매핑(`EMP_LEAVE_SUMMARY` Page·`EMP_LEAVE_USAGE_SUMMARY` 단일값) | — | `features/leave/api/{getEmpLeaveSummary,getEmpLeaveUsageSummary}.ts`+query 훅 생성, Page/단일값 파싱, `keyword`/`deptId`/`year`/page/size 반영, 실패→위임 | 8 | 5 | ☑ |
| T5.2 | 부여일수 조정 mutation 2종: `adjustSpecialGrantDays`(`PATCH /api/employees/{empId}/leaves/special-grant-days?plusMinusDays`, body 없음, `204`) + `adjustCompensatoryGrantDays`(`PATCH /api/employees/{empId}/leaves/compensatory-grant-days?plusMinusDays`, `204`) + mutation 훅(onSuccess `invalidateQueries`(요약·사용률 축)). `plusMinusDays`는 **query param·음수 허용·0.5 소수 허용** | F749·F750, §참조 계약 매핑(`EMP_LEAVE_ADJUST_SPECIAL_GRANT_DAYS`/`_COMPENSATORY_GRANT_DAYS`, query plusMinusDays) | — (T5.1과 병렬) | `features/leave/api/{adjustSpecialGrantDays,adjustCompensatoryGrantDays}.ts`+mutation 훅 생성, `plusMinusDays` 쿼리 전송, `204` 처리, 서버 규칙 위반→throw(`handleApiError` 위임), 성공 시 요약·사용률 invalidate | 7 | 4 | ☑ |
| T5.3 | 관리자 휴가 현황 페이지 `AdminLeavePage`: 연차 사용률 카드(T5.1 F748, 회사 전체/부서) + 전사 사원 휴가 요약표(T5.1 F747: `keyword` 디바운스·`deptId`(DEPTS Select)·`year` 필터 + `PaginationControls`/`usePageState`) + 부여일수 조정 다이얼로그(shadcn Dialog + RHF+zod: 요약 행 [특별/포상 조정]→`empId`(행 응답값)+`plusMinusDays` 입력, **0이 아닌 숫자·0.5 단위 소수 검증·`.int()` 금지**→T5.2 mutation) + 빈 상태 안내 | F747·F748·F749·F750, §페이지별 상세(관리자 휴가 현황 페이지·다음 이동), §계약 실측 메모(empId 보강·plusMinusDays 소수) | T5.1, T5.2 | `features/leave/pages/AdminLeavePage.tsx` 생성, 사용률 카드+요약 표+필터+페이징 렌더, 행에서 조정 다이얼로그 오픈, 소수/부호 검증(정수 강제 없음), 성공→요약·사용률 갱신+토스트, 서버 규칙 위반→에러 토스트 | 8 | 7 | ☑ |

> **M5 split 판단(복잡도·중요도)**: T5.3(복잡도 7)만 임계값 도달 — **요약 표(필터·페이징) + 사용률 카드 + 조정 다이얼로그(특별/포상 2종·소수 검증)**가 한 페이지에 겹친다. **task-planner 판단으로 T5.3a(사용률 카드 + 요약 표·필터·페이징)·T5.3b(부여일수 조정 다이얼로그·RHF/zod 소수 검증·mutation 배선) 분할 후보**. T5.1(Page+단일값 query 5)·T5.2(query-param mutation 2종 4)은 단일 유지.
> **실행 순서**: T5.1(중요도8)·T5.2(중요도7) 상호 독립(조회 vs 조정) → 병렬 → T5.3(중요도8, T5.1·T5.2 의존). 위상정렬 + 동순위 내 중요도 순.

### M6 — 라우팅/사이드바/`[수정]` 배선 통합 (react-router-developer 위임)

> 목표: M1~M5가 만든 5개 페이지를 라우트에 연결하고, 사이드바 "휴가 관리" 그룹을 실 라우트로 승격/추가하며, 상세 `[수정]`에 연가 분기를 배선하는 **공유 파일 통합 태스크**. 근거: PRD §메뉴 구조, §페이지별 상세(각 라우트), §상세 `[수정]` 배선. 세 파일(`router.tsx`·`sidebarMenuItems.ts`·`DrafterActions.tsx`)을 한 번에 편집해 병렬 편집 충돌을 회피한다(③이 T1.4·T2.4·T4.3·T5.3으로 흩어 위임한 것을 ④는 한 태스크로 응축).
> 완료 정의: 5개 라우트 등록(정적 `leaves/new`·`leaves/:draftId/edit`가 리터럴 `leaves` 세그먼트로 상세 `:draftId`와 랭킹 충돌 없음 — ③`business-trips/*` 동형) + 사이드바 3항목(placeholder 2개 승격 + 관리자 1개 추가) + `DrafterActions.handleEdit`에 `isLeaveDraft` 분기 추가. 미인증→리디렉션, role별 노출/게이팅, 상세 `[수정]`→휴가 수정 페이지 이동이 관통.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T6.1 | **라우팅/사이드바/`[수정]` 통합 배선** (react-router-developer 위임): (1) `router.tsx` `ProtectedRoute` 자식에 5라우트 추가 — `/approval/drafts/leaves/new`(작성·정적 우선)·`/approval/drafts/leaves/:draftId/edit`(수정)·`/leaves/me`(내 휴가)·`/leaves/dept`(부서)·`/leaves/admin`(관리자). (2) `sidebarMenuItems.ts` "휴가 관리" 그룹(128~135행): `내 휴가 요약` placeholder→**"내 휴가"**(`to:'/leaves/me'`, EMPLOYEE, `implemented` 제거) 승격·라벨 조정 + `부서 휴가 관리` placeholder→(`to:'/leaves/dept'`, DEPT_MANAGER) 승격 + **"관리자 휴가 현황"**(`to:'/leaves/admin'`, `minRole:'ADMIN'`) 신규 슬롯 추가. **결재대기함은 이미 "전자결재" 그룹(89~94행)에 있으므로 추가 금지**. (3) `DrafterActions.handleEdit`(69~79행)에 `isLeaveDraft(draft)`(T2.1) 분기 추가 → `navigate('/approval/drafts/leaves/${draftId}/edit')`(기존 일반/출장 분기·매출 폴백 토스트 유지) | §메뉴 구조("휴가 관리" 3항목·결재대기함 제외), §페이지별 상세(라우트), §상세 `[수정]` 배선 | T1.3, T2.1, T2.4, T3.2, T4.3, T5.3 | 5라우트 직접 URL 진입 동작, `leaves/new`·`leaves/:draftId/edit`가 상세 `:draftId`로 오매핑 안 됨, 사이드바 3항목 role별 노출(EMPLOYEE 내 휴가·DEPT_MANAGER 부서·ADMIN 관리자, `ADMIN` 계층 자동 포함), 휴가 상세 `[수정]`→휴가 수정 페이지·일반/출장은 각 수정 페이지·매출은 폴백 토스트 | 7 | 4 | ☑ |

> **M6 split 판단**: 복잡도 4 < 7 → **split 없음**. 세 파일 편집이나 각각 ①②③ 동일 컨벤션 복제라 낮음. react-router-developer가 라우트 등록 순서·정적/동적 랭킹을 명시 확인.
> **실행 순서**: 단일 태스크. M1~M5 전 페이지 + T2.1(`isLeaveDraft`) 완료 후 착수(리프).

## 🔀 병렬화 가능 지점

build-domain 5단계가 아래 그룹을 병렬 실행자에게 위임 판단할 수 있다.

- **마일스톤 간(M1~M5)**: 서로 코드 하드 의존 없음(전부 ①/②/③/근태 자산만 소비) → **5개 마일스톤 병렬 착수 가능**. walking-skeleton 권고 순서는 여정 순(M1→M5)이나 병렬 실행을 막지 않는다. **소프트 의존**: M2 T2.2·T2.4가 M1 T1.1(`leaveDraftSchema`·`leaveTypeLabels`)를 재사용하려면 T1.1 선행 권장(하드 의존 아님 — 미선행 시 동일 shape 재정의 가능).
- **각 마일스톤 1티어(상호 독립 → 병렬)**: `M1{T1.1·T1.2}` / `M2{T2.1·T2.3}` / `M4{T4.1·T4.2}` / `M5{T5.1·T5.2}`. 서로 다른 파일(`model/`·`lib/`·`api/`·`components/detail/`)이라 충돌 없음. `M3{T3.1}`은 단일 진입.
- **병렬 웨이브 요약**:
  - **웨이브 1**(net-new, 동시 착수): T1.1·T1.2·T2.1·T2.3·T3.1·T4.1·T4.2·T5.1·T5.2
  - **웨이브 2**(본문·페이지, 각 1티어 완료 후): T2.2·T1.3·T2.4·T3.2·T4.3·T5.3
  - **웨이브 3**(배선 리프): T6.1(라우팅/사이드바/`[수정]` 통합)
- **⚠️ 공유 파일 병목(라우트/사이드바/`[수정]` 분기)**: `src/app/router.tsx`·`src/shared/components/sidebarMenuItems.ts`·`src/features/approval/components/detail/DrafterActions.tsx`(handleEdit) 세 파일은 **M6 단일 태스크로 몰아** react-router-developer에게 위임한다(5개 라우트 + 3개 사이드바 항목 + 1개 `isLeaveDraft` 분기를 한 번에). 각 마일스톤에서 개별 편집하면 같은 파일 동시 편집 충돌 위험 → 반드시 마지막에 통합. `DraftTypeBody.tsx`(29~31행 폴백 교체)와 `draftDetail.ts`(67행 `LeaveSlot` 좁히기)는 각각 T2.2·T2.1이 소유(다른 파일이라 병목 아님).

## ⚠️ 리스크 & 선행 결정 (Open Questions — PRD §Open Questions 승계)

- **라우트 경로 + 세그먼트 랭킹(신규 결정)**: PRD §페이지별 상세가 확정한 라우트를 따른다 — 작성 `/approval/drafts/leaves/new`·수정 `/approval/drafts/leaves/:draftId/edit`·내 휴가 `/leaves/me`·부서 `/leaves/dept`·관리자 `/leaves/admin`. 정적 `leaves/new`는 상세 `/approval/drafts/:draftId`보다 먼저 매칭돼야 하나, 리터럴 `leaves` 세그먼트 + `DraftDetailPage` decimal 가드로 오매핑되지 않는다(③`business-trips/*` 동형). react-router-developer가 등록 순서·랭킹을 M6에서 명시 확인.
- **[Open Q#1] 상신 시 결재선 필수 검증 위치(T1.3 착수 전)**: `LEAVE_DRAFT_CREATE_SUBMISSION`의 `param.approvers`는 optional로 문서화되나 도메인 규칙은 "상신=결재자 ≥1". 프론트 정책: `[생성 후 상신]`은 결재선 최소 1명 클라 사전검증(차단), `[임시저장으로 생성]`은 없이 허용. 최종은 서버(②③`CreatePage` 동일 정책 복제). 결재선은 `EmployeePicker` 로컬 선택 상태라 순수 zod 밖 — 상신 핸들러에서 `approverSelection.length` 가드. **비블로킹**.
- **[Open Q#2] 잔여 초과 사전 검증 여부(T3.2 착수 전)**: 사용일수 차감은 결재완료 이후이고 초과는 서버가 판정한다. 프론트는 잔여만 표시(F743)하고 상신은 서버 판정에 맡기는 것으로 가정(신청 단계 사전 경고 UX 미포함). 필요 시 후속 확정. **비블로킹**.
- **[Open Q#3] `HOURLY` 라벨·`reservedHours` 표기(T1.1·T2.2 착수 전)**: enum description "공휴일"과 "연가 1시간 단위 사용"(도메인모델)이 충돌 → 작성 폼 유형 라벨(`leaveTypeLabels`, T1.1)과 상세 본문 `reservedHours` "n시간" 표기(T2.2)·반차/시간연차 파생 표기 규칙을 착수 전 확정. **비블로킹**.
- **[해소·Open Q#4] `LeaveSlot` 하위필드**: 백엔드 DTO(`DraftDetailResponse.LeaveDraftDetail`) 소스 대조로 `{ startAt, endAt, leaveType(enum 코드), reservedHours }` 확정. T2.1이 `draftDetail.ts` `Record<string, unknown>`을 이 타입으로 좁힌다. live UX 재확인은 선택(낮음).
- **[Open Q#5] 작성 폼 첨부 범위(T1.3)**: 상세 응답 `files[]`는 ①이 표시하나, 작성 폼에서 F716 업로드를 포함할지 상세 첨부 영역(①)에서만 관리할지. 권고: ②③선례대로 작성 폼은 첨부 없이 생성 → 상세에서 관리(정책 `@docs/backend-contract/file-upload.md` + `@../docs/도메인모델.md` 위임). **비블로킹**.
- **[신규 확인] 관리자 부서 필터 목록 출처(T5.1)**: F747/F748 `deptId` 필터 Select 후보를 기존 `DEPTS` 조회(`EmployeePicker` 내부 사용 훅) 재사용으로 가정 — 기존 훅 존재 여부 확인 후 재사용(발명 금지). **비블로킹**.

## 📦 백로그 (PRD 명시 제외 — 태스크화 금지)

PRD §"MVP 이후 기능 / 범위 외" 참조로만 나열(각 유형 작성 PRD 또는 ①공통 대상):

- **타 유형 슬롯 작성/수정 전부**: `GENERAL_DRAFT_*`(②일반, 완료)·`BUSINESS_TRIP_DRAFT_*`(③출장, 완료)·`SALES_DRAFT_*`(⑤매출) — 각 유형 작성 PRD 관할. ④는 휴가만.
- **상세조회·문서함 5종·상신/철회/취소·승인/반려·공람·첨부 뷰·워크플로우 액션·결재대기함** — ①공통 소유(`DRAFT_DETAIL`/`DRAFT_SUBMIT`/`DRAFT_SUBMISSION_WITHDRAWAL`/`DRAFT_CANCELLATION_CREATE(_SUBMISSION)`/`DRAFT_APPROVE`/`DRAFT_REJECT`/`MY_PENDING_APPROVAL_DRAFTS`). "재사용"으로만 언급, 신규 F 부여 없음. **결재대기함은 이미 "전자결재" 그룹에 배선됨** — 휴가 결재자의 상세 진입 표준 경로, ④ 조치 없음.
- **첨부 후처리(미리보기/다운로드/삭제)** — 상세 첨부 영역(F717~F719) ①소유. ④의 작성 폼은 업로드 진입만(권고: 상세에서 관리).
- **결재선 협조 결재자(`COOPERATOR`) 역할 지정 UI** — MVP 범위 밖(APPROVER 고정, ②③선례).
- **휴가↔근태/일정 연동**(연차 승인 시 근태·`Schedule` 반영) — 백엔드 이벤트 처리, 프론트 화면 없음.
- **연차 자동 부여(1/1 배치)·잔여 초과 사전 차단** — 서버 정책/판정(프론트는 잔여 표시만, Open Q#2).
- **잔여/사용률 시각화(Recharts)** — MVP 이후. 잔여 카드·사용률은 숫자/텍스트로 표기.
- **테마/다크모드·다국어(i18n)·브라우저 푸시 알림** — 전 도메인 공통 제외.

## ✅ 정합성 검증 체크리스트 (실행 결과)

- 🔍 **커버리지**: F740(T1.1~T1.3 + 배선 T6.1)·F741(T2.3/T2.4 + 배선 T2.1/T6.1)·F742(T3.1/T3.2)·F743(T3.1/T3.2)·F744(T4.1/T4.3)·F745(T4.2/T4.3)·F746(T4.2/T4.3)·F747(T5.1/T5.3)·F748(T5.1/T5.3)·F749(T5.2/T5.3)·F750(T5.2/T5.3) — PRD MVP 핵심 기능 11개 전부 ≥1 태스크 매핑 ✅. 지원 배선(`isLeaveDraft`=T2.1·`LeaveSlot` 확정=T2.1·`LeaveDraftBody`=T2.2·`DrafterActions` 분기=T6.1) 태스크화 ✅. 첨부 F716·`DraftDetailResponse`·`EmployeePicker`·`usePrimaryDeptId`·`approvalKeys`는 소비(신규 F 아님) ✅
- 🔍 **역참조**: 모든 태스크가 PRD F740~F750/§페이지별 상세/§참조 계약 매핑/§계약 실측 메모/§Open Questions에 근거 — 발명 태스크 없음 ✅
- 🔍 **의존성**: M1(T1.1·T1.2→T1.3)·M2(T2.1·T2.3→T2.2·T2.4)·M3(T3.1→T3.2)·M4(T4.1·T4.2→T4.3)·M5(T5.1·T5.2→T5.3)→M6(T6.1) 위상 정렬, 순환 없음. ①/②/③/근태 자산은 재구현 없이 소비 전제 ✅
- 🔍 **여정 정합**: 태스크 순서가 PRD 사용자 여정(작성→상세[본문·수정]→내 휴가→부서→관리자)과 정합. 작성이 핵심 세로 슬라이스라 M1 우선(walking-skeleton), 내 휴가 진입점(M3)은 [휴가 신청]→작성 배선을 M6에서 합류 ✅
- 🔍 **범위**: PRD 제외 기능(타 유형 슬롯·첨부 후처리·협조 결재자·결재대기함·연동/배치·Recharts·테마/i18n/푸시)은 백로그로만, 태스크화 없음. ④는 휴가 F740~F750 + 지원 배선만 ✅
- 🔍 **규약**: 계약/전역 규칙(reissue·페이징 `number+1`·403/`ROLE_003` 매핑·`withCredentials`·날짜 dayjs·파일 정책) 재서술 없음, 필드/DTO·body 구조 재설계 없음(스니펫·§참조 계약 매핑·기존 `ApproverParam`으로 위임), URL은 PRD 확정 라우트 + react-router-developer 위임, 견적 강제 없음 ✅

**결과: 6개 항목 전부 통과. ①공통·②일반·③출장·근태 자산 소비 전제로 ④연가 F740~F750 + 지원 배선(`isLeaveDraft`·`LeaveSlot` 확정·`LeaveDraftBody`·`[수정]` 분기)을 6개 마일스톤(M1 작성·M2 상세본문+수정·M3 내 휴가·M4 부서·M5 관리자·M6 라우팅 통합)·16개 태스크로 전개 완료. 슬롯 non-null 술어 `isLeaveDraft`·`LeaveSlot` 구체 타입은 T2.1이 소유·T2.2/T2.4/T6.1이 소비. 공유 파일 3종(router·sidebar·DrafterActions)은 M6 단일 태스크로 통합해 병렬 충돌 회피. Open Q#1(상신 결재선 사전검증)·#3(HOURLY 라벨·reservedHours)·#5(첨부 범위) + 신규(부서 필터 출처)는 비블로킹으로 격리, #4(LeaveSlot 하위필드)는 DTO 소스 대조로 해결 — F740~F750 착수 가능.**
