# 매출 기안(Sales Draft) 작성/수정·본문 렌더·가맹점 선택 Frontend 개발 ROADMAP

> 출처 PRD: `docs/prd/12.sales-draft-prd.md` (groupware-prd-validator 검증 통과 — 매출 기안 판별은 슬롯-null 술어 `sales != null`, `SalesSlot` 하위필드는 백엔드 DTO `SalesDraftDetail(Long,String,YearMonth,Long)` 소스 대조로 확정, `salesAmount>0`·`franchiseId` 미검증도 백엔드 소스 실측)
> 이 로드맵은 PRD를 **실행 순서·의존성·태스크**로 전개한 것이다. 기능/계약의 사실 원천은 PRD와 백엔드 계약 문서(`api-endpoint.md`의 `SALES_DRAFT_CREATE`/`_CREATE_SUBMISSION`/`SALES_DRAFT_UPDATE`/`FRANCHISE_LIST` + `back/build/generated-snippets/<기능ID>/`)이며, 여기서는 **무엇을 어떤 순서로 만들지**만 다룬다. 필드/DTO·body 구조는 재서술하지 않고 PRD §참조 계약 매핑을 가리킨다.

## 🗺️ 개요

**📅 최종 업데이트**: 2026-07-09
**📊 진행 상황**: 10/10 Tasks 완료 (100%) — M1 ☑ / M2 ☑ / M3 ☑ / M4 ☑

- **전략**: walking-skeleton-first 세로 슬라이스. **①공통(`docs/ROADMAP(DRAFT).md`, `src/features/approval/**`)·②일반(`docs/ROADMAP(DRAFT-COMMON).md`)·③출장(`docs/ROADMAP(DRAFT-BUSINESSTRIP).md`)·④연가(`docs/ROADMAP(LEAVE).md`) 는 이미 완료**되어 재구현하지 않고 **소비**한다. ⑤매출 관심사는 **① 대상 가맹점 선택 자산 확립(M1 `features/franchise` 조회 슬라이스 + `FranchisePicker`) → ② 작성 슬라이스(F760) → ③ 상세 본문+수정 슬라이스(F761, `SalesDraftBody`·`isSalesDraft`·`SalesSlot` 확정 포함)** 로 얇게 관통하고, 마지막에 라우팅/사이드바/`[수정]` 분기 배선을 **한 태스크로 통합(M4)**한다(공유 파일 병목 회피). **M0(아키텍처 배관) 마일스톤 없음** — ①의 배관을 그대로 소비한다. 이번 스코프는 ②③④보다 작다(신규 F 3개·신규 페이지 2개)라 마일스톤 4개로 압축한다(과설계 금지).
- **범위 경계**: ⑤가 소유하는 것은 **매출 기안 작성 페이지·수정 페이지 + 그 api/mutation(2개 DRAFT 기능ID)·매출 폼 zod 스키마·매출 상세 본문(`SalesDraftBody`)·상세 `[수정]` 매출 분기 배선·유형 판별 술어 `isSalesDraft`·`SalesSlot` 구체 타입 확정·신규 `features/franchise` 얇은 조회 슬라이스(`getFranchises`+훅 하나)·`FranchisePicker`(F762, `FRANCHISE_LIST` 소비)·사이드바 "전자결재" 그룹 "매출 기안 작성" 1항목**뿐이다. 상세·문서함 4종·상신/철회/취소·승인/반려/공람·첨부 뷰·**결재대기함**·`EmployeePicker`·`ApproverParam`·`approvalKeys`·`useDraftDetailQuery`·`useDraftFileUploadMutation`(F716)·본인 empId(`useMeQuery().data?.empBasicInfo.empId`)는 **①소유(재구현 금지, 소비만)**. PRD §"MVP 이후 기능 / 범위 외"(타 유형 슬롯 전부·매출 전용 이력 페이지·가맹점 도메인 본체·`FRANCHISE_SALES_*` aggregate·첨부 후처리·협조 결재자 UI)는 로드맵 범위 밖(§백로그 참조, 태스크화 금지). **매출 전용 이력 API가 부재하므로 이력 페이지를 만들지 않는다** — 이력·결재는 ①문서함 4종·결재대기함이 전량 커버.
- **소비할 완료 자산(재구현 금지)**:
  - **①상세/셸**: `src/features/approval/pages/DraftDetailPage.tsx`, `components/detail/{DraftDetailHeader,DraftTypeBody,DrafterActions,ApproverActions,AttachmentSection,...}.tsx`
  - **①기안자 액션 판정**: `lib/resolveDrafterActions.ts`(`canEdit` = 기안자 본인 + UNSUBMITTED, 이미 계산됨 — ⑤는 판정 로직 재작성 안 함, 노출 게이팅만 소비), `components/detail/DrafterActions.tsx`(`handleEdit` 71~85행 — 현재 `isGeneralDraft`·`isBusinessTripDraft`·`isLeaveDraft` 분기 + 매출 "준비 중" 폴백 토스트 84행 → ⑤가 `isSalesDraft` 분기 실배선)
  - **①슬롯-null 유형 판별 선례**: `components/detail/DraftTypeBody.tsx`(37~39행 `draft.sales != null` → 현재 `TypeSlotFallback typeName="매출"` "준비 중" 폴백 렌더 → ⑤가 `SalesDraftBody`로 교체), `lib/isGeneralDraft.ts`·`lib/isBusinessTripDraft.ts`·`lib/isLeaveDraft.ts`(슬롯-null 술어 동형 선례 — ⑤의 `isSalesDraft`가 `leave != null`과 정확히 대칭인 `sales != null`을 계승)
  - **①상세 타입**: `model/draftDetail.ts`의 `DraftDetailResponse.sales: SalesSlot`(112행) — 현재 `SalesSlot = Record<string, unknown>`(80행, ①이 미확정으로 남겨둠) → **⑤가 `{ franchiseId, franchiseName, reportMonth, salesAmount }` 구체 타입으로 좁힌다**(T3.1). 본문 렌더·수정 프리필·판별 소스. `DraftEmployeeRef{empId,empName}`·`DraftApprover`도 소비
  - **①결재선 선택 UI**: `components/EmployeePicker.tsx`(제어형, props `selected`/`onChange`/`multiple`/`disabledEmpIds` — 선택 순서 유지, 디바운스 300ms·단일 페이지+`!last` 안내, `EmployeePickerEmployee{empId,empName}`), `model/approverParam.ts`(`ApproverParam{approverId,role,order}` — 신규 타입 발명 금지, 선택 순서→`order` 1-base·`role:'APPROVER'` 고정)
  - **①쿼리/프리필/첨부**: `model/queryKeys.ts`(`approvalKeys.all`·`draftDetail(draftId)` — 작성/수정 성공 후 invalidate 대상), `api/useDraftDetailQuery.ts`(F701, 수정 프리필·본문 렌더 소스), `api/useDraftFileUploadMutation.ts`(F716, 첨부는 생성 후 상세 `AttachmentSection`에서 관리 — 작성 폼 범위 밖, Open Q#4)
  - **①본인 empId**: `useMeQuery().data?.empBasicInfo.empId`(`features/employee/api/useMeQuery.ts`·`model/me.ts`) — `FranchisePicker` "내 담당 가맹점" 우선 노출(`managerId`)에 재사용. ①이 이미 확립(`DrafterActions`·`ApproverActions` 등 전역 재사용), 로딩 전/부재 시 `undefined` → fail-closed(담당 필터 미적용 → 검색 fallback). `authStore.ts`의 `AuthUser`는 별개 자산, 미터치
  - **②③④ 동형 복제 구조적 템플릿(이름만 치환)**: `model/businessTripDraftSchema.ts`→`salesDraftSchema.ts`, `api/createBusinessTripDraft.ts`(**혼합 body**·submit boolean 분기로 한 함수가 두 URL 호출)→`createSalesDraft.ts`, `api/useBusinessTripDraftCreateMutation.ts`→`useSalesDraftCreateMutation.ts`, `pages/BusinessTripDraftCreatePage.tsx`→`SalesDraftCreatePage.tsx`, `api/updateBusinessTripDraft.ts`→`updateSalesDraft.ts`, `api/useBusinessTripDraftUpdateMutation.ts`→`useSalesDraftUpdateMutation.ts`, `pages/BusinessTripDraftEditPage.tsx`→`SalesDraftEditPage.tsx`, `components/detail/LeaveDraftBody.tsx`(read-only, mutation 없음)→`SalesDraftBody.tsx`, `lib/isLeaveDraft.ts`(+test)→`isSalesDraft.ts`(+test)
  - **`features/franchise` 조회 슬라이스 복제 템플릿**: `src/features/department/api/getDepartments.ts`(값 있는 파라미터만 조건부로 params에 채워 전송, `Page<T>` 반환)·`api/useDepartmentsQuery.ts`·`model/queryKeys.ts` — ⑤ `getFranchises`/`useFranchisesQuery`/`franchiseKeys` 동형. `FranchisePicker`는 `EmployeePicker`(제어형·다이얼로그 내 마운트·디바운스·단일 페이지+`!last` 안내)를 단일 선택으로 복제
  - **폼/에러 배관**: `src/shared/lib/form.ts`(`useZodForm`/`submitWithErrorMapping`), `shared/lib/apiError.ts`(`handleApiError` — `ROLE_003` 권한부족 UX 포함), `ProtectedRoute`, `LayoutShell`, `src/shared/components/sidebarMenuItems.ts`("전자결재" 그룹 76~107행: "새 기안 작성"·"출장 기안 작성"이 그룹 최상단), `src/app/router.tsx`
  - 날짜 `dayjs` / 천 단위 표기 `Intl.NumberFormat` / 토스트 `sonner` / 폼 `react-hook-form + zod` / shadcn Input·Textarea·Button·Card·Label·Dialog·Table (CLAUDE.md §6 고정 스택 — 추가 라이브러리 도입 금지)
- **PRD에서 확정된 결정(로드맵 반영)**:
  - **유형 판별(슬롯 non-null)**: 매출 기안 = `draft.sales != null`(`isSalesDraft`). **`draftType` 문자열 비교 금지**(백엔드 `getClass().getSimpleName()`, 스니펫 값 outdated). ④의 `isLeaveDraft`(`leave != null`)와 동형 축이며, T3.1이 소유·T3.4(수정 진입 가드)·T4.1(상세 `[수정]` navigate)이 소비. `SalesDraftBody`(T3.2)는 `DraftTypeBody`가 이미 `sales != null`로 분기하므로 술어 불필요(폴백 교체만).
  - **작성/수정 body 혼합 구조(⚠️ 평탄화 금지)**: 작성/수정은 `param{title,content,approvers?}` 객체와 최상위 형제 `franchiseId/reportMonth/salesAmount`(작성)·`franchiseId?/reportMonth?/salesAmount?`(수정)가 **나란히** 붙는 혼합 구조다(③출장의 `param{...}`+`startAt/endAt/destination/purpose`, ④연가의 `param{...}`+`startAt/endAt/leaveType`와 동형 구조·필드만 다름, ②일반의 평탄 `{title,content,approvers}`와 다름). 신규 타입 `SalesDraftPayload`(`param` 중첩). 필드/구조 상세는 PRD §참조 계약 매핑 실측값에 위임.
  - **`salesAmount` 도메인 규칙(⚠️ 양의 정수)**: 백엔드 `SalesDraft.validateSalesInitParam`가 `salesAmount > 0`을 검증(0 이하 전부 거부), 타입 `long` → zod `.positive().int()`. 프론트 사전검증 + 서버 최종 판정. 상세 본문은 천 단위 구분 표기(예 `1,000,000원`).
  - **`franchiseId` 담당 미검증(백엔드 소스 실측)**: `SalesDraftService.findFranchise`는 `findById`로 **존재 여부만** 확인(담당 여부 미검증) → 서버는 임의 `franchiseId` 허용. 프론트는 "내 담당 우선 노출 + 전체 검색 허용"으로 설계(§FranchisePicker), 과도한 제약 금지.
  - **`reportMonth` 형식**: 작성/수정 요청·상세 응답 모두 `"yyyy-MM"` 문자열(백엔드 `YearMonth`). 입력은 `<input type="month">`(값이 정확히 `yyyy-MM`)로 받아 그대로 전송, zod는 `/^\d{4}-(0[1-9]|1[0-2])$/` 또는 dayjs로 검증.
  - **`SalesSlot` 구체 타입 확정**: `{ franchiseId, franchiseName, reportMonth, salesAmount }`. 백엔드 DTO(`DraftDetailResponse.SalesDraftDetail(Long franchiseId, String franchiseName, YearMonth reportMonth, Long salesAmount)`) 소스 대조로 확정. `franchiseName`은 상세조회에만 존재(요청 body엔 없음, 표시용·수정 프리필 시 `FranchisePicker` 선택 상태 복원용). T3.1이 `model/draftDetail.ts`(80행)의 `Record<string, unknown>`을 이 타입으로 좁힌다.
  - **Open Q#1**: `[생성 후 상신]`은 결재선 최소 1명 클라 사전검증(차단), `[임시저장으로 생성]`은 결재선 없이 허용. 최종 판정 서버(②③④`CreatePage` 동일 정책 복제). 결재선은 `EmployeePicker` 로컬 선택 상태라 순수 zod 밖 — 상신 핸들러에서 `approverSelection.length` 가드.
  - **FranchisePicker 선택 모델(제어형·단일 선택)**: `selected: { id:number; name:string } | null`, `onChange(next)`. 소비처(작성/수정 폼)가 선택 상태 소유·유지, 위젯은 탐색 UI·토글만. 기본 뷰=`getFranchises({ managerId: 본인 empId })`(담당 우선), 검색 모드=`keyword` 입력 시 `managerId` 제거하고 전체 조회(디바운스 300ms). 담당 0개=빈 상태 안내 + 검색 fallback(작성 차단 없음). 페이징=`size≈50` 단일 페이지 + `!last`면 "검색해 좁혀주세요" 안내. `status` 필터 미노출(Open Q#3). 상세는 PRD §FranchisePicker 설계에 위임.
- **완료 게이트(전 마일스톤 공통)**: `npm run check-all` 통과 + `npm run build` 성공(CLAUDE.md §9). 단 attendance flake로 `check-all`이 exit 1일 수 있어 **approval/franchise 관련 신규 테스트만 통과 확인**한다. 도메인 슬라이스 구현 직후 test-author-runner로 유닛/컴포넌트 테스트 작성·실행.

## 🧩 의존성 개요

```
[①공통 완료 자산: DraftDetailPage·DrafterActions(handleEdit:71-85, 매출 폴백:84)·resolveDrafterActions(canEdit)·
 DraftTypeBody(sales 폴백:37-39)·draftDetail.ts(SalesSlot:80·sales 슬롯:112)·EmployeePicker·ApproverParam·
 approvalKeys·useDraftDetailQuery·useDraftFileUploadMutation·useMeQuery(본인 empId)·폼 배관·ProtectedRoute·
 LayoutShell·sidebarMenuItems(전자결재 그룹:76-107)·router]
[②일반·③출장·④연가 기안 완료: businessTripDraftSchema·createBusinessTripDraft(혼합 body·submit 분기)·
 BusinessTripDraft{Create,Edit}Page·LeaveDraftBody·isLeaveDraft·updateBusinessTripDraft
   — ⑤가 이름만 바꿔 동형 복제할 구조적 템플릿]
[features/department 슬라이스: getDepartments(조건부 params)·useDepartmentsQuery·queryKeys — ⑤ features/franchise 동형 복제 템플릿]
  │
  ├→ M1 franchise 조회 슬라이스 + FranchisePicker (F762)      ← 공유 의존(작성/수정 폼이 소비), 우선 착수
  │     T1.1 getFranchises + useFranchisesQuery + franchiseKeys + Franchise 타입 ─→ T1.2 FranchisePicker(단일 선택·managerId 기본뷰·검색 fallback)
  │
  ├→ M2 매출 기안 작성 슬라이스 (F760)
  │     T2.1 작성 zod 스키마 ┐
  │     T2.2 작성 api+mutation(혼합 body·submit 분기) ─┴→ T2.3 작성 페이지(+FranchisePicker[T1.2]·EmployeePicker[①])
  │
  ├→ M3 매출 상세 본문 + 수정 슬라이스 (F761 + SalesDraftBody + isSalesDraft·SalesSlot 확정)
  │     T3.1 isSalesDraft 술어 + SalesSlot 구체 타입 확정 ─┬→ T3.2 SalesDraftBody(폴백 교체)
  │     T3.3 수정 api+mutation(혼합 body) ─────────────────┴→ T3.4 수정 페이지(프리필+FranchisePicker[T1.2] 복원)
  │
  └→ M4 라우팅/사이드바/[수정] 배선 통합 (react-router-developer 위임)
        T4.1 router.tsx 2라우트 + sidebar 1항목(FRANCHISE) + DrafterActions isSalesDraft 분기
```

- **M1~M3는 서로 코드 하드 의존이 없다**(전부 ①/②③④/department 자산만 소비) → 기술적으로 병렬 착수 가능. walking-skeleton 권고 순서는 **여정 순(M1→M3)**. **단, 페이지 티어의 하드 의존**: M2 작성 페이지(T2.3)·M3 수정 페이지(T3.4)는 M1 `FranchisePicker`(T1.2)를 import하므로 T1.2 완료 후 착수한다(각 마일스톤의 1티어 net-new 태스크 T2.1·T2.2·T3.1·T3.2·T3.3은 M1 미완이어도 병렬 착수 가능). **소프트 의존**: M3 수정 페이지(T3.4)는 M2 T2.1의 `salesDraftSchema` 매출 필드 정의를 재사용할 수 있어 T2.1 선행 권장(하드 의존 아님).
- **공유 파일 병목(라우트/사이드바/`[수정]` 분기)**: `src/app/router.tsx`·`src/shared/components/sidebarMenuItems.ts`·`src/features/approval/components/detail/DrafterActions.tsx`(handleEdit) 세 파일 수정은 **M4 단일 태스크로 몰아** react-router-developer에게 위임한다(2개 라우트 + 1개 사이드바 항목 + 1개 `isSalesDraft` 분기를 한 번에). **M1~M3 마일스톤은 이 3개 파일을 절대 편집하지 않는다.** `DraftTypeBody.tsx`(37~39행 폴백 교체)와 `draftDetail.ts`(80행 `SalesSlot` 좁히기)는 각각 T3.2·T3.1이 소유(위 3개 병목 파일이 아니므로 병목 아님). M4는 M2·M3 페이지가 존재해야 라우트를 연결할 수 있으므로 마지막.
- **각 마일스톤 내부**: 스키마/술어/타입/api(1티어)는 상호 독립 → 병렬 가능. 페이지(2티어)가 이들을 조립, 라우트/배선(M4 리프)이 마지막.

## 🚩 마일스톤 & 태스크

> 표기: **라우팅/사이드바/`[수정]` 분기 배선**(`router.tsx`·`sidebarMenuItems.ts`·`DrafterActions.tsx` 수정)은 각 마일스톤에서 하지 않고 **M4로 통합**(react-router-developer 위임). 나머지(데이터 계층·비라우팅 UI·`DraftTypeBody`/`draftDetail.ts` 편집)는 직접 구현. 완료 여부: ☐ 미착수 / ☑ 완료.

### M1 — franchise 조회 슬라이스 + FranchisePicker (F762)

> 목표: 매출 작성/수정 폼이 소비할 **대상 가맹점 선택 UI**를 확립. 신규 `features/franchise` 얇은 조회 슬라이스(`getFranchises`+훅 하나)를 만들고, `features/approval/components`의 `FranchisePicker`가 이를 cross-feature import해 단일 선택 위젯을 제공한다(①`EmployeePicker`가 `features/department`를 소비하는 것과 동형). 근거: PRD §FranchisePicker 설계, §페이지별 상세, F762.
> 완료 정의: `getFranchises({ keyword?, status?, managerId?, page?, size? })`가 값 있는 파라미터만 조건부로 전송해 `Page<Franchise>`를 반환하고, `FranchisePicker`가 마운트 시 담당 가맹점(`managerId`=본인 empId)을 우선 노출·`keyword` 입력 시 전체 검색(디바운스 300ms)·단일 선택 토글·`!last` 안내·담당 0개 빈 상태를 처리한다. 제어형(`selected:{id,name}|null`/`onChange`)이라 작성/수정 폼이 선택 상태를 소유.
> 이 마일스톤은 ①`EmployeePicker`와 `features/department` 조회 훅을 동형 복제하되 **다중→단일 선택**, **부서/부서원 2단 탐색→가맹점 단일 목록(담당 기본뷰+전체 검색)** 으로 치환한다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T1.1 | 신규 `features/franchise` 얇은 조회 슬라이스: `getFranchises(params?)`(`GET /api/franchises`, 값 있는 `keyword`/`status`/`managerId`/`page`/`size`만 조건부로 params에 채워 전송, `Page<Franchise>` 반환) + `useFranchisesQuery` + `franchiseKeys`(department `queryKeys` 동형 팩토리: `all`/`list(params)`) + `Franchise` 응답 타입(필드는 PRD §참조 계약 매핑 `FRANCHISE_LIST` 실측에 위임 — 추측 금지). `getDepartments`·`useDepartmentsQuery` 동형 | F762, §참조 계약 매핑(`FRANCHISE_LIST` `Page<T>`·전 쿼리 선택) | — | `features/franchise/api/{getFranchises,useFranchisesQuery}.ts` + `model/{franchiseKeys,franchise}.ts` 생성, `Page<T>` 파싱, 값 없는 파라미터 쿼리스트링 생략, 실패→`handleApiError` 위임 | 8 | 4 | ☑ |
| T1.2 | `FranchisePicker`(`features/approval/components`): `features/franchise` 훅(T1.1) cross-feature import, **제어형 단일 선택**(`selected:{id:number;name:string}|null`/`onChange`). 마운트 시 `getFranchises({ managerId: useMeQuery().data?.empBasicInfo.empId })`(담당 우선, `undefined`면 fail-closed→검색 fallback) + `keyword` 입력 시 `managerId` 제거·전체 검색(디바운스 300ms) + 단일 선택 토글 + `!last` "검색해 좁혀주세요" 안내 + 담당 0개 빈 상태 + 목록 행 보조표기(`BusinessStatus`·`ownerName`·`address`). `EmployeePicker` 복제(다중→단일, 2단→단일 목록) | F762, §FranchisePicker 설계(선택 모델·기본뷰·검색·담당 0개·페이징·status 미노출), §권한 분기점(`franchiseId` 미검증) | T1.1 | `features/approval/components/FranchisePicker.tsx` 생성, 담당 기본 노출·검색 시 전체 조회·단일 선택/해제·`!last` 안내·담당 0개 빈 상태, `selected`/`onChange` 제어형 계약 | 8 | 6 | ☑ |

> **M1 split 판단(복잡도·중요도)**: 전 태스크 복잡도 < 7 → **split 없음**. T1.2(복잡도 6)가 최대 — `EmployeePicker` 복제이나 담당 기본뷰↔전체 검색 모드 전환·단일 선택·본인 empId fail-closed가 겹쳐 임계값 근접(단일 유지). T1.1(getDepartments 동형 슬라이스, 복잡도 4)은 표준 패턴.
> **실행 순서**: T1.1(중요도8) → T1.2(중요도8, T1.1 의존). 선형 슬라이스. `FranchisePicker`가 M2·M3 페이지의 공유 의존이라 M1 우선 착수 권장.

### M2 — 매출 기안 작성 슬라이스 (F760)

> 목표: 제목·본문 + 대상 가맹점(`franchiseId`, `FranchisePicker`)·매출 보고월(`reportMonth`)·매출액(`salesAmount`) 입력 + 결재선(`EmployeePicker`) → `[임시저장으로 생성]`(UNSUBMITTED, `SALES_DRAFT_CREATE`) 또는 `[생성 후 상신]`(WAITING, `SALES_DRAFT_CREATE_SUBMISSION`) → 생성 기안 상세(①)로 이동하는 얇은 세로 슬라이스. 근거: PRD §사용자 여정(작성), §페이지별 상세(매출 기안 작성 페이지), F760.
> 완료 정의: `FRANCHISE` role 사원이 작성 페이지에 진입해 제목·본문·가맹점(`FranchisePicker`)·보고월(`<input type="month">`→`yyyy-MM`)·매출액(양의 정수) 입력(zod 필수·`salesAmount` `.positive().int()`·`reportMonth` 형식 refine)·결재선 지정 후 두 버튼으로 생성. 둘 다 `201 {draftId}` → `/approval/drafts/{draftId}` 상세로 이동 + `approvalKeys.all` invalidate + 성공 토스트. `[생성 후 상신]`은 결재선 최소 1명 클라 사전검증(Open Q#1), `[임시저장으로 생성]`은 결재선 없이 허용. 매출액 0 이하·권한 없음(403)은 `handleApiError` 토스트. 첨부 UI 미포함(생성 후 상세에서 관리 — ②③④선례·Open Q#4).
> 이 마일스톤은 ③④의 `createBusinessTripDraft`/`BusinessTripDraftCreatePage`를 동형 복제하되 **유형 필드(목적지·목적·참여자 / 유형·기간)를 매출 필드(`FranchisePicker`→`franchiseId`·`reportMonth` month input·`salesAmount`)로 치환**한다(혼합 body·2버튼·상신 사전검증은 동일).

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T2.1 | 작성 폼 zod 스키마 `salesDraftSchema`(title·content 필수·공백 불가, `franchiseId` 양의 정수 필수, `reportMonth` `yyyy-MM` 형식 필수, `salesAmount` `.positive().int()` 필수·0 이하 거부 — 결재선은 스키마 밖 `EmployeePicker` 로컬 선택 상태). `businessTripDraftSchema`·`leaveDraftSchema` 동형 | §페이지별 상세(주요 기능·zod 사전검증), §계약 실측 메모(`salesAmount>0`·`reportMonth` yyyy-MM) | — | `features/approval/model/salesDraftSchema.ts`에 스키마·`SalesDraftFormValues` 존재, 필수 공백/매출액 0 이하/보고월 형식 인라인 에러 | 7 | 3 | ☑ |
| T2.2 | 작성 api 함수 `createSalesDraft`(submit boolean 분기: `POST /api/drafts/sales`(생성) vs `.../sales/submission`(생성+상신), **혼합 body** `param{title,content,approvers?}` + 최상위 `franchiseId/reportMonth/salesAmount`, resp `201 {draftId}`) + mutation 훅 `useSalesDraftCreateMutation`(onSuccess `invalidateQueries(approvalKeys.all)`). `createBusinessTripDraft`·`useBusinessTripDraftCreateMutation` 동형, `ApproverParam` 재사용(신규 타입 금지), 신규 타입 `SalesDraftPayload`(param 중첩), **body 평탄화 금지** | F760, §참조 계약 매핑(`SALES_DRAFT_CREATE`/`_CREATE_SUBMISSION`, 혼합 body) | — (T2.1과 병렬) | `features/approval/api/createSalesDraft.ts`+`useSalesDraftCreateMutation.ts` 생성, 두 엔드포인트 axios 소비, `201 {draftId}` 파싱, 실패→throw(호출부 `submitWithErrorMapping` 위임), 성공 시 `approvalKeys.all` invalidate | 8 | 4 | ☑ |
| T2.3 | 작성 페이지 `SalesDraftCreatePage`: 제목(Input)·본문(Textarea)·대상 가맹점(`FranchisePicker`=T1.2, → `franchiseId`)·보고월(`<input type="month">`→`yyyy-MM`)·매출액(number Input) RHF+zod(T2.1) + 결재선 `EmployeePicker`(①, 선택 순서→`order` 1-base·`role:'APPROVER'`→`ApproverParam[]`) + `[임시저장으로 생성]`(type=button)/`[생성 후 상신]`(type=submit) 2버튼. `[생성 후 상신]`은 결재선 0명 시 사전검증 차단(Open Q#1), 혼합 body 조립 후 생성 성공(T2.2)→`navigate('/approval/drafts/${draftId}')` + 토스트. `BusinessTripDraftCreatePage` 이식(유형 필드→FranchisePicker·month·매출액) | F760, §페이지별 상세(매출 기안 작성 페이지·다음 이동), Open Q#1 | T2.1, T2.2, T1.2 | `features/approval/pages/SalesDraftCreatePage.tsx` 생성, 필수 미입력·매출액 0 이하·보고월 미선택 폼 에러, `FranchisePicker` 선택/해제·결재선 지정/해제, 상신 버튼이 결재선 0명 차단, 두 경로 생성 성공→상세 이동·invalidate·토스트, 서버 에러(403 등)→`handleApiError` 토스트 | 8 | 7 | ☑ |

> **M2 split 판단(복잡도·중요도)**: T2.3(복잡도 7)만 임계값 도달 — `BusinessTripDraftCreatePage` 이식이나 **`FranchisePicker` 배선·month input·매출액·혼합 body 조립·상신 사전검증**이 겹친다. **task-planner 판단으로 T2.3a(폼 필드/스키마 바인딩 + `FranchisePicker`·`EmployeePicker`)·T2.3b(제출 핸들러 2버튼 + 상신 사전검증 + 혼합 body 조립·navigate) 분할 후보**. T2.1·T2.2(< 7)는 단일 유지.
> **실행 순서**: T2.1(중요도7)·T2.2(중요도8) 상호 독립 → 병렬 → T2.3(중요도8, T2.1·T2.2·T1.2 의존). 위상정렬 + 동순위 내 중요도 순.

### M3 — 매출 상세 본문 렌더 + 수정 슬라이스 (F761 + `SalesDraftBody` + `isSalesDraft`·`SalesSlot` 확정)

> 목표: 기안서 상세(①)에서 매출 기안 본문(가맹점명·보고월·매출액)을 실제로 렌더하고, 임시저장함/상신함(①)→상세→기안자 본인이 `[수정]`(`DrafterActions`, `canEdit`)을 눌러 **매출 기안일 때만** 수정 페이지로 진입 → 기존 값 프리필(제목·본문·결재선·가맹점·보고월·매출액) 수정 → `[저장]`(`204`) → 상세 복귀하는 슬라이스. 근거: PRD §사용자 여정(수정), §페이지별 상세(기안서 상세 페이지·매출 기안 수정 페이지), F761.
> 완료 정의: (1) `DraftTypeBody`(37~39행)의 `sales != null` "준비 중" 폴백을 `SalesDraftBody`로 교체 — `sales` 슬롯(`SalesSlot` 구체 타입: `franchiseName`·`reportMonth`·`salesAmount`)과 공통 `content`를 렌더(매출액 천 단위 `1,000,000원`·보고월 dayjs 포맷, **read-only·mutation 없음**). (2) 상세 `[수정]`(M4에서 배선) → `isSalesDraft(draft)`일 때 수정 페이지로 `navigate`. (3) 수정 페이지가 `DRAFT_DETAIL`(F701, ①)로 title/content/approvers[]/`sales.{franchiseId,franchiseName,reportMonth,salesAmount}` 프리필(결재선 `order` 순 정렬→`EmployeePicker` 복원, `FranchisePicker`는 `franchiseId`+`franchiseName`으로 선택 상태 복원), zod 검증 후 `[저장]`(`SALES_DRAFT_UPDATE`, `PATCH`, `204`)→`approvalKeys.draftDetail`/`all` invalidate + 상세 복귀 + 토스트. **첨부는 이 폼 범위 밖**(①상세). 상신/철회/취소·승인/반려는 ①소유(유형 무관 범용, ⑤ 조치 없음).
> 이 마일스톤이 **슬롯 non-null 술어(`isSalesDraft`)와 `SalesSlot` 구체 타입을 소유(T3.1)**하고, 상세 본문(T3.2)·수정 프리필(T3.4)이 이를 소비한다. ④의 `LeaveDraftBody`(mutation 없는 read-only 본문)·`updateBusinessTripDraft`/`BusinessTripDraftEditPage`를 동형 복제.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T3.1 | **매출 기안 판별 술어 `isSalesDraft(draft)` 추출**(순수 함수): `draft.sales != null`. `lib/isLeaveDraft.ts` 동형(슬롯-null 축), T3.4(수정 진입 가드)·T4.1(상세 `[수정]` navigate)이 공유. **`draftType` 문자열 비교 금지** + **`SalesSlot` 구체 타입 확정**: `model/draftDetail.ts`(80행)의 `SalesSlot = Record<string, unknown>`을 `{ franchiseId:number; franchiseName:string; reportMonth:string; salesAmount:number }`로 좁힌다(DTO `SalesDraftDetail` 소스 대조 확정) | §계약 실측 메모(슬롯-null 규약·`SalesSlot` 하위필드 확정), §상세 `[수정]` 배선 | — | `features/approval/lib/isSalesDraft.ts` + `isSalesDraft.test.ts`에 술어 존재(`sales` non-null=true/null=false 단위 검증, `DraftTypeBody` 37~39행 분기와 일치), `draftDetail.ts` `SalesSlot` 구체 타입으로 좁혀짐 | 8 | 3 | ☑ |
| T3.2 | 매출 상세 본문 컴포넌트 `SalesDraftBody`: `DraftTypeBody`(37~39행)의 `sales != null` `TypeSlotFallback` 폴백을 실제 렌더로 교체. `sales` 슬롯(`SalesSlot`, T3.1 — 가맹점명 `franchiseName`·보고월 `reportMonth`(dayjs "2026년 4월" 또는 `yyyy-MM`)·매출액 `salesAmount`(천 단위 `1,000,000원`))과 공통 `content`를 렌더. **신규 조회 없음**(F701 슬롯 소비). `LeaveDraftBody` 동형(참여자/공람 mutation 없음 — 매출 슬롯은 순수 표시 필드) | §페이지별 상세(매출 본문 렌더 `SalesDraftBody`), §참조 계약 매핑(`DRAFT_DETAIL` `SalesSlot`) | T3.1 | `features/approval/components/detail/SalesDraftBody.tsx` 생성 + `DraftTypeBody`(37~39행)가 sales 분기에서 이를 렌더, 매출 상세 진입 시 가맹점명·보고월·매출액·본문 표시(폴백 문구 사라짐) | 8 | 4 | ☑ |
| T3.3 | 수정 api 함수 `updateSalesDraft`(`PATCH /api/drafts/sales/{draftId}`, **혼합 body** `param?{title?,content?,approvers?}` + 최상위 `franchiseId?/reportMonth?/salesAmount?`, 전부 optional 부분 수정, `204` Empty) + mutation 훅 `useSalesDraftUpdateMutation`(onSuccess `invalidateQueries(approvalKeys.draftDetail(draftId))` + `approvalKeys.all`). `updateBusinessTripDraft`·`useBusinessTripDraftUpdateMutation` 동형, **body 평탄화 금지** | F761, §참조 계약 매핑(`SALES_DRAFT_UPDATE`, 부분 수정 혼합 body) | — (T3.1과 병렬) | `features/approval/api/updateSalesDraft.ts`+`useSalesDraftUpdateMutation.ts` 생성, `204` 처리, 권한/상태 위반→throw(호출부 `handleApiError` 위임), 성공 시 상세·목록 invalidate | 7 | 4 | ☑ |
| T3.4 | 수정 페이지 `SalesDraftEditPage`: `useDraftDetailQuery`(F701, ①)로 프리필(title/content + approvers[]를 `order` 순 정렬→`{empId,empName}`→`EmployeePicker` 복원 + `sales.{franchiseId,franchiseName}`→`FranchisePicker` 초기 `selected` 복원 + `sales.reportMonth`→month input·`sales.salesAmount`→매출액 초기값). 진입 가드 = `isSalesDraft`(T3.1) × UNSUBMITTED × 기안자(`resolveDrafterActions.canEdit` 소비, 최종 서버) + decimal 양의 정수 라우트 가드. `[저장]`(T3.3)→`204`→상세 복귀 + 토스트. `BusinessTripDraftEditPage` 복제(유형 필드→FranchisePicker·month·매출액) | F761, §페이지별 상세(매출 기안 수정 페이지·다음 이동), §계약 실측 메모(프리필 소스·`franchiseName` 표시용) | T3.1, T3.3, T1.2 (+ T2.1 soft) | `features/approval/pages/SalesDraftEditPage.tsx` 생성, `draftId`로 상세 프리필→제목/본문/결재선/가맹점/보고월/매출액 초기값 복원, 비-매출·비-UNSUBMITTED·비-기안자 진입 시 권한 부족/처리 불가 UX, 저장 성공→상세 복귀·invalidate·토스트, 검증 실패→인라인 에러 | 8 | 7 | ☑ |

> **M3 split 판단(복잡도·중요도)**: T3.4(복잡도 7)만 임계값 도달 — `BusinessTripDraftEditPage` 복제이나 **혼합 body 프리필(approvers[]→picker + sales 슬롯→FranchisePicker/month/매출액) + 3중 진입 가드**로 M2 T2.3과 대칭. **task-planner 판단으로 T3.4a(프리필/폼 바인딩 + `FranchisePicker` 복원)·T3.4b(진입 가드 + 저장 핸들러) 분할 후보**. T3.1(술어+타입 좁히기 3)·T3.2(본문 렌더 4)·T3.3(PATCH 204 4)은 단일 유지.
> **실행 순서**: T3.1(중요도8)·T3.3(중요도7) 상호 독립 → 병렬 → T3.2(중요도8, T3.1 의존)·T3.4(중요도8, T3.1·T3.3·T1.2 의존) → . T3.1은 T3.2·T3.4·T4.1 공유 술어/타입이라 M3 착수 즉시 확정.

### M4 — 라우팅/사이드바/`[수정]` 배선 통합 (react-router-developer 위임)

> 목표: M2·M3이 만든 2개 페이지를 라우트에 연결하고, 사이드바 "전자결재" 그룹에 "매출 기안 작성" 1항목(minRole `FRANCHISE`)을 추가하며, 상세 `[수정]`에 매출 분기를 배선하는 **공유 파일 통합 태스크**. 근거: PRD §메뉴 구조, §페이지별 상세(각 라우트), §상세 `[수정]` 배선. 세 파일(`router.tsx`·`sidebarMenuItems.ts`·`DrafterActions.tsx`)을 한 번에 편집해 병렬 편집 충돌을 회피한다.
> 완료 정의: 2개 라우트 등록(정적 `sales/new`가 리터럴 `sales` 세그먼트로 상세 `:draftId`와 랭킹 충돌 없음 — ③`business-trips/*`·④`leaves/*` 동형) + 사이드바 1항목(FRANCHISE, ADMIN 자동 포함) + `DrafterActions.handleEdit`(71~85행)에 `isSalesDraft` 분기 추가(84행 폴백 토스트 자리). 미인증→리디렉션, 비FRANCHISE 미노출, 상세 `[수정]`→매출 수정 페이지 이동이 관통.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T4.1 | **라우팅/사이드바/`[수정]` 통합 배선** (react-router-developer 위임): (1) `router.tsx` `ProtectedRoute` 자식에 2라우트 추가 — `/approval/drafts/sales/new`(작성·정적 우선)·`/approval/drafts/sales/:draftId/edit`(수정). (2) `sidebarMenuItems.ts` "전자결재" 그룹(76~107행)에 **"매출 기안 작성"**(`to:'/approval/drafts/sales/new'`, `minRole:'FRANCHISE'`) 1항목을 "출장 기안 작성" 옆에 추가(③선례). **결재대기함·문서함은 이미 존재하므로 추가 금지**. (3) `DrafterActions.handleEdit`(71~85행)에 `isSalesDraft(draft)`(T3.1) 분기 추가 → `navigate('/approval/drafts/sales/${draftId}/edit')`(기존 일반/출장/휴가 분기 유지, 84행 "준비 중" 폴백 토스트 제거) | §메뉴 구조("전자결재" 그룹 1항목·FRANCHISE), §페이지별 상세(라우트), §상세 `[수정]` 배선 | T2.3, T3.1, T3.4 | 2라우트 직접 URL 진입 동작, `sales/new`·`sales/:draftId/edit`가 상세 `:draftId`로 오매핑 안 됨, 사이드바 "매출 기안 작성" role별 노출(FRANCHISE·ADMIN 계층 자동 포함, 비FRANCHISE 미노출), 매출 상세 `[수정]`→매출 수정 페이지·일반/출장/휴가는 각 수정 페이지 | 7 | 4 | ☑ |

> **M4 split 판단**: 복잡도 4 < 7 → **split 없음**. 세 파일 편집이나 각각 ①②③④ 동일 컨벤션 복제라 낮음. react-router-developer가 라우트 등록 순서·정적/동적 랭킹을 명시 확인.
> **실행 순서**: 단일 태스크. M2·M3 페이지 + T3.1(`isSalesDraft`) 완료 후 착수(리프). **완료**: `router.tsx` 2라우트(`sales/new`·`sales/:draftId/edit`, 각각 동적 `:draftId`보다 앞에 등록)·`sidebarMenuItems.ts` "매출 기안 작성"(FRANCHISE) 1항목·`DrafterActions.handleEdit`의 `isSalesDraft` 분기 배선 완료. 라이브 검증(ADMIN 계정, Playwright): `/approval/drafts/sales/new` 정상 렌더(FranchisePicker·매출 보고월·매출액 폼 노출), `/approval/drafts/sales/:draftId/edit`가 상세·타 유형 수정 라우트와 랭킹 충돌 없이 자체 404 처리로 분기됨을 확인. code-reviewer 리뷰 통과(non-minor 이슈 없음). `npm run typecheck`·`npm run build` 성공, approval/franchise 관련 신규 테스트(26개 파일 199개) 전부 통과(`npm run check-all` 전체 실행 시 department/leave/attendance 도메인의 기존 타임아웃 플레이크로 실패하나 이번 변경과 무관 — §완료 게이트 각주 참조).

## 🔀 병렬화 가능 지점

build-domain 5단계가 아래 그룹을 병렬 실행자에게 위임 판단할 수 있다.

- **마일스톤 간(M1~M3)**: 서로 코드 하드 의존 없음(전부 ①/②③④/department 자산만 소비) → **3개 마일스톤 병렬 착수 가능**. walking-skeleton 권고 순서는 여정 순(M1→M3)이나 병렬 실행을 막지 않는다. **단, 페이지 티어 하드 의존**: M2 T2.3·M3 T3.4는 M1 `FranchisePicker`(T1.2)를 import → T1.2 완료 후 착수. **소프트 의존**: M3 T3.4가 M2 T2.1(`salesDraftSchema`) 재사용하려면 T2.1 선행 권장(하드 의존 아님).
- **각 마일스톤 1티어(상호 독립 → 병렬)**: `M2{T2.1·T2.2}` / `M3{T3.1·T3.3}`. 서로 다른 파일(`model/`·`lib/`·`api/`·`components/detail/`)이라 충돌 없음. `M1{T1.1}`은 단일 진입(T1.2가 T1.1 의존).
- **병렬 웨이브 요약**:
  - **웨이브 1**(net-new, 동시 착수): T1.1·T2.1·T2.2·T3.1·T3.3
  - **웨이브 2**(위젯·본문, 각 1티어 완료 후): T1.2(T1.1 의존)·T3.2(T3.1 의존)
  - **웨이브 3**(페이지, `FranchisePicker`+api 완료 후): T2.3·T3.4
  - **웨이브 4**(배선 리프): T4.1(라우팅/사이드바/`[수정]` 통합)
- **⚠️ 공유 파일 병목(라우트/사이드바/`[수정]` 분기)**: `src/app/router.tsx`·`src/shared/components/sidebarMenuItems.ts`·`src/features/approval/components/detail/DrafterActions.tsx`(handleEdit) 세 파일은 **M4 단일 태스크로 몰아** react-router-developer에게 위임한다(2개 라우트 + 1개 사이드바 항목 + 1개 `isSalesDraft` 분기를 한 번에). **M1~M3 마일스톤은 이 3개 파일을 절대 편집하지 않는다.** `DraftTypeBody.tsx`(37~39행 폴백 교체)와 `draftDetail.ts`(80행 `SalesSlot` 좁히기)는 각각 T3.2·T3.1이 소유(다른 파일이라 병목 아님).

## ⚠️ 리스크 & 선행 결정 (Open Questions — PRD §Open Questions 승계)

- **라우트 경로 + 세그먼트 랭킹(신규 결정)**: PRD §페이지별 상세가 확정한 라우트를 따른다 — 작성 `/approval/drafts/sales/new`·수정 `/approval/drafts/sales/:draftId/edit`. 정적 `sales/new`는 상세 `/approval/drafts/:draftId`보다 먼저 매칭돼야 하나, 리터럴 `sales` 세그먼트 + `DraftDetailPage` decimal 가드로 오매핑되지 않는다(③`business-trips/*`·④`leaves/*` 동형). react-router-developer가 등록 순서·랭킹을 M4에서 명시 확인.
- **[Open Q#1] 상신 시 결재선 필수 검증 위치(T2.3 착수 전)**: `SALES_DRAFT_CREATE_SUBMISSION`의 `param.approvers`는 optional로 문서화되나 도메인 규칙은 "상신=결재자 ≥1". 프론트 정책: `[생성 후 상신]`은 결재선 최소 1명 클라 사전검증(차단), `[임시저장으로 생성]`은 없이 허용. 최종은 서버(②③④`CreatePage` 동일 정책 복제). 결재선은 `EmployeePicker` 로컬 선택 상태라 순수 zod 밖 — 상신 핸들러에서 `approverSelection.length` 가드. **비블로킹**.
- **[Open Q#2] `reportMonth` 중복/미래월 제약(T2.1·T2.3 착수 전)**: 백엔드 `validateSalesInitParam`은 `salesAmount>0`만 검증하고 보고월 중복(같은 가맹점 같은 월 재작성)·미래월 제약은 소스에서 미관측. 프론트는 제약 없이 서버 판정에 맡기는 것으로 가정 — month 선택 UI에 미래월 제한/중복 사전 경고가 필요한지 확인. **비블로킹**.
- **[Open Q#3] 영업 상태(`status`)별 기안 가능 여부(T1.2 착수 전)**: `franchiseId`는 존재만 검증하므로 폐업/영업중단 가맹점도 서버상 기안 가능. `FranchisePicker`에서 특정 `status`만 노출/선택 허용할지, 전체 노출 후 서버 판정에 맡길지 확인(현 설계: 전체 노출·`status` 필터 미노출, 행에 `BusinessStatus` 보조 표기만). **비블로킹**.
- **[Open Q#4] 작성 폼 첨부 범위(T2.3)**: 작성 폼에서 F716 업로드를 포함할지 상세 첨부 영역(①)에서만 관리할지. 권고: ②③④선례대로 작성 폼은 첨부 없이 생성 → 상세에서 관리(정책 `@docs/backend-contract/file-upload.md` + `@../docs/도메인모델.md` 위임). **비블로킹**.
- **[해소] `SalesSlot` 하위필드**: 백엔드 DTO(`DraftDetailResponse.SalesDraftDetail(Long franchiseId, String franchiseName, YearMonth reportMonth, Long salesAmount)`) 소스 대조로 `{ franchiseId, franchiseName, reportMonth(yyyy-MM), salesAmount }` 확정. T3.1이 `draftDetail.ts` `Record<string, unknown>`을 이 타입으로 좁힌다. `franchiseName`은 상세에만 존재(수정 프리필 시 `FranchisePicker` 선택 복원용). live UX 재확인은 선택(낮음).
- **[신규 확인] `Franchise` 응답 타입 필드(T1.1)**: `FRANCHISE_LIST` response-fields(`id`/`name`/`address`/`ownerName`/`BusinessStatus`/`managerEmpId`/`managerEmpName` 등 PRD §참조 계약 매핑 실측)를 스니펫 재확인 후 타입 확정(추측 금지). **비블로킹**.

## 📦 백로그 (PRD 명시 제외 — 태스크화 금지)

PRD §"MVP 이후 기능 / 범위 외" 참조로만 나열(각 유형 작성 PRD 또는 ①공통/가맹점 도메인 대상):

- **타 유형 슬롯 작성/수정 전부**: `GENERAL_DRAFT_*`(②일반, 완료)·`BUSINESS_TRIP_DRAFT_*`(③출장, 완료)·`LEAVE_DRAFT_*`(④연가, 완료) — 각 유형 작성 PRD 관할. ⑤는 매출만.
- **상세조회·문서함 4종·상신/철회/취소·승인/반려·공람·첨부 뷰·워크플로우 액션·결재대기함** — ①공통 소유. "재사용"으로만 언급, 신규 F 부여 없음. **결재대기함·문서함은 이미 "전자결재" 그룹에 배선됨** — 매출 결재자·매출 이력의 표준 진입 경로, ⑤ 조치 없음.
- **매출 기안 전용 이력 페이지** — **만들지 않는다**(전용 이력 API 부재, ①문서함 4종이 상신/임시저장/결재대기/결재 이력 전량 커버).
- **가맹점 도메인 본체 전부**: `FRANCHISE_DETAIL/CREATE/UPDATE/STATUS_UPDATE/MANAGER_UPDATE/MEMO_*`(가맹점 CRUD)·`FRANCHISE_EDUCATION_*`·`FRANCHISE_INQUIRY_*` — "가맹점" 도메인 build-domain 사이클 몫. ⑤는 `FRANCHISE_LIST`(선택 UI용 목록 조회) **하나만** 소유. 사이드바 "가맹점" 그룹(Store 아이콘, placeholder 4개) 전부 미터치.
- **`FRANCHISE_SALES_YEARLY/MONTHLY/DAILY`**(`/api/franchises/{franchiseId}/sales/...`) — **완전히 다른 aggregate**(`Franchise_daily_sales`, 외부 API/MOCKOON 동기화 배치)이며 매출 **기안**(`SalesDraft`)과 무관. 절대 혼동 금지. 사이드바 "가맹점 > 가맹점 매출" placeholder도 이쪽 자리이므로 미터치.
- **첨부 후처리(미리보기/다운로드/삭제)** — 상세 첨부 영역(F717~F719) ①소유. ⑤의 작성 폼은 업로드 진입만(권고: 상세에서 관리).
- **결재선 협조 결재자(`COOPERATOR`) 역할 지정 UI** — MVP 범위 밖(APPROVER 고정, ②③④선례).
- **테마/다크모드·다국어(i18n)·브라우저 푸시 알림** — 전 도메인 공통 제외.

## ✅ 정합성 검증 체크리스트 (실행 결과)

- 🔍 **커버리지**: F760(T2.1~T2.3 + 배선 T4.1)·F761(T3.3/T3.4 + 배선 T3.1/T4.1)·F762(T1.1/T1.2, 작성·수정 페이지가 소비) — PRD MVP 핵심 기능 3개 전부 ≥1 태스크 매핑 ✅. 지원 배선(`isSalesDraft`=T3.1·`SalesSlot` 확정=T3.1·`SalesDraftBody`=T3.2·`DrafterActions` 분기=T4.1) 태스크화 ✅. 첨부 F716·`DraftDetailResponse`·`EmployeePicker`·`approvalKeys`·본인 empId·문서함 4종·결재대기함은 소비(신규 F 아님) ✅
- 🔍 **역참조**: 모든 태스크가 PRD F760~F762/§페이지별 상세/§FranchisePicker 설계/§참조 계약 매핑/§계약 실측 메모/§Open Questions에 근거 — 발명 태스크 없음 ✅
- 🔍 **의존성**: M1(T1.1→T1.2)·M2(T2.1·T2.2→T2.3)·M3(T3.1·T3.3→T3.2·T3.4)→M4(T4.1) 위상 정렬, 순환 없음. 페이지 티어(T2.3·T3.4)는 T1.2(`FranchisePicker`) 하드 의존. ①/②③④/department 자산은 재구현 없이 소비 전제 ✅
- 🔍 **여정 정합**: 태스크 순서가 PRD 사용자 여정(가맹점 선택 자산→작성→상세[본문·수정])과 정합. 작성/수정 폼이 `FranchisePicker`를 공유 소비하므로 M1 우선(walking-skeleton), "매출 기안 작성" 진입점 배선은 M4에서 합류 ✅
- 🔍 **범위**: PRD 제외 기능(타 유형 슬롯·매출 전용 이력 페이지·가맹점 도메인 본체·`FRANCHISE_SALES_*`·첨부 후처리·협조 결재자·테마/i18n/푸시)은 백로그로만, 태스크화 없음. ⑤는 매출 F760~F762 + 지원 배선만 ✅
- 🔍 **규약**: 계약/전역 규칙(reissue·페이징 `number+1`·403/`ROLE_003` 매핑·`withCredentials`·날짜 dayjs·파일 정책) 재서술 없음, 필드/DTO·body 구조 재설계 없음(스니펫·§참조 계약 매핑·기존 `ApproverParam`으로 위임), URL은 PRD 확정 라우트 + react-router-developer 위임, 견적 강제 없음 ✅

**결과: 6개 항목 전부 통과. ①공통·②일반·③출장·④연가·department 자산 소비 전제로 ⑤매출 F760~F762 + 지원 배선(`isSalesDraft`·`SalesSlot` 확정·`SalesDraftBody`·`[수정]` 분기)을 4개 마일스톤(M1 franchise 슬라이스+FranchisePicker·M2 작성·M3 상세본문+수정·M4 라우팅 통합)·10개 태스크로 전개 완료. 스코프가 작아 ②③④(6마일스톤)보다 압축(과설계 없음). 슬롯 non-null 술어 `isSalesDraft`·`SalesSlot` 구체 타입은 T3.1이 소유·T3.2/T3.4/T4.1이 소비. `FranchisePicker`(T1.2)는 작성/수정 페이지의 공유 하드 의존이라 M1 우선. 공유 파일 3종(router·sidebar·DrafterActions)은 M4 단일 태스크로 통합해 병렬 충돌 회피. Open Q#1(상신 결재선 사전검증)·#2(reportMonth 제약)·#3(status 노출)·#4(첨부 범위) + 신규(`Franchise` 타입 필드)는 비블로킹으로 격리, `SalesSlot` 하위필드는 DTO 소스 대조로 해결 — F760~F762 착수 가능.**
