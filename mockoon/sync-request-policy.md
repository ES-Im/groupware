# Franchise Sync Request Policy

`Franchise_sync_request`는 Mockoon fake external API에서 수집한 row를 batch/importer 처리 전 단계로 기록합니다.

## Endpoints

| syncType | endpointPath | importer target |
| --- | --- | --- |
| `DAILY_SALES` | `/api/daily-sales` | `FranchiseDailySales` create/replace |
| `INQUIRY` | `/api/inquiries` | `FranchiseInquiry` create/replace/delete intent |
| `EDUCATION_APPLICATION` | `/api/education-applications` | `EducationApplication` create/replace |
| `EDUCATION_APPLICATION_CANCEL` | `/api/education-application-cancellations` | `EducationApplication` cancel |

## Mapping Keys

- `externalId`: 외부 API row 식별자입니다. 가맹점 식별자가 아닙니다.
- `businessNumber`: 가맹점 매핑키입니다.
- `franchiseName`: 검증/로그용 보조값입니다.
- `educationCode`: 교육 신청/취소에서 `Education.id`를 찾기 위한 공개 교육 코드입니다.

## Daily Sales Replacement

현재 도메인에는 일 매출 취소 엔티티와 `DAILY_SALES_CANCEL` sync type이 없습니다. 따라서 취소/정정 시나리오는 `/api/daily-sales` 안에서 동일 `externalId`를 가진 변경 row로 표현하며, importer는 기존 `FranchiseDailySales` 값을 replace 해야 합니다.

## Scenario Rows

fixture에는 importer 실패 경로 검증을 위한 row가 포함됩니다.

- 미등록 가맹점: `businessNumber = 9999999999`
- 미등록 교육 코드: `educationCode = EDU-202512-9999`
- 음수 `salesAmount`
- 음수 `orderCount`
- 음수 `appliedCount`

## Sync Request Creation

각 item 수집 시 `Franchise_sync_request`는 다음 기준으로 생성합니다.

- `syncType`: envelope의 `syncType`
- `endpointPath`: envelope의 `endpointPath`
- `externalId`: item의 `externalId`
- `franchise`: item의 `businessNumber`로 조회한 `Franchise`
- `educationId`: 교육 신청/취소에서 item의 `educationCode`로 조회한 `Education.id`
- 초기 상태: `PENDING`, `retryCount = 0`, `startedAt = null`, `finishedAt = null`