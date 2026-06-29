# `도메인모델.md` 기반 용어사전

| 용어 | 영문/코드명 | 분류 | 정의 |
|---|---|---|---|
| 공통 엔티티 | `AbstractEntity` | 공통 | 모든 도메인 엔티티가 공통으로 가지는 `id`, `created_at`, `updated_at` 기반 모델 |
| 이메일 | `Email` | Value Object | 사내/대표 이메일을 표현하는 값 객체, 이메일 형식과 유일성이 중요 |
| 회사 정보 | `Company` | 회사 | 단일 회사 체제의 공개 기본 정보 스냅샷 |
| 회사 정보 스냅샷 | `Company Snapshot` | 회사 | 회사 정보를 수정하지 않고 새 이력 row로 저장한 기록 |
| 부서 | `Dept` | 조직 | 부서 코드, 부서명, 활성 여부를 관리하는 조직 단위 |
| 부서장 | `DeptLeader` | 조직 | 특정 부서의 리더 임명/종료 이력을 기록하는 모델 |
| 사원 | `Emp` | 사원 | 계정, 인적사항, 재직상태, 권한, 소속, 파일을 관리하는 핵심 사용자 모델 |
| 사원 상태 | `EmpStatus` | 사원 Enum | `PENDING`, `ACTIVE`, `RESIGNED`, `SUSPENDED`로 사원의 상태를 표현 |
| 시스템 권한 | `SystemRoleCode` | 권한 Enum | `EMPLOYEE`, `HR`, `ADMIN` 등 사원의 시스템 권한 |
| 사원 파일 | `EmpFile` | 사원 | 프로필 사진, 전자서명 등 사원 관련 파일 메타데이터 |
| 사원 소속 | `EmpBelongings` | 사원/조직 | 사원의 부서, 직급, 주요 소속 여부, 발령 이력을 기록 |
| 직급 | `PositionCode` | 사원 Enum | `INTERN`, `STAFF`, `MANAGER`, `DIRECTOR` 등 직급 코드 |
| 근태 | `Attendance` | 근태 | 사원의 출근, 퇴근, 근태 상태, 승인/수정 정보를 기록 |
| 근태 상태 | `AttendanceStatus` | 근태 Enum | 정상근무, 반차, 연차, 병가, 결근, 지각/조퇴 상태 |
| 사원 휴가 | `EmpLeave` | 휴가 | 특정 사원의 연도별 휴가 부여/사용/잔여 현황 |
| 일정 | `Schedule` | 일정 | 개인/부서/공용 일정의 제목, 시간, 장소, 반복 여부를 관리 |
| 일정 참여자 | `ScheduleParticipant` | 일정 | 일정과 참여 사원을 연결하는 모델 |
| 기안서 | `Draft` | 전자결재 | 일반기안, 휴가, 출장, 매출보고의 공통 추상 모델 |
| 일반 기안서 | `GeneralDraft` | 전자결재 | 일반 목적의 기안서 |
| 휴가 기안서 | `LeaveDraft` | 전자결재 | 휴가 신청을 위한 기안서 |
| 매출 기안서 | `SalesDraft` | 전자결재 | 프랜차이즈 월매출 보고용 기안서 |
| 출장 기안서 | `BusinessTripDraft` | 전자결재 | 출장 신청을 위한 기안서 |
| 출장 참여자 | `BusinessTripParticipant` | 전자결재 | 출장 기안서에 포함되는 참여 사원 |
| 기안서 파일 | `DraftFile` | 전자결재 | 기안서 첨부파일 메타데이터 |
| 결재 | `Approval` | 전자결재 | 하나의 기안서에 대한 결재 흐름 |
| 결재자 | `Approvers` | 전자결재 | 결재선의 개별 승인자, 승인/반려 상태를 관리 |
| 공람 | `Circulation` | 전자결재 | 특정 기안서를 사원에게 공람 대상으로 지정한 정보 |
| 회의 | `Meeting` | 회의 | 회의실 예약 정보와 참여자를 관리 |
| 회의실 | `MeetingRoom` | 회의 | 회의실 기본 정보, 수용 인원, 활성 여부 등을 관리 |
| 회의실 파일 | `MeetingRoomFile` | 회의 | 회의실 이미지/첨부파일 메타데이터 |
| 가맹점 | `Franchise` | 가맹점 | 가맹점 기본 정보, 상태, 담당자, 메모를 관리 |
| 가맹점 일매출 | `FranchiseDailySales` | 가맹점 | 가맹점의 일별 매출 기록 |
| 교육 | `Education` | 가맹점 교육 | 가맹점 대상 교육 일정과 신청 정보를 관리 |
| 교육 파일 | `EducationFile` | 가맹점 교육 | 교육 첨부파일 메타데이터 |
| 교육 신청 | `EducationApplication` | 가맹점 교육 | 교육에 참가 신청한 가맹점 정보 |
| 가맹점 문의 | `FranchiseInquiry` | 가맹점 문의 | 외부 가맹점 문의 내용과 담당 상태 |
| 문의 답변 | `FranchiseInquiryAnswer` | 가맹점 문의 | 가맹점 문의에 대한 답변 초안/발송 정보 |
| 동기화 요청 | `FranchiseSyncRequest` | 외부 연동 | 가맹점 외부 API 동기화 요청 기록 |
| 게시글 | `Board` | 게시판 | 게시글 제목, 내용, 임시저장/발행, 조회수/좋아요/댓글 수 관리 |
| 게시글 파일 | `BoardFile` | 게시판 | 게시글 첨부파일 메타데이터 |
| 댓글 | `BoardComment` | 게시판 | 게시글 댓글/대댓글, 수정/삭제 상태 관리 |
| 좋아요 | `BoardLike` | 게시판 | 사원의 게시글 좋아요 기록 |
| 게시판 카테고리 | `BoardCategory` | 게시판 | 게시글 분류와 노출 여부를 관리 |
| 쪽지 | `Message` | 쪽지 | 임시저장/발송 쪽지의 제목, 내용, 수신자, 파일 관리 |
| 쪽지 발신 정보 | `MessageSender` | 쪽지 | 발신자 기준 휴지통/삭제 상태를 관리 |
| 쪽지 수신 정보 | `MessageRecipient` | 쪽지 | 수신자 기준 읽음, 휴지통, 삭제 상태를 관리 |
| 쪽지 파일 | `MessageFile` | 쪽지 | 쪽지 첨부파일 메타데이터 |
| 채팅방 | `ChatRoom` | 채팅 | 채팅방 생성자, 참여자 상태, 마지막 메시지 시각, 종료 여부 관리 |
| 채팅방 멤버 | `ChatRoomMember` | 채팅 | 멤버별 입장/퇴장, 즐겨찾기, 마지막 읽은 메시지 관리 |
| 채팅 메시지 | `ChatMessage` | 채팅 | 채팅방에 append-only로 저장되는 메시지 |