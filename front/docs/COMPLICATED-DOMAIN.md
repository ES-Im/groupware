# 전자결재 도메인 5분할 — 교차 도메인 얽힘(Entanglement) 취합

> `/dev:build-domain`으로 전자결재 도메인을 5개 관심사(①공통·②일반·③출장·④연가·⑤매출)로 절차 분할해 순차 진행하면서, 각 유형별 PRD가 "이 기능ID가 다른 도메인과 얽혀 있는가"를 확인한 결과를 취합한 문서다. ①②는 얽힘 검토 대상에서 제외(①은 공통 워크플로우 자체, ②는 순수 일반 기안이라 자명). ③④⑤가 검토 대상이었다.

---

## 결론 요약

**③출장·④연가·⑤매출 전부 다른 업무 도메인과 실질적으로 얽혀 있지 않다.** 각 PRD가 `api-endpoint.md` 전수 검색으로 자기 기능ID를 단독 소유함을 확인했다. 유일한 예외는 ⑤매출이 가맹점 선택 UI를 위해 `FRANCHISE_LIST`(가맹점 목록 조회, 읽기 전용) 하나를 참조한다는 점인데, 이마저 신규 `features/franchise` 얇은 슬라이스로 깔끔히 격리되어 "얽힘"이라기보다는 향후 가맹점 도메인 본체가 이어붙일 자리를 미리 잡아둔 것에 가깝다.

즉 이 문서의 실질적인 내용은 (1) 도메인별 "얽힘 없음" 확인 근거 기록, (2) ⑤가 남긴 가맹점 도메인 인수인계 사항, (3) ②③④⑤가 공통으로 지켜야 하는 cross-cutting 규약(엄밀히는 "얽힘"이 아니라 "공유 컨벤션"이지만, 여러 도메인에 걸쳐 있어 한 곳에 모아두는 게 유용하다) 세 가지다.

---

## 1. 도메인별 얽힘 검토 결과

### ③ 출장(BUSINESS_TRIP)

- `api-endpoint.md` 전수 검색 결과 "출장" 관련 기능ID 6개(`BUSINESS_TRIP_DRAFT_CREATE`/`_CREATE_SUBMISSION`/`_UPDATE`/`_PARTICIPANTS_UPDATE`/`MY_BUSINESS_TRIP_REQUEST_HISTORY`/`DEPT_BUSINESS_TRIP_REQUEST_HISTORY`)가 전부이며, **별도의 "개인출장"(경비정산 등) 도메인/기능ID는 존재하지 않는다.**
- ③ PRD가 6개 전부를 단독 소유. 넘길 항목 없음(얽힘 없음).

### ④ 연가(LEAVE)

- `api-endpoint.md` 전수 검색 결과 "휴가/연차/leave" 관련 기능ID 11개(DRAFT/DOCUMENT API 5개 + EMP LEAVE/DEPT API 6개)가 전부이며 ④가 단독 소유.
- 옛 PRD(`docs/prd/6.leave-prd.md`, ①이 없던 시절 작성)가 떠안았던 F606~F611(상세/상신/철회/취소/승인/반려)·F619(결재대기함)는 ①공통이 이미 범용 구현해 재매핑·제거됐다 — 이건 "얽힘"이 아니라 ①이 생기기 전 PRD의 스코프 오류였고, ④가 신규 PRD(`docs/prd/11.leave-draft-prd.md`)로 재작성되며 자연히 해소됐다.
- 근태(attendance) 도메인의 `usePrimaryDeptId`를 소비하지만 이는 기존에 이미 확립된 공용 훅 재사용이지 신규 얽힘이 아니다.

### ⑤ 매출(SALES)

- `SALES_DRAFT_CREATE`/`_CREATE_SUBMISSION`/`_UPDATE` 3개 기능ID를 ⑤가 단독 소유. **매출 기안 전용 이력조회 API는 존재하지 않는다**(LEAVE/BUSINESS_TRIP과 달리 `MY_SALES_*`/`DEPT_SALES_*` 부재) — 이력은 ①의 문서함 4종으로 전량 커버되므로 별도 이력 페이지를 만들지 않았다(스코프가 ②③④보다 작다).
- **유일한 실질적 교차점**: 매출 기안 작성/수정 폼의 `franchiseId`(필수 필드) 입력을 위해 `FRANCHISE_LIST`(`GET /api/franchises`, 가맹점 도메인 소유 조회 API)를 참조해야 했다.
  - **격리 방식**: 신규 `features/franchise` 얇은 슬라이스(`model/franchise.ts`+`queryKeys.ts`, `api/getFranchises.ts`+`useFranchisesQuery.ts`)를 만들고, `features/approval`의 `FranchisePicker` 컴포넌트가 이를 cross-feature import로 소비한다. `features/department`를 `EmployeePicker`(①)가 소비하는 것과 동일한 기존 아키텍처를 그대로 따랐다(사용자 승인 완료된 결정).
  - **⑤가 만든 것은 딱 조회 함수 하나뿐**이다. `FRANCHISE_LIST` 외의 가맹점 관련 기능(`FRANCHISE_DETAIL/CREATE/UPDATE/STATUS_UPDATE/MANAGER_UPDATE/MEMO_*`, `FRANCHISE_EDUCATION_*`, `FRANCHISE_INQUIRY_*`, `FRANCHISE_SALES_YEARLY/MONTHLY/DAILY`)는 전부 범위 밖으로 명시적으로 격리했다 — 아래 §3 참조.
  - **백엔드 도메인 규칙 실측**: `SalesDraftService.findFranchise`는 `franchiseId`의 **존재 여부만** 검증하고 담당자(`Franchise.managerEmpId`) 일치는 검증하지 않는다. 즉 서버는 임의 가맹점을 매출 기안에 지정하는 것을 허용한다 — 이는 버그가 아니라 확인된 설계이므로, 프론트도 "담당 가맹점 우선 노출 + 전체 검색 허용"으로 맞춰 설계했다(과도한 제약을 걸지 않음).

---

## 2. ⑤가 남긴 가맹점 도메인 인수인계 사항

향후 "가맹점" 도메인을 `/dev:build-domain`으로 별도 진행할 때 참고할 것:

- **이미 존재하는 것**: `features/franchise/model/franchise.ts`(`Franchise` 타입 — `id/name/address/ownerName/BusinessStatus/managerEmpId/managerEmpName`, `FRANCHISE_LIST` 응답 실측 기준)·`queryKeys.ts`(`franchiseKeys`, `list` 축만 존재)·`api/getFranchises.ts`+`useFranchisesQuery.ts`. 이 위에 이어붙이면 된다(department 슬라이스와 동형 구조).
- **아직 없는 것**: `FRANCHISE_DETAIL`(상세 조회)·`FRANCHISE_CREATE`·`FRANCHISE_UPDATE`·`FRANCHISE_STATUS_UPDATE`·`FRANCHISE_MANAGER_UPDATE`·`FRANCHISE_MEMO_UPDATE/CLEAR` — 가맹점 CRUD 전부. `FRANCHISE_EDUCATION_*`(교육 캘린더/신청자/등록/수정/활성화)·`FRANCHISE_INQUIRY_*`(문의/답변) 전부.
- **`FRANCHISE_SALES_YEARLY/MONTHLY/DAILY`(`/api/franchises/{franchiseId}/sales/...`)는 매출 "기안"(`SalesDraft`)과 완전히 다른 aggregate**(`Franchise_daily_sales`, 외부 API/MOCKOON 동기화 배치 엔티티 — `createSales`/`replaceSales`로 외부 데이터 기반 생성/교체, 프론트 등록 폼 없음)다. 혼동해서 매출 기안 스코프에 끌어들이지 말 것 — 가맹점 도메인 PRD가 별도로 다뤄야 한다.
- **사이드바 "가맹점" 그룹**(`src/shared/components/sidebarMenuItems.ts`, Store 아이콘, `minRole: FRANCHISE`)에 이미 placeholder 4개(가맹점 관리/가맹점 교육/가맹점 문의/가맹점 매출)가 있다. ⑤는 이 그룹을 전혀 건드리지 않았다(대신 "전자결재" 그룹에 "매출 기안 작성" 1항목만 추가). 가맹점 도메인 착수 시 이 4개 placeholder를 실 라우트로 승격하면 된다.
- **`SalesDraftBody`(상세 본문)가 표시하는 `franchiseName`은 상세조회(`DRAFT_DETAIL`)에만 존재하고 작성/수정 요청 바디에는 없다** — `SalesDraftDetail(Long franchiseId, String franchiseName, YearMonth reportMonth, Long salesAmount)` DTO 구조 참고.

---

## 3. 도메인 간 공유 규약 (얽힘이 아니라 일관성 유지용 컨벤션)

②③④⑤ 전체에 걸쳐 반복 적용된 규약들. 새 기안 유형이 추가되면(현재는 GENERAL/LEAVE/BUSINESS_TRIP/SALES 4종이 전부) 아래 규약을 그대로 따르면 된다.

### 3.1 유형 판별 = 슬롯-null (draftType 문자열 비교 금지)

`DRAFT_DETAIL` 응답의 `draftType`은 백엔드 `getClass().getSimpleName()` 값이라 스니펫에 박힌 문자열(`"BUSINESS_TRIP"` 등)이 outdated할 수 있다. 대신 `draft.leave`/`draft.businessTrip`/`draft.sales`/`draft.sourceDraftId`(취소기안) 중 **어느 슬롯이 non-null인지**로 유형을 판별한다. 일반 기안은 이 4개가 전부 null.

- `lib/isGeneralDraft.ts`(①) · `isBusinessTripDraft.ts`(③) · `isLeaveDraft.ts`(④) · `isSalesDraft.ts`(⑤) — 전부 이 패턴.

### 3.2 `DraftTypeBody` 확장 포인트 패턴

①이 만든 상세 본문 조립 컴포넌트(`components/detail/DraftTypeBody.tsx`)는 슬롯별 분기를 갖고 있고, 처음엔 GENERAL만 실제 렌더하고 나머지는 `TypeSlotFallback`("준비 중") 폴백이었다. ③④⑤가 각자 자기 슬롯 분기만 실제 컴포넌트(`BusinessTripDraftBody`/`LeaveDraftBody`/`SalesDraftBody`)로 교체했다. `TypeSlotFallback`은 이제 소스에 잔여 참조가 없다(4종 전부 실제 컴포넌트로 교체 완료).

### 3.3 `DrafterActions.handleEdit` 분기 소유권 규약

①의 상세 페이지 기안자 액션(`components/detail/DrafterActions.tsx`)의 `[수정]` 버튼 핸들러는 유형별로 다른 페이지로 이동해야 한다. 규약: **각 유형 PRD가 자기 분기 하나씩만 추가**하고, 항상 마지막 fallback(토스트 "준비 중") 앞에 순서대로 쌓는다.

```
isGeneralDraft → isBusinessTripDraft → isLeaveDraft → isSalesDraft → fallback
```

슬롯이 상호 배타적이므로(한 기안은 leave/businessTrip/sales 중 최대 하나만 non-null) 분기 순서 자체는 안전하며, 이 배선은 **항상 그 유형의 마지막 마일스톤(라우팅 통합)이 전담**하고 병렬로 실행되는 다른 마일스톤은 이 파일을 건드리지 않는다(공유 파일 충돌 방지).

### 3.4 결재대기함은 "전자결재" 그룹 소유

`결재대기함`(`badgeKey: 'approvalPending'`)은 ①이 "전자결재" 사이드바 그룹에 이미 배선했다. 유형별 PRD(④가 "휴가 관리" 그룹을, ⑤는 해당 없음)가 자기 사이드바 그룹의 placeholder를 실 라우트로 승격할 때, 결재대기함류 공용 문서함 항목을 **자기 그룹에 재추가하지 않는다**.

### 3.5 Picker 계열 컴포넌트(EmployeePicker/FranchisePicker) 컨벤션

제어형(`selected`/`onChange` props, 상태는 소비처가 소유) · 디바운스 300ms 검색 · 넉넉한 단일 페이지(`size≈50`) + `!last`면 "검색으로 좁혀주세요" 안내. `FranchisePicker`(⑤)는 `EmployeePicker`(①)의 이 구조를 그대로 복제했다. 참고: 두 Picker 모두 쿼리 에러 시 sonner 토스트로 surface하지 않고 empty-state로만 보이는 공통 한계가 있다(리뷰에서 advisory로 확인됨, 두 Picker 공통 이슈라 개별 수정 보류 — 필요해지면 두 곳을 함께 고칠 것).

### 3.6 year/숫자 필터 디바운스 규약

연도 등 숫자 필터 입력은 keyword 검색과 동일하게 로컬 입력값 + 300ms 디바운스 확정 state 분리로 구현한다(`<input type="number">`를 즉시 `onChange`로 바인딩 금지). ④에서 3개 마일스톤이 독립적으로 동일 안티패턴을 재현한 뒤 통일 수정한 사례가 있다.

---

## 4. 검토하지 않은 것 (범위 밖 확인)

- **①공통·②일반**은 애초에 다른 업무 도메인을 참조하지 않는 순수 워크플로우/평탄 구조라 얽힘 검토 대상이 아니었다.
- 이 문서는 **전자결재 도메인 5분할** 범위에서 발견된 얽힘만 다룬다. 다른 도메인(근태·게시판·채팅·조직도 등) 간 얽힘은 각자 별도 build-domain 사이클에서 필요 시 별도 문서화한다.
