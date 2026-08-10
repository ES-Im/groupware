### AUTH API
| 기능 | ID | Method | Endpoint | Request | Response | 권한필요여부 | 필요한 권한 |
|---|---|---|---|---|---|---|---|
| LOGIN | `LOGIN` | `POST` | `/api/auth/login` | JSON Body | `200` JSON Body | 아니오 | 공개 |
| LOGOUT | `LOGOUT` | `POST` | `/api/auth/logout` | Empty | `204` Empty | 예 | EMPLOYEE |
| Access Token 재발급 | `REISSUE_TOKEN` | `POST` | `/api/auth/reissue` | Empty | `200` JSON Body | 아니오 | Refresh Token |

### COMPANY API

> ⚠️ 이 섹션은 원래 인덱스에 누락되어 있었다(2026-07-10, COMPANY 도메인 build-domain 착수 시 보강). `COMPANY_INFO`는 백엔드 REST Docs 스니펫이 아직 없다(`CompanyQueryApiDocsTest`에 `@Test` 미작성) — 필드는 `CompanyInfoResponse.java`(응답 DTO)와 `CompanyQueryApiTest.java`(jsonPath 단언)로 소스 대조 확정했다. 나머지 3개(`COMPANY_REGISTER`/`COMPANY_UPDATE_INFO`/`COMPANY_UPDATE_CONTACT`/`COMPANY_UPDATE_HOME_PAGE_URL`)는 `back/build/generated-snippets/<기능ID>/`에 정식 스니펫이 존재한다.

| 기능 | ID | Method | Endpoint | Request | Response | 권한필요여부 | 필요한 권한 |
|---|---|---|---|---|---|---|---|
| 회사 정보 조회 | `COMPANY_INFO` | `GET` | `/api/companies` | Empty | `200` JSON Body | 아니오 | 공개(인증 불요, `permitAll`) |
| 회사 정보 최초 등록 | `COMPANY_REGISTER` | `POST` | `/api/companies/new` | JSON Body | `204` Empty | 예 | ADMIN |
| 회사 기본 정보 수정(이력 생성) | `COMPANY_UPDATE_INFO` | `POST` | `/api/companies/info` | JSON Body | `204` Empty | 예 | ADMIN |
| 회사 대표 연락처 수정(이력 생성) | `COMPANY_UPDATE_CONTACT` | `POST` | `/api/companies/contact` | JSON Body | `204` Empty | 예 | ADMIN |
| 회사 홈페이지 URL 수정(이력 생성) | `COMPANY_UPDATE_HOME_PAGE_URL` | `POST` | `/api/companies/home-page-url` | JSON Body | `204` Empty | 예 | ADMIN |

### EMP_ACCOUNT API

> ⚠️ `HR_UPDATE_EMP_BELONGINGS`는 인사관리(가입승인+조직소속) build-domain 착수 시(2026-07-12) 신규 추가됐다. 서비스/도메인 로직(`EmpAccountManager.updateBelongingsByHR`, `Emp.changeBelongingsByHR`)은 기존에 구현·테스트되어 있었으나 이를 노출하는 컨트롤러 엔드포인트가 없어서 이번에 `EmpManagementApi`에 추가했다(`PATCH /api/employees/{empId}/belongings`, 요청 DTO `EmpBelongingsUpdateRequest.java`). REST Docs 테스트(`EmpManagementApiDocsTest.update_emp_belongings_by_hr`)까지 작성·실행해 `back/build/generated-snippets/HR_UPDATE_EMP_BELONGINGS/`에서 스니펫 생성 확인 완료(신규 소속 등록 시 `deptId/position/isPrimary/startAt` 필수, 기존 소속 수정 시 `deptId` 생략 가능). 같은 세션에서 `SecurityConfig.java`의 URL 레벨 HR 매처에 `/belongings`(PATCH)와 `/new`(GET)가 누락되어 있던 것도 함께 정리했다(전에는 서비스 계층 `checkHRRoleEmp`에서만 걸러 401 `ROLE_002`로 응답 — 이제 URL 게이트에서 403으로 통일, `docs/backend-contract/security.md` HR 행에도 반영).

| 기능                     | ID                             | Method | Endpoint | Request | Response | 권한필요여부 | 필요한 권한 |
|---|---|---|---|---|---|---|---|
| 회원가입                   | `REGISTER`                     | `POST` | `/api/employees` | JSON Body | `204` Empty | 아니오 | 공개 |
| 사원 단건 정보 조회            | `RETRIEVE_EMP_INFO`            | `GET` | `/api/employees/{empId}` | Path | `200` JSON Body | 예 | EMPLOYEE |
| 본인 정보 조회               | `RETRIEVE_ME_INFO`             | `GET` | `/api/employees/me` | Empty | `200` JSON Body | 예 | EMPLOYEE(본인) |
| 소속정보 전체 조회             | `RETRIEVE_BELONGINGS_INFOS`    | `GET` | `/api/employees/me/belongings` | Empty | `200` JSON Body | 예 | EMPLOYEE(본인) |
| 프로필사진/전자서명파일 전체 조회     | `RETRIEVE_FILES_INFOS`         | `GET` | `/api/employees/me/files` | Empty | `200` JSON Body | 예 | EMPLOYEE(본인) |
| 본인 개인정보 수정             | `UPDATE_SELF_INFO`             | `PATCH` | `/api/employees/me` | JSON Body | `204` Empty | 예 | EMPLOYEE(본인) |
| 본인 개인파일 추가             | `EMP_FILE_UPLOAD`              | `PATCH` | `/api/employees/{empId}/files?fileType={value}` | Path + Query + Multipart | `204` Empty | 예 | EMPLOYEE(본인) |
| 본인 개인파일 활성화/비활성화       | `ACTIVATE_ME_FILE`             | `PATCH` | `/api/employees/me/files/{fileId}/status` | Path | `204` Empty | 예 | EMPLOYEE(본인) |
| 본인 개인파일 삭제             | `EMP_FILE_DELETE`              | `DELETE` | `/api/employees/{empId}/files/{fileId}` | Path | `204` Empty | 예 | EMPLOYEE(본인) |
| 관리용 사원 리스트 조회          | `EMPS_FOR_MANAGEMENT`          | `GET` | `/api/employees?deptId={value}&status={value}&keyword={value}&page={value}&size={value}` | Query | `200` JSON Body | 예 | HR 또는 DEPT_MANAGER(같은 부서) 또는 ADMIN |
| 신규 사원 리스트 조회           | `NEW_EMP_LIST`                 | `GET` | `/api/employees/new?page={value}&size={value}&keyword={value}` | Query | `200` JSON Body | 예 | HR 또는 ADMIN |
| 신규 사원 가입 승인            | `HR_APPROVE_EMP_REGISTRATION`  | `PATCH` | `/api/employees/{empId}/registration-approval?hiredAt={value}` | Path + Query | `204` Empty | 예 | HR 또는 ADMIN |
| 사원 소속 정보 등록/수정         | `HR_UPDATE_EMP_BELONGINGS`     | `PATCH` | `/api/employees/{empId}/belongings` | Path + JSON Body | `204` Empty | 예 | HR 또는 ADMIN |
| 사원 퇴직 처리               | `HR_RESIGN_EMP`                | `PATCH` | `/api/employees/{empId}/resignation?hiredAt={value}` | Path + Query | `204` Empty | 예 | HR 또는 ADMIN |
| 사원 활성화 처리              | `HR_ACTIVATE_EMP`              | `PATCH` | `/api/employees/{empId}/status/activation` | Path | `204` Empty | 예 | HR 또는 ADMIN |
| 사원 정직 처리               | `HR_SUSPEND_EMP`               | `PATCH` | `/api/employees/{empId}/status/suspension` | Path | `204` Empty | 예 | HR 또는 ADMIN |
| 특정 사원 정보 수정 (HR)       | `HR_UPDATE_EMP_INFO`           | `PATCH` | `/api/employees/{empId}/hr-managed-info` | Path + JSON Body | `204` Empty | 예 | HR 또는 ADMIN |
| 특정 사원 정보 수정 (부서매니저)    | `DEPT_MANAGER_UPDATE_EMP_INFO` | `PATCH` | `/api/employees/{empId}/dept-managed-info` | Path + JSON Body | `204` Empty | 예 | DEPT_MANAGER(같은 부서) 또는 ADMIN |
| 특정 사원 파일 활성화/비활성화 (HR) | `HR_UPDATE_ONES_FILE_STATUS`   | `PATCH` | `/api/employees/{empId}/files/{fileId}/status?isForActivate={value}` | Path + Query | `204` Empty | 예 | HR 또는 ADMIN |

### ATTENDANCE API
| 기능 | ID | Method | Endpoint | Request | Response | 권한필요여부 | 필요한 권한 |
|---|---|---|---|---|---|---|---|
| 내 월별 근태 조회 | `MY_ATTENDANCE_MONTHLY` | `GET` | `/api/employees/attendances/me/monthly?yearMonth={value}&status={value}&page={value}&size={value}` | Query | `200` JSON Body | 예 | EMPLOYEE(본인) |
| 내 월별 근태 요약 조회 | `MY_ATTENDANCE_MONTHLY_SUMMARY` | `GET` | `/api/employees/attendances/me/monthly/summary?yearMonth={value}` | Query | `200` JSON Body | 예 | EMPLOYEE(본인) |
| 출근 기록 | `MY_ATTENDANCE_CHECK_IN` | `POST` | `/api/employees/attendances/me/check-in` | Empty | `204` Empty | 예 | EMPLOYEE(본인) |
| 퇴근 기록 | `MY_ATTENDANCE_CHECK_OUT` | `PATCH` | `/api/employees/attendances/me/check-out` | Empty | `204` Empty | 예 | EMPLOYEE(본인) |
| 부서 월별 근태 조회 | `DEPT_ATTENDANCE_MONTHLY` | `GET` | `/api/employees/attendances/{deptId}/monthly?yearMonth={value}&keyword={value}&status={value}&page={value}&size={value}` | Path + Query | `200` JSON Body | 예 | DEPT_MANAGER(같은 부서) 또는 ADMIN |
| 부서 승인 대기 근태 조회 | `DEPT_ATTENDANCE_PENDING` | `GET` | `/api/employees/attendances/{deptId}/monthly/pending?page={value}&size={value}` | Path + Query | `200` JSON Body | 예 | DEPT_MANAGER(같은 부서) 또는 ADMIN |
| 부서 매니저 근태 수정 | `DEPT_ATTENDANCE_UPDATE` | `PATCH` | `/api/employees/attendances/{attendanceId}` | Path + JSON Body | `204` Empty | 예 | DEPT_MANAGER(같은 부서) 또는 ADMIN |
| 부서 매니저 근태 승인 | `DEPT_ATTENDANCE_APPROVE` | `PATCH` | `/api/employees/attendances/{attendanceId}/approval?targetEmpId={value}&approvedAt={value}` | Path + Query | `204` Empty | 예 | DEPT_MANAGER(같은 부서) 또는 ADMIN |

### DRAFT / DOCUMENT API
| 기능 | ID | Method | Endpoint | Request | Response | 권한필요여부 | 필요한 권한 |
|---|---|---|---|---|---|---|---|
| 내 휴가 신청 이력 조회 | `MY_LEAVE_REQUEST_HISTORY` | `GET` | `/api/leaves/employees/me/request-history?approvalStatus={value}&yearMonth={value}` | Query | `200` JSON Body | 예 | EMPLOYEE(본인) |
| 부서 휴가 신청 이력 조회 | `DEPT_LEAVE_REQUEST_HISTORY` | `GET` | `/api/leaves/departments/{deptId}/request-history?keyword={value}&approvalStatus={value}&yearMonth={value}&page={value}&size={value}` | Path + Query | `200` JSON Body | 예 | DEPT_MANAGER(같은 부서) 또는 ADMIN |
| 내 출장 신청 이력 조회 | `MY_BUSINESS_TRIP_REQUEST_HISTORY` | `GET` | `/api/business-trips/employees/me/request-history?approvalStatus={value}&yearMonth={value}` | Query | `200` JSON Body | 예 | EMPLOYEE(본인) |
| 부서 출장 신청 이력 조회 | `DEPT_BUSINESS_TRIP_REQUEST_HISTORY` | `GET` | `/api/business-trips/departments/{deptId}/request-history?keyword={value}&approvalStatus={value}&yearMonth={value}&page={value}&size={value}` | Path + Query | `200` JSON Body | 예 | DEPT_MANAGER(같은 부서) 또는 ADMIN |
| 기안서 상세조회 | `DRAFT_DETAIL` | `GET` | `/api/drafts/{draftId}` | Path | `200` JSON Body | 예 | 기안서 조회 가능자 |
| 일반 기안서 생성 | `GENERAL_DRAFT_CREATE` | `POST` | `/api/drafts/generals` | JSON Body | `201` JSON Body | 예 | EMPLOYEE(활성 사원) |
| 휴가 기안서 생성 | `LEAVE_DRAFT_CREATE` | `POST` | `/api/drafts/leaves` | JSON Body | `201` JSON Body | 예 | EMPLOYEE(활성 사원) |
| 출장 기안서 생성 | `BUSINESS_TRIP_DRAFT_CREATE` | `POST` | `/api/drafts/business-trips` | JSON Body | `201` JSON Body | 예 | EMPLOYEE(활성 사원) |
| 매출 기안서 생성 | `SALES_DRAFT_CREATE` | `POST` | `/api/drafts/sales` | JSON Body | `201` JSON Body | 예 | FRANCHISE |
| 일반 기안서 생성/상신 | `GENERAL_DRAFT_CREATE_SUBMISSION` | `POST` | `/api/drafts/generals/submission` | JSON Body | `201` JSON Body | 예 | EMPLOYEE(활성 사원) |
| 휴가 기안서 생성/상신 | `LEAVE_DRAFT_CREATE_SUBMISSION` | `POST` | `/api/drafts/leaves/submission` | JSON Body | `201` JSON Body | 예 | EMPLOYEE(활성 사원) |
| 출장 기안서 생성/상신 | `BUSINESS_TRIP_DRAFT_CREATE_SUBMISSION` | `POST` | `/api/drafts/business-trips/submission` | JSON Body | `201` JSON Body | 예 | EMPLOYEE(활성 사원) |
| 매출 기안서 생성/상신 | `SALES_DRAFT_CREATE_SUBMISSION` | `POST` | `/api/drafts/sales/submission` | JSON Body | `201` JSON Body | 예 | FRANCHISE |
| 일반 기안서 수정 | `GENERAL_DRAFT_UPDATE` | `PATCH` | `/api/drafts/generals/{draftId}` | Path + JSON Body | `204` Empty | 예 | 기안자(EMPLOYEE) |
| 휴가 기안서 수정 | `LEAVE_DRAFT_UPDATE` | `PATCH` | `/api/drafts/leaves/{draftId}` | Path + JSON Body | `204` Empty | 예 | 기안자(EMPLOYEE) |
| 출장 기안서 수정 | `BUSINESS_TRIP_DRAFT_UPDATE` | `PATCH` | `/api/drafts/business-trips/{draftId}` | Path + JSON Body | `204` Empty | 예 | 기안자(EMPLOYEE) |
| 매출 기안서 수정 | `SALES_DRAFT_UPDATE` | `PATCH` | `/api/drafts/sales/{draftId}` | Path + JSON Body | `204` Empty | 예 | FRANCHISE |
| 출장 참여자 수정 | `BUSINESS_TRIP_PARTICIPANTS_UPDATE` | `PATCH` | `/api/drafts/business-trips/{draftId}/participants` | Path + JSON Body | `204` Empty | 예 | 기안자(EMPLOYEE) |
| 기안서 상신 | `DRAFT_SUBMIT` | `PATCH` | `/api/drafts/{draftId}/submission` | Path + JSON Body | `204` Empty | 예 | 기안자(EMPLOYEE) |
| 기안서 상신 철회 | `DRAFT_SUBMISSION_WITHDRAWAL` | `PATCH` | `/api/drafts/{draftId}/submission-withdrawal` | Path | `204` Empty | 예 | 기안자(EMPLOYEE) |
| 기안서 삭제 | `DRAFT_DELETE` | `DELETE` | `/api/drafts/{draftId}` | Path | `204` Empty | 예 | 기안자(EMPLOYEE) |
| 취소 기안서 생성 | `DRAFT_CANCELLATION_CREATE` | `POST` | `/api/drafts/{sourceDraftId}/cancellation-drafts` | Path + JSON Body | `201` JSON Body | 예 | 기안자(EMPLOYEE) |
| 취소 기안서 생성/상신 | `DRAFT_CANCELLATION_CREATE_SUBMISSION` | `POST` | `/api/drafts/{sourceDraftId}/cancellation-drafts/submission` | Path + JSON Body | `201` JSON Body | 예 | 기안자(EMPLOYEE) |
| 기안서 승인 | `DRAFT_APPROVE` | `PATCH` | `/api/drafts/{draftId}/approval` | Path | `204` Empty | 예 | 결재선 결재자 |
| 기안서 반려 | `DRAFT_REJECT` | `PATCH` | `/api/drafts/{draftId}/rejection` | Path + JSON Body | `204` Empty | 예 | 결재선 결재자 |
| 공람자 추가 | `DRAFT_CIRCULATION_ADD` | `POST` | `/api/drafts/{draftId}/circulations` | Path + JSON Body | `204` Empty | 예 | 기안자(EMPLOYEE) |
| 공람자 제거 | `DRAFT_CIRCULATION_REMOVE` | `DELETE` | `/api/drafts/{draftId}/circulations/{empId}` | Path | `204` Empty | 예 | 기안자(EMPLOYEE) |
| 공람 읽음 처리 | `DRAFT_CIRCULATION_READ` | `PATCH` | `/api/drafts/{draftId}/circulations/me/read` | Path | `204` Empty | 예 | 공람 대상자 |
| 내 상신 기안서 목록 | `MY_SUBMITTED_DRAFTS` | `GET` | `/api/document-boxes/me/submitted-drafts?keyword={value}&page={value}&size={value}` | Query | `200` JSON Body | 예 | EMPLOYEE(본인) |
| 내 임시저장 기안서 목록 | `MY_UNSUBMITTED_DRAFTS` | `GET` | `/api/document-boxes/me/unsubmitted-drafts?keyword={value}&page={value}&size={value}` | Query | `200` JSON Body | 예 | EMPLOYEE(본인) |
| 내 결재 대기 기안서 목록 | `MY_PENDING_APPROVAL_DRAFTS` | `GET` | `/api/document-boxes/me/pending-approval-drafts?keyword={value}&page={value}&size={value}` | Query | `200` JSON Body | 예 | EMPLOYEE(본인) |
| 내 결재 대기 기안서 수 | `MY_PENDING_APPROVAL_DRAFTS_COUNT` | `GET` | `/api/document-boxes/me/pending-approval-drafts/count` | Empty | `200` JSON Body | 예 | EMPLOYEE(본인) |
| 내 문서함 요약 | `MY_DOCUMENT_BOX_SUMMARY` | `GET` | `/api/document-boxes/me/summary` | Empty | `200` JSON Body | 예 | EMPLOYEE(본인) |
| 내 조회 가능 문서 목록 | `MY_ACCESSIBLE_DOCUMENTS` | `GET` | `/api/document-boxes/me/accessible-documents?keyword={value}&page={value}&size={value}` | Query | `200` JSON Body | 예 | EMPLOYEE(본인) |

### SCHEDULE / MEETING API
| 기능 | ID | Method | Endpoint | Request | Response | 권한필요여부 | 필요한 권한 |
|---|---|---|---|---|---|---|---|
| 기간별 일정 조회 | `SCHEDULE_CALENDAR` | `GET` | `/api/schedules/calendar?start={value}&end={value}&scheduleType={value}` | Query | `200` JSON Body | 예 | EMPLOYEE(조회 가능 범위) |
| 일정 상세 조회 | `SCHEDULE_DETAIL` | `GET` | `/api/schedules/{scheduleId}` | Path | `200` JSON Body | 예 | EMPLOYEE(조회 가능 범위) |
| 수기 일정 등록 | `MANUAL_SCHEDULE_CREATE` | `POST` | `/api/schedules` | JSON Body | `201` JSON Body | 예 | EMPLOYEE(활성 사원) |
| 일정 참여자 추가 | `SCHEDULE_PARTICIPANTS_ADD` | `POST` | `/api/schedules/{scheduleId}/participants?scope={value}` | Path + Query + JSON Body | `201` Empty | 예 | 일정 소유자 |
| 일정 참여자 제외 | `SCHEDULE_PARTICIPANTS_REMOVE` | `PATCH` | `/api/schedules/{scheduleId}/participants?scope={value}` | Path + Query + JSON Body | `204` Empty | 예 | 일정 소유자 |
| 일정 취소 | `SCHEDULE_CANCEL` | `PATCH` | `/api/schedules/{scheduleId}/cancellation?scope={value}` | Path + Query | `204` Empty | 예 | 일정 소유자 |
| 수기 일정 수정 | `MANUAL_SCHEDULE_UPDATE` | `PATCH` | `/api/schedules/{scheduleId}?scope={value}` | Path + Query + JSON Body | `204` Empty | 예 | 일정 소유자 |
| 내 회의 예약 캘린더 | `MY_MEETING_RESERVATIONS_CALENDAR` | `GET` | `/api/meetings/my/reservations/calendar?start={value}&end={value}` | Query | `200` JSON Body | 예 | EMPLOYEE(본인) |
| 회의 예약 상세 | `MEETING_RESERVATION_DETAIL` | `GET` | `/api/meetings/{meetingId}` | Path | `200` JSON Body | 예 | EMPLOYEE |
| 회의 예약 관리 목록 | `MEETING_RESERVATION_MANAGEMENT` | `GET` | `/api/meetings?yearMonth={value}&keyword={value}&meetingRoomId={value}&page={value}&size={value}` | Query | `200` JSON Body | 예 | FACILITY |
| 회의 예약 생성 | `MEETING_RESERVATION_CREATE` | `POST` | `/api/meetings` | JSON Body | `201` Empty | 예 | EMPLOYEE(활성 사원) |
| 회의 참여자 교체 | `MEETING_PARTICIPANTS_REPLACE` | `PATCH` | `/api/meetings/{meetingId}/participants` | Path + JSON Body | `204` Empty | 예 | 예약자(EMPLOYEE) |
| 회의 예약 취소 | `MEETING_RESERVATION_CANCEL` | `PATCH` | `/api/meetings/{meetingId}/cancel` | Path | `204` Empty | 예 | 예약자(EMPLOYEE) |
| 회의 예약 정보 수정 | `MEETING_RESERVATION_UPDATE` | `PATCH` | `/api/meetings/{meetingId}/reservation-info` | Path + JSON Body | `204` Empty | 예 | 예약자(EMPLOYEE) |

### MEETING ROOM API
| 기능 | ID | Method | Endpoint | Request | Response | 권한필요여부 | 필요한 권한 |
|---|---|---|---|---|---|---|---|
| 예약 가능 회의실 조회 | `AVAILABLE_MEETING_ROOMS` | `GET` | `/api/meeting-rooms/available?date={value}&startAt={value}&endAt={value}&capacity={value}&page={value}&size={value}` | Query | `200` JSON Body | 예 | EMPLOYEE |
| 관리용 회의실 조회 | `MEETING_ROOM_MANAGEMENT` | `GET` | `/api/meeting-rooms/management?available={value}&bookedInFuture={value}&page={value}&size={value}` | Query | `200` JSON Body | 예 | FACILITY |
| 회의실 기간별 예약 조회 | `MEETING_ROOM_RESERVATIONS_CALENDAR` | `GET` | `/api/meeting-rooms/{meetingRoomId}/reservations/calendar?start={value}&end={value}` | Path + Query | `200` JSON Body | 예 | EMPLOYEE |
| 회의실 상세 조회 | `MEETING_ROOM_DETAIL` | `GET` | `/api/meeting-rooms/{meetingRoomId}` | Path | `200` JSON Body | 예 | EMPLOYEE |
| 회의실 첨부파일 목록 | `MEETING_ROOM_FILES` | `GET` | `/api/meeting-rooms/{meetingRoomId}/files` | Path | `200` JSON Body | 예 | EMPLOYEE |
| 회의실 생성 | `MEETING_ROOM_CREATE` | `POST` | `/api/meeting-rooms` | JSON Body | `201` JSON Body | 예 | FACILITY |
| 회의실 정보 수정 | `MEETING_ROOM_UPDATE` | `PATCH` | `/api/meeting-rooms/{meetingRoomId}` | Path + JSON Body | `204` Empty | 예 | FACILITY |
| 회의실 활성화 | `MEETING_ROOM_ACTIVATE` | `PATCH` | `/api/meeting-rooms/{meetingRoomId}/activate` | Path | `204` Empty | 예 | FACILITY |
| 회의실 비활성화 | `MEETING_ROOM_DEACTIVATE` | `PATCH` | `/api/meeting-rooms/{meetingRoomId}/deactivate` | Path | `204` Empty | 예 | FACILITY |

### EMP LEAVE / DEPT API
| 기능 | ID | Method | Endpoint | Request | Response | 권한필요여부 | 필요한 권한 |
|---|---|---|---|---|---|---|---|
| 내 잔여 휴가 요약 | `MY_EMP_LEAVE_SUMMARY` | `GET` | `/api/employees/me/leaves/summary?year={value}` | Query | `200` JSON Body | 예 | EMPLOYEE(본인) |
| 관리자 사원 휴가 요약 | `EMP_LEAVE_SUMMARY` | `GET` | `/api/employees/leaves/summary?keyword={value}&deptId={value}&year={value}&page={value}&size={value}` | Query | `200` JSON Body | 예 | ADMIN |
| 관리자 회사 휴가 사용률 | `EMP_LEAVE_USAGE_SUMMARY` | `GET` | `/api/employees/leaves/usage-summary?deptId={value}&year={value}` | Query | `200` JSON Body | 예 | ADMIN |
| 부서 사원 휴가 요약 | `DEPT_EMP_LEAVE_SUMMARY` | `GET` | `/api/departments/{deptId}/employees/leaves/summary?keyword={value}&year={value}&page={value}&size={value}` | Path + Query | `200` JSON Body | 예 | DEPT_MANAGER(같은 부서) 또는 ADMIN |
| 부서 휴가 사용률 | `DEPT_EMP_LEAVE_USAGE_SUMMARY` | `GET` | `/api/departments/{deptId}/employees/leaves/usage-summary?year={value}` | Path + Query | `200` JSON Body | 예 | DEPT_MANAGER(같은 부서) 또는 ADMIN |
| 특별 휴가 부여일수 조정 | `EMP_LEAVE_ADJUST_SPECIAL_GRANT_DAYS` | `PATCH` | `/api/employees/{empId}/leaves/special-grant-days?plusMinusDays={value}` | Path + Query | `204` Empty | 예 | ADMIN |
| 포상 휴가 부여일수 조정 | `EMP_LEAVE_ADJUST_COMPENSATORY_GRANT_DAYS` | `PATCH` | `/api/employees/{empId}/leaves/compensatory-grant-days?plusMinusDays={value}` | Path + Query | `204` Empty | 예 | ADMIN |
| 전체 부서정보 조회 | `DEPTS` | `GET` | `/api/departments?keyword={value}&isActive={value}&page={value}&size={value}` | Query | `200` JSON Body | 예 | EMPLOYEE |
| 부서 기본정보 조회 | `DEPT_INFO` | `GET` | `/api/departments/{deptId}` | Path | `200` JSON Body | 예 | EMPLOYEE |
| 특정 부서 멤버 조회 | `DEPT_MEMBERS` | `GET` | `/api/departments/{deptId}/members?keyword={value}&isEmpActive={value}&page={value}&size={value}` | Path + Query | `200` JSON Body | 예 | EMPLOYEE |
| 부서 등록 | `DEPT_REGISTER` | `POST` | `/api/departments` | JSON Body | `204` Empty | 예 | ADMIN |
| 부서 활성화 | `DEPT_ACTIVATE` | `PATCH` | `/api/departments/{deptId}/activation` | Path | `204` Empty | 예 | ADMIN |
| 부서 비활성화 | `DEPT_DEACTIVATE` | `PATCH` | `/api/departments/{deptId}/deactivation` | Path | `204` Empty | 예 | ADMIN |
| 부서명 변경 | `DEPT_UPDATE_NAME` | `PATCH` | `/api/departments/{deptId}/name?newName={value}` | Path + Query | `204` Empty | 예 | ADMIN |
| 상위 부서 변경 | `DEPT_UPDATE_PARENT` | `PATCH` | `/api/departments/{deptId}/parent?parentDeptId={value}` | Path + Query | `204` Empty | 예 | ADMIN |
| 부서장 지정 | `DEPT_APPOINT_LEADER` | `PATCH` | `/api/departments/{deptId}/leader/appointment?leaderEmpId={value}&appointedAt={value}` | Path + Query | `204` Empty | 예 | ADMIN |
| 현재 부서장 종료 | `DEPT_END_LEADER` | `PATCH` | `/api/departments/{deptId}/leader/end?endAt={value}` | Path + Query | `204` Empty | 예 | ADMIN |

### BOARD / MESSAGE / CHAT API
| 기능 | ID | Method | Endpoint | Request | Response | 권한필요여부 | 필요한 권한 |
|---|---|---|---|---|---|---|---|
| 카테고리 관리 목록 | `CATEGORY_MANAGEMENT` | `GET` | `/api/categories/management?keyword={value}&isVisible={value}&page={value}&size={value}` | Query | `200` JSON Body | 예 | ADMIN |
| 노출 카테고리 목록 | `CATEGORY_LIST` | `GET` | `/api/categories` | Empty | `200` JSON Body | 예 | EMPLOYEE |
| 카테고리 등록 | `CATEGORY_REGISTER` | `POST` | `/api/categories` | JSON Body | `201` Empty | 예 | ADMIN |
| 카테고리명 변경 | `CATEGORY_UPDATE_NAME` | `PATCH` | `/api/categories/{categoryId}/name` | Path + JSON Body | `204` Empty | 예 | ADMIN |
| 카테고리 노출 | `CATEGORY_ACTIVATE` | `PATCH` | `/api/categories/{categoryId}/visibility/activation` | Path | `204` Empty | 예 | ADMIN |
| 카테고리 숨김 | `CATEGORY_DEACTIVATE` | `PATCH` | `/api/categories/{categoryId}/visibility/deactivation` | Path | `204` Empty | 예 | ADMIN |
| 게시글 등록 | `BOARD_REGISTER` | `POST` | `/api/boards` | JSON Body | `201` Empty | 예 | EMPLOYEE(활성 사원) |
| 임시저장 게시글 발행 | `BOARD_PUBLISH` | `PATCH` | `/api/boards/{boardId}/publishment` | Path | `204` Empty | 예 | 게시글 작성자 또는 ADMIN |
| 게시글 수정 | `BOARD_UPDATE` | `PATCH` | `/api/boards/{boardId}` | Path + JSON Body | `204` Empty | 예 | 게시글 작성자 또는 ADMIN |
| 게시글 삭제 | `BOARD_DELETE` | `DELETE` | `/api/boards/{boardId}` | Path | `204` Empty | 예 | 게시글 작성자 또는 ADMIN |
| 카테고리별 게시글 목록 | `BOARD_LIST` | `GET` | `/api/categories/{categoryId}/boards?keyword={value}&page={value}&size={value}` | Path + Query | `200` JSON Body | 예 | EMPLOYEE |
| 카테고리별 최신 게시글 | `BOARD_LATEST` | `GET` | `/api/categories/{categoryId}/boards/latest?limit={value}` | Path + Query | `200` JSON Body | 예 | EMPLOYEE |
| 게시글 상세 조회 | `BOARD_DETAIL` | `GET` | `/api/boards/{boardId}` | Path | `200` JSON Body | 예 | EMPLOYEE |
| 게시글 댓글 목록 | `BOARD_COMMENTS` | `GET` | `/api/boards/{boardId}/comments?page={value}&size={value}` | Path + Query | `200` JSON Body | 예 | EMPLOYEE |
| 게시글 첨부파일 목록 | `BOARD_FILES` | `GET` | `/api/boards/{boardId}/files` | Path | `200` JSON Body | 예 | EMPLOYEE |
| 게시글 편집 모드 | `BOARD_EDIT_MODE` | `GET` | `/api/boards/{boardId}/edit-mode` | Path | `200` JSON Body | 예 | 게시글 작성자 |
| 내 임시저장 게시글 목록 | `BOARD_DRAFTS` | `GET` | `/api/my/boards/drafts` | Empty | `200` JSON Body | 예 | 게시글 작성자 |
| 댓글 등록 | `COMMENT_REGISTER` | `POST` | `/api/boards/{boardId}/comments` | Path + JSON Body | `201` Empty | 예 | EMPLOYEE(활성 사원) |
| 대댓글 등록 | `COMMENT_REPLY` | `POST` | `/api/boards/{boardId}/comments/{parentCommentId}/replies` | Path + JSON Body | `201` Empty | 예 | EMPLOYEE(활성 사원) |
| 댓글 수정 | `COMMENT_UPDATE` | `PATCH` | `/api/boards/{boardId}/comments/{commentId}` | Path + JSON Body | `204` Empty | 예 | 댓글 작성자 |
| 댓글 삭제 | `COMMENT_DELETE` | `DELETE` | `/api/boards/{boardId}/comments/{commentId}` | Path | `204` Empty | 예 | 댓글 작성자 |
| 임시 쪽지 저장 | `MESSAGE_DRAFT_CREATE` | `POST` | `/api/messages/drafts` | JSON Body | `201` JSON Body | 예 | EMPLOYEE(활성 사원) |
| 쪽지 즉시 발송 | `MESSAGE_SEND` | `POST` | `/api/messages` | JSON Body | `201` JSON Body | 예 | EMPLOYEE(활성 사원) |
| 임시 쪽지 발송 | `MESSAGE_DRAFT_SEND` | `PATCH` | `/api/messages/drafts/{messageId}/send` | Path | `204` Empty | 예 | 쪽지 작성자 |
| 임시 쪽지 삭제 | `MESSAGE_DRAFT_DELETE` | `DELETE` | `/api/messages/drafts/{messageId}` | Path | `204` Empty | 예 | 쪽지 작성자 |
| 임시 쪽지 수정 | `MESSAGE_DRAFT_UPDATE` | `PATCH` | `/api/messages/drafts/{messageId}` | Path + JSON Body | `204` Empty | 예 | 쪽지 작성자 |
| 임시 쪽지 수신자 변경 | `MESSAGE_DRAFT_RECEIVERS_UPDATE` | `PATCH` | `/api/messages/drafts/{messageId}/receivers` | Path + JSON Body | `204` Empty | 예 | 쪽지 작성자 |
| 보낸 쪽지 휴지통 이동 | `SENT_MESSAGE_TRASH` | `PATCH` | `/api/messages/sent/{messageId}/trash` | Path | `204` Empty | 예 | 발신자 |
| 보낸 쪽지 휴지통 복구 | `SENT_MESSAGE_RESTORE` | `PATCH` | `/api/messages/sent/{messageId}/trash/restoration` | Path | `204` Empty | 예 | 발신자 |
| 보낸 쪽지 삭제 | `SENT_MESSAGE_DELETE` | `PATCH` | `/api/messages/sent/{messageId}/deletion` | Path | `204` Empty | 예 | 발신자 |
| 받은 쪽지 읽음 처리 | `RECEIVED_MESSAGE_READ` | `PATCH` | `/api/messages/received/{messageId}/read` | Path | `204` Empty | 예 | 수신자 |
| 받은 쪽지 휴지통 이동 | `RECEIVED_MESSAGE_TRASH` | `PATCH` | `/api/messages/received/{messageId}/trash` | Path | `204` Empty | 예 | 수신자 |
| 받은 쪽지 휴지통 복구 | `RECEIVED_MESSAGE_RESTORE` | `PATCH` | `/api/messages/received/{messageId}/trash/restoration` | Path | `204` Empty | 예 | 수신자 |
| 받은 쪽지 삭제 | `RECEIVED_MESSAGE_DELETE` | `PATCH` | `/api/messages/received/{messageId}/deletion` | Path | `204` Empty | 예 | 수신자 |
| 내 채팅방 목록 조회 | `CHAT_ROOM_LIST` | `GET` | `/api/chat/rooms?keyword={value}&isBookmark={value}` | Query | `200` JSON Body | 예 | EMPLOYEE(본인) |
| 채팅방 상세 조회 | `CHAT_ROOM_DETAIL` | `GET` | `/api/chat/rooms/{roomId}` | Path | `200` JSON Body | 예 | 채팅방 멤버 |
| 채팅 메시지 목록 조회 | `CHAT_MESSAGES` | `GET` | `/api/chat/rooms/{roomId}/messages?cursor={value}&size={value}` | Path + Query | `200` JSON Body | 예 | 채팅방 멤버 |
| 채팅방 생성 | `CHAT_ROOM_CREATE` | `POST` | `/api/chat/rooms` | JSON Body | `200` JSON Body | 예 | EMPLOYEE(활성 사원) |
| 채팅방 멤버 초대 | `CHAT_ROOM_INVITE` | `PATCH` | `/api/chat/rooms/{roomId}/invite` | Path + JSON Body | `204` Empty | 예 | 채팅방 멤버 |
| 채팅방 표시명 수정 | `CHAT_ROOM_NAME_UPDATE` | `PATCH` | `/api/chat/rooms/{roomId}/name` | Path + JSON Body | `204` Empty | 예 | 채팅방 멤버 |
| 채팅방 나가기 | `CHAT_ROOM_LEAVE` | `PATCH` | `/api/chat/rooms/{roomId}/leave` | Path | `204` Empty | 예 | 채팅방 멤버 |
| 채팅방 즐겨찾기 | `CHAT_ROOM_BOOKMARK` | `PATCH` | `/api/chat/rooms/{roomId}/bookmark` | Path | `204` Empty | 예 | 채팅방 멤버 |
| 채팅방 즐겨찾기 해제 | `CHAT_ROOM_UNBOOKMARK` | `PATCH` | `/api/chat/rooms/{roomId}/unbookmark` | Path | `204` Empty | 예 | 채팅방 멤버 |
| 채팅방 읽음 위치 갱신 | `CHAT_ROOM_READ_POSITION_UPDATE` | `PATCH` | `/api/chat/rooms/{roomId}/read-position` | Path + JSON Body | `204` Empty | 예 | 채팅방 멤버 |

### FRANCHISE API
| 기능 | ID | Method | Endpoint | Request | Response | 권한필요여부 | 필요한 권한 |
|---|---|---|---|---|---|---|---|
| 가맹점 목록 조회 | `FRANCHISE_LIST` | `GET` | `/api/franchises?keyword={value}&status={value}&managerId={value}` | Query | `200` JSON Body | 예 | FRANCHISE 또는 ADMIN |
| 가맹점 상세 조회 | `FRANCHISE_DETAIL` | `GET` | `/api/franchises/{franchiseId}` | Path | `200` JSON Body | 예 | FRANCHISE 또는 ADMIN |
| 가맹점 등록 | `FRANCHISE_CREATE` | `POST` | `/api/franchises` | JSON Body | `201` JSON Body | 예 | FRANCHISE 또는 ADMIN |
| 가맹점 기본 정보 수정 | `FRANCHISE_UPDATE` | `PATCH` | `/api/franchises/{franchiseId}` | Path + JSON Body | `204` Empty | 예 | FRANCHISE 또는 ADMIN |
| 가맹점 영업 상태 변경 | `FRANCHISE_STATUS_UPDATE` | `PATCH` | `/api/franchises/{franchiseId}/status?status={value}` | Path + Query | `204` Empty | 예 | FRANCHISE 또는 ADMIN |
| 가맹점 담당자 변경 | `FRANCHISE_MANAGER_UPDATE` | `PATCH` | `/api/franchises/{franchiseId}/managers?newManagerId={value}` | Path + Query | `204` Empty | 예 | FRANCHISE 또는 ADMIN |
| 가맹점 메모 수정 | `FRANCHISE_MEMO_UPDATE` | `PATCH` | `/api/franchises/{franchiseId}/memo` | Path + JSON Body | `204` Empty | 예 | FRANCHISE 또는 ADMIN |
| 가맹점 메모 삭제 | `FRANCHISE_MEMO_CLEAR` | `PATCH` | `/api/franchises/{franchiseId}/clear-memo` | Path | `204` Empty | 예 | FRANCHISE 또는 ADMIN |
| 교육 캘린더 조회 | `FRANCHISE_EDUCATION_CALENDAR` | `GET` | `/api/franchise-educations/calendar?start={value}&end={value}` | Query | `200` JSON Body | 예 | FRANCHISE 또는 ADMIN |
| 교육 상세 조회 | `FRANCHISE_EDUCATION_DETAIL` | `GET` | `/api/franchise-educations/{educationId}` | Path | `200` JSON Body | 예 | FRANCHISE 또는 ADMIN |
| 교육 신청자 조회 | `FRANCHISE_EDUCATION_APPLICANTS` | `GET` | `/api/franchise-educations/{educationId}/applicants` | Path + Query | `200` JSON Body | 예 | FRANCHISE 또는 ADMIN |
| 교육 등록 | `FRANCHISE_EDUCATION_CREATE` | `POST` | `/api/franchise-educations` | JSON Body | `201` JSON Body | 예 | FRANCHISE 또는 ADMIN |
| 교육 수정 | `FRANCHISE_EDUCATION_UPDATE` | `PATCH` | `/api/franchise-educations/{educationId}` | Path + JSON Body | `204` Empty | 예 | FRANCHISE 또는 ADMIN(교육 등록자) |
| 교육 활성화 | `FRANCHISE_EDUCATION_ACTIVATE` | `POST` | `/api/franchise-educations/{educationId}/activation` | Path | `204` Empty | 예 | FRANCHISE 또는 ADMIN(교육 등록자) |
| 교육 비활성화 | `FRANCHISE_EDUCATION_DEACTIVATE` | `POST` | `/api/franchise-educations/{educationId}/deactivation` | Path | `204` Empty | 예 | FRANCHISE 또는 ADMIN(교육 등록자) |
| 문의 목록 조회 | `FRANCHISE_INQUIRY_LIST` | `GET` | `/api/franchise-inquiries?isAnswered={value}&assignedManagerId={value}&keyword={value}&from={value}&to={value}` | Query | `200` JSON Body | 예 | FRANCHISE 또는 ADMIN |
| 문의 상세 조회 | `FRANCHISE_INQUIRY_DETAIL` | `GET` | `/api/franchise-inquiries/{inquiryId}` | Path | `200` JSON Body | 예 | FRANCHISE 또는 ADMIN |
| 답변 조회 | `FRANCHISE_INQUIRY_ANSWER_DETAIL` | `GET` | `/api/franchise-inquiries/{inquiryId}/answer` | Path | `200` JSON Body | 예 | FRANCHISE 또는 ADMIN |
| 답변 담당자 배정 | `FRANCHISE_INQUIRY_ASSIGN_ANSWER` | `PATCH` | `/api/franchise-inquiries/{inquiryId}/assign-answer?assignedEmpId={value}` | Path + Query | `204` Empty | 예 | FRANCHISE 또는 ADMIN |
| 답변 초안 생성 | `FRANCHISE_INQUIRY_ANSWER_CREATE` | `POST` | `/api/franchise-inquiries/{inquiryId}/answers` | Path + JSON Body | `201` Empty | 예 | FRANCHISE 또는 ADMIN(답변 담당자) |
| 답변 초안 수정 | `FRANCHISE_INQUIRY_ANSWER_UPDATE` | `PATCH` | `/api/franchise-inquiries/{inquiryId}/answers` | Path + JSON Body | `204` Empty | 예 | FRANCHISE 또는 ADMIN(답변 담당자) |
| 답변 발송 | `FRANCHISE_INQUIRY_ANSWER_SEND` | `PATCH` | `/api/franchise-inquiries/{inquiryId}/answers/send` | Path | `204` Empty | 예 | FRANCHISE 또는 ADMIN(답변 담당자) |
| 연 매출 조회 | `FRANCHISE_SALES_YEARLY` | `GET` | `/api/franchises/{franchiseId}/sales/years/{year}` | Path | `200` JSON Body | 예 | FRANCHISE 또는 ADMIN |
| 월 매출 조회 | `FRANCHISE_SALES_MONTHLY` | `GET` | `/api/franchises/{franchiseId}/sales/months/{yearMonth}` | Path | `200` JSON Body | 예 | FRANCHISE 또는 ADMIN |
| 일 매출 조회 | `FRANCHISE_SALES_DAILY` | `GET` | `/api/franchises/{franchiseId}/sales/dates/{date}` | Path | `200` JSON Body | 예 | FRANCHISE 또는 ADMIN |

### FILE API
| 기능 | ID | Method | Endpoint | Request | Response | 권한필요여부 | 필요한 권한 |
|---|---|---|---|---|---|---|---|
| 사원 파일 미리보기 | `EMP_FILE_PREVIEW` | `GET` | `/api/employees/{empId}/files/{fileId}/preview` | Path | `200` Binary/File | 예 | EMPLOYEE |
| 사원 파일 다운로드 | `EMP_FILE_DOWNLOAD` | `GET` | `/api/employees/{empId}/files/{fileId}/download` | Path | `200` Binary/File | 예 | EMPLOYEE |
| 기안서 첨부 파일 미리보기 | `DRAFT_FILE_PREVIEW` | `GET` | `/api/drafts/{draftId}/files/{fileId}/preview` | Path | `200` Binary/File | 예 | EMPLOYEE |
| 기안서 첨부 파일 다운로드 | `DRAFT_FILE_DOWNLOAD` | `GET` | `/api/drafts/{draftId}/files/{fileId}/download` | Path | `200` Binary/File | 예 | EMPLOYEE |
| 게시판 첨부 파일 미리보기 | `BOARD_FILE_PREVIEW` | `GET` | `/api/boards/{boardId}/files/{fileId}/preview` | Path | `200` Binary/File | 예 | EMPLOYEE |
| 게시판 첨부 파일 다운로드 | `BOARD_FILE_DOWNLOAD` | `GET` | `/api/boards/{boardId}/files/{fileId}/download` | Path | `200` Binary/File | 예 | EMPLOYEE |
| 쪽지 첨부 파일 미리보기 | `MESSAGE_FILE_PREVIEW` | `GET` | `/api/messages/{messageId}/files/{fileId}/preview` | Path | `200` Binary/File | 예 | EMPLOYEE |
| 쪽지 첨부 파일 다운로드 | `MESSAGE_FILE_DOWNLOAD` | `GET` | `/api/messages/{messageId}/files/{fileId}/download` | Path | `200` Binary/File | 예 | EMPLOYEE |
| 교육 첨부 파일 미리보기 | `EDUCATION_FILE_PREVIEW` | `GET` | `/api/educations/{educationId}/files/{fileId}/preview` | Path | `200` Binary/File | 예 | EMPLOYEE |
| 교육 첨부 파일 다운로드 | `EDUCATION_FILE_DOWNLOAD` | `GET` | `/api/educations/{educationId}/files/{fileId}/download` | Path | `200` Binary/File | 예 | EMPLOYEE |
| 회의실 첨부 파일 미리보기 | `MEETING_ROOM_FILE_PREVIEW` | `GET` | `/api/meeting-rooms/{meetingRoomId}/files/{fileId}/preview` | Path | `200` Binary/File | 예 | EMPLOYEE |
| 회의실 첨부 파일 다운로드 | `MEETING_ROOM_FILE_DOWNLOAD` | `GET` | `/api/meeting-rooms/{meetingRoomId}/files/{fileId}/download` | Path | `200` Binary/File | 예 | EMPLOYEE |
| 사원 파일 업로드 | `EMP_FILE_UPLOAD` | `PATCH` | `/api/employees/{empId}/files?fileType={value}` | Path + Query + Multipart | `204` Empty | 예 | EMPLOYEE(본인) |
| 기안서 첨부 파일 업로드 | `DRAFT_FILE_UPLOAD` | `PATCH` | `/api/drafts/{draftId}/files` | Path + Multipart | `204` Empty | 예 | 기안자(EMPLOYEE) |
| 게시판 첨부 파일 업로드 | `BOARD_FILE_UPLOAD` | `PATCH` | `/api/boards/{boardId}/files` | Path + Multipart | `204` Empty | 예 | 게시글 작성자 또는 ADMIN |
| 쪽지 첨부 파일 업로드 | `MESSAGE_FILE_UPLOAD` | `PATCH` | `/api/messages/{messageId}/files` | Path + Multipart | `204` Empty | 예 | 쪽지 작성자 |
| 교육 첨부 파일 업로드 | `EDUCATION_FILE_UPLOAD` | `PATCH` | `/api/educations/{educationId}/files` | Path + Multipart | `204` Empty | 예 | FRANCHISE 또는 ADMIN(교육 등록자) |
| 회의실 첨부 파일 업로드 | `MEETING_ROOM_FILE_UPLOAD` | `PATCH` | `/api/meeting-rooms/{meetingRoomId}/files` | Path + Multipart | `204` Empty | 예 | FACILITY |
| 사원 파일 삭제 | `EMP_FILE_DELETE` | `DELETE` | `/api/employees/{empId}/files/{fileId}` | Path | `204` Empty | 예 | EMPLOYEE(본인) |
| 기안서 첨부 파일 삭제 | `DRAFT_FILE_DELETE` | `DELETE` | `/api/drafts/{draftId}/files/{fileId}` | Path | `204` Empty | 예 | 기안자(EMPLOYEE) |
| 게시판 첨부 파일 삭제 | `BOARD_FILE_DELETE` | `DELETE` | `/api/boards/{boardId}/files/{fileId}` | Path | `204` Empty | 예 | 게시글 작성자 또는 ADMIN |
| 쪽지 첨부 파일 삭제 | `MESSAGE_FILE_DELETE` | `DELETE` | `/api/messages/{messageId}/files/{fileId}` | Path | `204` Empty | 예 | 쪽지 작성자 |
| 교육 첨부 파일 삭제 | `EDUCATION_FILE_DELETE` | `DELETE` | `/api/educations/{educationId}/files/{fileId}` | Path | `204` Empty | 예 | FRANCHISE 또는 ADMIN(교육 등록자) |
| 회의실 첨부 파일 삭제 | `MEETING_ROOM_FILE_DELETE` | `DELETE` | `/api/meeting-rooms/{meetingRoomId}/files/{fileId}` | Path | `204` Empty | 예 | FACILITY |
