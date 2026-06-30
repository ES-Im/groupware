# Mockoon Franchise Fake API

이 문서는 `mockoon` 패키지의 fake API 산출물과 fixture 데이터를 설명합니다.

## 실행 방법

프로젝트 상위 디렉터리의 `compose.yaml`을 기준으로 실행합니다.

```powershell
cd C:\Users\eunse\localRep\groupware
docker compose up mock-server
```

fixture 또는 Mockoon 환경 파일을 수정한 뒤에는 컨테이너를 재생성합니다.

```powershell
docker compose up -d --force-recreate mock-server
```

Postman 기본 URL은 `http://localhost:3001`입니다.

## API 목록

| SyncType                       | Method | URL                                        |  Items | 설명                           |
|--------------------------------|--------|--------------------------------------------|-------:|------------------------------|
| `DAILY_SALES`                  | GET    | `/api/daily-sales`                         |   2772 | 일 매출 및 동일 externalId 변경 데이터  |
| `INQUIRY`                      | GET    | `/api/inquiries`                           |    256 | 문의 NEW/EDIT/DELETION 데이터     |
| `EDUCATION_APPLICATION`        | GET    | `/api/education-applications`              |     86 | 교육 신청 데이터                    |
| `EDUCATION_APPLICATION_CANCEL` | GET    | `/api/education-application-cancellations` |     17 | 교육 신청 취소 데이터                 |

## Query Parameter 사용 규칙

모든 수집 API는 아래 optional query parameter를 동일하게 지원합니다.

| Parameter    | Required | 설명                                                                 |
|--------------|----------|----------------------------------------------------------------------|
| `externalId` | No       | 각 API row 자체의 외부 식별자입니다. 지정하면 해당 `externalId` item 목록만 반환합니다. |
| `itemIdx`    | No       | fixture 배열 기준 0-based item index입니다. `externalId`와 함께 지정하면 단건 조회로 사용합니다. |

호출 예시는 아래와 같습니다.

```text
GET /api/daily-sales
GET /api/daily-sales?externalId=SALES-1108167890-20250206
GET /api/daily-sales?externalId=SALES-1108167890-20250206&itemIdx=36
```

- query parameter를 생략하면 전체 `items`를 반환합니다.
- `externalId`만 전달하면 해당 `externalId`를 가진 `items`를 배열로 반환합니다.
- `externalId`와 `itemIdx`를 함께 전달하면 정확히 일치하는 item을 0건 또는 1건 배열로 반환합니다.
- Postman에서 `externalId=&itemIdx=`처럼 빈 query parameter가 전송되면 query parameter가 없는 것으로 보고 전체 조회로 처리합니다.
- Mockoon 템플릿에서 query parameter 존재 여부나 lookup key 판단에는 `queryParamRaw`를 사용합니다. `queryParam`은 응답 문자열 출력용으로만 사용합니다.

## 공통 응답 Envelope

모든 수집 API는 아래 구조를 유지합니다.

```json
    {
      requestId: mock-daily-sales-20260629-0001,
      source: MOCKOON_FRANCHISE_API,
      syncType: DAILY_SALES,
      endpointPath: /api/daily-sales,
      generatedAt: 2026-06-29T10:00:00+09:00,
      items: []
    }
```

## 데이터 생성 규칙

- 전체 기간은 `2025-01-01`부터 `2026-12-31`까지입니다.
- 가맹점 매핑키는 `businessNumber`입니다.
- `externalId`는 가맹점 식별자가 아니라 각 API row 자체의 외부 식별자입니다.
- 가맹점 3개는 전체 기간 동안 매일 `daily-sales` 데이터가 있습니다.
- 가맹점 1개는 `2025-06-01`까지만 데이터가 있습니다. 폐업 가정입니다.
- 가맹점 1개는 `2026-07-10`부터 데이터가 있습니다. 현재 시점 영업준비 가정입니다.
- `daily-sales-cancellation` 별도 endpoint는 만들지 않았습니다. 현재 도메인에 별도 취소 엔티티/SyncType이 없으므로 동일 `externalId`의 변경 row로 흡수했습니다.
- `daily-sales` 변경 row는 정상 매출 row 대비 약 0.1 비율로 생성했습니다.
- `inquiry.type`은 `NEW`, `EDIT`, `DELETION`만 사용합니다.
- 실패 시나리오 검증용으로 미등록 사업자번호, 미등록 educationCode, 음수 금액/건수/신청 인원 데이터를 포함했습니다.

## DB Seed용 가맹점 Fixture

아래 가맹점 정보는 importer 테스트 전에 DB에 seed로 넣기 위한 기준 데이터입니다. `apiExternalId`는 fixture 식별용이며, 실제 매핑은 `businessNumber`로 합니다.

| apiExternalId        | businessNumber | franchiseName | activeStart   | activeEnd     | assumption                    |
|----------------------|----------------|---------------|---------------|---------------|-------------------------------|
| `FRAPI-202501-0001`  | `1108167890`   | 하루온 강남점       | `2025-01-01`  | `2026-12-31`  | `active-full-period`          |
| `FRAPI-202501-0002`  | `2148705678`   | 하루온 홍대점       | `2025-01-01`  | `2026-12-31`  | `active-full-period`          |
| `FRAPI-202501-0003`  | `2208812345`   | 하루온 판교점       | `2025-01-01`  | `2026-12-31`  | `active-full-period`          |
| `FRAPI-202501-0004`  | `6178123456`   | 하루온 부산점       | `2025-01-01`  | `2025-06-01`  | `closed-after-2025-06-01`     |
| `FRAPI-202607-0005`  | `6168512345`   | 하루온 제주점       | `2026-07-10`  | `2026-12-31`  | `preparing-before-2026-07-10` |

## DB Seed용 EducationCode Fixture

아래 교육 코드는 importer 테스트 전에 `Education.educationCode`로 seed할 수 있는 기준 데이터입니다.

| educationCode      | educationDate | sequence | periodGroup                 |
|--------------------|---------------|---------:|-----------------------------|
| `EDU-202501-0001`  | `2025-01-15`  |        1 | `2025-01-01_TO_2026-06-29`  |
| `EDU-202502-0002`  | `2025-02-20`  |        2 | `2025-01-01_TO_2026-06-29`  |
| `EDU-202503-0003`  | `2025-03-18`  |        3 | `2025-01-01_TO_2026-06-29`  |
| `EDU-202504-0004`  | `2025-04-22`  |        4 | `2025-01-01_TO_2026-06-29`  |
| `EDU-202505-0005`  | `2025-05-27`  |        5 | `2025-01-01_TO_2026-06-29`  |
| `EDU-202508-0006`  | `2025-08-12`  |        6 | `2025-01-01_TO_2026-06-29`  |
| `EDU-202511-0007`  | `2025-11-05`  |        7 | `2025-01-01_TO_2026-06-29`  |
| `EDU-202601-0008`  | `2026-01-21`  |        8 | `2025-01-01_TO_2026-06-29`  |
| `EDU-202604-0009`  | `2026-04-14`  |        9 | `2025-01-01_TO_2026-06-29`  |
| `EDU-202606-0010`  | `2026-06-25`  |       10 | `2025-01-01_TO_2026-06-29`  |
| `EDU-202607-0011`  | `2026-07-02`  |       11 | `2026-06-30_TO_2026-12-31`  |
| `EDU-202607-0012`  | `2026-07-15`  |       12 | `2026-06-30_TO_2026-12-31`  |
| `EDU-202607-0013`  | `2026-07-29`  |       13 | `2026-06-30_TO_2026-12-31`  |
| `EDU-202608-0014`  | `2026-08-06`  |       14 | `2026-06-30_TO_2026-12-31`  |
| `EDU-202608-0015`  | `2026-08-18`  |       15 | `2026-06-30_TO_2026-12-31`  |
| `EDU-202608-0016`  | `2026-08-31`  |       16 | `2026-06-30_TO_2026-12-31`  |
| `EDU-202609-0017`  | `2026-09-09`  |       17 | `2026-06-30_TO_2026-12-31`  |
| `EDU-202609-0018`  | `2026-09-22`  |       18 | `2026-06-30_TO_2026-12-31`  |
| `EDU-202610-0019`  | `2026-10-03`  |       19 | `2026-06-30_TO_2026-12-31`  |
| `EDU-202610-0020`  | `2026-10-17`  |       20 | `2026-06-30_TO_2026-12-31`  |
| `EDU-202610-0021`  | `2026-10-29`  |       21 | `2026-06-30_TO_2026-12-31`  |
| `EDU-202611-0022`  | `2026-11-04`  |       22 | `2026-06-30_TO_2026-12-31`  |
| `EDU-202611-0023`  | `2026-11-13`  |       23 | `2026-06-30_TO_2026-12-31`  |
| `EDU-202611-0024`  | `2026-11-21`  |       24 | `2026-06-30_TO_2026-12-31`  |
| `EDU-202611-0025`  | `2026-11-30`  |       25 | `2026-06-30_TO_2026-12-31`  |
| `EDU-202612-0026`  | `2026-12-05`  |       26 | `2026-06-30_TO_2026-12-31`  |
| `EDU-202612-0027`  | `2026-12-11`  |       27 | `2026-06-30_TO_2026-12-31`  |
| `EDU-202612-0028`  | `2026-12-18`  |       28 | `2026-06-30_TO_2026-12-31`  |
| `EDU-202612-0029`  | `2026-12-24`  |       29 | `2026-06-30_TO_2026-12-31`  |
| `EDU-202612-0030`  | `2026-12-31`  |       30 | `2026-06-30_TO_2026-12-31`  |

## 산출 파일

| 파일                                                  | 설명                         |
|-----------------------------------------------------|----------------------------|
| `franchise-api.json`                                | Mockoon 환경 export          |
| `franchise-fake-api.postman_collection.json`        | Postman collection         |
| `franchise-fake-api.local.postman_environment.json` | Postman local environment  |
| `data/franchise-seeds.json`                         | 가맹점 seed fixture           |
| `data/education-codes.json`                         | educationCode seed fixture |
| `data/daily-sales.json`                             | 일 매출 및 변경 데이터              |
| `data/inquiries.json`                               | 문의 데이터                     |
| `data/education-applications.json`                  | 교육 신청 데이터                  |
| `data/education-application-cancellations.json`     | 교육 신청 취소 데이터               |
| `sync-request-policy.md`                            | 싱크 요청 생성/해석 정책             |