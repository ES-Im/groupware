# API / QueryRepository Map

작성 기준:
- 원본: `C:\Users\eunse\localRep\HARUON_Repectoring\src\main\java\com\haruon\groupware\**\controller`, `**\rest`, `**\mapper`
- 리팩터링 방향: 
  - React REST API 
  - hexagonal architecture 
  - JPA/JPQL QueryRepository adapter


- 목록, 검색, 통계, 화면 조합 DTO는 `application/{domain}/required/*QueryRepository`
- `adapter/persistence/*QueryRepositoryAdapter`에서 JPQL로 구현

## REST API 초안

### 인증

| Method | URL | 설명 | 권한 | Request | Response | 주요 예외 |
|---|---|---|---|---|---|---|
| POST | `./auth/login` | 로그인 | permitAll | `LoginRequest` | `LoginResponse` | `INVALID_CREDENTIALS`, `INACTIVE_EMP` |
| POST | `./auth/reissue` | access token 재발급 | permitAll(refresh cookie) | 없음 | `TokenResponse` | `INVALID_REFRESH_TOKEN` |
| POST | `./auth/logout` | 로그아웃 | authenticated | 없음 | 없음 | `UNAUTHORIZED` |
| GET | `./auth/me/param={}` | 현재 로그인 사용자 조회 | authenticated | 없음 | `CurrentUserResponse` | `UNAUTHORIZED` |

### 사원/부서/공통

| Method | URL                                                  | 설명                  | 권한                 | Request                         | Response                           | 주요 예외                                                        |
|--------|------------------------------------------------------|---------------------|--------------------|---------------------------------|------------------------------------|--------------------------------------------------------------|
| POST   | `./users`                                            | 사원 self 등록          | permitAll          | `EmpRegisterRequest`            | 없음                                 |  `DUPLICATE_LOGIN_ID`, `DUPLICATE_EMP_NO`, `INVALID_REQUEST` |
| GET    | `./users/me/param={}`                                | 개인정보 조회             | EMPLOYEE           | 없음                              | `EmpInfoResponse`                  | `UNAUTHORIZED`                                               |
| PATCH  | `./users/me`                                         | 자기 개인정보 수정          | EMPLOYEE           | `EmpUpdateRequestBySelf`        | 없음                                 | `EMP_NOT_FOUND`, `INVALID_PASSWORD`                          |
| PATCH  | `./users/me/files`                                   | 자기 사원 파일 추가/교체      | EMPLOYEE           | `EmpFileReplaceParam`           | 없음                                 | `UNSUPPORTED_FILE_EXTENSION`, `FILE_SIZE_LIMIT_EXCEEDED`     |
| PATCH  | `./users/me/files/{fileId}/active-status`            | 자기 사원 파일 활성 상태 변경   | EMPLOYEE           | `EmpFileStatusChangeParam`      | 없음                                 | `FILE_NOT_FOUND`                                             |
| DELETE | `./users/me/files/{fileId}`                          | 자기 사원 파일 삭제         | EMPLOYEE           | 없음                              | 없음                                 | `FILE_NOT_FOUND`                                             |
| GET    | `./users/param={deptId,status,keyword,page,size}`    | 사원 목록 조회            | HR 또는 DEPT_MANAGER | 없음                              | `PageResponse<EmpSummaryResponse>` | `ACCESS_DENIED`                                              |
| GET    | `./users/new/param={page,size}`                      | 신규 등록 사원 목록 조회      | HR                 | 없음                              | `PageResponse<EmpSummaryResponse>` | `ACCESS_DENIED`                                              |
| GET    | `./users/{empId}/profile-file/param={}`              | 사원 프로필 파일 조회        | authenticated      | 없음                              | `FileResponse`                     | `FILE_NOT_FOUND`                                             |
| GET    | `./users/{empId}/sign-file/param={}`                 | 사원 서명 파일 조회         | authenticated      | 없음                              | `FileResponse`                     | `FILE_NOT_FOUND`                                             |
| PATCH  | `./users/{empId}/registration-approval`              | HR 사원 등록 승인         | HR                 | `EmpUpdateRequestByHR`          | 없음                                 | `EMP_NOT_FOUND`, `INVALID_EMP_STATUS`                        |
| PATCH  | `./users/{empId}/resignation`                        | HR 사원 퇴직 처리         | HR                 | `EmpUpdateRequestByHR`          | 없음                                 | `EMP_NOT_FOUND`, `INVALID_RESIGN_DATE`                       |
| PATCH  | `./users/{empId}/hr`                                 | HR 사원 정보 수정         | HR                 | `EmpUpdateRequestByHR`          | 없음                                 | `EMP_NOT_FOUND`, `DUPLICATE_LOGIN_ID`                        |
| PATCH  | `./users/{empId}/activation`                         | HR 사원 활성화           | HR                 | 없음                              | 없음                                 | `EMP_NOT_FOUND`, `EMP_ALREADY_ACTIVE`                        |
| PATCH  | `./users/{empId}/files/active-status`                | HR 사원 파일 활성 상태 변경   | HR                 | `EmpUpdateRequestByHR`          | 없음                                 | `EMP_NOT_FOUND`, `FILE_NOT_FOUND`                            |
| PATCH  | `./users/{empId}/dept-manager`                       | 부서장이 같은 부서 사원 정보 수정 | DEPT_MANAGER       | `EmpUpdateRequestByDeptManager` | 없음                                 | `DEPARTMENT_MISMATCH`, `ACCESS_DENIED`                       |
| GET    | `./depts/param={activeOnly}`                         | 부서 목록 조회            | authenticated      | 없음                              | `List<DeptResponse>`               | 없음                                                           |
| GET    | `./depts/chart/param={}`                             | 조직도 조회              | authenticated      | 없음                              | `DeptTreeResponse`                 | 없음                                                           |
| GET    | `./depts/{deptId}/employees/param={includeInactive}` | 부서 소속 사원 조회         | authenticated      | 없음                              | `List<EmpSummaryResponse>`         | `DEPT_NOT_FOUND`                                             |
| POST   | `./depts`                                            | 부서 등록               | ADMIN              | `DeptRegisterRequest`           | 없음                                 | `DUPLICATE_DEPT`, `ACCESS_DENIED`                            |
| PATCH  | `./depts/{deptId}/activation`                        | 부서 활성화              | ADMIN              | 없음                              | 없음                                 | `DEPT_NOT_FOUND`                                             |
| PATCH  | `./depts/{deptId}/deactivation`                      | 부서 비활성화             | ADMIN              | 없음                              | 없음                                 | `DEPT_NOT_FOUND`                                             |
| PATCH  | `./depts/{deptId}/name`                              | 부서명 변경              | ADMIN              | `DeptNameChangeRequest`         | 없음                                 | `DEPT_NOT_FOUND`, `DUPLICATE_DEPT`                           |
| GET    | `./common-codes/param={parentCode}`                  | 공통코드 목록 조회          | authenticated      | 없음                              | `List<CommonCodeResponse>`         | 없음                                                           |
| GET    | `./company/param={}`                                 | 회사 정보 조회            | authenticated      | 없음                              | `CompanyResponse`                  | 없음                                                           |

### 근태/휴가 현황

| Method | URL | 설명 | 권한 | Request | Response | 주요 예외 |
|---|---|---|---|---|---|---|
| GET | `./attendances/me/param={yearMonth}` | 내 월별 근태 조회 | EMPLOYEE | 없음 | `List<AttendanceResponse>` | 없음 |
| GET | `./attendances/depts/{deptId}/param={yearMonth}` | 부서 월별 근태 조회 | DEPT_MANAGER | 없음 | `List<AttendanceResponse>` | `DEPARTMENT_MISMATCH` |
| GET | `./attendances/{empId}/param={date}` | 사원 일자별 근태 조회 | EMPLOYEE 또는 DEPT_MANAGER | 없음 | `AttendanceResponse` | `EMP_NOT_FOUND` |
| POST | `./attendances/check-in` | 출근 기록 | EMPLOYEE | `CheckInRequest` | 없음 | `DUPLICATE_ATTENDANCE`, `DOMAIN_STATE_VIOLATION` |
| PATCH | `./attendances/check-out` | 퇴근 기록 | EMPLOYEE | `CheckOutRequest` | 없음 | `CHECK_IN_RECORD_NOT_FOUND` |
| PATCH | `./attendances/{attendanceId}/check-out` | 퇴근 재기록 | EMPLOYEE | `CheckOutRequest` | 없음 | `ATTENDANCE_NOT_FOUND`, `ATTENDANCE_EMP_MISMATCH` |
| POST | `./attendances/closing` | 근태 마감 | batch 또는 ADMIN | `AttendanceCloseParam` | `AttendanceCloseResult` | `DOMAIN_STATE_VIOLATION` |
| PATCH | `./attendances/{attendanceId}` | 부서장 근태 수정 | DEPT_MANAGER | `EditAttendanceByDeptManagerParam` | 없음 | `DEPARTMENT_MISMATCH`, `CLOSED_ATTENDANCE_EDIT_FORBIDDEN` |
| PATCH | `./attendances/{attendanceId}/approval` | 부서장 근태 수정 승인 | DEPT_MANAGER | `ApproveAttendanceByDeptManagerParam` | 없음 | `DEPARTMENT_MISMATCH`, `ATTENDANCE_NOT_FOUND` |
| GET | `./business-trips/me/param={yearMonth}` | 내 월별 출장 조회 | EMPLOYEE | 없음 | `List<BusinessTripResponse>` | 없음 |
| GET | `./business-trips/depts/{deptId}/param={yearMonth}` | 부서 월별 출장 조회 | DEPT_MANAGER | 없음 | `List<BusinessTripResponse>` | `DEPARTMENT_MISMATCH` |
| GET | `./leaves/me/param={yearMonth}` | 내 월별 휴가 조회 | EMPLOYEE | 없음 | `List<LeaveResponse>` | 없음 |
| GET | `./leaves/depts/{deptId}/param={yearMonth}` | 부서 월별 휴가 조회 | DEPT_MANAGER | 없음 | `List<LeaveResponse>` | `DEPARTMENT_MISMATCH` |
| GET | `./leaves/me/summary/param={year}` | 내 휴가 합계/사용률 조회 | EMPLOYEE | 없음 | `LeaveSummaryResponse` | 없음 |
| GET | `./leaves/depts/{deptId}/summary/param={year}` | 부서 휴가 합계/사용률 조회 | DEPT_MANAGER | 없음 | `List<LeaveSummaryResponse>` | `DEPARTMENT_MISMATCH` |
| GET | `./leaves/company/usage-rate/param={year}` | 회사 휴가 사용률 조회 | HR | 없음 | `LeaveUsageRateResponse` | `ACCESS_DENIED` |
| PATCH | `./emp-leaves/{empId}/special-grant-days` | 특별휴가 조정 | HR | `LeaveGrantAdjustRequest` | 없음 | `EMP_ANNUAL_LEAVE_NOT_FOUND` |
| PATCH | `./emp-leaves/{empId}/compensatory-grant-days` | 대체휴무 조정 | HR | `LeaveGrantAdjustRequest` | 없음 | `EMP_ANNUAL_LEAVE_NOT_FOUND` |

### 기안/결재

| Method | URL | 설명 | 권한 | Request | Response | 주요 예외 |
|---|---|---|---|---|---|---|
| GET | `./drafts/mine/param={keyword,page,size}` | 내 기안함 조회 | EMPLOYEE | 없음 | `PageResponse<DraftSummaryResponse>` | 없음 |
| GET | `./drafts/approvals/param={keyword,page,size}` | 결재함 조회 | EMPLOYEE | 없음 | `PageResponse<DraftSummaryResponse>` | 없음 |
| GET | `./drafts/refers/param={keyword,page,size}` | 참조/공람함 조회 | EMPLOYEE | 없음 | `PageResponse<DraftSummaryResponse>` | 없음 |
| GET | `./drafts/{draftId}/param={}` | 기안 공통 상세 조회 | EMPLOYEE | 없음 | `DraftDetailResponse` | `DRAFT_NOT_FOUND` |
| GET | `./drafts/general/{draftId}/param={}` | 일반 기안 상세 조회 | EMPLOYEE | 없음 | `GeneralDraftDetailResponse` | `DRAFT_NOT_FOUND`, `DRAFT_TYPE_MISMATCH` |
| GET | `./drafts/leave/{draftId}/param={}` | 휴가 기안 상세 조회 | EMPLOYEE | 없음 | `LeaveDraftDetailResponse` | `DRAFT_NOT_FOUND`, `DRAFT_TYPE_MISMATCH` |
| GET | `./drafts/leave-cancel/{draftId}/param={}` | 휴가 취소 기안 상세 조회 | EMPLOYEE | 없음 | `LeaveCancelDraftDetailResponse` | `DRAFT_NOT_FOUND`, `DRAFT_TYPE_MISMATCH` |
| GET | `./drafts/business-trip/{draftId}/param={}` | 출장 기안 상세 조회 | EMPLOYEE | 없음 | `BusinessTripDraftDetailResponse` | `DRAFT_NOT_FOUND`, `DRAFT_TYPE_MISMATCH` |
| GET | `./drafts/business-trip-cancel/{draftId}/param={}` | 출장 취소 기안 상세 조회 | EMPLOYEE | 없음 | `BusinessTripCancelDraftDetailResponse` | `DRAFT_NOT_FOUND`, `DRAFT_TYPE_MISMATCH` |
| GET | `./drafts/sales/{draftId}/param={}` | 매출보고 기안 상세 조회 | EMPLOYEE | 없음 | `SalesDraftDetailResponse` | `DRAFT_NOT_FOUND`, `DRAFT_TYPE_MISMATCH` |
| GET | `./drafts/{draftId}/files/param={}` | 기안 첨부파일 목록 조회 | EMPLOYEE | 없음 | `List<DraftFileResponse>` | `DRAFT_NOT_FOUND` |
| GET | `./approvals/line-candidates/param={deptId,excludeEmpId}` | 결재선 후보 사원 조회 | EMPLOYEE | 없음 | `List<EmpSummaryResponse>` | `DEPT_NOT_FOUND` |
| GET | `./approvals/main-summary/param={empId}` | 메인 화면 결재 요약 조회 | EMPLOYEE | 없음 | `ApprovalMainSummaryResponse` | 없음 |
| POST | `./drafts/general` | 일반 기안 임시 작성 | EMPLOYEE | `CommonDraftCreateRequest` | 없음 | `APPROVAL_LINE_REQUIRED` |
| POST | `./drafts/general/submissions` | 일반 기안 작성 후 상신 | EMPLOYEE | `CommonDraftCreateRequest` | 없음 | `APPROVAL_LINE_REQUIRED` |
| PATCH | `./drafts/general/{draftId}` | 일반 기안 수정 | EMPLOYEE | `CommonDraftUpdateRequest` | 없음 | `DRAFT_NOT_FOUND` |
| POST | `./drafts/leave` | 휴가 기안 임시 작성 | EMPLOYEE | `LeaveDraftCreateRequest` | 없음 | `INSUFFICIENT_LEAVE_BALANCE` |
| POST | `./drafts/leave/submissions` | 휴가 기안 작성 후 상신 | EMPLOYEE | `LeaveDraftCreateRequest` | 없음 | `INSUFFICIENT_LEAVE_BALANCE` |
| PATCH | `./drafts/leave/{draftId}` | 휴가 기안 수정 | EMPLOYEE | `LeaveDraftUpdateRequest` | 없음 | `DRAFT_NOT_FOUND`, `INSUFFICIENT_LEAVE_BALANCE` |
| POST | `./drafts/leave-cancel` | 휴가 취소 기안 임시 작성 | EMPLOYEE | `CancelDraftCreateRequest` | 없음 | `DRAFT_NOT_APPROVED` |
| POST | `./drafts/leave-cancel/submissions` | 휴가 취소 기안 작성 후 상신 | EMPLOYEE | `CancelDraftCreateRequest` | 없음 | `DRAFT_NOT_APPROVED` |
| POST | `./drafts/leave-cancel/{draftId}/approvals` | 휴가 취소 기안 승인 | EMPLOYEE | `ApprovalProcessRequest` | 없음 | `DRAFT_NOT_FOUND`, `ACCESS_DENIED` |
| POST | `./drafts/business-trip` | 출장 기안 임시 작성 | EMPLOYEE | `BusinessTripDraftCreateRequest` | 없음 | `INVALID_REQUEST` |
| POST | `./drafts/business-trip/submissions` | 출장 기안 작성 후 상신 | EMPLOYEE | `BusinessTripDraftCreateRequest` | 없음 | `APPROVAL_LINE_REQUIRED` |
| PATCH | `./drafts/business-trip/{draftId}` | 출장 기안 수정 | EMPLOYEE | `BusinessTripDraftUpdateRequest` | 없음 | `DRAFT_NOT_FOUND` |
| PUT | `./drafts/business-trip/{draftId}/participants` | 출장 참가자 교체 | EMPLOYEE | `ParticipantReplaceRequest` | 없음 | `DRAFT_NOT_FOUND` |
| POST | `./drafts/business-trip-cancel` | 출장 취소 기안 임시 작성 | EMPLOYEE | `CancelDraftCreateRequest` | 없음 | `DRAFT_NOT_APPROVED` |
| POST | `./drafts/business-trip-cancel/submissions` | 출장 취소 기안 작성 후 상신 | EMPLOYEE | `CancelDraftCreateRequest` | 없음 | `DRAFT_NOT_APPROVED` |
| POST | `./drafts/business-trip-cancel/{draftId}/approvals` | 출장 취소 기안 승인 | EMPLOYEE | `ApprovalProcessRequest` | 없음 | `DRAFT_NOT_FOUND`, `ACCESS_DENIED` |
| POST | `./drafts/sales` | 매출보고 기안 임시 작성 | FRANCHISE | `SalesDraftCreateRequest` | 없음 | `ACCESS_DENIED` |
| POST | `./drafts/sales/submissions` | 매출보고 기안 작성 후 상신 | FRANCHISE | `SalesDraftCreateRequest` | 없음 | `APPROVAL_LINE_REQUIRED` |
| PATCH | `./drafts/sales/{draftId}` | 매출보고 기안 수정 | FRANCHISE | `SalesDraftUpdateRequest` | 없음 | `DRAFT_NOT_FOUND` |
| PATCH | `./drafts/{draftId}/revert` | 상신 취소 후 미상신 상태로 되돌림 | EMPLOYEE | 없음 | 없음 | `DRAFT_NOT_FOUND`, `DOMAIN_STATE_VIOLATION` |
| POST | `./drafts/{draftId}/submissions` | 기존 기안 상신 | EMPLOYEE | `DraftSubmitRequest` | 없음 | `APPROVAL_LINE_REQUIRED` |
| POST | `./drafts/{draftId}/approvals` | 기안 승인 | EMPLOYEE | `ApprovalProcessRequest` | 없음 | `ACCESS_DENIED`, `DOMAIN_STATE_VIOLATION` |
| POST | `./drafts/{draftId}/rejections` | 기안 반려 | EMPLOYEE | `RejectRequest` | 없음 | `ACCESS_DENIED`, `DOMAIN_STATE_VIOLATION` |
| POST | `./drafts/{draftId}/circulations` | 공람자 추가 | EMPLOYEE | `CirculationRequest` | 없음 | `DRAFT_NOT_FOUND` |
| DELETE | `./drafts/{draftId}/circulations/{empId}` | 공람자 제거 | EMPLOYEE | 없음 | 없음 | `DRAFT_NOT_FOUND` |
| POST | `./drafts/{draftId}/files` | 기안 첨부파일 추가 | EMPLOYEE | `DraftFileCreateRequest` | 없음 | `DRAFT_NOT_FOUND` |
| DELETE | `./drafts/{draftId}/files/{fileId}` | 기안 첨부파일 제거 | EMPLOYEE | 없음 | 없음 | `DRAFT_NOT_FOUND`, `FILE_NOT_FOUND` |

### 게시판

| Method | URL | 설명 | 권한 | Request | Response | 주요 예외 |
|---|---|---|---|---|---|---|
| GET | `./boards/param={categoryId,keyword,page,size}` | 게시글 목록 조회 | authenticated | 없음 | `PageResponse<BoardSummaryResponse>` | 없음 |
| GET | `./boards/home/param={limit}` | 홈 게시글 요약 조회 | authenticated | 없음 | `List<BoardSummaryResponse>` | 없음 |
| GET | `./boards/notices/param={keyword,page,size}` | 공지 목록 조회 | authenticated | 없음 | `PageResponse<BoardSummaryResponse>` | 없음 |
| GET | `./boards/notices/home/param={limit}` | 홈 공지 요약 조회 | authenticated | 없음 | `List<BoardSummaryResponse>` | 없음 |
| GET | `./boards/{boardId}/param={}` | 게시글 상세 조회 | authenticated | 없음 | `BoardDetailResponse` | `BOARD_NOT_FOUND` |
| GET | `./boards/{boardId}/comments/param={page,size}` | 댓글 목록 조회 | authenticated | 없음 | `PageResponse<CommentResponse>` | `BOARD_NOT_FOUND` |
| GET | `./boards/{boardId}/files/param={}` | 게시글 첨부파일 목록 조회 | authenticated | 없음 | `List<BoardFileResponse>` | `BOARD_NOT_FOUND` |
| GET | `./boards/{boardId}/reaction-count/param={}` | 댓글/좋아요 수 조회 | authenticated | 없음 | `BoardReactionCountResponse` | `BOARD_NOT_FOUND` |
| POST | `./boards` | 게시글 임시 작성 | EMPLOYEE | `BoardCreateRequest` | `CreatedIdResponse` | `CATEGORY_NOT_FOUND` |
| POST | `./boards/{boardId}/publication` | 게시글 발행 | EMPLOYEE | `PublishBoardRequest` | 없음 | `BOARD_NOT_FOUND`, `ACCESS_DENIED` |
| PATCH | `./boards/{boardId}` | 게시글 수정 | EMPLOYEE | `BoardUpdateRequest` | 없음 | `BOARD_NOT_FOUND`, `ACCESS_DENIED` |
| POST | `./boards/{boardId}/files` | 게시글 파일 추가 | EMPLOYEE | `BoardFileRequest` | 없음 | `BOARD_NOT_FOUND`, `ACCESS_DENIED` |
| DELETE | `./boards/{boardId}/files/{fileId}` | 게시글 파일 삭제 | EMPLOYEE | 없음 | 없음 | `BOARD_NOT_FOUND`, `FILE_NOT_FOUND` |
| POST | `./boards/{boardId}/views` | 게시글 조회수 증가 | authenticated | `ReactionCountRequest` | 없음 | `BOARD_NOT_FOUND` |
| POST | `./boards/{boardId}/likes` | 게시글 좋아요 | EMPLOYEE | 없음 | 없음 | `BOARD_NOT_FOUND` |
| DELETE | `./boards/{boardId}/likes` | 게시글 좋아요 취소 | EMPLOYEE | 없음 | 없음 | `BOARD_NOT_FOUND` |
| POST | `./boards/{boardId}/comments` | 댓글 작성 | EMPLOYEE | `CommentCreateRequest` | `CreatedIdResponse` | `BOARD_NOT_FOUND` |
| POST | `./comments/{commentId}/replies` | 대댓글 작성 | EMPLOYEE | `CommentCreateRequest` | `CreatedIdResponse` | `COMMENT_NOT_FOUND` |
| PATCH | `./comments/{commentId}` | 댓글 수정 | EMPLOYEE | `CommentUpdateRequest` | 없음 | `COMMENT_NOT_FOUND`, `ACCESS_DENIED` |
| DELETE | `./comments/{commentId}` | 댓글 삭제 | EMPLOYEE | 없음 | 없음 | `COMMENT_NOT_FOUND`, `ACCESS_DENIED` |
| GET | `./board-categories/param={activeOnly}` | 게시판 카테고리 목록 조회 | authenticated | 없음 | `List<CategoryResponse>` | 없음 |
| POST | `./board-categories` | 게시판 카테고리 등록 | ADMIN | `CategoryCreateRequest` | `CreatedIdResponse` | `DUPLICATE_CATEGORY` |
| PATCH | `./board-categories/{categoryId}/name` | 게시판 카테고리명 변경 | ADMIN | `CategoryNameChangeRequest` | 없음 | `CATEGORY_NOT_FOUND` |
| PATCH | `./board-categories/{categoryId}/show` | 게시판 카테고리 노출 | ADMIN | 없음 | 없음 | `CATEGORY_NOT_FOUND` |
| PATCH | `./board-categories/{categoryId}/hide` | 게시판 카테고리 숨김 | ADMIN | 없음 | 없음 | `CATEGORY_NOT_FOUND` |

### 채팅

| Method | URL | 설명 | 권한 | Request | Response | 주요 예외 |
|---|---|---|---|---|---|---|
| GET | `./chatrooms/param={empId}` | 내 채팅방 목록 조회 | EMPLOYEE | 없음 | `List<ChatRoomSummaryResponse>` | 없음 |
| GET | `./chatrooms/{roomId}/param={empId}` | 채팅방 정보 조회 | EMPLOYEE | 없음 | `ChatRoomResponse` | `CHAT_ROOM_NOT_FOUND`, `ACCESS_DENIED` |
| GET | `./chatrooms/{roomId}/messages/param={cursor,size}` | 채팅 대화 조회 | EMPLOYEE | 없음 | `SliceResponse<ChatMessageResponse>` | `CHAT_ROOM_NOT_FOUND`, `ACCESS_DENIED` |
| GET | `./chatrooms/{roomId}/members/param={}` | 채팅방 참여자 조회 | EMPLOYEE | 없음 | `List<ChatMemberResponse>` | `CHAT_ROOM_NOT_FOUND`, `ACCESS_DENIED` |
| GET | `./chatrooms/direct/param={empId,otherEmpId}` | 1:1 채팅방 존재 여부 조회 | EMPLOYEE | 없음 | `DirectChatRoomResponse` | 없음 |
| GET | `./chatrooms/unread-count/param={empId}` | 미읽음 채팅 수 조회 | EMPLOYEE | 없음 | `UnreadCountResponse` | 없음 |
| POST | `./chatrooms` | 채팅방 생성 | EMPLOYEE | `ChatRoomCreateRequest` | `CreatedIdResponse` | `EMP_NOT_FOUND` |
| POST | `./chatrooms/{roomId}/members` | 채팅방 멤버 초대 | EMPLOYEE | `ChatRoomInviteRequest` | 없음 | `CHAT_ROOM_NOT_FOUND`, `ACCESS_DENIED` |
| PATCH | `./chatrooms/{roomId}/display-name` | 멤버별 채팅방 표시 이름 변경 | EMPLOYEE | `ChatRoomDisplayNameRequest` | 없음 | `CHAT_ROOM_NOT_FOUND`, `ACCESS_DENIED` |
| POST | `./chatrooms/{roomId}/leave` | 채팅방 나가기 | EMPLOYEE | 없음 | 없음 | `CHAT_ROOM_NOT_FOUND`, `ACCESS_DENIED` |
| POST | `./chatrooms/{roomId}/bookmark` | 채팅방 북마크 | EMPLOYEE | 없음 | 없음 | `CHAT_ROOM_NOT_FOUND`, `ACCESS_DENIED` |
| DELETE | `./chatrooms/{roomId}/bookmark` | 채팅방 북마크 해제 | EMPLOYEE | 없음 | 없음 | `CHAT_ROOM_NOT_FOUND`, `ACCESS_DENIED` |
| PATCH | `./chatrooms/{roomId}/latest-read-message` | 마지막 읽은 채팅 갱신 | EMPLOYEE | `LatestReadMessageRequest` | 없음 | `CHAT_ROOM_NOT_FOUND`, `CHAT_NOT_FOUND` |
| POST | `./chatrooms/{roomId}/messages` | 채팅 메시지 전송 | EMPLOYEE | `ChatMessageSendRequest` | `CreatedIdResponse` | `CHAT_ROOM_NOT_FOUND`, `ACCESS_DENIED` |

### 일정/회의실

| Method | URL | 설명 | 권한 | Request | Response | 주요 예외 |
|---|---|---|---|---|---|---|
| GET | `./schedules/calendar/param={empId,from,to}` | 캘린더 일정 목록 조회 | EMPLOYEE | 없음 | `List<ScheduleCalendarResponse>` | 없음 |
| GET | `./schedules/{scheduleId}/param={}` | 일정 상세 조회 | EMPLOYEE | 없음 | `ScheduleDetailResponse` | `SCHEDULE_NOT_FOUND` |
| GET | `./schedules/{scheduleId}/participants/param={}` | 일정 참여자 조회 | EMPLOYEE | 없음 | `List<EmpSummaryResponse>` | `SCHEDULE_NOT_FOUND` |
| POST | `./schedules` | 수기 일정 등록 | EMPLOYEE | `ManualScheduleParam` | `CreatedSourceKeyResponse` | `INVALID_REQUEST` |
| POST | `./schedules/{scheduleId}/participants/param={bulk}` | 일정 참가자 추가 | EMPLOYEE | `ScheduleParticipantsRequest` | 없음 | `SCHEDULE_NOT_FOUND`, `EDIT_FORBIDDEN_SCHEDULE` |
| DELETE | `./schedules/{scheduleId}/participants/param={bulk}` | 일정 참가자 제거 | EMPLOYEE | `ScheduleParticipantsRequest` | 없음 | `SCHEDULE_NOT_FOUND`, `EDIT_FORBIDDEN_SCHEDULE` |
| PATCH | `./schedules/{scheduleId}/param={bulk}` | 수기 일정 수정 | EMPLOYEE | `ManualScheduleParam` | 없음 | `SCHEDULE_NOT_FOUND`, `NOT_MANUAL_SCHEDULE` |
| DELETE | `./schedules/{scheduleId}/param={bulk}` | 일정 취소 | EMPLOYEE | 없음 | 없음 | `SCHEDULE_NOT_FOUND`, `EDIT_FORBIDDEN_SCHEDULE` |
| POST | `./meetings` | 회의실 예약 | EMPLOYEE | `MeetingReserveRequest` | `CreatedIdResponse` | `MEETING_ROOM_NOT_FOUND`, `INACTIVATED_MEETING_ROOM` |
| PUT | `./meetings/{meetingId}/participants` | 회의 참가자 교체 | EMPLOYEE | `MeetingParticipantsReplaceRequest` | 없음 | `MEETING_NOT_FOUND`, `ACCESS_DENIED` |
| PATCH | `./meetings/{meetingId}` | 회의 예약 정보 변경 | EMPLOYEE | `MeetingUpdateRequest` | 없음 | `MEETING_NOT_FOUND`, `ACCESS_DENIED` |
| DELETE | `./meetings/{meetingId}` | 회의 취소 | EMPLOYEE | 없음 | 없음 | `MEETING_NOT_FOUND`, `ACCESS_DENIED` |
| GET | `./meetings/my-reservations/param={empId,from,to}` | 내 회의실 예약 조회 | EMPLOYEE | 없음 | `List<MeetingReservationResponse>` | 없음 |
| GET | `./meetings/{scheduleId}/reservation/param={}` | 일정 기준 회의 예약 조회 | EMPLOYEE | 없음 | `MeetingReservationResponse` | `MEETING_NOT_FOUND` |
| GET | `./meeting-rooms/param={activeOnly}` | 회의실 목록 조회 | authenticated | 없음 | `List<MeetingRoomResponse>` | 없음 |
| GET | `./meeting-rooms/{roomId}/param={}` | 회의실 상세 조회 | authenticated | 없음 | `MeetingRoomDetailResponse` | `MEETING_ROOM_NOT_FOUND` |
| GET | `./meeting-rooms/{roomId}/file/param={}` | 회의실 파일 조회 | authenticated | 없음 | `FileResponse` | `FILE_NOT_FOUND` |
| GET | `./meeting-rooms/{roomId}/reservation-times/param={date}` | 회의실 예약 가능 시간 조회 | EMPLOYEE | 없음 | `List<ReservationTimeResponse>` | `MEETING_ROOM_NOT_FOUND` |
| POST | `./meeting-rooms` | 회의실 생성 | FACILITY | `MeetingRoomCreateRequest` | `CreatedIdResponse` | `ACCESS_DENIED` |
| PATCH | `./meeting-rooms/{roomId}` | 회의실 정보 변경 | FACILITY | `MeetingRoomUpdateRequest` | 없음 | `MEETING_ROOM_NOT_FOUND` |
| PATCH | `./meeting-rooms/{roomId}/activation` | 회의실 활성화 | FACILITY | 없음 | 없음 | `MEETING_ROOM_NOT_FOUND` |
| PATCH | `./meeting-rooms/{roomId}/deactivation` | 회의실 비활성화 | FACILITY | 없음 | 없음 | `RESERVED_MEETING_EXIST` |
| POST | `./meeting-rooms/{roomId}/files` | 회의실 파일 추가 | FACILITY | `MeetingRoomFileCreateRequest` | 없음 | `MEETING_ROOM_NOT_FOUND` |
| DELETE | `./meeting-rooms/{roomId}/files/{fileId}` | 회의실 파일 제거 | FACILITY | 없음 | 없음 | `FILE_NOT_FOUND` |

### 가맹점/교육/문의/통계

| Method | URL | 설명 | 권한 | Request | Response | 주요 예외 |
|---|---|---|---|---|---|---|
| GET | `./franchises/param={keyword,status,managerId,page,size}` | 가맹점 목록 조회 | FRANCHISE | 없음 | `PageResponse<FranchiseSummaryResponse>` | `ACCESS_DENIED` |
| GET | `./franchises/{franchiseId}/param={}` | 가맹점 상세 조회 | FRANCHISE | 없음 | `FranchiseDetailResponse` | `FRANCHISE_NOT_FOUND` |
| GET | `./franchises/{franchiseId}/brief/param={}` | 가맹점 요약 조회 | FRANCHISE | 없음 | `FranchiseBriefResponse` | `FRANCHISE_NOT_FOUND` |
| GET | `./franchises/brief/param={keyword,status}` | 가맹점 요약 목록 조회 | FRANCHISE | 없음 | `List<FranchiseBriefResponse>` | 없음 |
| POST | `./franchises` | 가맹점 생성 | FRANCHISE | `FranchiseCreateRequest` | `CreatedIdResponse` | `ACCESS_DENIED` |
| PATCH | `./franchises/{franchiseId}` | 가맹점 정보 수정 | FRANCHISE | `FranchiseUpdateRequest` | 없음 | `FRANCHISE_NOT_FOUND` |
| PATCH | `./franchises/{franchiseId}/status` | 가맹점 영업 상태 변경 | FRANCHISE | `FranchiseStatusRequest` | 없음 | `FRANCHISE_NOT_FOUND` |
| PATCH | `./franchises/{franchiseId}/manager` | 가맹점 담당자 변경 | FRANCHISE | `FranchiseManagerRequest` | 없음 | `FRANCHISE_NOT_FOUND`, `EMP_NOT_FOUND` |
| PATCH | `./franchises/{franchiseId}/memo` | 가맹점 메모 수정 | FRANCHISE | `MemoRequest` | 없음 | `FRANCHISE_NOT_FOUND` |
| DELETE | `./franchises/{franchiseId}/memo` | 가맹점 메모 삭제 | FRANCHISE | 없음 | 없음 | `FRANCHISE_NOT_FOUND` |
| POST | `./franchises/{franchiseId}/daily-sales` | 외부 일매출 import | system 또는 FRANCHISE | `DailySalesRequest` | `CreatedIdResponse` | `FRANCHISE_NOT_FOUND`, `DUPLICATE_EXTERNAL_ID` |
| POST | `./franchises/{franchiseId}/inquiries` | 외부 문의 import | system 또는 FRANCHISE | `InquiryRequest` | `CreatedIdResponse` | `FRANCHISE_NOT_FOUND`, `DUPLICATE_EXTERNAL_ID` |
| GET | `./franchise-statistics/register-count/param={}` | 가맹점 등록 수 통계 조회 | FRANCHISE | 없음 | `FranchiseStatisticsResponse` | `ACCESS_DENIED` |
| GET | `./franchise-statistics/open-status/param={}` | 가맹점 운영 상태 통계 조회 | FRANCHISE | 없음 | `FranchiseStatisticsResponse` | `ACCESS_DENIED` |
| GET | `./franchise-statistics/revenue/monthly/param={year,franchiseId}` | 월별 매출 통계 조회 | FRANCHISE | 없음 | `List<FranchiseStatisticsResponse>` | `ACCESS_DENIED` |
| GET | `./franchise-statistics/revenue/top/param={targetMonth,limit}` | 월별 매출 상위 가맹점 조회 | FRANCHISE | 없음 | `List<FranchiseStatisticsResponse>` | `ACCESS_DENIED` |
| GET | `./franchise-statistics/revenue/worst/param={targetMonth,limit}` | 월별 매출 하위 가맹점 조회 | FRANCHISE | 없음 | `List<FranchiseStatisticsResponse>` | `ACCESS_DENIED` |
| GET | `./educations/param={keyword,page,size}` | 교육 목록 조회 | authenticated | 없음 | `PageResponse<EducationSummaryResponse>` | 없음 |
| GET | `./educations/{educationId}/param={}` | 교육 상세 조회 | authenticated | 없음 | `EducationDetailResponse` | `EDUCATION_NOT_FOUND` |
| GET | `./educations/{educationId}/files/param={}` | 교육 첨부파일 목록 조회 | authenticated | 없음 | `List<EducationFileResponse>` | `EDUCATION_NOT_FOUND` |
| POST | `./educations` | 교육 생성 | FRANCHISE | `EducationCreateRequest` | `CreatedIdResponse` | `ACCESS_DENIED` |
| PATCH | `./educations/{educationId}` | 교육 수정 | FRANCHISE | `EducationUpdateRequest` | 없음 | `EDUCATION_NOT_FOUND` |
| PATCH | `./educations/{educationId}/activation` | 교육 활성화 | FRANCHISE | 없음 | 없음 | `EDUCATION_NOT_FOUND` |
| PATCH | `./educations/{educationId}/deactivation` | 교육 비활성화 | FRANCHISE | 없음 | 없음 | `EDUCATION_REGISTER_MISMATCH` |
| POST | `./educations/{educationId}/files` | 교육 파일 추가 | FRANCHISE | `EducationFileCreateRequest` | 없음 | `EDUCATION_NOT_FOUND` |
| DELETE | `./educations/{educationId}/files/{fileId}` | 교육 파일 제거 | FRANCHISE | 없음 | 없음 | `FILE_NOT_FOUND` |
| POST | `./educations/{educationId}/applications` | 외부 교육 신청 import | system 또는 FRANCHISE | `ApplicationRequest` | 없음 | `EDUCATION_NOT_FOUND` |
| DELETE | `./educations/{educationId}/applications/{externalId}/param={franchiseId}` | 외부 교육 신청 취소 | system 또는 FRANCHISE | 없음 | 없음 | `EDUCATION_NOT_FOUND` |
| GET | `./franchise-inquiries/param={keyword,status,page,size}` | 가맹점 문의 목록 조회 | FRANCHISE | 없음 | `PageResponse<InquirySummaryResponse>` | `ACCESS_DENIED` |
| GET | `./franchise-inquiries/{inquiryId}/param={}` | 가맹점 문의 상세 조회 | FRANCHISE | 없음 | `InquiryDetailResponse` | `FRANCHISE_INQUIRY_NOT_FOUND` |
| GET | `./franchise-inquiries/{inquiryId}/files/param={}` | 가맹점 문의 첨부파일 조회 | FRANCHISE | 없음 | `List<FileResponse>` | `FRANCHISE_INQUIRY_NOT_FOUND` |
| GET | `./franchise-inquiries/{inquiryId}/answer/param={}` | 가맹점 문의 답변 조회 | FRANCHISE | 없음 | `InquiryAnswerResponse` | `FRANCHISE_INQUIRY_NOT_FOUND` |
| PATCH | `./franchise-inquiries/{inquiryId}/assignee` | 문의 답변 담당자 배정 | FRANCHISE | `InquiryAssigneeRequest` | 없음 | `FRANCHISE_INQUIRY_NOT_FOUND`, `EMP_NOT_FOUND` |
| POST | `./franchise-inquiries/{inquiryId}/answer-draft` | 문의 답변 초안 생성 | FRANCHISE | `AnswerDraftRequest` | 없음 | `FRANCHISE_INQUIRY_NOT_FOUND` |
| PATCH | `./franchise-inquiries/{inquiryId}/answer-draft` | 문의 답변 초안 수정 | FRANCHISE | `AnswerDraftRequest` | 없음 | `FRANCHISE_INQUIRY_NOT_FOUND` |
| POST | `./franchise-inquiries/{inquiryId}/answer-send` | 문의 답변 전송 | FRANCHISE | `AnswerSendRequest` | 없음 | `FRANCHISE_INQUIRY_NOT_FOUND` |

### 쪽지

| Method | URL | 설명 | 권한 | Request | Response | 주요 예외 |
|---|---|---|---|---|---|---|
| GET | `./messages/received/param={empId,page,size}` | 받은 쪽지함 조회 | EMPLOYEE | 없음 | `PageResponse<MessageSummaryResponse>` | 없음 |
| GET | `./messages/sent/param={empId,page,size}` | 보낸 쪽지함 조회 | EMPLOYEE | 없음 | `PageResponse<MessageSummaryResponse>` | 없음 |
| GET | `./messages/drafts/param={empId,page,size}` | 임시 쪽지함 조회 | EMPLOYEE | 없음 | `PageResponse<MessageSummaryResponse>` | 없음 |
| GET | `./messages/trash/param={empId,page,size}` | 쪽지 휴지통 조회 | EMPLOYEE | 없음 | `PageResponse<MessageSummaryResponse>` | 없음 |
| GET | `./messages/{messageId}/files/param={}` | 쪽지 첨부파일 목록 조회 | EMPLOYEE | 없음 | `List<MessageFileResponse>` | `MESSAGE_NOT_FOUND`, `ACCESS_DENIED` |
| GET | `./messages/unread/param={empId}` | 안 읽은 쪽지 목록 조회 | EMPLOYEE | 없음 | `List<MessageSummaryResponse>` | 없음 |
| GET | `./messages/unread-count/param={empId}` | 안 읽은 쪽지 수 조회 | EMPLOYEE | 없음 | `UnreadCountResponse` | 없음 |
| POST | `./messages/drafts` | 쪽지 임시 저장 | EMPLOYEE | `MessageCreateRequest` | `CreatedIdResponse` | `MESSAGE_RECEIVER_REQUIRED` |
| POST | `./messages` | 쪽지 즉시 전송 | EMPLOYEE | `MessageCreateRequest` | `CreatedIdResponse` | `MESSAGE_RECEIVER_REQUIRED` |
| POST | `./messages/drafts/{messageId}/send` | 임시 쪽지 전송 | EMPLOYEE | `MessageSendRequest` | 없음 | `MESSAGE_NOT_FOUND`, `ACCESS_DENIED` |
| PATCH | `./messages/drafts/{messageId}` | 임시 쪽지 수정 | EMPLOYEE | `MessageUpdateRequest` | 없음 | `MESSAGE_NOT_FOUND`, `ACCESS_DENIED` |
| DELETE | `./messages/drafts/{messageId}` | 임시 쪽지 삭제 | EMPLOYEE | 없음 | 없음 | `MESSAGE_NOT_FOUND`, `ACCESS_DENIED` |
| PUT | `./messages/drafts/{messageId}/receivers` | 임시 쪽지 수신자 교체 | EMPLOYEE | `MessageReceiversReplaceRequest` | 없음 | `MESSAGE_NOT_FOUND`, `MESSAGE_RECEIVER_REQUIRED` |
| POST | `./messages/drafts/{messageId}/files` | 임시 쪽지 파일 추가 | EMPLOYEE | `MessageFileRequest` | 없음 | `MESSAGE_NOT_FOUND` |
| DELETE | `./messages/drafts/{messageId}/files/{fileId}` | 임시 쪽지 파일 삭제 | EMPLOYEE | 없음 | 없음 | `MESSAGE_NOT_FOUND`, `FILE_NOT_FOUND` |
| PATCH | `./messages/{messageId}/read` | 수신 쪽지 읽음 처리 | EMPLOYEE | `MessageReadRequest` | 없음 | `MESSAGE_NOT_FOUND`, `ACCESS_DENIED` |
| POST | `./messages/{messageId}/receiver-trash` | 수신함 쪽지 휴지통 이동 | EMPLOYEE | `MessageBoxMoveRequest` | 없음 | `MESSAGE_NOT_FOUND`, `ACCESS_DENIED` |
| DELETE | `./messages/{messageId}/receiver-trash` | 수신함 쪽지 휴지통 복원 | EMPLOYEE | 없음 | 없음 | `MESSAGE_NOT_FOUND`, `ACCESS_DENIED` |
| DELETE | `./messages/{messageId}/receiver-box` | 수신함 쪽지 영구 삭제 | EMPLOYEE | 없음 | 없음 | `MESSAGE_NOT_FOUND`, `ACCESS_DENIED` |
| POST | `./messages/{messageId}/sender-trash` | 발신함 쪽지 휴지통 이동 | EMPLOYEE | `MessageBoxMoveRequest` | 없음 | `MESSAGE_NOT_FOUND`, `ACCESS_DENIED` |
| DELETE | `./messages/{messageId}/sender-trash` | 발신함 쪽지 휴지통 복원 | EMPLOYEE | 없음 | 없음 | `MESSAGE_NOT_FOUND`, `ACCESS_DENIED` |
| DELETE | `./messages/{messageId}/sender-box` | 발신함 쪽지 영구 삭제 | EMPLOYEE | 없음 | 없음 | `MESSAGE_NOT_FOUND`, `ACCESS_DENIED` |

## QueryRepository 후보

### 사원/부서/공통

| 메서드명 | 화면/유스케이스 기준 | 간략 설명 |
|---|---|---|
| `EmpQueryRepository.findEmpInfo` | 개인정보 조회 | 사원, 부서, 직급, 연락처, 프로필 등 내 정보 상세 조회 |
| `EmpQueryRepository.findEmployees` | 사원 목록/조직도 | 사원 목록 검색 및 페이징 조회 |
| `EmpQueryRepository.findNewEmployees` | 신규 사원 승인 | 신규 등록 대기 사원 목록 조회 |
| `EmpQueryRepository.findEmployeesByDept` | 부서별 사원 | 부서 소속 사원 목록 조회 |
| `EmpQueryRepository.findEmpFileByLoginId` | 프로필 이미지 | 로그인 사용자 프로필 파일 조회 |
| `EmpQueryRepository.findSignFileByEmpId` | 결재/서명 | 사원 서명 파일 조회 |
| `EmpRepository.findById` | 사원 command 검증 | 사원 aggregate 단건 조회, 기존 Repository 유지 |
| `EmpRepository.findByEmpNo` | 사번 기반 조회 | 사번으로 사원 aggregate 조회, 기존 Repository 유지 |
| `EmpRepository.existsByLoginId` | 사원 등록 | 로그인 ID 중복 확인, 기존 Repository 유지 |
| `EmpRepository.existsByEmpNo` | 사원 등록 | 사번 중복 확인, 기존 Repository 유지 |
| `DeptQueryRepository.findDeptTree` | 조직도 | 전체 부서와 부서장 정보를 조직도 형태로 조회 |
| `DeptQueryRepository.findDepartments` | 부서 관리/드롭다운 | 부서 목록 조회 |
| `DeptQueryRepository.findDeptHead` | 부서장 표시 | 부서장 정보 조회 |
| `DeptRepository.findById` | 부서 command 검증 | 부서 aggregate 단건 조회, 기존 Repository 유지 |
| `DeptRepository.findByDeptCode` | 부서 등록 | 부서 코드 중복 확인, 기존 Repository 유지 |
| `CommonCodeQueryRepository.findByParentCode` | 공통코드 드롭다운 | 부모 코드 기준 하위 공통코드 목록 조회 |
| `CompanyQueryRepository.findCompanyInfo` | 회사 정보 화면 | 회사 기본 정보 조회 |

### 근태/휴가 현황

| 메서드명 | 화면/유스케이스 기준 | 간략 설명 |
|---|---|---|
| `AttendanceQueryRepository.findAttendance` | 출퇴근 기록 | 특정 사원/일자의 근태 기록 조회 |
| `AttendanceQueryRepository.findAttendanceByEmp` | 사원 근태 현황 | 사원 현재 또는 최근 근태 상태 조회 |
| `AttendanceQueryRepository.findAttendanceListByMonth` | 개인/부서 월 근태 화면 | 사원 또는 부서의 월별 근태 목록 조회 |
| `AttendanceQueryRepository.findBusinessTripListByMonth` | 개인/부서 출장 현황 | 사원 또는 부서의 월별 출장 목록 조회 |
| `AttendanceQueryRepository.findDaySchedulesByEmpAndDay` | 근태 마감/일정 반영 | 특정 일자의 사원 일정 조회 |
| `LeaveQueryRepository.findLeaveRequestListByMonth` | 개인/부서 휴가 현황 | 사원 또는 부서의 월별 휴가 신청 목록 조회 |
| `LeaveQueryRepository.findLeaveSumAndUsageRateList` | 휴가 현황/잔여 현황 | 휴가 합계 및 사용률 목록 조회 |
| `LeaveQueryRepository.findLeaveUsageRateForYear` | 휴가 사용률 | 연간 휴가 사용률 조회 |
| `AttendanceRepository.findById` | 근태 수정/승인 | 근태 aggregate 단건 조회, 기존 Repository 유지 |
| `AttendanceRepository.findByEmpIdAndAttendanceDate` | 출퇴근 기록/근태 마감 | 사원과 일자 기준 근태 aggregate 조회, 기존 Repository 유지 |
| `EmpLeaveRepository.findByEmpIdAndGrantYear` | 휴가 신청/사용 반영 | 사원과 부여연도 기준 연차 aggregate 조회, 기존 Repository 유지 |
| `EmpLeaveRepository.existsByEmpAndGrantYear` | 연차 부여 | 특정 사원/연도 연차 정보 존재 여부 확인, 기존 Repository 유지 |
| `EmpLeaveRepository.findEmpIdsByGrantYear` | 연차 일괄 부여 | 특정 연도에 이미 연차가 부여된 사원 ID 목록 조회, 기존 Repository 유지 |

### 기안/결재

| 메서드명 | 화면/유스케이스 기준 | 간략 설명 |
|---|---|---|
| `DraftQueryRepository.findMyDrafts` | 내 기안함 | 작성자 기준 기안 목록 검색/페이징 조회 |
| `DraftQueryRepository.countMyDrafts` | 내 기안함 페이징 | 작성자 기준 기안 전체/검색 건수 조회 |
| `DraftQueryRepository.findApprovalDrafts` | 결재함 | 내가 결재할 문서 또는 결재한 문서 목록 조회 |
| `DraftQueryRepository.countApprovalDrafts` | 결재함 페이징 | 결재 문서 전체/검색 건수 조회 |
| `DraftQueryRepository.findReferenceDrafts` | 참조/공람함 | 내가 참조자로 포함된 문서 목록 조회 |
| `DraftQueryRepository.countReferenceDrafts` | 참조/공람함 페이징 | 참조 문서 전체/검색 건수 조회 |
| `DraftQueryRepository.findGeneralDraftDetail` | 일반 기안 상세 | 일반 기안 상세 DTO 조회 |
| `DraftQueryRepository.findLeaveDraftDetail` | 휴가 기안 상세 | 휴가 기안 상세 DTO 조회 |
| `DraftQueryRepository.findLeaveCancelDraftDetail` | 휴가 취소 기안 상세 | 휴가 취소 기안 상세 DTO 조회 |
| `DraftQueryRepository.findBusinessTripDraftDetail` | 출장 기안 상세 | 출장 기안 상세 DTO 조회 |
| `DraftQueryRepository.findBusinessTripCancelDraftDetail` | 출장 취소 기안 상세 | 출장 취소 기안 상세 DTO 조회 |
| `DraftQueryRepository.findSalesDraftDetail` | 매출보고 기안 상세 | 매출보고 기안 상세 DTO 조회 |
| `DraftQueryRepository.findDraftFiles` | 기안 상세/파일 다운로드 | 기안 첨부파일 목록 조회 |
| `ApprovalQueryRepository.findApprovalMainSummary` | 메인 화면 | 결재 대기/처리 요약 조회 |
| `ApprovalQueryRepository.findApprovalLineCandidates` | 결재선 선택 | 부서 내 결재선 후보 사원 조회 |
| `ApprovalQueryRepository.findFinalApprovalByEmpId` | 최종 결재 처리 | 대상 결재자가 최종 결재자인지 조회 |
| `ApprovalQueryRepository.findMidApprovalByEmpId` | 중간 결재 처리 | 대상 결재자가 중간 결재자인지 조회 |
| `ApprovalQueryRepository.findRejectableApprovalByEmpId` | 반려 처리 | 대상 결재자가 반려 가능한 결재자인지 조회 |
| `DraftRepository.findById` | 공통 기안 조회/승인/반려 | 기안 aggregate 단건 조회, 기존 Repository 유지 |
| `DraftRepository.findByIdAndEmp` | 기안 작성자 권한 확인 | 기안 ID와 작성자 기준 기안 aggregate 조회, 기존 Repository 유지 |
| `DraftRepository.findBySourceKey` | 일정 이벤트/취소 기안 | 동일 sourceKey를 가진 기안 aggregate 목록 조회, 기존 Repository 유지 |
| `DraftRepository.findByEmp` | 내 기안 command 검증 | 작성자 기준 기안 aggregate 목록 조회, 기존 Repository 유지 |
| `LeaveDraftRepository.findByEmpIdAndLeaveTypeAndApproval_StatusIn` | 휴가 기안 생성 | 진행 중인 휴가 예약량 조회, 기존 Repository 유지 |
| `LeaveDraftRepository.findByEmpIdAndLeaveTypeAndApproval_StatusInAndId_Not` | 휴가 기안 수정 | 수정 대상 제외 후 진행 중인 휴가 예약량 조회, 기존 Repository 유지 |

### 게시판

| 메서드명                                           | 화면/유스케이스 기준     | 간략 설명                                  |
|------------------------------------------------|-----------------|----------------------------------------|
| `BoardQueryRepository.findBoards`              | 게시판 목록          | 전체/검색/페이징 게시글 조회                       |
| `BoardQueryRepository.findBoardsByCategory`    | 카테고리별 게시판       | 카테고리 게시글 조회                            |
| `BoardQueryRepository.findBoardDetail`         | 게시글 상세          | 게시글 본문, 작성자, 카테고리 조회                   |
| `BoardQueryRepository.findComments`            | 게시글 상세          | 댓글 목록 조회                               |
| `BoardQueryRepository.countComments`           | 게시글 상세/목록       | 댓글 수 조회                                |
| `BoardQueryRepository.countLikes`              | 게시글 상세/목록       | 좋아요 수 조회                               |
| `BoardQueryRepository.findBoardFiles`          | 게시글 상세/수정       | 첨부파일 목록 조회                             |
| `BoardQueryRepository.findBoardFile`           | 파일 다운로드         | 첨부파일 단건 조회                             |
| `BoardQueryRepository.findNotices`             | 공지 목록           | 공지사항 목록/검색 조회                          |
| `BoardQueryRepository.findBoardHome`           | 홈 대시보드          | 게시글 요약 목록 조회                           |
| `BoardQueryRepository.findNoticeHome`          | 홈 대시보드          | 공지 요약 목록 조회                            |
| `CategoryQueryRepository.findActiveCategories` | 게시글 작성/목록 필터    | 활성 카테고리 목록 조회                          |
| `CategoryQueryRepository.findCategories`       | 카테고리 관리         | 전체 카테고리 목록 조회                          |
| `BoardRepository.findById`                     | 게시글 command 검증  | 게시글 aggregate 단건 조회, 기존 Repository 유지  |
| `CategoryRepository.findById`                  | 카테고리 command 검증 | 카테고리 aggregate 단건 조회, 기존 Repository 유지 |

### 채팅

| 메서드명 | 화면/유스케이스 기준 | 간략 설명 |
|---|---|---|
| `ChatQueryRepository.findChatRoomsByEmpId` | 채팅방 목록 | 내 채팅방 목록과 마지막 메시지 요약 조회 |
| `ChatQueryRepository.findOtherParticipant` | 1:1 채팅방 표시 | 상대 참여자 정보 조회 |
| `ChatQueryRepository.findConversation` | 채팅방 대화 | 채팅 메시지 목록 조회 |
| `ChatQueryRepository.findChatRoom` | 채팅방 검증 | 채팅방 존재 여부와 기본 정보 조회 |
| `ChatQueryRepository.findDirectChatRoom` | 1:1 채팅 시작 | 기존 1:1 채팅방 존재 여부 조회 |
| `ChatQueryRepository.countUnreadChats` | 채팅 알림/헤더 | 미읽음 채팅 수 조회 |
| `ChatRoomRepository.findById` | 채팅방 command 검증 | 채팅방 aggregate 단건 조회, 기존 Repository 유지 |
| `ChatRepository.findById` | 채팅 읽음 위치 갱신 | 채팅 메시지 aggregate 단건 조회, 기존 Repository 유지 |

### 일정/회의실

| 메서드명 | 화면/유스케이스 기준 | 간략 설명 |
|---|---|---|
| `ScheduleQueryRepository.findCalendarSchedules` | 캘린더 | 사원 기준 기간별 일정 목록 조회 |
| `ScheduleQueryRepository.findScheduleDetail` | 일정 상세 | 일정 단건 상세 조회 |
| `ScheduleQueryRepository.findScheduleByReservation` | 회의 예약 상세 | 회의 예약과 연결된 일정 조회 |
| `ScheduleQueryRepository.findScheduleParticipantsByScheduleId` | 일정/회의 참가자 화면 | 일정 ID 기준 참가자 사원 ID 목록 조회, 기존 QueryRepository 존재 |
| `ScheduleQueryRepository.countScheduleParticipantsByScheduleId` | 일정/회의 참가자 검증 | 일정 ID 기준 참가자 수 집계, 기존 QueryRepository 존재 |
| `MeetingRoomQueryRepository.findMeetingRooms` | 회의실 목록 | 회의실 목록 조회 |
| `MeetingRoomQueryRepository.findMeetingRoomDetail` | 회의실 상세/수정 | 회의실 상세 DTO 조회 |
| `MeetingRoomQueryRepository.findMeetingRoomFile` | 회의실 파일 | 회의실 파일 단건 조회 |
| `MeetingQueryRepository.findReservableTimes` | 회의실 예약 | 회의실/일자 기준 예약 가능 시간 조회 |
| `MeetingQueryRepository.findMyReservations` | 내 예약 | 사원 기준 회의실 예약 목록 조회 |
| `MeetingQueryRepository.findReservationByScheduleId` | 예약 취소/상세 | 일정 ID 기준 예약 정보 조회 |
| `MeetingQueryRepository.countReservationsByMeetingRoomId` | 회의실 삭제/비활성화 검증 | 회의실 예약 수 조회 |
| `ScheduleRepository.findByEmp_IdAndScheduleDate` | 근태 마감 | 사원/일자 기준 일정 aggregate 조회, 기존 Repository 유지 |
| `ScheduleRepository.findById` | 수기 일정 수정/취소 | 일정 aggregate 단건 조회, 기존 Repository 유지 |
| `ScheduleRepository.findSchedulesBySourceKey` | 이벤트 기반 일정 수정 | sourceKey 기준 일정 aggregate 묶음 조회, 기존 Repository 유지 |
| `ScheduleRepository.findBySourceKey` | 일정 이벤트 검증/테스트 | sourceKey 기준 일정 aggregate 목록 조회, 기존 Repository 유지 |
| `MeetingRepository.findById` | 회의 상세/취소/수정 | 회의 aggregate 단건 조회, 기존 Repository 유지 |
| `MeetingRepository.findByIdAndEmpId` | 회의 예약자 권한 확인 | 회의 ID와 예약자 기준 회의 aggregate 조회, 기존 Repository 유지 |
| `MeetingRepository.findMeetingByMeetingDateAfterAndMeetingRoom` | 회의실 비활성화/수정 검증 | 특정 회의실의 미래 예약 회의 aggregate 조회, 기존 Repository 유지 |
| `MeetingRepository.findBySourceKey` | 일정 이벤트 처리 | sourceKey 기준 회의 aggregate 조회, 기존 Repository 유지 |
| `MeetingRoomRepository.findById` | 회의실 예약/수정/파일 관리 | 회의실 aggregate 단건 조회, 기존 Repository 유지 |

### 가맹점/교육/문의/통계

| 메서드명 | 화면/유스케이스 기준 | 간략 설명 |
|---|---|---|
| `FranchiseQueryRepository.findFranchises` | 가맹점 목록 | 조건별 가맹점 목록 검색/페이징 조회 |
| `FranchiseQueryRepository.findFranchiseDetail` | 가맹점 상세/수정 | 가맹점 단건 상세 조회 |
| `FranchiseQueryRepository.findFranchiseBrief` | 가맹점 요약 | 가맹점 단건 요약 조회 |
| `FranchiseQueryRepository.findFranchiseBriefs` | 가맹점 요약 목록 | 가맹점 요약 목록 조회 |
| `FranchiseStatisticsQueryRepository.findRegisterCount` | 가맹점 통계 | 전체/올해/이번 달 등록 수 집계 |
| `FranchiseStatisticsQueryRepository.findOpenStatus` | 가맹점 통계 | 운영/미운영 상태 집계 |
| `FranchiseStatisticsQueryRepository.findTopSalesByMonth` | 가맹점 통계 | 월별 상위 매출 가맹점 조회 |
| `FranchiseStatisticsQueryRepository.findWorstSalesByMonth` | 가맹점 통계 | 월별 하위 매출 가맹점 조회 |
| `FranchiseStatisticsQueryRepository.findMonthlyRevenueThisYear` | 가맹점 통계 | 올해 월별 매출 조회 |
| `FranchiseStatisticsQueryRepository.findMonthlyRevenueLastYear` | 가맹점 통계 | 작년 월별 매출 조회 |
| `FranchiseSalesQueryRepository.findMonthlySalesByFranchiseId` | 매출보고 기안/가맹점 매출 현황 | 가맹점 월별 매출액과 주문 수 집계, 기존 QueryRepository 존재 |
| `EducationQueryRepository.findEducations` | 교육 목록 | 교육 전체/검색 목록 조회 |
| `EducationQueryRepository.findEducationDetail` | 교육 상세/수정 | 교육 상세 조회 |
| `EducationQueryRepository.findEducationFiles` | 교육 상세/수정 | 교육 첨부파일 목록 조회 |
| `EducationQueryRepository.findEducationFile` | 교육 파일 다운로드 | 교육 첨부파일 단건 조회 |
| `FranchiseInquiryQueryRepository.findInquiries` | 가맹점 문의 목록 | 문의 전체/검색 목록 조회 |
| `FranchiseInquiryQueryRepository.findInquiryDetail` | 가맹점 문의 상세 | 문의 본문 조회 |
| `FranchiseInquiryQueryRepository.findInquiryFiles` | 가맹점 문의 상세 | 문의 첨부파일 조회 |
| `FranchiseInquiryQueryRepository.findAnswer` | 가맹점 문의 상세 | 문의 답변 조회 |
| `FranchiseRepository.findById` | 가맹점 command 검증 | 가맹점 aggregate 단건 조회, 기존 Repository 유지 |
| `EducationRepository.findById` | 교육 command 검증 | 교육 aggregate 단건 조회, 기존 Repository 유지 |
| `FranchiseInquiryRepository.findById` | 문의 답변/담당자 배정 | 문의 aggregate 단건 조회, 기존 Repository 유지 |
| `FranchiseInquiryRepository.findByExternalId` | 문의 import/update | 외부 문의 ID로 aggregate 조회, 기존 Repository 유지 |
| `FranchiseInquiryRepository.existsByExternalId` | 문의 import | 외부 문의 ID 중복 확인, 기존 Repository 유지 |
| `FranchiseDailySalesRepository.findById` | 일매출 상세/관리 | 일매출 aggregate 단건 조회, 기존 Repository 유지 |
| `FranchiseDailySalesRepository.findByExternalId` | 일매출 import/update | 외부 일매출 ID로 aggregate 조회, 기존 Repository 유지 |
| `FranchiseDailySalesRepository.existsByExternalId` | 일매출 import | 외부 일매출 ID 중복 확인, 기존 Repository 유지 |
| `FranchiseDailySalesRepository.count` | 일매출 import 검증/통계 | 일매출 전체 건수 집계, 기존 Repository 유지 |

### 쪽지

| 메서드명 | 화면/유스케이스 기준 | 간략 설명 |
|---|---|---|
| `MessageQueryRepository.findReceivedMessages` | 받은 쪽지함 | 받은 쪽지 목록 조회 |
| `MessageQueryRepository.findSentMessages` | 보낸 쪽지함 | 보낸 쪽지 목록 조회 |
| `MessageQueryRepository.findDraftMessages` | 임시보관함 | 임시 쪽지 목록 조회 |
| `MessageQueryRepository.findTrashMessages` | 휴지통 | 휴지통 쪽지 목록 조회 |
| `MessageQueryRepository.findMessageFiles` | 쪽지 상세 | 쪽지 첨부파일 목록 조회 |
| `MessageQueryRepository.findUnreadMessages` | 헤더/메인 알림 | 안 읽은 쪽지 목록 조회 |
| `MessageQueryRepository.countUnreadMessages` | 헤더/메인 알림 | 안 읽은 쪽지 수 조회 |
| `MessageRepository.findById` | 쪽지 발신/수신/임시저장 관리 | 쪽지 aggregate 단건 조회, 기존 Repository 유지 |

## 원본 mapper 대응표

| 원본 mapper | 로컬 리팩터링 QueryRepository 후보 |
|---|---|
| `ApprovalActionMapper`, `ApprovalMapper` | `ApprovalQueryRepository`, `DraftQueryRepository`, `EmpQueryRepository` |
| `AttendanceMapper` | `AttendanceQueryRepository`, `LeaveQueryRepository`, `ScheduleQueryRepository` |
| `BoardMapper`, `CategoryMapper` | `BoardQueryRepository`, `CategoryQueryRepository` |
| `ChatMapper` | `ChatQueryRepository` |
| `CommonMapper`, `CompanyMapper`, `DeptMapper`, `EmpMapper`, `EmprofileMapper`, `EmpSignMapper`, `EmpUpdateMapper` | `CommonCodeQueryRepository`, `CompanyQueryRepository`, `DeptQueryRepository`, `EmpQueryRepository` |
| `CourseMapper` | `EducationQueryRepository`, `EmpQueryRepository` |
| `DraftMapper`, `DeleteMapper` | `DraftQueryRepository` |
| `FranchiseMapper`, `StatisticsMapper` | `FranchiseQueryRepository`, `FranchiseStatisticsQueryRepository`, `FranchiseSalesQueryRepository` |
| `MeetingRoomMapper`, `ReservationMapper` | `MeetingRoomQueryRepository`, `MeetingQueryRepository` |
| `MsgMapper` | `MessageQueryRepository` |
| `QuestionMapper` | `FranchiseInquiryQueryRepository` |
| `ScheduleMapper` | `ScheduleQueryRepository` |

