### 파일 업로드 기본 정책

- 파일 조회/다운로드/미리보기는 `fileId` 기반이며, 항상 소유 도메인 경로 하위에서 처리한다.
  - 미리보기: `GET /api/{도메인}/{ownerId}/files/{fileId}/preview`
  - 다운로드: `GET /api/{도메인}/{ownerId}/files/{fileId}/download`
  - 도메인: `employees`, `drafts`, `boards`, `messages`, `educations`, `meeting-rooms`
- 파일 업로드는 `PATCH` + `multipart/form-data` 방식으로 처리한다. 상세 경로는 `api-endpoint.md`의 FILE API를 따른다.
- 서버 multipart 상한은 애플리케이션 도메인별 검증까지 요청이 도달할 수 있도록 정책상 최대 크기 이상으로 설정한다.
  - 권장 설정: `spring.servlet.multipart.max-file-size: 20MB`
  - 권장 설정: `spring.servlet.multipart.max-request-size: 25MB`



### 도메인별 허용 확장자와 최대 크기


| 도메인                       | 최대 크기 | 허용 확장자                                                                     |
| ------------------------- | ----- | -------------------------------------------------------------------------- |
| `employees` 사원 파일(프로필/서명) | 5MB   | `jpg, jpeg, png`                                                           |
| `meeting-rooms` 회의실 파일    | 10MB  | `jpg, jpeg, png`                                                           |
| `boards` 게시판 첨부           | 20MB  | `pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv, png, jpg, jpeg, gif, zip` |
| `drafts` 기안서 첨부           | 20MB  | 게시판과 동일                                                                    |
| `educations` 교육 첨부        | 20MB  | 게시판과 동일                                                                    |
| `messages` 쪽지 첨부          | 20MB  | 게시판과 동일                                                                    |


- 요약하면 사원/회의실은 이미지 전용이고, 게시판/기안서/교육/쪽지는 문서형 첨부 세트를 사용한다.



### 에러코드

- 파일 검증 위반 시 에러코드는 다음과 같다.
  - MIME 불일치: `FILE_001`
  - 크기 초과: `FILE_002`
  - 확장자 불가: `FILE_003`
  - 파일명 무효: `FILE_004`
  - 파일 미존재: `FILE_005`
- multipart 서버 상한을 초과해 Spring 단계에서 `MaxUploadSizeExceededException`이 발생하는 경우 : `FILE_002`, HTTP 400으로 응답한다.

