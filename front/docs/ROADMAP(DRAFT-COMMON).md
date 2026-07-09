# 일반 기안(General Draft) 작성/수정 Frontend 개발 ROADMAP

> 출처 PRD: `docs/prd/8.general-draft-prd.md` (groupware-prd-validator 검증 통과 · Major M1 교정 반영 — 일반 기안 판별은 슬롯-null 술어)
> 이 로드맵은 PRD를 **실행 순서·의존성·태스크**로 전개한 것이다. 기능/계약의 사실 원천은 PRD와 백엔드 계약 문서(`api-endpoint.md` DRAFT/DOCUMENT API + `back/build/generated-snippets/GENERAL_DRAFT_{CREATE,CREATE_SUBMISSION,UPDATE}/`)이며, 여기서는 **무엇을 어떤 순서로 만들지**만 다룬다. 필드/DTO는 재서술하지 않고 PRD §참조 계약 매핑을 가리킨다.

## 🗺️ 개요

**📅 최종 업데이트**: 2026-07-09
**📊 진행 상황**: 8/8 Tasks 완료 (100%) — M1(작성)·M2(수정) ✅ 전체 완료

- **전략**: walking-skeleton-first 세로 슬라이스. **①공통(`docs/ROADMAP(DRAFT).md` 28/28, `src/features/approval/**`)은 이미 완료**되어 재구현하지 않고 **소비**한다. ②일반 기안 관심사는 **작성 슬라이스(F720, 즉시 착수 가능) → 수정 슬라이스(F721, 상세 `[수정]` 배선 = Major M1 술어 의존)** 순으로 얇게 관통한다. 작성 폼이 여정 진입점이라 M1 우선.
- **범위 경계**: ②가 소유하는 것은 **일반 기안 작성 페이지·수정 페이지 + 그 api/mutation(`GENERAL_DRAFT_CREATE`/`_CREATE_SUBMISSION`/`_UPDATE`)·zod 스키마·상세 `[수정]` 라우팅 실배선·"새 기안 작성" 진입점**뿐이다. 상세·문서함 5종·상신/철회/취소·승인/반려/공람·첨부 뷰·`EmployeePicker`·`ApproverParam`·`approvalKeys`·`useDraftDetailQuery`·첨부 업로드(F716)는 **①소유(재구현 금지, 소비만)**. PRD §"MVP 이후 기능 / 범위 외"(유형 슬롯 작성/수정 전부·첨부 후처리·협조 결재자 UI)는 로드맵 범위 밖(§백로그 참조, 태스크화 금지).
- **소비할 ①공통 완료 자산(재구현 금지 — 커밋 `d316ddc1`)**:
  - 상세 페이지/셸: `src/features/approval/pages/DraftDetailPage.tsx`, `components/detail/{DraftDetailHeader,DraftTypeBody,DrafterActions,AttachmentSection,...}.tsx`
  - **기안자 액션 판정**: `lib/resolveDrafterActions.ts`(`canEdit` = 기안자 본인 + UNSUBMITTED, 이미 계산됨 — ②는 판정 로직 재작성 안 함), `components/detail/DrafterActions.tsx`(`handleEdit` 현재 "해당 유형 작성 화면은 준비 중입니다" 폴백 토스트 → ②가 일반 기안 분기 실배선)
  - **슬롯-null 유형 판별 선례**: `components/detail/DraftTypeBody.tsx`(`draft.leave/businessTrip/sales` non-null 체크로 GENERAL 분기 — ②의 `[수정]` 배선·수정 진입 가드가 동형 술어를 공유, Major M1)
  - **결재선 선택**: `components/EmployeePicker.tsx`(제어형, props `selected`/`onChange`/`multiple`/`disabledEmpIds` — 선택 순서 유지), `model/approverParam.ts`(`ApproverParam{approverId,role,order}` — 신규 타입 발명 금지)
  - **쿼리/프리필/첨부**: `model/queryKeys.ts`(`approvalKeys.all`·`draftDetail(draftId)`), `api/useDraftDetailQuery.ts`(F701, 수정 프리필 소스), `api/useDraftFileUploadMutation.ts`(F716, 첨부는 생성 후 상세 `AttachmentSection`에서 관리)
  - **작성/수정 폼 near-perfect 템플릿**: `components/detail/CancellationDraftDialog.tsx`(제목·본문 RHF+zod + `EmployeePicker` 결재선 + `[임시저장으로 생성]`/`[생성 후 상신]` 2버튼 + `approverSelection.map((e,i)=>({approverId:e.empId, role:'APPROVER', order:i+1}))` 매핑 + 성공 후 `navigate('/approval/drafts/${draftId}')`) — ②의 작성 페이지는 이 다이얼로그 로직을 **페이지로 이식**한다. `model/cancellationDraftSchema.ts`·`api/createCancellationDraft.ts`·`api/useCancellationDraftMutation.ts`가 스키마/api/mutation 동형 복제 대상.
  - **폼 배관/배치**: `src/shared/lib/form.ts`(`useZodForm`/`submitWithErrorMapping`), `shared/lib/apiError.ts`(`handleApiError`), `ProtectedRoute`, `LayoutShell`, `shared/components/sidebarMenuItems.ts`(①이 "전자결재" 그룹 추가 완료), `src/app/router.tsx`(`/approval/drafts/:draftId` 상세 라우트 존재)
  - **페이지 폼 선례**: `src/features/board/pages/BoardCreatePage.tsx`·`BoardEditPage.tsx`(작성/수정 페이지 레이아웃·프리필·`dirtyFields` PATCH 시맨틱)
  - 날짜 `dayjs` / 토스트 `sonner` / 폼 `react-hook-form + zod` / shadcn Input·Textarea·Button·Card·Label (CLAUDE.md §6 고정 스택 — 추가 라이브러리 도입 금지)
- **①에서 채택한 검증 결정(로드맵 반영)**:
  - **Major M1(핵심)**: 일반 기안 판별은 `draftType` 문자열 비교 **금지**(실측 `draftType == "GeneralDraft"`, 스니펫의 `"BUSINESS_TRIP"`은 outdated). ①의 `DraftTypeBody`와 동형인 **슬롯-null 술어**(`draft.leave == null && draft.businessTrip == null && draft.sales == null && draft.sourceDraftId == null`)로 `DrafterActions.handleEdit`의 GENERAL 분기와 수정 페이지 진입 가드를 배선한다(T2.1이 소유·T2.4/T2.3이 소비).
  - **Minor m3**: 작성 폼은 **첨부 없이 생성**(JSON body `{title,content,approvers?}`) → 첨부는 생성 후 상세 `AttachmentSection`(①, F716)에서 관리. **작성/수정 폼에 첨부 UI 미포함**(작성 폼 첨부 UX Open Q 회피).
  - **Open Q#1**: `[생성 후 상신]`은 결재선 최소 1명 클라 사전검증, `[임시저장으로 생성]`은 결재선 없이 허용. 최종 판정은 서버.
  - **approvers body**: 객체 중첩 `{title,content,approvers?:[{approverId,role,order}]}`(취소기안 F704와 동형). 기존 `ApproverParam` 재사용(신규 타입 금지).
- **완료 게이트(전 마일스톤 공통)**: `npm run check-all` 통과 + `npm run build` 성공(CLAUDE.md §9). 단 attendance flake로 `check-all`이 exit 1일 수 있어 **approval/작성·수정 관련 신규 테스트만 통과 확인**한다. 도메인 슬라이스 구현 직후 test-author-runner로 유닛/컴포넌트 테스트 작성·실행.

## 🧩 의존성 개요

```
[①공통 완료 자산: DraftDetailPage·DrafterActions·resolveDrafterActions·DraftTypeBody·
 EmployeePicker·ApproverParam·approvalKeys·useDraftDetailQuery·useDraftFileUploadMutation·
 CancellationDraftDialog(폼 템플릿)·폼 배관·LayoutShell·sidebarMenuItems·router]  ← 소비만(재구현 금지)
  │
  ├→ M1 일반 기안 작성 슬라이스 (F720)   ← 즉시 착수 가능(상세 [수정] 술어와 무관, 여정 진입점)
  │     T1.1 작성 zod 스키마 ┐
  │     T1.2 작성 api+mutation ┴→ T1.3 작성 페이지 → T1.4 라우트 + 사이드바 "새 기안 작성"
  │
  └→ M2 일반 기안 수정 슬라이스 (F721) + 상세 [수정] 배선   ← Major M1 술어 소유·소비
        T2.1 isGeneralDraft 술어(슬롯-null) ┐
        T2.2 수정 api+mutation             ┴→ T2.3 수정 페이지 → T2.4 상세 [수정] 실배선 + 라우트
```

- **M1·M2는 서로 코드 의존이 없다**(둘 다 ①자산만 소비) → 기술적으로 병렬 착수 가능. 다만 walking-skeleton 권고 순서는 **M1 먼저**(작성이 여정 진입점·즉시 착수). M2의 수정 폼은 M1의 `generalDraftSchema`(T1.1)를 재사용할 수 있으나(title/content 필수 동형), 하드 의존은 아니다(M2 독립 착수 시 동일 shape 재정의 가능 — §병렬화 참조).
- **각 마일스톤 내부**: 스키마/술어(T1.1·T2.1)와 api+mutation(T1.2·T2.2)은 상호 독립 → 병렬 가능. 페이지(T1.3·T2.3)가 이들을 조립하고, 라우트/배선(T1.4·T2.4)이 리프.
- **Major M1 술어의 위치**: T2.1이 `isGeneralDraft` 슬롯-null 술어를 **소유(추출)**하고, T2.4(상세 `[수정]` navigate 분기)와 T2.3(수정 페이지 진입 가드)이 **소비**한다.

## 🚩 마일스톤 & 태스크

### M1 — 일반 기안 작성 슬라이스 (F720) ✅

> 목표: 사이드바 "전자결재 > 새 기안 작성" → 제목·본문·결재선(`EmployeePicker`) 입력 → `[임시저장으로 생성]`(UNSUBMITTED) 또는 `[생성 후 상신]`(WAITING) → 생성 기안 상세(①)로 이동하는 얇은 세로 슬라이스. 근거: PRD §사용자 여정, §페이지별 상세(일반 기안 작성 페이지), F720.
> 완료 정의: `EMPLOYEE`가 메뉴로 작성 페이지에 진입해 제목·본문 입력(zod 필수 검증)·결재선 지정 후 두 버튼으로 생성. 둘 다 `201 {draftId}` → `/approval/drafts/{draftId}` 상세로 이동 + `approvalKeys` invalidate + 성공 토스트. `[생성 후 상신]`은 결재선 최소 1명 클라 사전검증(Open Q#1), `[임시저장으로 생성]`은 결재선 없이 허용. 첨부 UI 미포함(Minor m3 — 첨부는 생성 후 상세에서).
> 이 마일스톤은 ①의 `CancellationDraftDialog` 폼 로직을 **작성 페이지로 이식**하고, `createCancellationDraft`/`useCancellationDraftMutation`을 동형 복제해 일반 기안 생성 api/mutation을 만든다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T1.1 | 작성 폼 zod 스키마 `generalDraftSchema`(title·content 필수·공백 불가). `model/cancellationDraftSchema.ts` 동형(결재선은 스키마 밖 `EmployeePicker` 로컬 선택 상태로 관리) | §페이지별 상세(zod 사전검증), §참조 계약 매핑(`GENERAL_DRAFT_CREATE` title/content 필수) | — | `features/approval/model/generalDraftSchema.ts`에 스키마·`GeneralDraftFormValues` 존재, 제목/본문 공백 시 인라인 에러 | 7 | 2 | ☑ |
| T1.2 | 작성 api 함수 `createGeneralDraft`(submit 분기: `POST /api/drafts/generals`(생성) vs `/generals/submission`(생성+상신), body `{title,content,approvers?}`, resp `201 {draftId}`) + mutation 훅 `useGeneralDraftCreateMutation`(onSuccess `invalidateQueries(approvalKeys.all)`). `api/createCancellationDraft.ts`·`useCancellationDraftMutation.ts` 동형, body 항목 타입은 기존 `ApproverParam` 재사용(신규 타입 금지) | F720, §참조 계약 매핑(`GENERAL_DRAFT_CREATE`/`_CREATE_SUBMISSION`, approvers 객체 중첩) | — (T1.1과 병렬) | 두 엔드포인트 axios 소비, `201 {draftId}` 파싱, 실패→에러 그대로 throw(호출부 `submitWithErrorMapping` 위임), 성공 시 `approvalKeys.all` invalidate | 8 | 4 | ☑ |
| T1.3 | 작성 페이지 `GeneralDraftCreatePage`: 제목(Input)·본문(Textarea) RHF+zod(T1.1) + 결재선 `EmployeePicker`(①, 선택 순서→`order` 1-base·`role:'APPROVER'` 고정) + `[임시저장으로 생성]`(type=button)/`[생성 후 상신]`(type=submit) 2버튼. `[생성 후 상신]`은 결재선 0명 시 사전검증 차단(Open Q#1), 생성 성공(T1.2)→`navigate('/approval/drafts/${draftId}')` + 토스트. `CancellationDraftDialog` 폼 로직을 페이지로 이식(첨부 UI 없음 — Minor m3) | F720, §페이지별 상세(일반 기안 작성 페이지·다음 이동), Open Q#1·#3 | T1.1, T1.2 | 제목/본문 미입력 폼 에러, 결재선 지정·해제 동작, 상신 버튼이 결재선 0명 차단, 두 경로 생성 성공→상세 이동·`approvalKeys` invalidate·토스트, 서버 에러→`handleApiError` 토스트 | 8 | 6 | ☑ |
| T1.4 | 라우트 승격 `/approval/drafts/new`(가칭) ProtectedRoute 자식 추가 + 사이드바 "전자결재" 그룹에 **"새 기안 작성" 항목 1개**(`to:'/approval/drafts/new'`, `minRole:'EMPLOYEE'`) 추가. **`new` 정적 세그먼트가 기존 `:draftId` 동적 라우트보다 먼저 매칭돼야 함**(RR7 정적 우선 랭킹 + `DraftDetailPage`의 decimal 가드로 이중 안전 — §리스크). **라우팅/사이드바는 react-router-developer 위임 권장** | §메뉴 구조("새 기안 작성" 신규 진입점), §사용자 여정 | T1.3 | 미인증→로그인 리디렉션(기존 가드), `EMPLOYEE` 메뉴 클릭→작성 페이지 진입, 직접 URL 진입도 동작, `/approval/drafts/6` 상세는 여전히 상세로 매칭 | 6 | 3 | ☑ |

> **M1 split 판단(복잡도·중요도)**: 전 태스크 복잡도 < 7 → **split 없음(4개 전부 단일 task 유지)**. T1.1(2필드 스키마, `cancellationDraftSchema` 동형)·T1.2(api+mutation 동형 복제, submit 분기 2 엔드포인트라 복잡도 4·슬라이스 기반이라 중요도 8)는 낮음. T1.3(핵심 작성 화면 — `CancellationDraftDialog` 폼 이식 + Open Q#1 상신 사전검증 분기 + `EmployeePicker` + 2버튼 + navigate, 복잡도 6·중요도 8이나 다이얼로그 선례 이식이라 임계값 미만)·T1.4(라우트 1 + 사이드바 항목 1, react-router-developer 위임이라 복잡도 3)은 7 미만 유지.
> **실행 순서**: T1.1(중요도7)·T1.2(중요도8)는 상호 독립 → 병렬 가능 → T1.3(중요도8, T1.1·T1.2 의존) → T1.4(중요도6, T1.3 의존, M1 리프). 근거: 위상정렬 우선 + 동순위 내 중요도 높은 순.

### M2 — 일반 기안 수정 슬라이스 (F721) + 상세 `[수정]` 배선 ✅

> 목표: 임시저장함(①)→상세(①)에서 기안자 본인이 `[수정]`(`DrafterActions`, `canEdit`=기안자+UNSUBMITTED)을 눌러 일반 기안 수정 페이지로 진입 → 기존 값 프리필(제목·본문·결재선) 수정 → `[저장]`(`204`) → 상세 복귀하는 슬라이스. 근거: PRD §사용자 여정(수정), §페이지별 상세(일반 기안 수정 페이지·상세 `[수정]` 배선), F721.
> 완료 정의: 상세 `[수정]` 클릭 시 **일반 기안(슬롯-null 술어)일 때만** 수정 페이지로 `navigate`(타 유형은 폴백 토스트 유지). 수정 페이지가 `DRAFT_DETAIL`(F701, ①)로 title/content/approvers[] 프리필(결재선은 `order` 순 정렬→`EmployeePicker` 초기 선택 복원), zod 검증 후 `[저장]`(`GENERAL_DRAFT_UPDATE`, `PATCH`, `204`)→`approvalKeys.draftDetail`/`all` invalidate + 상세로 복귀 + 토스트. 첨부 UI 미포함(Minor m3).
> 이 마일스톤이 **Major M1 슬롯-null 술어(`isGeneralDraft`)를 소유(T2.1)하고, 상세 `[수정]` 라우팅(T2.4)·수정 진입 가드(T2.3)에 배선**한다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T2.1 | **일반 기안 판별 술어 `isGeneralDraft(draft)` 추출**(순수 함수): `draft.leave == null && draft.businessTrip == null && draft.sales == null && draft.sourceDraftId == null`(유형 슬롯 전부 null + 취소기안 아님). ①의 `DraftTypeBody` 인라인 판별과 **동형**이며, T2.4(상세 `[수정]` navigate)·T2.3(수정 진입 가드)이 공유. **`draftType` 문자열 비교 금지**(Major M1) | §상세 `[수정]` 배선(슬롯-null 판별), §계약 실측 메모(draftType="GeneralDraft" 금지) | — | `features/approval/lib/isGeneralDraft.ts`(또는 동등 위치)에 술어 존재, GENERAL=true / leave·businessTrip·sales·sourceDraftId non-null=false 단위 검증, `DraftTypeBody`와 판별 규칙 일치 | 8 | 3 | ☑ |
| T2.2 | 수정 api 함수 `updateGeneralDraft`(`PATCH /api/drafts/generals/{draftId}`, body `{title?,content?,approvers?}`, `204` Empty) + mutation 훅 `useGeneralDraftUpdateMutation`(onSuccess `invalidateQueries(approvalKeys.draftDetail(draftId))` + `approvalKeys.all`). 표준 mutation 패턴 | F721, §참조 계약 매핑(`GENERAL_DRAFT_UPDATE`, 부분 수정 optional) | — (T2.1과 병렬) | `204` 처리, 권한/상태 위반(기안자 아님·이미 상신)→에러 그대로 throw(호출부 `handleApiError` 위임), 성공 시 상세·목록 invalidate | 7 | 4 | ☑ |
| T2.3 | 수정 페이지 `GeneralDraftEditPage`: `useDraftDetailQuery`(F701, ①)로 프리필(title/content + approvers[]를 `order` 순 정렬→`{empId,empName}` 매핑→`EmployeePicker` 초기 선택 복원). 진입 가드 = `isGeneralDraft`(T2.1) × UNSUBMITTED × 기안자(`resolveDrafterActions.canEdit` 소비, 최종 서버). `[저장]`(T2.2)→`204`→상세로 복귀 + 토스트. `BoardEditPage` 프리필·라우트 파라미터 decimal 가드 패턴 복제(첨부 UI 없음) | F721, §페이지별 상세(일반 기안 수정 페이지·다음 이동), §계약 실측 메모(프리필 소스) | T2.1, T2.2 | `draftId`로 상세 프리필→제목/본문/결재선 초기값 복원, 비-GENERAL·비-UNSUBMITTED·비-기안자 진입 시 권한 부족/처리 불가 UX, 저장 성공→상세 복귀·invalidate·토스트, 검증 실패→인라인 에러 | 8 | 6 | ☑ |
| T2.4 | 상세 `[수정]` 실배선: `DrafterActions.handleEdit`를 `isGeneralDraft`(T2.1)면 `navigate('/approval/drafts/${draftId}/edit')`, 타 유형(휴가/출장/매출)은 기존 "준비 중" 폴백 토스트 유지. + 라우트 승격 `/approval/drafts/:draftId/edit`(가칭) ProtectedRoute 자식 추가. **라우팅은 react-router-developer 위임 권장**, `DrafterActions` 수정은 ② 직접 | §상세 `[수정]` 배선(GENERAL 분기만 실배선·타 유형 폴백 유지), Open Q#5 | T2.1, T2.3 | 일반 기안 상세에서 `[수정]`→수정 페이지 이동, 유형 슬롯 있는 기안은 폴백 토스트, 직접 URL `/approval/drafts/{id}/edit` 진입도 동작 | 7 | 4 | ☑ |

> **M2 split 판단(복잡도·중요도)**: 전 태스크 복잡도 < 7 → **split 없음(4개 전부 단일 task 유지)**. T2.1(슬롯-null 순수 술어 추출, `DraftTypeBody` 동형이라 복잡도 3이나 Major M1 정합 핵심·②의 상세 배선/수정 가드 공유 기반이라 중요도 8)·T2.2(PATCH 204 mutation 표준 패턴, 복잡도 4)는 낮음. T2.3(수정 화면 — 프리필 approvers[]→`EmployeePicker` 복원 + 진입 가드 3중 판정 + `BoardEditPage` 프리필 복제, 복잡도 6·중요도 8이나 선례 복제라 임계값 미만)·T2.4(`DrafterActions.handleEdit` 실배선 = Major M1 술어 소비 + 라우트 승격, 복잡도 4·중요도 7 — PRD Major 교정의 실제 착지점)은 7 미만 유지.
> **실행 순서**: T2.1(중요도8)·T2.2(중요도7)는 상호 독립 → 병렬 가능 → T2.3(중요도8, T2.1·T2.2 의존) → T2.4(중요도7, T2.1·T2.3 의존, M2 리프). 근거: 위상정렬 우선 + 동순위 내 중요도 높은 순. T2.1은 T2.3·T2.4가 공유하는 술어라 M2 착수 즉시 확정.

## 🔀 병렬화 가능 지점

- **M1 T1.1(스키마)·T1.2(api+mutation)**: 상호 독립 → 병렬. 둘 다 net-new이나 서로 다른 파일(`model/`·`api/`).
- **M2 T2.1(술어)·T2.2(api+mutation)**: 상호 독립 → 병렬. T2.1은 순수 함수 추출, T2.2는 표준 mutation.
- **M1 ↔ M2**: 서로 코드 의존 없음(둘 다 ①자산만 소비) → **병렬 착수 가능**. 단 walking-skeleton 권고 순서는 M1 먼저(작성이 여정 진입점). M2 수정 폼이 M1의 `generalDraftSchema`(T1.1)를 재사용하려면 T1.1이 선행돼야 하나, 재사용은 소프트(M2 독립 착수 시 동일 shape 재정의 가능) — 병렬 진행 시 스키마를 M1에서 먼저 확정하는 것을 권장.
- **라우트 배선(T1.4·T2.4)**: 둘 다 `router.tsx`를 건드리므로 react-router-developer에 위임 시 **두 라우트(`/approval/drafts/new`·`/approval/drafts/:draftId/edit`)를 한 번에 추가**하면 충돌 없이 효율적(정적 `new`/동적 `:draftId` + 정적 `edit` 세그먼트 랭킹 함께 검토).

## ⚠️ 리스크 & 선행 결정 (Open Questions — PRD §Open Questions 승계)

- **라우트 경로 명명 + 세그먼트 랭킹(신규 결정)**: `/approval/drafts/new`·`/approval/drafts/:draftId/edit`는 가칭. **`new`가 기존 `:draftId`(상세)보다 먼저 매칭돼야 함** — React Router 7은 정적 세그먼트를 동적보다 높게 랭크하고, `DraftDetailPage`가 `:draftId`를 decimal 양의 정수로만 가드하므로 `new`는 상세로 오매핑되지 않으나, react-router-developer가 라우트 등록 순서·랭킹을 명시적으로 확인. 사이드바 그룹 구성은 PRD §메뉴 구조를 따른다.
- **[Open Q#1] 상신 시 결재선 필수 검증 위치(T1.3 착수 전)**: `GENERAL_DRAFT_CREATE_SUBMISSION` request-fields는 approvers optional이나 도메인모델은 "상신=결재자 1명 이상 필수". 프론트 정책: `[생성 후 상신]`은 결재선 최소 1명 클라 사전검증(차단), `[임시저장으로 생성]`은 없이 허용. 최종은 서버. 결재선은 `EmployeePicker` 로컬 선택 상태라 순수 zod 스키마 밖 — 상신 핸들러에서 `approverSelection.length` 가드로 구현(취소기안 다이얼로그는 현재 미검증·서버 위임이므로 ②가 상신 사전검증을 추가하는 첫 사례 → 일관성 정책 확정).
- **[Open Q#2] 작성 후 이동 목적지(T1.3)**: 생성/상신 응답이 `{draftId}`이므로 ①선례(취소기안)대로 `/approval/drafts/{draftId}` 상세로 이동 가정. 임시저장 시 상세 대신 임시저장함으로 보낼지 여부는 비블로킹(상세 이동으로 진행, 필요 시 재조정).
- **[Open Q#3] 작성/수정 폼 첨부(Minor m3 채택 — 리스크 해소)**: 작성 api는 JSON body(파일 파트 없음), F716은 `draftId` 필요. **작성/수정 폼은 첨부 UI 미포함**으로 단순화 — 첨부는 생성 후 상세 `AttachmentSection`(①)에서 관리. 다중 파일 순차 업로드·생성+상신 시 롤백 UX 등 리스크 회피(T1.3/T2.3 범위에서 제외).
- **[Open Q#4] "새 기안 작성" 유형 선택 허브(비블로킹)**: MVP는 유형 선택 없이 "새 기안 작성"=일반 기안 작성 직결. ③출장/④연가/⑤매출 착수 시 유형 선택 화면·사이드바 유형별 항목 여부 재검토(이번 범위는 일반만).
- **[Open Q#5] 상세 `[수정]` 유형 분기 소유권(T2.4)**: `DrafterActions.handleEdit`의 유형별 라우팅은 유형이 늘수록 분기가 커진다. ②는 **GENERAL 분기만 배선**(`isGeneralDraft`)하고 나머지는 폴백 유지 → 각 유형 PRD가 자기 분기를 추가하는 규약(COMPLICATED-DOMAIN 후보). 분기 확장 규약은 ③④⑤ 취합 시 확정.

## 📦 백로그 (PRD 명시 제외 — 태스크화 금지)

PRD §"MVP 이후 기능 / 범위 외" 참조로만 나열(각 유형 작성 PRD 또는 ①공통 대상):

- **유형 슬롯 작성/수정 전부**: `LEAVE_DRAFT_*`(④연가, `docs/prd/6.leave-prd.md`)·`BUSINESS_TRIP_DRAFT_*`·`BUSINESS_TRIP_PARTICIPANTS_UPDATE`(③출장)·`SALES_DRAFT_*`(⑤매출) — 각 유형 작성 PRD 관할. ②는 GENERAL만.
- **상세조회·문서함 5종·상신/철회/취소·승인/반려·공람·첨부 뷰·워크플로우 액션** — ①공통 소유(`docs/prd/7.approval-common-prd.md`, `docs/ROADMAP(DRAFT).md` 28/28).
- **첨부 후처리(미리보기/다운로드/삭제)** — 상세 페이지 첨부 영역(F717~F719) ①소유. ②의 작성/수정 폼은 업로드조차 미포함(Minor m3).
- **결재선 협조 결재자(`COOPERATOR`) 역할 지정 UI** — MVP 범위 밖(APPROVER 고정).
- **테마/다크모드·다국어(i18n)·브라우저 푸시 알림** — 전 도메인 공통 제외.

## ✅ 정합성 검증 체크리스트 (실행 결과)

- 🔍 **커버리지**: F720(T1.1/T1.2/T1.3/T1.4)·F721(T2.2/T2.3) + 상세 `[수정]` 배선(T2.1/T2.4) — PRD MVP 핵심 기능 2개 전부 ≥1 태스크 매핑 ✅. 첨부 F716은 ①소유 소비(신규 F 아님, 작성 폼 미포함) ✅
- 🔍 **역참조**: 모든 태스크가 PRD F720/F721/§페이지별 상세/§참조 계약 매핑/§상세 `[수정]` 배선/§Open Questions에 근거 — 발명 태스크 없음 ✅
- 🔍 **의존성**: M1(T1.1·T1.2→T1.3→T1.4)·M2(T2.1·T2.2→T2.3→T2.4) 위상 정렬, 순환 없음. ①공통 자산(상세·`DrafterActions`·`EmployeePicker`·`approvalKeys`·`useDraftDetailQuery`·`CancellationDraftDialog`·폼 배관)은 재구현하지 않고 소비 전제 ✅
- 🔍 **여정 정합**: 태스크 순서가 PRD 사용자 여정(사이드바 "새 기안 작성"→작성 페이지→상세(①) / 임시저장함(①)→상세(①)→`[수정]`→수정 페이지→상세 복귀)과 일치. 작성이 진입점이라 M1 우선(walking-skeleton) ✅
- 🔍 **범위**: PRD 제외 기능(유형 슬롯 작성/수정·첨부 후처리·협조 결재자·테마/i18n/푸시)은 백로그로만, 태스크화 없음. ②는 GENERAL 작성/수정 + 상세 `[수정]` GENERAL 분기만 ✅
- 🔍 **규약**: 계약/전역 규칙(reissue·페이징+1·403/404 매핑·`withCredentials`·날짜 dayjs·파일 정책) 재서술 없음, 필드/DTO 설계 없음(스니펫·§참조 계약 매핑·기존 `ApproverParam`으로 위임), URL 가칭 + react-router-developer 위임, 견적 강제 없음 ✅

**결과: 6개 항목 전부 통과. ①공통 자산 소비 전제로 ②일반 기안 작성(F720)·수정(F721) M1~M2만 설계 완료. Major M1 슬롯-null 술어는 T2.1이 소유·T2.3/T2.4가 소비. Open Q#1(상신 결재선 사전검증)은 T1.3 착수 전 정책 확정, 나머지(#2 이동·#3 첨부·#4 유형 허브·#5 분기 소유권)는 비블로킹으로 격리 — F720~F721 착수 가능.**
